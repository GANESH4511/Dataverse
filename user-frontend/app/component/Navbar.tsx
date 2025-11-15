'use client';

import React, { useEffect } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useWallet } from '@solana/wallet-adapter-react';

const WalletMultiButtonDynamic = dynamic(
  async () => (await import('@solana/wallet-adapter-react-ui')).WalletMultiButton,
  { ssr: false }
);

const Navbar = () => {
  const { connected, publicKey } = useWallet();

  useEffect(() => {
    // Avoid clearing token during auto-reconnect (which flips connected to false temporarily)
    if (!connected) {
      const existingWallet = localStorage.getItem('walletAddress');
      const existingToken = localStorage.getItem('authToken');

      // Only clear if there was an actual wallet stored before and user intentionally disconnected
      if (existingWallet && existingToken) {
        console.log('🔒 Wallet manually disconnected — clearing auth session');
        localStorage.removeItem('authToken');
        localStorage.removeItem('walletAddress');
      } else {
        console.log('⚠️ Wallet not connected yet (likely auto-reconnect). Skipping token clear.');
      }
    } else if (connected && publicKey) {
      // Store wallet address when connected for future reconnects
      localStorage.setItem('walletAddress', publicKey.toBase58());
      console.log('✅ Wallet connected:', publicKey.toBase58());
    }
  }, [connected, publicKey]);

  return (
    <nav className="flex justify-between items-center p-4 bg-black text-white shadow-md">
      <h3 className="font-bold text-lg">Dataverse</h3>
      <div className="flex space-x-6">
        <Link href="/dashboard" className="hover:text-blue-400">Dashboard</Link>
        <Link href="/my-tasks" className="hover:text-blue-400">My Tasks</Link>
        <Link href="/upload-task" className="hover:text-blue-400">Upload Task</Link>
        <Link href="/profile" className="hover:text-blue-400">Profile</Link>
      </div>
      <WalletMultiButtonDynamic />
    </nav>
  );
};

export default Navbar;
