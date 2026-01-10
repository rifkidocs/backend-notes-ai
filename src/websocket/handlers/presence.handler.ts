import { Server as SocketIOServer } from 'socket.io';
import logger from '../../utils/logger';
import { getColor } from '../utils/color';

interface SocketUser {
  id: string;
  email: string;
  name: string | null;
}

export class PresenceHandler {
  private io: SocketIOServer;
  private userSessions: Map<string, Set<string>> = new Map(); // userId -> Set of socketIds

  constructor(io: SocketIOServer) {
    this.io = io;
  }

  handlePresenceSubscribe(socket: any, data: { noteId: string }) {
    try {
      const { noteId } = data;
      const user = socket.user as SocketUser;

      if (!noteId) {
        return;
      }

      // Track user session
      if (!this.userSessions.has(user.id)) {
        this.userSessions.set(user.id, new Set());
      }
      this.userSessions.get(user.id)!.add(socket.id);

      // Get all online users in the document
      const room = this.io.sockets.adapter.rooms.get(`note_${noteId}`);
      const onlineUsers: Map<string, { id: string; name: string; color: string }> = new Map();

      if (room) {
        for (const socketId of room) {
          const clientSocket = this.io.sockets.sockets.get(socketId);
          if (clientSocket && (clientSocket as any).user) {
            const socketUser = (clientSocket as any).user as SocketUser;
            if (!onlineUsers.has(socketUser.id)) {
              onlineUsers.set(socketUser.id, {
                id: socketUser.id,
                name: socketUser.name || socketUser.email.split('@')[0],
                color: getColor(socketUser.id)
              });
            }
          }
        }
      }

      // Send presence update
      this.io.to(`note_${noteId}`).emit('presence:online', {
        noteId,
        users: Array.from(onlineUsers.values()),
        timestamp: new Date().toISOString(),
      });

      logger.debug(`Presence subscribe: ${user.email} in document ${noteId}`);
    } catch (error) {
      logger.error('Error handling presence subscribe:', error);
    }
  }

  handleDisconnect(socket: any) {
    try {
      const user = socket.user as SocketUser;

      if (!user) return;

      // Remove socket from user sessions
      const sessions = this.userSessions.get(user.id);
      if (sessions) {
        sessions.delete(socket.id);

        // If user has no more active sessions, notify all documents
        if (sessions.size === 0) {
          this.userSessions.delete(user.id);

          // Notify all rooms that user is offline
          const rooms = socket.rooms;
          for (const roomName of rooms) {
            if (roomName.startsWith('note_')) {
              this.io.to(roomName).emit('presence:offline', {
                userId: user.id,
                timestamp: new Date().toISOString(),
              });
            }
          }
        }
      }

      logger.debug(`User disconnected: ${user.email}`);
    } catch (error) {
      logger.error('Error handling disconnect:', error);
    }
  }
}
