/**
 * AgentCard component - displays agent information in marketplace
 */
import { useState } from 'react';
import { useAccount } from 'wagmi';
import { useIsAgentAuthorized } from '../hooks/useContract';
import AuthorizeAgentModal from './AuthorizeAgentModal';

export default function AgentCard({ agent }) {
  const { address } = useAccount();
  const { isAuthorized, refetch } = useIsAgentAuthorized(address, agent.wallet_address);
  const [showAuthorize, setShowAuthorize] = useState(false);

  const handleSuccess = () => {
    refetch();
    setShowAuthorize(false);
  };

  return (
    <>
      <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition">
        {/* Agent Image */}
        {agent.image_url && (
          <img
            src={agent.image_url}
            alt={agent.name}
            className="w-full h-48 object-cover rounded-md mb-4"
          />
        )}

        {/* Agent Name */}
        <h3 className="text-xl font-bold text-gray-900 mb-2">{agent.name}</h3>

        {/* Agent Price */}
        <div className="mb-3">
          <span className="text-2xl font-bold text-blue-600">${agent.price}</span>
          <span className="text-gray-600 ml-1">USDC</span>
        </div>

        {/* Agent Description */}
        {agent.description && (
          <p className="text-gray-600 text-sm mb-4 line-clamp-3">{agent.description}</p>
        )}

        {/* Agent Wallet */}
        <p className="text-xs text-gray-500 mb-4">
          Wallet: {agent.wallet_address.slice(0, 6)}...{agent.wallet_address.slice(-4)}
        </p>

        {/* Authorization Status */}
        <div className="flex items-center justify-between">
          {isAuthorized ? (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
              ✓ Authorized
            </span>
          ) : (
            <button
              onClick={() => setShowAuthorize(true)}
              className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition"
            >
              Authorize Agent
            </button>
          )}
        </div>
      </div>

      {showAuthorize && (
        <AuthorizeAgentModal
          agent={agent}
          onClose={() => setShowAuthorize(false)}
          onSuccess={handleSuccess}
        />
      )}
    </>
  );
}
