'use client';

import React, { useEffect, useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useWalletAuth } from './utils/walletAuth';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';

const WalletMultiButtonDynamic = dynamic(
  async () =>
    (await import('@solana/wallet-adapter-react-ui')).WalletMultiButton,
  { ssr: false }
);

const LandingPage = () => {
  const router = useRouter();
  const { connected } = useWallet();
  const { signInWithWallet } = useWalletAuth();
  const [isSigning, setIsSigning] = useState(false);
  const [signInMessage, setSignInMessage] = useState('');
  const [signInError, setSignInError] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (token) {
      return;
    }

    // Only trigger once when wallet connects
    if (connected && !isSigning) {
      setIsSigning(true);
      setSignInMessage('🔐 Signing in with your wallet...');
      setSignInError('');
      
      signInWithWallet()
        .then((user) => {
          if (user) {
            setSignInMessage('✅ Successfully signed in!');
            setTimeout(() => {
              router.push('/dashboard');
            }, 1500);
          }
        })
        .catch((err) => {
          console.error('❌ Wallet sign-in failed:', err);
          setSignInError(`❌ Sign-in failed: ${err.message || 'Unknown error'}`);
          setSignInMessage('');
        })
        .finally(() => setIsSigning(false));
    }
  }, [connected, signInWithWallet, router, isSigning]);

  return (
    <main className="flex flex-col items-center justify-center min-h-screen bg-black text-white">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">Power Your Data Universe</h1>
        <p className="text-gray-400 mb-8 text-lg">Upload tasks and manage your marketplace</p>
        
        <div className="mb-6">
          <WalletMultiButtonDynamic />
        </div>

        {/* Sign-in Status Messages */}
        {signInMessage && (
          <div className="mt-6 p-4 bg-green-500/20 border border-green-500 rounded-lg">
            <p className="text-green-400 font-semibold">{signInMessage}</p>
          </div>
        )}

        {signInError && (
          <div className="mt-6 p-4 bg-red-500/20 border border-red-500 rounded-lg">
            <p className="text-red-400 font-semibold">{signInError}</p>
            <p className="text-red-300 text-sm mt-2">Please try connecting your wallet again</p>
          </div>
        )}

        {isSigning && (
          <div className="mt-6 p-4">
            <p className="text-blue-400 font-semibold animate-pulse">Authenticating...</p>
          </div>
        )}

        {!connected && !isSigning && (
          <div className="mt-8 p-6 bg-gray-900 border border-gray-700 rounded-lg max-w-md mx-auto">
            <p className="text-gray-300 mb-2">👛 Connect your Solana wallet to get started</p>
            <p className="text-gray-500 text-sm">Click the button above to connect your wallet and sign in</p>
          </div>
        )}
      </div>
    </main>
  );
};

export default LandingPage;
