import dotenv from 'dotenv';
dotenv.config(); // MUST load first — before any other import uses env vars

import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import userRoutes from './user';
import workerRoutes from './worker';

// Initialize app and database
const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3000;

// ---------- Sanity check ----------
if (!process.env.JWT_SECRET) {
    console.error('❌ JWT_SECRET is missing in .env');
    process.exit(1);
}
if (!process.env.WORKER_JWT_SECRET) {
    console.error('❌ WORKER_JWT_SECRET is missing in .env');
    process.exit(1);
}
console.log('✅ Environment variables loaded correctly');

// ---------- Middleware ----------
app.use(cors({
    origin: ['http://localhost:3001', 'http://127.0.0.1:3001', 'http://localhost:3002', 'http://127.0.0.1:3002'], // user & worker frontends
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ---------- Health check ----------
app.get('/health', (req, res) => {
    res.json({
        success: true,
        message: 'Dataverse Backend is running!',
        timestamp: new Date().toISOString(),
    });
});

// ---------- Routes ----------
app.use('/api/user', userRoutes);
app.use('/api/worker', workerRoutes);

// ---------- Global error handler ----------
app.use((error: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error('🔥 Global error handler:', error);

    if (error.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
            success: false,
            message: 'File too large. Maximum size is 50MB.',
        });
    }

    if (error.message === 'Only ZIP files are allowed') {
        return res.status(400).json({
            success: false,
            message: 'Only ZIP files are allowed',
        });
    }

    res.status(500).json({
        success: false,
        message: 'Internal server error',
    });
});

// ---------- 404 handler ----------
app.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        message: 'Route not found',
    });
});

// ---------- Graceful shutdown ----------
process.on('SIGINT', async () => {
    console.log('Shutting down gracefully...');
    await prisma.$disconnect();
    process.exit(0);
});

process.on('SIGTERM', async () => {
    console.log('Shutting down gracefully...');
    await prisma.$disconnect();
    process.exit(0);
});

// ---------- Start server ----------
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📊 Health check: http://localhost:${PORT}/health`);
    console.log(`👤 User API: http://localhost:${PORT}/api/user`);
    console.log(`👷 Worker API: http://localhost:${PORT}/api/worker`);
});

export default app;
