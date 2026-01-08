import prisma from '../config/database';
import { AppError } from '../middleware/error.middleware';
import { DocumentContent } from '../types/global';

export class NotesService {
  async createNote(userId: string, data: { title?: string; content?: any }) {
    const note = await prisma.note.create({
      data: {
        title: data.title || 'Untitled',
        content: data.content || { type: 'doc', children: [] },
        ownerId: userId,
      },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          },
        },
      },
    });

    return note;
  }

  async getNotes(
    userId: string,
    options: {
      page?: number;
      limit?: number;
      includeDeleted?: boolean;
      search?: string;
    } = {}
  ) {
    const page = options.page || 1;
    const limit = options.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = {
      ownerId: userId,
    };

    if (!options.includeDeleted) {
      where.isDeleted = false;
    }

    if (options.search) {
      where.OR = [
        { title: { contains: options.search, mode: 'insensitive' } },
      ];
    }

    const [notes, total] = await Promise.all([
      prisma.note.findMany({
        where,
        skip,
        take: limit,
        orderBy: { updatedAt: 'desc' },
        include: {
          owner: {
            select: {
              id: true,
              name: true,
              email: true,
              avatar: true,
            },
          },
        },
      }),
      prisma.note.count({ where }),
    ]);

    return {
      notes,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getNoteById(noteId: string, userId: string) {
    const note = await prisma.note.findUnique({
      where: { id: noteId },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          },
        },
        sharedAccess: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                avatar: true,
              },
            },
          },
        },
      },
    });

    if (!note) {
      throw new AppError(404, 'Note not found');
    }

    // Check if user has access
    if (note.ownerId !== userId && !note.isPublic) {
      const hasAccess = note.sharedAccess.some(
        (access) => access.userId === userId
      );

      if (!hasAccess) {
        throw new AppError(403, 'You do not have access to this note');
      }
    }

    return note;
  }

  async updateNote(
    noteId: string,
    userId: string,
    data: {
      title?: string;
      content?: any;
      icon?: string;
      coverImage?: string;
    }
  ) {
    const note = await prisma.note.findUnique({
      where: { id: noteId },
    });

    if (!note) {
      throw new AppError(404, 'Note not found');
    }

    if (note.ownerId !== userId) {
      throw new AppError(403, 'You do not have permission to update this note');
    }

    const updatedNote = await prisma.note.update({
      where: { id: noteId },
      data: {
        ...data,
        updatedAt: new Date(),
      },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          },
        },
      },
    });

    return updatedNote;
  }

  async deleteNote(noteId: string, userId: string) {
    const note = await prisma.note.findUnique({
      where: { id: noteId },
    });

    if (!note) {
      throw new AppError(404, 'Note not found');
    }

    if (note.ownerId !== userId) {
      throw new AppError(403, 'You do not have permission to delete this note');
    }

    await prisma.note.update({
      where: { id: noteId },
      data: {
        isDeleted: true,
        updatedAt: new Date(),
      },
    });

    return { message: 'Note deleted successfully' };
  }

  async archiveNote(noteId: string, userId: string) {
    const note = await prisma.note.findUnique({
      where: { id: noteId },
    });

    if (!note) {
      throw new AppError(404, 'Note not found');
    }

    if (note.ownerId !== userId) {
      throw new AppError(403, 'You do not have permission to archive this note');
    }

    const updatedNote = await prisma.note.update({
      where: { id: noteId },
      data: {
        isArchived: true,
        updatedAt: new Date(),
      },
    });

    return updatedNote;
  }

  async restoreNote(noteId: string, userId: string) {
    const note = await prisma.note.findUnique({
      where: { id: noteId },
    });

    if (!note) {
      throw new AppError(404, 'Note not found');
    }

    if (note.ownerId !== userId) {
      throw new AppError(403, 'You do not have permission to restore this note');
    }

    const updatedNote = await prisma.note.update({
      where: { id: noteId },
      data: {
        isDeleted: false,
        isArchived: false,
        updatedAt: new Date(),
      },
    });

    return updatedNote;
  }

  async getSharedNotes(userId: string, options: { page?: number; limit?: number } = {}) {
    const page = options.page || 1;
    const limit = options.limit || 20;
    const skip = (page - 1) * limit;

    const [notes, total] = await Promise.all([
      prisma.note.findMany({
        where: {
          sharedAccess: {
            some: {
              userId: userId,
            },
          },
          isDeleted: false,
        },
        skip,
        take: limit,
        orderBy: { updatedAt: 'desc' },
        include: {
          owner: {
            select: {
              id: true,
              name: true,
              email: true,
              avatar: true,
            },
          },
          sharedAccess: {
            where: {
              userId: userId,
            },
          },
        },
      }),
      prisma.note.count({
        where: {
          sharedAccess: {
            some: {
              userId: userId,
            },
          },
          isDeleted: false,
        },
      }),
    ]);

    return {
      notes,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}

export default new NotesService();
