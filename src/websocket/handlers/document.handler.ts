import { Server as SocketIOServer } from 'socket.io';
import logger from '../../utils/logger';
import prisma from '../../config/database';
import sharingService from '../../services/sharing.service';
import { getColor } from '../utils/color';

interface DocumentRoom {
  noteId: string;
  users: Map<string, Participant>;
  version: number;
}

interface SocketUser {
  id: string;
  email: string;
  name: string | null;
}

interface Participant {
  userId: string;
  userName: string;
  color: string;
  socketId: string;
}

export class DocumentEditHandler {
  private io: SocketIOServer;
  private documentRooms: Map<string, DocumentRoom> = new Map();

  constructor(io: SocketIOServer) {
    this.io = io;
  }

  async handleJoinDocument(socket: any, data: { noteId: string }) {
    try {
      const { noteId } = data;
      const user = socket.user as SocketUser;

      if (!noteId) {
        socket.emit('error', { message: 'Note ID is required' });
        return;
      }

      // Check if user has access to the document
      const access = await sharingService.checkNoteAccess(noteId, user.id);

      if (!access.canView) {
        socket.emit('error', { message: 'You do not have access to this document' });
        return;
      }

      // Join the document room
      const roomName = `note_${noteId}`;
      socket.join(roomName);

      // Initialize or get document room
      if (!this.documentRooms.has(noteId)) {
        const note = await prisma.note.findUnique({
          where: { id: noteId },
          select: { id: true },
        });

        if (!note) {
          socket.emit('error', { message: 'Document not found' });
          return;
        }

        this.documentRooms.set(noteId, {
          noteId,
          users: new Map(),
          version: 0,
        });
      }

      const room = this.documentRooms.get(noteId)!;
      
      const participant: Participant = {
        userId: user.id,
        userName: user.name || user.email.split('@')[0],
        color: getColor(user.id),
        socketId: socket.id
      };

      room.users.set(socket.id, participant);

      // Notify others in the room
      socket.to(roomName).emit('document:user:joined', participant);

      // Send current users to the new joiner
      const users = Array.from(room.users.values());

      socket.emit('document:users', { users });

      logger.info(`User ${user.email} joined document ${noteId}`);
    } catch (error) {
      logger.error('Error joining document:', error);
      socket.emit('error', { message: 'Failed to join document' });
    }
  }

  handleLeaveDocument(socket: any, data: { noteId: string }) {
    try {
      const { noteId } = data;
      const user = socket.user as SocketUser;
      const roomName = `note_${noteId}`;

      socket.leave(roomName);

      const room = this.documentRooms.get(noteId);
      if (room) {
        room.users.delete(socket.id);

        // Notify others
        socket.to(roomName).emit('document:user:left', {
          userId: user.id,
          socketId: socket.id,
        });

        // Clean up empty rooms
        if (room.users.size === 0) {
          this.documentRooms.delete(noteId);
        }
      }

      logger.info(`User ${user.email} left document ${noteId}`);
    } catch (error) {
      logger.error('Error leaving document:', error);
    }
  }

  async handleDocumentEdit(socket: any, data: { noteId: string; operations: any[]; version: number }) {
    try {
      const { noteId, operations, version } = data;
      const user = socket.user as SocketUser;

      if (!noteId || !operations) {
        socket.emit('error', { message: 'Invalid edit data' });
        return;
      }

      // Check edit permission
      const access = await sharingService.checkNoteAccess(noteId, user.id);

      if (!access.canEdit) {
        socket.emit('error', { message: 'You do not have edit permission' });
        return;
      }

      const room = this.documentRooms.get(noteId);
      if (!room) {
        // If room doesn't exist in memory but should (maybe server restart), 
        // we might want to recover or error. For now, error.
        socket.emit('error', { message: 'Document room not found. Please rejoin.' });
        return;
      }

      // Version control check
      if (version !== room.version) {
        socket.emit('document:conflict', {
          currentVersion: room.version,
          yourVersion: version,
        });
        return;
      }

      // Increment version immediately
      room.version++;
      const currentServerVersion = room.version;

      // Broadcast to all users in the room (including sender)
      this.io.to(`note_${noteId}`).emit('document:updated', {
        operations,
        version: currentServerVersion,
        userId: user.id,
        userName: user.name || user.email,
        timestamp: new Date().toISOString(),
      });

      // Async save to database
      this.saveDocumentEdit(noteId, user.id, operations, currentServerVersion, socket);

      logger.info(`User ${user.email} edited document ${noteId}, version ${currentServerVersion}`);
    } catch (error) {
      logger.error('Error handling document edit:', error);
      socket.emit('error', { message: 'Failed to process edit' });
    }
  }

  public getParticipant(noteId: string, socketId: string): Participant | undefined {
    const room = this.documentRooms.get(noteId);
    return room?.users.get(socketId);
  }

  private async saveDocumentEdit(
    noteId: string, 
    userId: string, 
    operations: any[], 
    version: number, 
    socket: any
  ) {
    try {
      // Save edit history
      await prisma.documentEdit.create({
        data: {
          noteId,
          userId,
          operations,
          version,
          ipAddress: socket.handshake.address,
          userAgent: socket.handshake.headers['user-agent'],
        },
      });

      // Update note timestamp
      await prisma.note.update({
        where: { id: noteId },
        data: {
          updatedAt: new Date(),
        },
      });
    } catch (error) {
      logger.error(`Error saving document edit for note ${noteId}:`, error);
    }
  }

  handleDisconnect(socket: any) {
    const user = socket.user as SocketUser;

    // Remove user from all document rooms
    for (const [noteId, room] of this.documentRooms.entries()) {
      if (room.users.has(socket.id)) {
        room.users.delete(socket.id);

        // Notify others
        this.io.to(`note_${noteId}`).emit('document:user:left', {
          userId: user.id,
          socketId: socket.id,
        });

        // Clean up empty rooms
        if (room.users.size === 0) {
          this.documentRooms.delete(noteId);
        }
      }
    }
  }
}
