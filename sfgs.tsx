// Payout processing for worker
const worker = await prisma.worker.findUnique({
    where: { id: req.workerId },
    select: { walletAddress: true, pendingBalance: true, lockedBalance: true }
});

if (!worker || worker.pendingBalance === 0)
    return res.status(400).json({ success: false, message: 'No payout available' });

// Solana transfer (if enabled)
if (process.env.PARENT_WALLET_PRIVATE_KEY) {
    const connection = new Connection(process.env.SOLANA_RPC_URL, 'confirmed');
    const parent = Keypair.fromSecretKey(bs58.decode(process.env.PARENT_WALLET_PRIVATE_KEY));
    const toWorker = new PublicKey(worker.walletAddress);

    const tx = new Transaction().add(SystemProgram.transfer({
        fromPubkey: parent.publicKey,
        toPubkey: toWorker,
        lamports: worker.pendingBalance
    }));

    tx.feePayer = parent.publicKey;
    tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
    await sendAndConfirmTransaction(connection, tx, [parent]);
}

// Update balances after payout
const updated = await prisma.worker.update({
    where: { id: req.workerId },
    data: {
        lockedBalance: { increment: worker.pendingBalance },
        pendingBalance: 0
    }
});

res.json({ success: true, message: 'Payout processed', balance: updated });
