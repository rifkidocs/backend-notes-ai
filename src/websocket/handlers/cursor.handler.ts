import { Server as SocketIOServer } from 'socket.io';
import logger from '../../utils/logger';
import { DocumentEditHandler } from './document.handler';

interface CursorPosition {
  line: number;
  ch: number;
}

export class CursorHandler {
  constructor(
    private _io: SocketIOServer,
    private documentHandler: DocumentEditHandler
  ) {}

  handleCursorUpdate(socket: any, data: { noteId: string; position: CursorPosition }) {
    try {
      const { noteId, position } = data;
      
      if (!noteId || !position) {
        return;
      }

      // Get participant info from document handler (Source of Truth)
      const participant = this.documentHandler.getParticipant(noteId, socket.id);

      if (!participant) {
        // If not in room, we shouldn't broadcast cursor
        return;
      }

      // Broadcast cursor position to other users in the document
      socket.to(`note_${noteId}`).emit('cursor:moved', {
        userId: participant.userId,
        userName: participant.userName,
        color: participant.color,
        socketId: socket.id,
        position,
        timestamp: new Date().toISOString(),
      });

      logger.debug(`Cursor update from ${participant.userName} in document ${noteId}`);
    } catch (error) {
      logger.error('Error handling cursor update:', error);
    }
  }
}