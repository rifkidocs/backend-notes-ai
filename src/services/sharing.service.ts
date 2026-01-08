import prisma from '../config/database';
import { AppError } from '../middleware/error.middleware';
import { AccessLevel } from '@prisma/client';
import { randomBytes } from 'crypto';

export class SharingService {
  async makeNotePublic(
    noteId: string,
    userId: string,
    accessLevel: AccessLevel
  ) {
    const note = await prisma.note.findUnique({
      where: { id: noteId },
    });

    if (!note) {
      throw new AppError(404, 'Note not found');
    }

    if (note.ownerId !== userId) {
      throw new AppError(403, 'You do not have permission to share this note');
    }

    const updatedNote = await prisma.note.update({
      where: { id: noteId },
      data: {
        isPublic: true,
        publicAccess: accessLevel,
        updatedAt: new Date(),
      },
    });

    return updatedNote;
  }

  async removePublicAccess(noteId: string, userId: string) {
    const note = await prisma.note.findUnique({
      where: { id: noteId },
    });

    if (!note) {
      throw new AppError(404, 'Note not found');
    }

    if (note.ownerId !== userId) {
      throw new AppError(403, 'You do not have permission to modify this note');
    }

    const updatedNote = await prisma.note.update({
      where: { id: noteId },
      data: {
        isPublic: false,
        publicAccess: null,
        updatedAt: new Date(),
      },
    });

    return updatedNote;
  }

  async inviteUserByEmail(
    noteId: string,
    userId: string,
    email: string,
    accessLevel: AccessLevel
  ) {
    const note = await prisma.note.findUnique({
      where: { id: noteId },
    });

    if (!note) {
      throw new AppError(404, 'Note not found');
    }

    if (note.ownerId !== userId) {
      throw new AppError(403, 'You do not have permission to share this note');
    }

    // Check if user with this email exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    const inviteToken = randomBytes(32).toString('hex');
    const inviteExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    if (existingUser) {
      // Create shared access for existing user
      const sharedAccess = await prisma.sharedAccess.create({
        data: {
          noteId,
          userId: existingUser.id,
          accessLevel,
          inviteToken,
          inviteExpiresAt,
          inviteAcceptedAt: new Date(),
        },
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
      });

      return sharedAccess;
    } else {
      // Create pending invite
      const sharedAccess = await prisma.sharedAccess.create({
        data: {
          noteId,
          inviteEmail: email.toLowerCase(),
          accessLevel,
          inviteToken,
          inviteExpiresAt,
        },
      });

      return sharedAccess;
    }
  }

  async acceptInvite(inviteToken: string, userId: string) {
    const sharedAccess = await prisma.sharedAccess.findUnique({
      where: { inviteToken },
      include: {
        note: true,
      },
    });

    if (!sharedAccess) {
      throw new AppError(404, 'Invalid invite token');
    }

    if (sharedAccess.inviteExpiresAt && sharedAccess.inviteExpiresAt < new Date()) {
      throw new AppError(400, 'Invite has expired');
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new AppError(404, 'User not found');
    }

    // Check if email matches
    if (sharedAccess.inviteEmail && user.email !== sharedAccess.inviteEmail) {
      throw new AppError(403, 'This invite is for a different email address');
    }

    // Update the shared access
    const updatedAccess = await prisma.sharedAccess.update({
      where: { id: sharedAccess.id },
      data: {
        userId: user.id,
        inviteEmail: null,
        inviteAcceptedAt: new Date(),
      },
      include: {
        note: true,
      },
    });

    return updatedAccess;
  }

  async removeUserAccess(noteId: string, accessId: string, userId: string) {
    const note = await prisma.note.findUnique({
      where: { id: noteId },
    });

    if (!note) {
      throw new AppError(404, 'Note not found');
    }

    if (note.ownerId !== userId) {
      throw new AppError(403, 'You do not have permission to modify this note');
    }

    await prisma.sharedAccess.delete({
      where: { id: accessId },
    });

    return { message: 'Access removed successfully' };
  }

  async updateAccessLevel(
    noteId: string,
    accessId: string,
    userId: string,
    accessLevel: AccessLevel
  ) {
    const note = await prisma.note.findUnique({
      where: { id: noteId },
    });

    if (!note) {
      throw new AppError(404, 'Note not found');
    }

    if (note.ownerId !== userId) {
      throw new AppError(403, 'You do not have permission to modify this note');
    }

    const updatedAccess = await prisma.sharedAccess.update({
      where: { id: accessId },
      data: {
        accessLevel,
        updatedAt: new Date(),
      },
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
    });

    return updatedAccess;
  }

  async getSharingSettings(noteId: string, userId: string) {
    const note = await prisma.note.findUnique({
      where: { id: noteId },
      include: {
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

    if (note.ownerId !== userId) {
      throw new AppError(403, 'You do not have permission to view sharing settings');
    }

    return {
      isPublic: note.isPublic,
      publicAccess: note.publicAccess,
      sharedAccess: note.sharedAccess,
    };
  }

  async getPublicNote(noteId: string) {
    const note = await prisma.note.findUnique({
      where: { id: noteId },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            avatar: true,
          },
        },
      },
    });

    if (!note) {
      throw new AppError(404, 'Note not found');
    }

    if (!note.isPublic) {
      throw new AppError(403, 'This note is not public');
    }

    return note;
  }

  async checkNoteAccess(noteId: string, userId: string): Promise<{ canView: boolean; canEdit: boolean }> {
    const note = await prisma.note.findUnique({
      where: { id: noteId },
      include: {
        sharedAccess: true,
      },
    });

    if (!note) {
      return { canView: false, canEdit: false };
    }

    // Owner has full access
    if (note.ownerId === userId) {
      return { canView: true, canEdit: true };
    }

    // Public access
    if (note.isPublic) {
      return {
        canView: true,
        canEdit: note.publicAccess === 'EDIT',
      };
    }

    // Shared access
    const sharedAccess = note.sharedAccess.find(
      (access) => access.userId === userId
    );

    if (sharedAccess) {
      return {
        canView: true,
        canEdit: sharedAccess.accessLevel === 'EDIT',
      };
    }

    return { canView: false, canEdit: false };
  }
}

export default new SharingService();
