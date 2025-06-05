// apps/backend/src/controllers/users.controller.ts
import { Request, Response } from 'express';
import { usersService } from '../services/users.service';

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
  async getUserById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const user = await usersService.getUserById(id);

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
      const { userId, username, email } = req.body;

      // Basic validation
      if (!username || !email) {
        return res.status(400).json({ success: false, error: 'Username and email are required' });
      }

      // Create user
      const newUser = await usersService.createUser({ id: userId, username, email });

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
  async deleteUser(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const result = await usersService.deleteUser(id);

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
  async getProfile(req: Request, res: Response) {
    try {
      // For now just return a mock user
      // Later this will use the authenticated user's ID
      const user = await usersService.getUserById('1');

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
