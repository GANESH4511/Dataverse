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
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [signInMessage, setSignInMessage] = useState('');
  const [signInError, setSignInError] = useState('');

  // Check if already logged in on mount
  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (token) {
      router.push('/dashboard');
    }
  }, [router]);

  // Auto sign-in when wallet connects
  useEffect(() => {
    if (!connected || isSigningIn || signInMessage || signInError) {
      return;
    }

    setIsSigningIn(true);
    setSignInMessage('🔐 Signing in with your wallet...');

    const autoSignIn = async () => {
      try {
        const result = await signInWithWallet();
        if (result) {
          setSignInMessage('✅ Successfully signed in!');
          setSignInError('');
          setTimeout(() => {
            router.push('/dashboard');
          }, 1500);
        }
      } catch (err: any) {
        console.error('❌ Sign-in error:', err);
        setSignInError(`❌ Sign-in failed: ${err.message || 'Unknown error'}`);
        setSignInMessage('');
        setIsSigningIn(false);
      }
    };

    autoSignIn();
  }, [connected, isSigningIn, signInMessage, signInError, signInWithWallet, router]);

  return (
    <main className="flex flex-col items-center justify-center min-h-screen bg-black text-white">
      <div className="text-center max-w-2xl mx-auto px-6">
        <h1 className="text-5xl font-bold mb-4">Welcome to Dataverse Workers</h1>
        <p className="text-xl text-gray-400 mb-2">
          Complete tasks and earn rewards on the Solana blockchain
        </p>
        <p className="text-gray-500 mb-8">
          Connect your wallet to get started and start earning SOL
        </p>

        <div className="mb-12">
          <WalletMultiButtonDynamic />
        </div>

        {/* Sign-in Status Messages */}
        {signInMessage && (
          <div className="mt-6 p-4 bg-green-500/20 border border-green-500 rounded-lg max-w-md mx-auto">
            <p className="text-green-400 font-semibold">{signInMessage}</p>
          </div>
        )}

        {signInError && (
          <div className="mt-6 p-4 bg-red-500/20 border border-red-500 rounded-lg max-w-md mx-auto">
            <p className="text-red-400 font-semibold">{signInError}</p>
            <p className="text-red-300 text-sm mt-2">Please try connecting your wallet again</p>
          </div>
        )}

        {isSigningIn && (
          <div className="mt-6 p-4">
            <p className="text-blue-400 font-semibold animate-pulse">Authenticating...</p>
          </div>
        )}

        {!connected && !isSigningIn && (
          <div className="mt-8 p-6 bg-gray-900 border border-gray-700 rounded-lg max-w-md mx-auto">
            <p className="text-gray-300 mb-2">👛 Connect your Solana wallet to get started</p>
            <p className="text-gray-500 text-sm">Click the button above to connect your wallet and sign in</p>
          </div>
        )}

        {!signInMessage && !signInError && (
          <>
        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="bg-gray-900 p-6 rounded-lg border border-gray-700">
            <span className="text-4xl mb-4 block">📋</span>
            <h3 className="text-xl font-bold mb-2">Browse Tasks</h3>
            <p className="text-gray-400">Find and complete data annotation tasks</p>
          </div>
          <div className="bg-gray-900 p-6 rounded-lg border border-gray-700">
            <span className="text-4xl mb-4 block">🚀</span>
            <h3 className="text-xl font-bold mb-2">Submit Work</h3>
            <p className="text-gray-400">Upload your completed submissions</p>
          </div>
          <div className="bg-gray-900 p-6 rounded-lg border border-gray-700">
            <span className="text-4xl mb-4 block">💰</span>
            <h3 className="text-xl font-bold mb-2">Earn Rewards</h3>
            <p className="text-gray-400">Get paid in SOL for your work</p>
          </div>
        </div>

        {/* How it works */}
        <div className="bg-gray-900 p-8 rounded-lg border border-gray-700 text-left">
          <h2 className="text-2xl font-bold mb-6">How It Works</h2>
          <div className="space-y-4">
            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="flex items-center justify-center h-8 w-8 rounded-full bg-blue-600 text-white font-bold">
                  1
                </div>
              </div>
              <div>
                <h3 className="font-semibold">Connect Your Wallet</h3>
                <p className="text-gray-400">Sign in with your Solana wallet</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="flex items-center justify-center h-8 w-8 rounded-full bg-blue-600 text-white font-bold">
                  2
                </div>
              </div>
              <div>
                <h3 className="font-semibold">Browse Available Tasks</h3>
                <p className="text-gray-400">View all available data annotation tasks</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="flex items-center justify-center h-8 w-8 rounded-full bg-blue-600 text-white font-bold">
                  3
                </div>
              </div>
              <div>
                <h3 className="font-semibold">Complete and Submit</h3>
                <p className="text-gray-400">Download task, complete it, and upload your submission</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="flex items-center justify-center h-8 w-8 rounded-full bg-blue-600 text-white font-bold">
                  4
                </div>
              </div>
              <div>
                <h3 className="font-semibold">Get Paid</h3>
                <p className="text-gray-400">Receive SOL rewards directly to your wallet</p>
              </div>
            </div>
          </div>
        </div>
        </>
        )}
      </div>
    </main>
  );
};

export default LandingPage;
