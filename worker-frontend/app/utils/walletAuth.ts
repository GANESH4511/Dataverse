'use client';

import { useWallet } from '@solana/wallet-adapter-react';

export function useWalletAuth() {
    const { publicKey, signMessage } = useWallet();

    const signInWithWallet = async () => {
        if (!publicKey) throw new Error('Wallet not connected');
        if (!signMessage) throw new Error('Wallet does not support message signing');

        const walletAddress = publicKey.toBase58();
        console.log('🪙 [SIGN-IN] Wallet address:', walletAddress);

        const existingToken = localStorage.getItem('authToken');
        const existingWallet = localStorage.getItem('walletAddress');

        // Skip reauth if already signed in
        if (existingToken && existingWallet === walletAddress) {
            console.log('🔐 [SIGN-IN] Already signed in as', existingWallet);
            return { walletAddress: existingWallet, token: existingToken };
        }

        console.log('🪙 [SIGN-IN] Starting wallet sign-in for', walletAddress);

        // Step 1: Request nonce
        try {
            console.log('📤 [SIGN-IN] Fetching nonce from http://localhost:3000/api/worker/wallet-nonce');
            const nonceRes = await fetch('http://localhost:3000/api/worker/wallet-nonce', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ publicKey: walletAddress }),
            });

            console.log('📬 [SIGN-IN] Nonce response status:', nonceRes.status);
            if (!nonceRes.ok) {
                throw new Error(`Nonce endpoint returned ${nonceRes.status} ${nonceRes.statusText}`);
            }

            const nonceData = await nonceRes.json();
            console.log('🟢 [SIGN-IN] Nonce received:', nonceData.message ? 'Yes' : 'No message');

            if (!nonceData.success) {
                throw new Error(nonceData.message || 'Failed to get nonce from backend');
            }

            // Step 2: Sign message
            console.log('✍️ [SIGN-IN] Requesting wallet signature...');
            const message = nonceData.message;
            const encoded = new TextEncoder().encode(message);
            const signature = await signMessage(encoded);
            console.log('✅ [SIGN-IN] Message signed, signature length:', signature.length);

            // Step 3: Verify on backend
            console.log('📤 [SIGN-IN] Sending signed message to http://localhost:3000/api/worker/wallet-signin');
            const signInRes = await fetch('http://localhost:3000/api/worker/wallet-signin', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    publicKey: walletAddress,
                    signature: Array.from(signature),
                    message,
                }),
            });

            console.log('📬 [SIGN-IN] Sign-in response status:', signInRes.status);
            if (!signInRes.ok) {
                throw new Error(`Sign-in endpoint returned ${signInRes.status} ${signInRes.statusText}`);
            }

            // ✅ Robust parse and verify
            let rawText = '';
            let result: any;
            try {
                rawText = await signInRes.text();
                console.log('📦 [SIGN-IN] Response body length:', rawText.length);
                result = JSON.parse(rawText);
                console.log('✅ [SIGN-IN] Response parsed successfully');
            } catch (err) {
                console.error('❌ [SIGN-IN] Could not parse backend response:', err, '\nRaw text:', rawText);
                throw new Error('Invalid backend response from /wallet-signin');
            }

            if (!result?.success || !result?.token || !result?.worker) {
                console.error('❌ [SIGN-IN] Bad sign-in result:', result);
                throw new Error(result?.message || 'Wallet sign-in failed');
            }

            // Step 4: Persist token
            localStorage.setItem('authToken', result.token);
            localStorage.setItem('walletAddress', result.worker.walletAddress);
            console.log('✅ [SIGN-IN] Token stored in localStorage');
            console.log('✅ [SIGN-IN] Wallet address stored:', result.worker.walletAddress);

            return { walletAddress: result.worker.walletAddress, token: result.token };
        } catch (err: any) {
            console.error('💥 [SIGN-IN] Error during sign-in:', err.message);
            console.error('💥 [SIGN-IN] Error details:', err);
            throw err;
        }
    };

    return { signInWithWallet };
}