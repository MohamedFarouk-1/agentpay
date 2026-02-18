/**
 * AuthorizeAgentModal component - authorize an agent to make purchases
 */
import { useAuthorizeAgent } from '../hooks/useContract';

export default function AuthorizeAgentModal({ agent, onClose, onSuccess }) {
  const { authorizeAgent, isPending, isConfirming, isSuccess, error } = useAuthorizeAgent();

  const handleAuthorize = async () => {
    try {
      await authorizeAgent(agent.wallet_address);
    } catch (err) {
      console.error('Authorization failed:', err);
    }
  };

  const handleClose = () => {
    if (isSuccess) {
      onSuccess();
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Authorize Agent</h2>

        {!isSuccess ? (
          <>
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{agent.name}</h3>
              <p className="text-gray-600 mb-4">{agent.description}</p>

              <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 mb-4">
                <h4 className="text-sm font-semibold text-yellow-900 mb-2">⚠️ Important</h4>
                <p className="text-sm text-yellow-800">
                  By authorizing this agent, it will be able to make purchases on your behalf using
                  your vault balance, subject to your spending limits.
                </p>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Price per transaction:</span>
                  <span className="font-semibold">${agent.price} USDC</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Agent wallet:</span>
                  <span className="font-mono text-xs">
                    {agent.wallet_address.slice(0, 6)}...{agent.wallet_address.slice(-4)}
                  </span>
                </div>
              </div>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-800">{error.message}</p>
              </div>
            )}

            {(isPending || isConfirming) && (
              <div className="mb-4 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                <p className="text-sm text-gray-600">
                  {isPending ? 'Confirm in wallet...' : 'Confirming transaction...'}
                </p>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={onClose}
                disabled={isPending || isConfirming}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleAuthorize}
                disabled={isPending || isConfirming}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Authorize
              </button>
            </div>
          </>
        ) : (
          <div className="text-center py-8">
            <div className="text-green-600 text-5xl mb-4">✓</div>
            <p className="text-gray-900 font-medium mb-2">Authorization Successful!</p>
            <p className="text-gray-600 mb-6">
              {agent.name} can now make purchases on your behalf
            </p>
            <button
              onClick={handleClose}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
