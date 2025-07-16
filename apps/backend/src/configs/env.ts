import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

export const JWT_SECRET = process.env.JWT_SECRET!;
export const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET!;
export const JWT_EXPIRES_IN = '1h';
export const JWT_REFRESH_EXPIRES_IN = '7d'; // or get from env
