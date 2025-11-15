'use client';

import { useWallet } from '@solana/wallet-adapter-react';

export function useWalletAuth() {
    const { publicKey, signMessage } = useWallet();

    const signInWithWallet = async () => {
        if (!publicKey) throw new Error('Wallet not connected');
        if (!signMessage) throw new Error('Wallet does not support message signing');

        const walletAddress = publicKey.toBase58();
        const existingToken = localStorage.getItem('authToken');
        const existingWallet = localStorage.getItem('walletAddress');

        // Skip reauth if already signed in
        if (existingToken && existingWallet === walletAddress) {
            console.log('🔐 Already signed in as', existingWallet);
            return { walletAddress: existingWallet, token: existingToken };
        }

        console.log('🪙 Starting wallet sign-in for', walletAddress);

        // Step 1: Request nonce
        const nonceRes = await fetch('http://localhost:3000/api/user/wallet-nonce', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ publicKey: walletAddress }),
        });

        const nonceData = await nonceRes.json();
        if (!nonceData.success) throw new Error('Failed to get nonce from backend');
        console.log('🟢 Nonce:', nonceData);

        // Step 2: Sign message
        const message = nonceData.message;
        const encoded = new TextEncoder().encode(message);
        const signature = await signMessage(encoded);

        // Step 3: Verify on backend
        const signInRes = await fetch('http://localhost:3000/api/user/wallet-signin', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                publicKey: walletAddress,
                signature: Array.from(signature),
                message,
            }),
        });

        // ✅ Robust parse and verify
        let rawText = '';
        let result: any;
        try {
            rawText = await signInRes.text();
            result = JSON.parse(rawText);
        } catch (err) {
            console.error('❌ Could not parse backend response:', err, '\nRaw text:', rawText);
            throw new Error('Invalid backend response from /wallet-signin');
        }

        if (!result?.success || !result?.token || !result?.user) {
            console.error('❌ Bad sign-in result:', result);
            throw new Error(result?.message || 'Wallet sign-in failed');
        }

        // Step 4: Persist token
        localStorage.setItem('authToken', result.token);
        localStorage.setItem('walletAddress', result.user.walletAddress);
        console.log('✅ Token stored in localStorage:', result.token);
        console.log('✅ Wallet address stored:', result.user.walletAddress);

        return { walletAddress: result.user.walletAddress, token: result.token };
    };

    return { signInWithWallet };
}