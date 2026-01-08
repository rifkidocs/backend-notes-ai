import { Socket, Server as SocketIOServer } from 'socket.io';
import logger from '../../utils/logger';
import prisma from '../../config/database';
import { sharingService } from '../../services/sharing.service';

interface DocumentRoom {
  noteId: string;
  users: Map<string, SocketUser>;
  version: number;
}

interface SocketUser {
  id: string;
  email: string;
  name: string | null;
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
      const roomName = `document:${noteId}`;
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
      room.users.set(socket.id, user);

      // Notify others in the room
      socket.to(roomName).emit('document:user:joined', {
        userId: user.id,
        userName: user.name || user.email,
        socketId: socket.id,
      });

      // Send current users to the new joiner
      const users = Array.from(room.users.values()).map((u) => ({
        id: u.id,
        name: u.name || u.email,
      }));

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
      const roomName = `document:${noteId}`;

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
        socket.emit('error', { message: 'Document room not found' });
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

      // Save to database
      await prisma.documentEdit.create({
        data: {
          noteId,
          userId: user.id,
          operations,
          version: room.version + 1,
          ipAddress: socket.handshake.address,
          userAgent: socket.handshake.headers['user-agent'],
        },
      });

      // Update version
      room.version++;

      // Update document content (simplified - in production, use OT)
      await prisma.note.update({
        where: { id: noteId },
        data: {
          updatedAt: new Date(),
        },
      });

      // Broadcast to all users in the room (including sender for confirmation)
      this.io.to(`document:${noteId}`).emit('document:updated', {
        operations,
        version: room.version,
        userId: user.id,
        userName: user.name || user.email,
        timestamp: new Date().toISOString(),
      });

      logger.info(`User ${user.email} edited document ${noteId}, version ${room.version}`);
    } catch (error) {
      logger.error('Error handling document edit:', error);
      socket.emit('error', { message: 'Failed to save edit' });
    }
  }

  handleDisconnect(socket: any) {
    const user = socket.user as SocketUser;

    // Remove user from all document rooms
    for (const [noteId, room] of this.documentRooms.entries()) {
      if (room.users.has(socket.id)) {
        room.users.delete(socket.id);

        // Notify others
        this.io.to(`document:${noteId}`).emit('document:user:left', {
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
