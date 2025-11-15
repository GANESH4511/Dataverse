import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { WorkerMiddleware } from './middleware';
import { generatePresignedUrl } from './s3';
import { generateWorkerToken } from './auth';
import { convertS3KeyToCloudFrontUrl, extractS3KeyFromUrl, validateS3Key } from './cloudfront';
import nacl from "tweetnacl";
import { PublicKey, Connection, Keypair, SystemProgram, Transaction, sendAndConfirmTransaction } from "@solana/web3.js";
import bs58 from 'bs58';

const router = Router();
const prisma = new PrismaClient();

// GET / - Show available worker endpoints
router.get('/', (req: Request, res: Response) => {
    res.json({
        success: true,
        message: 'Worker API endpoints',
        endpoints: {
            'POST /api/worker/wallet-nonce': 'Get nonce for wallet signing',
            'POST /api/worker/wallet-signin': 'Sign in worker with wallet signature',
            'GET /api/worker/alltask': 'Get all tasks (requires auth)',
            'POST /api/worker/submission-presigned-url': 'Get pre-signed URL for submission upload (requires auth)',
            'POST /api/worker/submission-from-s3': 'Create submission from S3 file with CloudFront URL (requires auth)',
            'GET /api/worker/balance': 'Get balance (requires auth)',
            'POST /api/worker/payout': 'Process payout (requires auth)'
        }
    });
});

// STEP 1: Generate a nonce message for wallet signing
router.post("/wallet-nonce", async (req: Request, res: Response) => {
    try {
        const { publicKey } = req.body;
        console.log('📡 [NONCE] Received request from wallet:', publicKey);

        if (!publicKey) {
            console.error('❌ [NONCE] Missing publicKey in request');
            return res.status(400).json({
                success: false,
                message: "publicKey is required"
            });
        }

        console.log('🔍 [NONCE] Looking up worker:', publicKey);
        let worker = await prisma.worker.findUnique({
            where: { walletAddress: publicKey }
        });

        if (!worker) {
            console.log('✨ [NONCE] Worker not found, creating new one');
            worker = await prisma.worker.create({
                data: {
                    walletAddress: publicKey,
                    nonce: Math.floor(Math.random() * 1000000).toString()
                }
            });
            console.log('✅ [NONCE] Worker created:', worker.id);
        } else {
            console.log('✅ [NONCE] Worker found:', worker.id);
        }

        const message = `Sign this message to authenticate: ${worker.nonce}`;
        console.log('📤 [NONCE] Sending message:', message);

        return res.json({
            success: true,
            message: message
        });
    } catch (err: any) {
        console.error('💥 [NONCE] Error:', err.message);
        return res.status(500).json({
            success: false,
            message: 'Error generating nonce: ' + err.message
        });
    }
});

