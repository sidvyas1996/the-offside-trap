import { UserProfile } from '@prisma/client';
import { prisma } from './db.service';
interface User {
  id?: string;
  username: string;
  email: string;
  avatar?: string | null;
  profile?: UserProfile | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export class UsersService {
  // Get all users
  async getUsers() {
    return prisma.user.findMany({
      select: {
        id: true,
        username: true,
        email: true,
        avatar: true,
        profile: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // Get user by ID
  async getUserById(id: string) {
    return prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        username: true,
        avatar: true,
        email: true,
        profile: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  // Get user by username
  async getUserByUsername(username: string) {
    return prisma.user.findUnique({
      where: { username },
    });
  }

  // Get user by email
  async getUserByEmail(email: string) {
    return prisma.user.findUnique({
      where: { email },
    });
  }

  // Create new user
  async createUser(userData: { username: string; email: string; password: string }) {
    try {
      return await prisma.user.create({
        data: userData,
      });
    } catch (error: any) {
      // Handle unique constraint violations
      if (error.code === 'P2002') {
        const field = error.meta?.target?.[0] || 'field';
        throw new Error(`${field} already in use`);
      }
      throw error;
    }
  }

  // Update user
  async updateUser(id: string, updateData: User) {
    try {
      // Remove id and timestamps from update data

      return await prisma.user.update({
        where: { id },
        data: updateData,
      });
    } catch (error: any) {
      // Handle record not found
      if (error.code === 'P2025') {
        return null;
      }

      // Handle unique constraint violations
      if (error.code === 'P2002') {
        const field = error.meta?.target?.[0] || 'field';
        throw new Error(`${field} already in use`);
      }

      throw error;
    }
  }

  // Delete user
  async deleteUser(id: string): Promise<boolean> {
    try {
      await prisma.user.delete({
        where: { id },
      });
      return true;
    } catch (error: any) {
      // Handle record not found
      if (error.code === 'P2025') {
        return false;
      }
      throw error;
    }
  }

  // Search users
  async searchUsers(query: string) {
    return prisma.user.findMany({
      where: {
        OR: [
          { username: { contains: query, mode: 'insensitive' } },
          { email: { contains: query, mode: 'insensitive' } },
        ],
      },
      orderBy: { username: 'asc' },
      take: 10,
    });
  }

  // Update the signed-in user's own profile fields (onboarding + settings)
  async updateMe(id: string, updateData: { username?: string; profile?: UserProfile }) {
    try {
      return await prisma.user.update({
        where: { id },
        data: updateData,
        select: {
          id: true,
          username: true,
          email: true,
          avatar: true,
          profile: true,
          createdAt: true,
          updatedAt: true,
        },
      });
    } catch (error: any) {
      if (error.code === 'P2025') return null;
      if (error.code === 'P2002') {
        const field = error.meta?.target?.[0] || 'field';
        throw new Error(`${field} already in use`);
      }
      throw error;
    }
  }

  // True when the username is free (or already owned by `excludeUserId`)
  async isUsernameAvailable(username: string, excludeUserId?: string): Promise<boolean> {
    const existing = await prisma.user.findUnique({
      where: { username },
      select: { id: true },
    });
    return !existing || existing.id === excludeUserId;
  }
}

// Export singleton instance
export const usersService = new UsersService();
