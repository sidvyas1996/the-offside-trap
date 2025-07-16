// apps/backend/src/controllers/users.controller.ts
import { Request, Response } from 'express';
import { usersService } from '../services/users.service';
import { AuthedRequest } from '../middlewares/auth.middleware';

export class UsersController {
  // Get all users
  async getUsers(req: Request, res: Response) {
    try {
      const users = await usersService.getUsers();
      res.json({ success: true, data: users });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      res.status(500).json({ success: false, error: errorMessage });
    }
  }

  // Get user by ID
  async getUserById(req: AuthedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      const user = await usersService.getUserById(userId!);

      if (!user) {
        res.status(404).json({ success: false, error: 'User not found' });
        return;
      }

      res.json({ success: true, data: user });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      res.status(500).json({ success: false, error: errorMessage });
    }
  }

  // Create new user
  async createUser(req: Request, res: Response) {
    try {
      const { username, email } = req.body;

      // Basic validation
      if (!username || !email) {
        return res.status(400).json({ success: false, error: 'Username and email are required' });
      }

      // Create user
      const newUser = await usersService.createUser({ username, email, password: '<PASSWORD>' });

      res.status(201).json({ success: true, data: newUser });
    } catch (error: unknown) {
      // Handle specific errors
      if (error instanceof Error && error.message === 'Username already taken') {
        return res.status(409).json({ success: false, error: error.message });
      }

      // Handle generic errors
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      res.status(500).json({ success: false, error: errorMessage });
    }
  }

  // Update user
  async updateUser(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { username, email } = req.body;

      // Update user
      const updatedUser = await usersService.updateUser(id, { username, email });

      if (!updatedUser) {
        return res.status(404).json({ success: false, error: 'User not found' });
      }

      res.json({ success: true, data: updatedUser });
    } catch (error: unknown) {
      // Handle specific errors
      if (error instanceof Error && error.message === 'Username already taken') {
        return res.status(409).json({ success: false, error: error.message });
      }

      // Handle generic errors
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      res.status(500).json({ success: false, error: errorMessage });
    }
  }

  // Delete user
  async deleteUser(req: AuthedRequest, res: Response) {
    try {
      const userId = req.user?.id;
      const result = await usersService.deleteUser(userId!);

      if (!result) {
        return res.status(404).json({ success: false, error: 'User not found' });
      }

      res.json({ success: true, message: 'User deleted successfully' });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      res.status(500).json({ success: false, error: errorMessage });
    }
  }

  // Get user profile (placeholder for when auth is added)
  async getProfile(req: AuthedRequest, res: Response) {
    try {
      const userId = req.user?.id;
      const user = await usersService.getUserById(userId!);

      if (!user) {
        return res.status(404).json({ success: false, error: 'User not found' });
      }

      res.json({ success: true, data: user });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      res.status(500).json({ success: false, error: errorMessage });
    }
  }
}
