import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';
import { asyncHandler, createError } from '../middlewares/error.middleware';

const prisma = new PrismaClient();

interface JwtPayload {
    userId: string;
    email: string;
}

export class AuthController {
    // Register new user
    register = asyncHandler(async (req: Request, res: Response) => {
        const { username, email, password } = req.body;

        // Check if user already exists
        const existingUser = await prisma.user.findFirst({
            where: {
                OR: [
                    { email },
                    { username }
                ]
            }
        });

        if (existingUser) {
            if (existingUser.email === email) {
                throw createError('Email already registered', 409);
            }
            if (existingUser.username === username) {
                throw createError('Username already taken', 409);
            }
        }

        // Hash password
        const saltRounds = 12;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        // Create user
        const user = await prisma.user.create({
            data: {
                username,
                email,
                password: hashedPassword
            },
            select: {
                id: true,
                username: true,
                email: true,
                avatar: true,
                createdAt: true
            }
        });

        // Generate JWT tokens
        const accessToken = this.generateAccessToken(user.id, user.email);
        const refreshToken = this.generateRefreshToken(user.id);

        // Store refresh token (optional - for more secure implementation)
        // You could store refresh tokens in database for invalidation

        res.status(201).json({
            success: true,
            data: {
                user,
                tokens: {
                    accessToken,
                    refreshToken,
                    expiresIn: '7d'
                }
            },
            message: 'Account created successfully'
        });
    });

