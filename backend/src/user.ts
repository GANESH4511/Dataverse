import nacl from "tweetnacl";
import { PublicKey } from "@solana/web3.js";
import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { autMiddleware } from './middleware';
import { generatePresignedUrl } from './s3';
import { generateUserToken } from './auth';
import { convertS3KeyToCloudFrontUrl, extractS3KeyFromUrl, validateS3Key } from './cloudfront';

import bs58 from 'bs58';

const router = Router();
const prisma = new PrismaClient();

// GET / - Show available user endpoints
router.get('/', (req: Request, res: Response) => {
    res.json({
        success: true,
        message: 'User API endpoints',
        endpoints: {

            'POST /api/user/upload-presigned-url': 'Get pre-signed URL for S3 upload (requires auth)',
            'POST /api/user/task-from-s3': 'Create task from S3 file with CloudFront URL (requires auth)',
            'GET /api/user/task': 'Get user tasks (requires auth)',
            'POST /api/user/payments': 'Record payment (requires auth)'
        }
    });
});

// ------------------------------------------------------------
// WALLET SIGN-IN FLOW
// ------------------------------------------------------------

// STEP 1: Generate a nonce message for wallet signing
router.post("/wallet-nonce", async (req: Request, res: Response) => {
    const { publicKey } = req.body;

    if (!publicKey) {
        return res.status(400).json({
            success: false,
            message: "publicKey is required"
        });
    }

    let user = await prisma.user.findUnique({
        where: { walletAddress: publicKey }
    });

    if (!user) {
        user = await prisma.user.create({
            data: {
                walletAddress: publicKey,
                nonce: Math.floor(Math.random() * 1000000).toString()
            }
        });
    }

    return res.json({
        success: true,
        message: `Sign this message to authenticate: ${user.nonce}`
    });
});

// STEP 2: Verify signed message and return JWT
router.post("/wallet-signin", async (req: Request, res: Response) => {
    try {
        const { publicKey, signature, message } = req.body;
        console.log("🟢 wallet-signin triggered with:", { publicKey, signatureLength: signature?.length, message });

        if (!publicKey || !signature || !message) {
            return res.status(400).json({
                success: false,
                message: "publicKey, signature, and message are required"
            });
        }

        const user = await prisma.user.findUnique({ where: { walletAddress: publicKey } });
        if (!user) {
            console.error("❌ User not found for wallet:", publicKey);
            return res.status(404).json({
                success: false,
                message: "Wallet not registered. Please request a nonce first."
            });
        }

        console.log("✅ Found user:", user);

        const isValid = nacl.sign.detached.verify(
            new TextEncoder().encode(message),
            new Uint8Array(signature),
            new PublicKey(publicKey).toBytes()
        );

        if (!isValid) {
            console.error("❌ Invalid signature for:", publicKey);
            return res.status(401).json({ success: false, message: "Invalid signature." });
        }

        console.log("✅ Signature valid, generating JWT...");
        console.log("🔐 JWT_SECRET available:", !!process.env.JWT_SECRET);

        const token = generateUserToken(user.id);
        console.log("✅ Generated token:", token);

        if (!token) {
            console.error("❌ Token generation failed!");
            return res.status(500).json({
                success: false,
                message: "Token generation failed — JWT_SECRET may be missing"
            });
        }

        await prisma.user.update({
            where: { id: user.id },
            data: { nonce: Math.floor(Math.random() * 1000000).toString() }
        });

        console.log("✅ Returning login response");
        return res.json({
            success: true,
            message: "Login successful",
            token,
            user: {
                id: user.id,
                walletAddress: user.walletAddress
            }
        });
    } catch (err: any) {
        console.error("💥 Wallet signin error:", err);
        return res.status(500).json({
            success: false,
            message: "Internal server error",
            error: err.message
        });
    }
});



// POST /upload-presigned-url - Generate pre-signed URL for direct S3 upload
router.post('/upload-presigned-url', autMiddleware, async (req: Request, res: Response) => {
    try {
        const { fileName, contentType } = req.body;

        if (!fileName || !contentType) {
            return res.status(400).json({
                success: false,
                message: 'fileName and contentType are required'
            });
        }

        // Validate that it's a ZIP file
        if (!contentType.includes('zip')) {
            return res.status(400).json({
                success: false,
                message: 'Only ZIP files are allowed'
            });
        }

        const { signedUrl, key } = await generatePresignedUrl(fileName, contentType, 'uploads');

        res.json({
            success: true,
            signedUrl,
            key,
            message: 'Pre-signed URL generated successfully'
        });
    } catch (error) {
        console.error('Pre-signed URL generation error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to generate pre-signed URL'
        });
    }
});

