import { z } from 'zod';

export const registerSchema = z.object({
    body: z.object({
        username: z.string()
            .min(3, 'Username must be at least 3 characters')
            .max(20, 'Username must be less than 20 characters')
            .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'),
        email: z.string().email('Invalid email address'),
        password: z.string()
            .min(8, 'Password must be at least 8 characters')
            .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain at least one uppercase letter, one lowercase letter, and one number')
    })
});

export const loginSchema = z.object({
    body: z.object({
        email: z.string().email('Invalid email address'),
        password: z.string().min(1, 'Password is required')
    })
});