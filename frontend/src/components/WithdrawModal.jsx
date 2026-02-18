/**
 * WithdrawModal component - withdraw USDC from vault
 */
import { useState } from 'react';
import { useWithdraw } from '../hooks/useContract';

export default function WithdrawModal({ balance, onClose, onSuccess }) {
  const [amount, setAmount] = useState('');
  const { withdraw, isPending, isConfirming, isSuccess, error } = useWithdraw();

  const handleWithdraw = async () => {
    if (!amount || parseFloat(amount) <= 0) return;

    try {
      await withdraw(amount);
    } catch (err) {
      console.error('Withdrawal failed:', err);
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
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Withdraw USDC</h2>

        {!isSuccess ? (
          <>
            <p className="text-gray-600 mb-4">
              Vault Balance: <span className="font-semibold">${balance} USDC</span>
            </p>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Amount (USDC)
              </label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                step="0.01"
                min="0"
                max={balance}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isPending || isConfirming}
              />
              <button
                onClick={() => setAmount(balance)}
                className="mt-2 text-sm text-blue-600 hover:text-blue-800"
                disabled={isPending || isConfirming}
              >
                Max
              </button>
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
                onClick={handleWithdraw}
                disabled={!amount || parseFloat(amount) <= 0 || parseFloat(amount) > parseFloat(balance) || isPending || isConfirming}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Withdraw
              </button>
            </div>
          </>
        ) : (
          <div className="text-center py-8">
            <div className="text-green-600 text-5xl mb-4">✓</div>
            <p className="text-gray-900 font-medium mb-2">Withdrawal Successful!</p>
            <p className="text-gray-600 mb-6">${amount} USDC withdrawn from vault</p>
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
