import { Server as SocketIOServer } from 'socket.io';
import logger from '../../utils/logger';

interface SocketUser {
  id: string;
  email: string;
  name: string | null;
}

interface CursorPosition {
  line: number;
  ch: number;
}

export class CursorHandler {
  private io: SocketIOServer;

  constructor(io: SocketIOServer) {
    this.io = io;
  }

  handleCursorUpdate(socket: any, data: { noteId: string; position: CursorPosition }) {
    try {
      const { noteId, position } = data;
      const user = socket.user as SocketUser;

      if (!noteId || !position) {
        return;
      }

      // Broadcast cursor position to other users in the document
      socket.to(`document:${noteId}`).emit('cursor:moved', {
        userId: user.id,
        userName: user.name || user.email,
        position,
        color: this.getUserColor(user.id),
        timestamp: new Date().toISOString(),
      });

      logger.debug(`Cursor update from ${user.email} in document ${noteId}`);
    } catch (error) {
      logger.error('Error handling cursor update:', error);
    }
  }

  private getUserColor(userId: string): string {
    // Generate a consistent color based on user ID
    const colors = [
      '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A',
      '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E2',
    ];
    const index = parseInt(userId.slice(-4), 16) % colors.length;
    return colors[index];
  }
}
