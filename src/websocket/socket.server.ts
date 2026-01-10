import { Server as HTTPServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import jwt from 'jsonwebtoken';
import logger from '../utils/logger';
import { DocumentEditHandler } from './handlers/document.handler';
import { CursorHandler } from './handlers/cursor.handler';
import { PresenceHandler } from './handlers/presence.handler';

export class SocketServer {
  private io: SocketIOServer;
  private documentHandler: DocumentEditHandler;
  private cursorHandler: CursorHandler;
  private presenceHandler: PresenceHandler;

  constructor(httpServer: HTTPServer) {
    this.io = new SocketIOServer(httpServer, {
      cors: {
        origin: process.env.FRONTEND_URL || 'http://localhost:3000',
        credentials: true,
      },
      transports: ['websocket', 'polling'],
    });

    this.documentHandler = new DocumentEditHandler(this.io);
    this.cursorHandler = new CursorHandler(this.io, this.documentHandler);
    this.presenceHandler = new PresenceHandler(this.io);

    this.setupMiddleware();
    this.setupEventHandlers();
  }

  private setupMiddleware() {
    // Authentication middleware
    this.io.use(async (socket: any, next) => {
      try {
        const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.substring(7);

        if (!token) {
          return next(new Error('Authentication error: No token provided'));
        }

        if (!process.env.JWT_SECRET) {
          return next(new Error('JWT_SECRET is not configured'));
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET) as { id: string };

        // Get user from database
        const prisma = (await import('../config/database')).default;
        const user = await prisma.user.findUnique({
          where: { id: decoded.id },
          select: {
            id: true,
            email: true,
            name: true,
          },
        });

        if (!user) {
          return next(new Error('Authentication error: User not found'));
        }

        socket.user = user;
        next();
      } catch (error) {
        logger.error('Socket authentication error:', error);
        next(new Error('Authentication error: Invalid token'));
      }
    });
  }

  private setupEventHandlers() {
    this.io.on('connection', (socket: any) => {
      logger.info(`User connected: ${socket.user?.email} (${socket.id})`);

      // Document events
      socket.on('document:join', (data: any) => this.documentHandler.handleJoinDocument(socket, data));
      socket.on('document:leave', (data: any) => this.documentHandler.handleLeaveDocument(socket, data));
      socket.on('document:edit', (data: any) => this.documentHandler.handleDocumentEdit(socket, data));

      // Cursor events
      socket.on('cursor:update', (data: any) => this.cursorHandler.handleCursorUpdate(socket, data));

      // Presence events
      socket.on('presence:subscribe', (data: any) => this.presenceHandler.handlePresenceSubscribe(socket, data));

      // Disconnect
      socket.on('disconnect', () => {
        logger.info(`User disconnected: ${socket.user?.email} (${socket.id})`);
        this.documentHandler.handleDisconnect(socket);
        this.presenceHandler.handleDisconnect(socket);
      });

      // Error handling
      socket.on('error', (error: any) => {
        logger.error('Socket error:', error);
      });
    });
  }

  public getIO() {
    return this.io;
  }
}

export default SocketServer;
