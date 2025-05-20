import { PrismaClient } from '@prisma/client';

// Singleton pattern for database client
export class DatabaseService {
    private static instance: DatabaseService;
    private prisma: PrismaClient;

    private constructor() {
        this.prisma = new PrismaClient({
            log: process.env.NODE_ENV === 'development'
                ? ['query', 'info', 'warn', 'error']
                : ['error'],
        });
    }

    public static getInstance(): DatabaseService {
        if (!DatabaseService.instance) {
            DatabaseService.instance = new DatabaseService();
        }
        return DatabaseService.instance;
    }

    public getPrisma(): PrismaClient {
        return this.prisma;
    }

    public async connect(): Promise<void> {
        try {
            await this.prisma.$connect();
            console.log('✅ Database connected successfully');
        } catch (error) {
            console.error('❌ Database connection failed:', error);
            throw error;
        }
    }

    public async disconnect(): Promise<void> {
        await this.prisma.$disconnect();
        console.log('Database disconnected');
    }
}

// Export a prisma instance for use in services
export const prisma = DatabaseService.getInstance().getPrisma();