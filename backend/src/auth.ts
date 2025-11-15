import jwt from 'jsonwebtoken';

// Generate JWT token for users
export const generateUserToken = (userId: string): string => {
    const JWT_SECRET = process.env.JWT_SECRET;
    if (!JWT_SECRET) {
        throw new Error('JWT_SECRET not configured');
    }
    return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '7d' });
};

// Generate JWT token for workers
export const generateWorkerToken = (workerId: string): string => {
    const WORKER_JWT_SECRET = process.env.WORKER_JWT_SECRET;
    if (!WORKER_JWT_SECRET) {
        throw new Error('WORKER_JWT_SECRET not configured');
    }
    return jwt.sign({ workerId }, WORKER_JWT_SECRET, { expiresIn: '7d' });
};

// Verify JWT token for users
export const verifyUserToken = (token: string): { userId: string } => {
    const JWT_SECRET = process.env.JWT_SECRET;
    if (!JWT_SECRET) {
        throw new Error('JWT_SECRET not configured');
    }
    return jwt.verify(token, JWT_SECRET) as { userId: string };
};

// Verify JWT token for workers
export const verifyWorkerToken = (token: string): { workerId: string } => {
    const WORKER_JWT_SECRET = process.env.WORKER_JWT_SECRET;
    if (!WORKER_JWT_SECRET) {
        throw new Error('WORKER_JWT_SECRET not configured');
    }
    return jwt.verify(token, WORKER_JWT_SECRET) as { workerId: string };
};
