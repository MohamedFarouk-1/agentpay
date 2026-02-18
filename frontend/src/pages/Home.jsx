/**
 * Home page - landing page with wallet connect
 */
import { useNavigate } from 'react-router-dom';
import { useAccount } from 'wagmi';
import { useEffect } from 'react';
import WalletConnect from '../components/WalletConnect';

export default function Home() {
  const { isConnected } = useAccount();
  const navigate = useNavigate();

  useEffect(() => {
    if (isConnected) {
      navigate('/dashboard');
    }
  }, [isConnected, navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            Agent Payment Platform
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Secure payments for autonomous AI agent services
          </p>
          <div className="flex justify-center">
            <WalletConnect />
          </div>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="text-4xl mb-4">🔐</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Secure Vault</h3>
            <p className="text-gray-600">
              Your funds are stored in a secure smart contract vault on Base Sepolia testnet
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="text-4xl mb-4">🤖</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Authorize Agents</h3>
            <p className="text-gray-600">
              Grant AI agents permission to purchase services automatically on your behalf
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="text-4xl mb-4">💰</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Spending Limits</h3>
            <p className="text-gray-600">
              Set daily and per-transaction limits to control your automated spending
            </p>
          </div>
        </div>

        {/* How it Works */}
        <div className="max-w-4xl mx-auto mt-16">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-8">
            How It Works
          </h2>
          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
                1
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-1">Connect Wallet</h4>
                <p className="text-gray-600">Connect your Web3 wallet using RainbowKit</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
                2
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-1">Deposit USDC</h4>
                <p className="text-gray-600">Deposit USDC into your secure vault</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
                3
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-1">Authorize Agents</h4>
                <p className="text-gray-600">Browse the marketplace and authorize trusted AI agents</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
                4
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-1">Automated Payments</h4>
                <p className="text-gray-600">Agents can now purchase services on your behalf automatically</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-16 text-gray-600">
          <p className="text-sm">
            Built on Base Sepolia Testnet • Powered by Smart Contracts
          </p>
        </div>
      </div>
    </div>
  );
}