    // Login user
    login = asyncHandler(async (req: Request, res: Response) => {
        const { email, password } = req.body;

        // Find user by email
        const user = await prisma.user.findUnique({
            where: { email },
            select: {
                id: true,
                username: true,
                email: true,
                password: true,
                avatar: true,
                createdAt: true
            }
        });

        if (!user) {
            throw createError('Invalid email or password', 401);
        }

        // Verify password
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            throw createError('Invalid email or password', 401);
        }

        // Generate JWT tokens
        const accessToken = this.generateAccessToken(user.id, user.email);
        const refreshToken = this.generateRefreshToken(user.id);

        // Remove password from response
        const { password: _, ...userWithoutPassword } = user;

        res.json({
            success: true,
            data: {
                user: userWithoutPassword,
                tokens: {
                    accessToken,
                    refreshToken,
                    expiresIn: '7d'
                }
            },
            message: 'Login successful'
        });
    });

    // Refresh access token
    refreshToken = asyncHandler(async (req: Request, res: Response) => {
        const { refreshToken } = req.body;

        if (!refreshToken) {
            throw createError('Refresh token required', 401);
        }

        try {
            // Verify refresh token
            const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET!) as JwtPayload;

            // Find user
            const user = await prisma.user.findUnique({
                where: { id: decoded.userId },
                select: {
                    id: true,
                    username: true,
                    email: true,
                    avatar: true
                }
            });

            if (!user) {
                throw createError('User not found', 401);
            }

            // Generate new access token
            const newAccessToken = this.generateAccessToken(user.id, user.email);

            res.json({
                success: true,
                data: {
                    accessToken: newAccessToken,
                    expiresIn: '7d'
                }
            });
        } catch (error) {
            throw createError('Invalid refresh token', 401);
        }
    });

    // Get current user profile
    getProfile = asyncHandler(async (req: Request, res: Response) => {
        const userId = req.user!.id;

        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                username: true,
                email: true,
                avatar: true,
                createdAt: true,
                _count: {
                    select: {
                        tactics: true,
                        likes: true,
                        saves: true,
                        comments: true
                    }
                }
            }
        });

        if (!user) {
            throw createError('User not found', 404);
        }

        res.json({
            success: true,
            data: {
                ...user,
                stats: {
                    tacticsCreated: user._count.tactics,
                    likesGiven: user._count.likes,
                    tacticsSaved: user._count.saves,
                    commentsPosted: user._count.comments
                }
            }
        });
    });

    // Update profile
    updateProfile = asyncHandler(async (req: Request, res: Response) => {
        const userId = req.user!.id;
        const { username, avatar } = req.body;

        // Validate input
        if (!username && !avatar) {
            throw createError('At least one field is required', 400);
        }

        const updateData: any = {};

        // Check username availability if provided
        if (username) {
            if (username.length < 3 || username.length > 20) {
                throw createError('Username must be between 3 and 20 characters', 400);
            }

            if (!/^[a-zA-Z0-9_]+$/.test(username)) {
                throw createError('Username can only contain letters, numbers, and underscores', 400);
            }

            // Check if username is already taken (by someone else)
            const existingUser = await prisma.user.findFirst({
                where: {
                    username,
                    NOT: { id: userId }
                }
            });

            if (existingUser) {
                throw createError('Username already taken', 409);
            }

            updateData.username = username;
        }

        // Validate avatar URL if provided
        if (avatar) {
            if (typeof avatar !== 'string') {
                throw createError('Avatar must be a valid URL', 400);
            }
            updateData.avatar = avatar;
        }

        // Update user
        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: updateData,
            select: {
                id: true,
                username: true,
                email: true,
                avatar: true,
                createdAt: true
            }
        });

        res.json({
            success: true,
            data: updatedUser,
            message: 'Profile updated successfully'
        });
    });

    // Change password
    changePassword = asyncHandler(async (req: Request, res: Response) => {
        const userId = req.user!.id;
        const { currentPassword, newPassword } = req.body;

        // Validate input
        if (!currentPassword || !newPassword) {
            throw createError('Current password and new password are required', 400);
        }

        // Validate new password strength
        if (newPassword.length < 8) {
            throw createError('New password must be at least 8 characters', 400);
        }

        if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(newPassword)) {
            throw createError('New password must contain at least one uppercase letter, one lowercase letter, and one number', 400);
        }

        // Get current user with password
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                password: true
            }
        });

        if (!user) {
            throw createError('User not found', 404);
        }

        // Verify current password
        const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
        if (!isCurrentPasswordValid) {
            throw createError('Current password is incorrect', 401);
        }

        // Check if new password is different from current
        const isSamePassword = await bcrypt.compare(newPassword, user.password);
        if (isSamePassword) {
            throw createError('New password must be different from current password', 400);
        }

        // Hash new password
        const saltRounds = 12;
        const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);

        // Update password
        await prisma.user.update({
            where: { id: userId },
            data: { password: hashedNewPassword }
        });

        res.json({
            success: true,
            message: 'Password changed successfully'
        });
    });

    // Logout (for token invalidation - optional implementation)
    logout = asyncHandler(async (req: Request, res: Response) => {
        // In a stateless JWT implementation, logout is handled client-side
        // by removing the token from storage

        // If you implement token blacklisting or refresh token storage,
        // you would invalidate them here:

        // const { refreshToken } = req.body;
        // if (refreshToken) {
        //   await prisma.refreshToken.delete({
        //     where: { token: refreshToken }
        //   });
        // }

        res.json({
            success: true,
            message: 'Logged out successfully'
        });
    });

    // Forgot password (placeholder for future implementation)
    forgotPassword = asyncHandler(async (req: Request, res: Response) => {
        const { email } = req.body;

        if (!email) {
            throw createError('Email is required', 400);
        }

        // Check if user exists
        const user = await prisma.user.findUnique({
            where: { email },
            select: { id: true, email: true, username: true }
        });

        if (!user) {
            // Don't reveal if email exists or not for security
            res.json({
                success: true,
                message: 'If an account with that email exists, we will send a password reset link'
            });
            return;
        }

        // TODO: Implement password reset functionality
        // 1. Generate reset token
        // 2. Store token with expiration in database
        // 3. Send email with reset link
        // 4. Create reset password endpoint

        res.json({
            success: true,
            message: 'Password reset functionality not implemented yet'
        });
    });

    // Helper methods
    private generateAccessToken(userId: string, email: string): string {
        const secret = process.env.JWT_SECRET;

        if (!secret) {
            throw new Error('JWT_SECRET environment variable is not defined');
        }

        return jwt.sign(
            { userId, email },
            secret,
            {expiresIn:'7d'},
        );
    }

    private generateRefreshToken(userId: string): string {
        const refreshSecret = process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET!;
        return jwt.sign(
            { userId },
            refreshSecret,
            { expiresIn: '30d' }
        );
    }

    // Verify email (placeholder for future implementation)
    verifyEmail = asyncHandler(async (req: Request, res: Response) => {
        const { token } = req.params;

        // TODO: Implement email verification
        // 1. Verify token
        // 2. Mark user as verified
        // 3. Update database

        res.status(501).json({
            success: false,
            error: 'Email verification not implemented yet'
        });
    });

    // Resend verification email (placeholder for future implementation)
    resendVerification = asyncHandler(async (req: Request, res: Response) => {
        const userId = req.user!.id;

        // TODO: Implement resend verification
        // 1. Check if user is already verified
        // 2. Generate new verification token
        // 3. Send email

        res.status(501).json({
            success: false,
            error: 'Email verification not implemented yet'
        });
    });
}