// STEP 2: Verify signed message and return JWT (NEW MESSAGE-SIGNED VERSION)
router.post("/wallet-signin", async (req: Request, res: Response) => {
    try {
        const { publicKey, signature, message } = req.body;
        console.log("🟢 [SIGNIN] wallet-signin triggered");
        console.log("🟢 [SIGNIN] publicKey:", publicKey);
        console.log("🟢 [SIGNIN] signatureLength:", signature?.length);
        console.log("🟢 [SIGNIN] message:", message);

        // Support both old and new authentication methods
        if (publicKey && signature && message) {
            // NEW: Message signing method
            if (!publicKey || !signature || !message) {
                console.error("❌ [SIGNIN] Missing required fields");
                return res.status(400).json({
                    success: false,
                    message: "publicKey, signature, and message are required"
                });
            }

            console.log("🔍 [SIGNIN] Looking up worker:", publicKey);
            const worker = await prisma.worker.findUnique({ where: { walletAddress: publicKey } });
            if (!worker) {
                console.error("❌ [SIGNIN] Worker not found for wallet:", publicKey);
                return res.status(404).json({
                    success: false,
                    message: "Wallet not registered. Please request a nonce first."
                });
            }

            console.log("✅ Found worker:", worker);

            const isValid = nacl.sign.detached.verify(
                new TextEncoder().encode(message),
                new Uint8Array(signature),
                new PublicKey(publicKey).toBytes()
            );

            if (!isValid) {
                console.error("❌ [SIGNIN] Invalid signature for:", publicKey);
                return res.status(401).json({ success: false, message: "Invalid signature." });
            }

            console.log("✅ [SIGNIN] Signature valid, generating JWT...");
            const token = generateWorkerToken(worker.id);

            await prisma.worker.update({
                where: { id: worker.id },
                data: { nonce: Math.floor(Math.random() * 1000000).toString() }
            });

            console.log("✅ [SIGNIN] Nonce updated, returning login response");
            return res.json({
                success: true,
                message: "Login successful",
                token,
                worker: {
                    id: worker.id,
                    walletAddress: worker.walletAddress
                }
            });
        } else {
            // OLD: Simple wallet address method (legacy support)
            console.log("🟡 [SIGNIN] Using legacy authentication method");
            const { walletAddress } = req.body;

            if (!walletAddress) {
                console.error("❌ [SIGNIN] Missing walletAddress");
                return res.status(400).json({
                    success: false,
                    message: 'Wallet address is required'
                });
            }

            console.log("🔍 [SIGNIN] Looking up worker by address:", walletAddress);
            let worker = await prisma.worker.findUnique({
                where: { walletAddress }
            });
            if (!worker) {
                console.log("✨ [SIGNIN] Creating new worker");
                worker = await prisma.worker.create({
                    data: { walletAddress }
                });
            }

            const token = generateWorkerToken(worker.id);

            res.json({
                success: true,
                message: 'Wallet sign in successful',
                token,
                worker: {
                    id: worker.id,
                    walletAddress: worker.walletAddress,
                    pendingBalance: worker.pendingBalance / 1000000000, // Convert from lamports to SOL
                    lockedBalance: worker.lockedBalance / 1000000000 // Convert from lamports to SOL
                }
            });
        }
    } catch (err: any) {
        console.error("❌ [SIGNIN] Wallet signin error:", err instanceof Error ? err.message : String(err));
        console.error("❌ [SIGNIN] Full error:", err);
        return res.status(500).json({
            success: false,
            message: "Internal server error",
            error: err.message
        });
    }
});

// GET /alltask - Retrieve all tasks uploaded by users
router.get('/alltask', WorkerMiddleware, async (req: Request, res: Response) => {
    try {
        const tasks = await prisma.task.findMany({
            include: {
                submissions: {
                    select: {
                        id: true,
                        workerId: true
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
                amount: task.amount / 100, // Convert to dollars
                createdAt: task.createdAt,
                submissionsCount: task.submissions.length,
                hasSubmitted: task.submissions.some((sub: { workerId: string }) => sub.workerId === req.workerId)
            }))
        });
    } catch (error) {
        console.error('Fetch all tasks error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch tasks'
        });
    }
});

