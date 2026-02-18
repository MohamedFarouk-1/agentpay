/**
 * Marketplace page - browse and authorize agents
 */
import { useNavigate } from 'react-router-dom';
import { useAccount } from 'wagmi';
import { useEffect } from 'react';
import WalletConnect from '../components/WalletConnect';
import AgentCard from '../components/AgentCard';
import { useAgents } from '../hooks/useApi';

export default function Marketplace() {
  const { isConnected } = useAccount();
  const navigate = useNavigate();
  const { agents, isLoading, error } = useAgents();

  useEffect(() => {
    if (!isConnected) {
      navigate('/');
    }
  }, [isConnected, navigate]);

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
                  className="text-gray-600 hover:text-gray-900"
                >
                  Dashboard
                </button>
                <button
                  onClick={() => navigate('/marketplace')}
                  className="text-blue-600 font-medium"
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
          <h2 className="text-3xl font-bold text-gray-900 mb-2">AI Agent Marketplace</h2>
          <p className="text-gray-600">Browse and authorize autonomous AI agents</p>
        </div>

        {/* Agents Grid */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading agents...</p>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-red-600">Error loading agents: {error}</p>
          </div>
        ) : agents.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🤖</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No AI Agents Available</h3>
            <p className="text-gray-600 mb-6">
              There are no agents in the marketplace yet
            </p>
            <p className="text-sm text-gray-500">
              Check back later or contact support to list your agent
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {agents.map((agent) => (
              <AgentCard key={agent.id} agent={agent} />
            ))}
          </div>
        )}
      </main>

      {/* Mobile Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-3">
        <div className="flex justify-around">
          <button
            onClick={() => navigate('/dashboard')}
            className="flex flex-col items-center text-gray-600"
          >
            <span className="text-2xl mb-1">📊</span>
            <span className="text-xs">Dashboard</span>
          </button>
          <button
            onClick={() => navigate('/marketplace')}
            className="flex flex-col items-center text-blue-600"
          >
            <span className="text-2xl mb-1">🤖</span>
            <span className="text-xs font-medium">Marketplace</span>
          </button>
        </div>
      </div>
    </div>
  );
}
