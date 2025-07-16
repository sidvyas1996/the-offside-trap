import { Request, Response } from 'express';
import { authService } from '../services/auth.service';

export class AuthController {
  async register(req: Request, res: Response) {
    try {
      const { email, username, avatar } = req.body;

      const token = await authService.register({ email, username, avatar });
      res.status(201).json({ success: true, token });
    } catch (error) {
      console.error('[REGISTER]', error);
      const message = error instanceof Error ? error.message : 'An unknown error occurred';
      res.status(400).json({ success: false, error: message });
    }
  }

  async login(req: Request, res: Response) {
    try {
      const { email, password } = req.body;

      const token = await authService.login(email, password);
      res.status(200).json({ success: true, token });
    } catch (error) {
      console.error('[LOGIN]', error);
      const message = error instanceof Error ? error.message : 'Invalid credentials';
      res.status(401).json({ success: false, error: message });
    }
  }
  async tokenRefresh(req: Request, res: Response) {
    try {
      const { refreshToken } = req.body;

      const token = await authService.refreshAccessToken(refreshToken);
      res.status(200).json({ success: true, token });
    } catch (error) {
      console.error('[LOGIN]', error);
      const message = error instanceof Error ? error.message : 'Invalid refresh token';
      res.status(401).json({ success: false, error: message });
    }
  }
}
