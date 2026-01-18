import app from './app';
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
dotenv.config();

const PORT = process.env.PORT || 3001;
const prisma = new PrismaClient();

async function startServer() {
  try {
    // Try to connect to database (optional - not required for export endpoint)
    if (process.env.DATABASE_URL) {
      try {
        await prisma.$connect();
        console.log('✅ Database connected successfully');
      } catch (dbError) {
        console.warn('⚠️  Database connection failed (some features may not work):', dbError instanceof Error ? dbError.message : 'Unknown error');
      }
    } else {
      console.log('ℹ️  DATABASE_URL not set - running without database (export endpoint will still work)');
    }

    // Start the server
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🔗 API URL: http://localhost:${PORT}/api`);
      console.log(`❤️  Health check: http://localhost:${PORT}/health`);
      console.log(`📸 Export endpoint: http://localhost:${PORT}/api/export/field`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down gracefully...');
  try {
    await prisma.$disconnect();
  } catch (error) {
    // Ignore disconnect errors if not connected
  }
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 Shutting down gracefully...');
  try {
    await prisma.$disconnect();
  } catch (error) {
    // Ignore disconnect errors if not connected
  }
  process.exit(0);
});

startServer();