// POST /task-from-s3 - Create task from S3 file with CloudFront URL
router.post('/task-from-s3', autMiddleware, async (req: Request, res: Response) => {
    try {
        const { title, description, amount, fileUrl } = req.body;

        // Validate required fields
        if (!title || !amount || !fileUrl) {
            return res.status(400).json({
                success: false,
                message: 'Title, amount, and fileUrl are required'
            });
        }

        // Validate and sanitize inputs
        const sanitizedTitle = title.toString().trim();
        const sanitizedDescription = description?.toString().trim() || '';
        const sanitizedAmount = amount.toString().trim();

        if (!sanitizedTitle || !sanitizedAmount) {
            return res.status(400).json({
                success: false,
                message: 'Title and amount cannot be empty'
            });
        }

        // Validate amount is a positive number
        const numericAmount = parseInt(sanitizedAmount);
        if (isNaN(numericAmount) || numericAmount <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Amount must be a positive number'
            });
        }

        // Extract S3 key from the provided fileUrl (could be S3 key, S3 URL, or CloudFront URL)
        const s3Key = extractS3KeyFromUrl(fileUrl);

        // Validate S3 key format
        if (!validateS3Key(s3Key)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid file URL. Must be a ZIP file in uploads/ folder'
            });
        }

        // Convert S3 key to CloudFront URL
        const cloudfrontUrl = convertS3KeyToCloudFrontUrl(s3Key);

        // Create task in database with CloudFront URL
        const task = await prisma.task.create({
            data: {
                title: sanitizedTitle,
                description: sanitizedDescription,
                fileUrl: cloudfrontUrl,
                amount: numericAmount,
                userId: req.userId!
            }
        });

        res.json({
            success: true,
            message: 'Task created successfully with CloudFront URL',
            task: {
                id: task.id,
                title: task.title,
                description: task.description,
                fileUrl: task.fileUrl,
                status: task.status,
                amount: task.amount,
                createdAt: task.createdAt
            }
        });
    } catch (error) {
        console.error('Task creation error:', error);

        // Handle specific CloudFront configuration errors
        if (error instanceof Error && error.message.includes('CLOUDFRONT_DOMAIN')) {
            return res.status(500).json({
                success: false,
                message: 'CloudFront configuration error'
            });
        }

        res.status(500).json({
            success: false,
            message: 'Failed to create task'
        });
    }
});

// GET /task - Fetch task details and status
router.get('/task', autMiddleware, async (req: Request, res: Response) => {
    try {
        const tasks = await prisma.task.findMany({
            where: { userId: req.userId! },
            include: {
                submissions: {
                    select: {
                        id: true,
                        fileUrl: true,
                        createdAt: true,
                        worker: {
                            select: {
                                id: true
                            }
                        }
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        res.json({
            success: true,
            tasks: tasks.map(task => ({
                id: task.id,
                title: task.title,
                description: task.description,
                fileUrl: task.fileUrl,
                status: task.status,
                amount: task.amount,
                createdAt: task.createdAt,
                submissionsCount: task.submissions.length,
                submissions: task.submissions
            }))
        });
    } catch (error) {
        console.error('Fetch tasks error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch tasks'
        });
    }
});

// POST /payments - Accept an amount and store in PostgreSQL
router.post('/payments', autMiddleware, async (req: Request, res: Response) => {
    try {
        const { amount } = req.body;

        if (!amount || typeof amount !== 'number' || amount <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Valid amount is required'
            });
        }

        // Create payment record (store in lamports)
        const amountInLamports = Math.round(amount * 1000000000); // Convert SOL to lamports
        const payment = await prisma.payment.create({
            data: {
                amount: amountInLamports, // Store in lamports for consistency
                userId: req.userId!
            }
        });

        res.json({
            success: true,
            message: 'Payment recorded successfully',
            payment: {
                id: payment.id,
                amount: payment.amount / 1000000000, // Convert back to SOL
                createdAt: payment.createdAt
            }
        });
    } catch (error) {
        console.error('Payment error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to process payment'
        });
    }
});

// GET /profile - Get user profile information
router.get('/profile', autMiddleware, async (req: Request, res: Response) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.userId! },
            include: {
                tasks: {
                    select: {
                        id: true,
                        status: true
                    }
                },
                payments: {
                    select: {
                        amount: true,
                        createdAt: true
                    }
                }
            }
        });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        const totalPayments = user.payments.reduce((sum, p) => sum + p.amount, 0);
        const totalTasks = user.tasks.length;
        const completedTasks = user.tasks.filter(t => t.status === 'COMPLETED').length;

        res.json({
            success: true,
            user: {
                id: user.id,
                walletAddress: user.walletAddress,
                createdAt: user.createdAt,
                updatedAt: user.updatedAt,
                stats: {
                    totalTasks,
                    completedTasks,
                    inProgressTasks: totalTasks - completedTasks,
                    totalPayments: totalPayments / 1000000000 // Convert from lamports to SOL
                }
            }
        });
    } catch (error) {
        console.error('Profile fetch error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch profile'
        });
    }
});


export default router;