// POST /submission-presigned-url - Generate pre-signed URL for submission upload
router.post('/submission-presigned-url', WorkerMiddleware, async (req: Request, res: Response) => {
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

        const { signedUrl, key } = await generatePresignedUrl(fileName, contentType, 'submissions');

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

// POST /submission-from-s3 - Create submission from S3 file with CloudFront URL
router.post('/submission-from-s3', WorkerMiddleware, async (req: Request, res: Response) => {
    try {
        const { taskId, fileUrl } = req.body;

        // Validate required fields
        if (!taskId || !fileUrl) {
            return res.status(400).json({
                success: false,
                message: 'taskId and fileUrl are required'
            });
        }

        // Validate taskId format
        if (typeof taskId !== 'string' || !taskId.trim()) {
            return res.status(400).json({
                success: false,
                message: 'Invalid taskId format'
            });
        }

        // Check if task exists
        const task = await prisma.task.findUnique({
            where: { id: taskId.trim() }
        });

        if (!task) {
            return res.status(404).json({
                success: false,
                message: 'Task not found'
            });
        }

        // Check if worker has already submitted for this task
        const existingSubmission = await prisma.submission.findFirst({
            where: {
                taskId: taskId.trim(),
                workerId: req.workerId!
            }
        });

        if (existingSubmission) {
            return res.status(400).json({
                success: false,
                message: 'You have already submitted for this task'
            });
        }

        // Extract S3 key from the provided fileUrl (could be S3 key, S3 URL, or CloudFront URL)
        const s3Key = extractS3KeyFromUrl(fileUrl);

        // Validate S3 key format for submissions
        if (!s3Key.startsWith('submissions/') || !s3Key.toLowerCase().endsWith('.zip')) {
            return res.status(400).json({
                success: false,
                message: 'Invalid file URL. Must be a ZIP file in submissions/ folder'
            });
        }

        // Convert S3 key to CloudFront URL
        const cloudfrontUrl = convertS3KeyToCloudFrontUrl(s3Key);

        // Calculate 10% reward from task amount
        // task.amount is stored in lamports (1 SOL = 1,000,000,000 lamports)
        // Reward is 10% of task amount
        const rewardAmountInLamports = Math.floor(task.amount * 0.1); // 10% of task amount in lamports

        // Create submission and update worker balance in a transaction
        const result = await prisma.$transaction(async (tx) => {
            // Create submission with CloudFront URL
            const submission = await tx.submission.create({
                data: {
                    fileUrl: cloudfrontUrl,
                    taskId: taskId.trim(),
                    workerId: req.workerId!
                }
            });

            // Update worker's pending balance with 10% of task amount (in lamports)
            const updatedWorker = await tx.worker.update({
                where: { id: req.workerId! },
                data: {
                    pendingBalance: {
                        increment: rewardAmountInLamports
                    }
                }
            });

            return { submission, updatedWorker };
        });

        const rewardInSOL = rewardAmountInLamports / 1000000000; // Convert from lamports to SOL

        res.json({
            success: true,
            message: 'Submission created successfully with CloudFront URL',
            submission: {
                id: result.submission.id,
                fileUrl: result.submission.fileUrl,
                taskId: result.submission.taskId,
                createdAt: result.submission.createdAt
            },
            rewardEarned: rewardInSOL, // 10% of task amount in SOL
            newPendingBalance: result.updatedWorker.pendingBalance / 1000000000 // Total pending balance in SOL
        });
    } catch (error) {
        console.error('Submission error:', error);

        // Handle specific CloudFront configuration errors
        if (error instanceof Error && error.message.includes('CLOUDFRONT_DOMAIN')) {
            return res.status(500).json({
                success: false,
                message: 'CloudFront configuration error'
            });
        }

        res.status(500).json({
            success: false,
            message: 'Failed to create submission'
        });
    }
});



// GET /balance - Show pending balance and locked balance
router.get('/balance', WorkerMiddleware, async (req: Request, res: Response) => {
    try {
        const worker = await prisma.worker.findUnique({
            where: { id: req.workerId! },
            select: {
                pendingBalance: true,
                lockedBalance: true
            }
        });

        if (!worker) {
            return res.status(404).json({
                success: false,
                message: 'Worker not found'
            });
        }

        res.json({
            success: true,
            balance: {
                pending: worker.pendingBalance / 1000000000, // Convert from lamports to SOL
                locked: worker.lockedBalance / 1000000000 // Convert from lamports to SOL
            }
        });
    } catch (error) {
        console.error('Balance fetch error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch balance'
        });
    }
});

// POST /payout - Move pending balance to locked balance and send SOL transaction
router.post('/payout', WorkerMiddleware, async (req: Request, res: Response) => {
    try {
        const worker = await prisma.worker.findUnique({
            where: { id: req.workerId! },
            select: {
                walletAddress: true,
                pendingBalance: true,
                lockedBalance: true
            }
        });

        if (!worker) {
            return res.status(404).json({
                success: false,
                message: 'Worker not found'
            });
        }

        if (worker.pendingBalance === 0) {
            return res.status(400).json({
                success: false,
                message: 'No pending balance to payout'
            });
        }

        const payoutAmountLamports = worker.pendingBalance;
        const payoutAmountSOL = payoutAmountLamports / 1_000_000_000;

        try {
            // Try to send Solana transaction if configured
            if (process.env.PARENT_WALLET_PRIVATE_KEY) {
                console.log(`💸 Processing SOL transfer: ${payoutAmountSOL} SOL to ${worker.walletAddress}`);

                const connection = new Connection(process.env.SOLANA_RPC_URL || 'https://api.devnet.solana.com', 'confirmed');
                const parentWalletSecretKey = bs58.decode(process.env.PARENT_WALLET_PRIVATE_KEY);
                const parentWallet = Keypair.fromSecretKey(parentWalletSecretKey);
                const workerPublicKey = new PublicKey(worker.walletAddress);

                // Create transfer instruction
                const transferInstruction = SystemProgram.transfer({
                    fromPubkey: parentWallet.publicKey,
                    toPubkey: workerPublicKey,
                    lamports: payoutAmountLamports
                });

                // Create and sign transaction
                const transaction = new Transaction().add(transferInstruction);
                transaction.feePayer = parentWallet.publicKey;
                transaction.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
                transaction.sign(parentWallet);

                // Send and confirm transaction
                const txSignature = await sendAndConfirmTransaction(connection, transaction, [parentWallet]);
                console.log(`✅ Transaction confirmed: ${txSignature}`);
            } else {
                console.log('⚠️ PARENT_WALLET_PRIVATE_KEY not configured, skipping SOL transfer');
            }
        } catch (txError) {
            console.error('⚠️ Transaction error (will still update balance in DB):', txError);
            // Continue with balance update even if transaction fails
        }

        // Move pending balance to locked balance and reset pending to 0
        const updatedWorker = await prisma.worker.update({
            where: { id: req.workerId! },
            data: {
                lockedBalance: {
                    increment: worker.pendingBalance
                },
                pendingBalance: 0
            }
        });

        res.json({
            success: true,
            message: 'Payout processed successfully',
            balance: {
                pending: updatedWorker.pendingBalance / 100, // Should be 0
                locked: updatedWorker.lockedBalance / 100
            },
            payoutAmount: worker.pendingBalance / 100, // Amount that was moved
            transactionNote: process.env.PARENT_WALLET_PRIVATE_KEY
                ? `SOL transferred to wallet`
                : 'Note: Configure PARENT_WALLET_PRIVATE_KEY to enable automatic SOL transfers'
        });
    } catch (error) {
        console.error('Payout error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to process payout',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});

// GET /profile - Get worker profile information
router.get('/profile', WorkerMiddleware, async (req: Request, res: Response) => {
    try {
        const worker = await prisma.worker.findUnique({
            where: { id: req.workerId! },
            include: {
                submissions: {
                    select: {
                        id: true
                    }
                }
            }
        });

        if (!worker) {
            return res.status(404).json({
                success: false,
                message: 'Worker not found'
            });
        }

        res.json({
            success: true,
            worker: {
                id: worker.id,
                walletAddress: worker.walletAddress,
                createdAt: worker.createdAt,
                stats: {
                    totalSubmissions: worker.submissions.length,
                    pendingBalance: worker.pendingBalance / 1000000000, // Convert from lamports to SOL
                    lockedBalance: worker.lockedBalance / 1000000000, // Convert from lamports to SOL
                    completedTasks: worker.submissions.length
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

// GET /tasks - Get all available tasks
router.get('/tasks', WorkerMiddleware, async (req: Request, res: Response) => {
    try {
        const tasks = await prisma.task.findMany({
            include: {
                submissions: {
                    select: {
                        id: true
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
                submissionsCount: task.submissions.length
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

// GET /submissions - Get worker's submissions
router.get('/submissions', WorkerMiddleware, async (req: Request, res: Response) => {
    try {
        const submissions = await prisma.submission.findMany({
            where: { workerId: req.workerId! },
            include: {
                task: {
                    select: {
                        title: true,
                        amount: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        res.json({
            success: true,
            submissions: submissions.map(sub => ({
                id: sub.id,
                taskId: sub.taskId,
                taskTitle: sub.task.title,
                fileUrl: sub.fileUrl,
                createdAt: sub.createdAt,
                reward: sub.task.amount
            }))
        });
    } catch (error) {
        console.error('Fetch submissions error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch submissions'
        });
    }
});

export default router;
