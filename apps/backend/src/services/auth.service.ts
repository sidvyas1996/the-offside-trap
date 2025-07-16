import jwt from 'jsonwebtoken';
import { prisma } from './db.service';
import {
  JWT_SECRET,
  JWT_REFRESH_SECRET,
  JWT_EXPIRES_IN,
  JWT_REFRESH_EXPIRES_IN,
} from '../configs/env';

type RegisterInput = {
  email: string;
  username: string;
  avatar?: string;
};

type JwtPayload = {
  id: string;
  email: string;
  username: string;
};

function createAccessToken(payload: JwtPayload): string {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN, // e.g. '15m'
  });
}

function createRefreshToken(payload: { id: string }): string {
  return jwt.sign(payload, JWT_REFRESH_SECRET, {
    expiresIn: JWT_REFRESH_EXPIRES_IN, // e.g. '7d'
  });
}

export const authService = {
  async register({
    email,
    username,
    avatar,
  }: RegisterInput): Promise<{ accessToken: string; refreshToken: string }> {
    const existingEmail = await prisma.user.findUnique({ where: { email } });
    if (existingEmail) throw new Error('Email already registered');

    const existingUsername = await prisma.user.findUnique({ where: { username } });
    if (existingUsername) throw new Error('Username already taken');

    const newUser = await prisma.user.create({
      data: {
        email,
        username,
        avatar,
      },
    });

    const payload = {
      id: newUser.id,
      email: newUser.email,
      username: newUser.username,
    };

    return {
      accessToken: createAccessToken(payload),
      refreshToken: createRefreshToken({ id: newUser.id }),
    };
  },

  async login(
    email: string,
    password: string,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) throw new Error('Invalid email or password');

    const payload = {
      id: user.id,
      email: user.email,
      username: user.username,
    };

    return {
      accessToken: createAccessToken(payload),
      refreshToken: createRefreshToken({ id: user.id }),
    };
  },

  async refreshAccessToken(refreshToken: string): Promise<string> {
    try {
      const decoded = jwt.verify(refreshToken, JWT_REFRESH_SECRET) as { id: string };
      const user = await prisma.user.findUnique({ where: { id: decoded.id } });

      if (!user) throw new Error('User not found');

      const payload = {
        id: user.id,
        email: user.email,
        username: user.username,
      };

      return createAccessToken(payload);
    } catch (err) {
      throw new Error('Invalid or expired refresh token');
    }
  },
};
