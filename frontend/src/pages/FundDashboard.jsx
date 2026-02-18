/**
 * FundDashboard page - main dashboard after wallet connect
 */
import { useNavigate } from 'react-router-dom';
import { useAccount } from 'wagmi';
import { useEffect } from 'react';
import WalletConnect from '../components/WalletConnect';
import Dashboard from '../components/Dashboard';
import { createFund } from '../hooks/useApi';

export default function FundDashboard() {
  const { address, isConnected } = useAccount();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isConnected) {
      navigate('/');
      return;
    }

    // Ensure fund account exists in backend
    const ensureFund = async () => {
      if (address) {
        try {
          await createFund(address);
        } catch (err) {
          console.error('Error creating fund:', err);
        }
      }
    };

    ensureFund();
  }, [isConnected, address, navigate]);

  if (!isConnected) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <h1 className="text-2xl font-bold text-gray-900">
                Agent Payment Platform
              </h1>
              <nav className="hidden md:flex gap-4">
                <button
                  onClick={() => navigate('/dashboard')}
                  className="text-blue-600 font-medium"
                >
                  Dashboard
                </button>
                <button
                  onClick={() => navigate('/marketplace')}
                  className="text-gray-600 hover:text-gray-900"
                >
                  Marketplace
                </button>
              </nav>
            </div>
            <WalletConnect />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h2>
          <p className="text-gray-600">Manage your vault and view transaction history</p>
        </div>

        <Dashboard />
      </main>

      {/* Mobile Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-3">
        <div className="flex justify-around">
          <button
            onClick={() => navigate('/dashboard')}
            className="flex flex-col items-center text-blue-600"
          >
            <span className="text-2xl mb-1">📊</span>
            <span className="text-xs font-medium">Dashboard</span>
          </button>
          <button
            onClick={() => navigate('/marketplace')}
            className="flex flex-col items-center text-gray-600"
          >
            <span className="text-2xl mb-1">🤖</span>
            <span className="text-xs">Marketplace</span>
          </button>
        </div>
      </div>
    </div>
  );
}
