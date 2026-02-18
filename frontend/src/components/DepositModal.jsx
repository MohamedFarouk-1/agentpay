/**
 * DepositModal component - approve USDC + deposit
 */
import { useState } from 'react';
import { useApproveUSDC, useDeposit, useUSDCBalance } from '../hooks/useContract';
import { useAccount } from 'wagmi';

export default function DepositModal({ onClose, onSuccess }) {
  const { address } = useAccount();
  const [amount, setAmount] = useState('');
  const [step, setStep] = useState('input'); // input, approving, approved, depositing, success

  const { balance: usdcBalance } = useUSDCBalance(address);
  const { approve, isPending: isApproving, isConfirming: isApprovingConfirm, isSuccess: isApproved } = useApproveUSDC();
  const { deposit, isPending: isDepositing, isConfirming: isDepositingConfirm, isSuccess: isDepositSuccess } = useDeposit();

  const handleApprove = async () => {
    if (!amount || parseFloat(amount) <= 0) return;

    try {
      setStep('approving');
      await approve(amount);
    } catch (error) {
      console.error('Approval failed:', error);
      setStep('input');
    }
  };

  const handleDeposit = async () => {
    try {
      setStep('depositing');
      await deposit(amount);
    } catch (error) {
      console.error('Deposit failed:', error);
      setStep('approved');
    }
  };

  const handleClose = () => {
    if (isDepositSuccess) {
      onSuccess();
    }
    onClose();
  };

  // Auto-progress steps
  if (isApproved && step === 'approving') {
    setStep('approved');
  }
  if (isDepositSuccess && step === 'depositing') {
    setStep('success');
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Deposit USDC</h2>

        {step === 'input' && (
          <>
            <p className="text-gray-600 mb-4">
              Wallet Balance: <span className="font-semibold">${usdcBalance} USDC</span>
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
                max={usdcBalance}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={() => setAmount(usdcBalance)}
                className="mt-2 text-sm text-blue-600 hover:text-blue-800"
              >
                Max
              </button>
            </div>

            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleApprove}
                disabled={!amount || parseFloat(amount) <= 0 || parseFloat(amount) > parseFloat(usdcBalance)}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Continue
              </button>
            </div>
          </>
        )}

        {step === 'approving' && (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-900 font-medium">Step 1: Approving USDC</p>
            <p className="text-gray-600 text-sm mt-2">
              {isApproving ? 'Confirm in wallet...' : isApprovingConfirm ? 'Confirming...' : 'Processing...'}
            </p>
          </div>
        )}

        {step === 'approved' && (
          <div className="text-center py-8">
            <div className="text-green-600 text-5xl mb-4">✓</div>
            <p className="text-gray-900 font-medium mb-4">Approval Successful!</p>
            <button
              onClick={handleDeposit}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Deposit ${amount} USDC
            </button>
          </div>
        )}

        {step === 'depositing' && (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-900 font-medium">Step 2: Depositing</p>
            <p className="text-gray-600 text-sm mt-2">
              {isDepositing ? 'Confirm in wallet...' : isDepositingConfirm ? 'Confirming...' : 'Processing...'}
            </p>
          </div>
        )}

        {step === 'success' && (
          <div className="text-center py-8">
            <div className="text-green-600 text-5xl mb-4">✓</div>
            <p className="text-gray-900 font-medium mb-2">Deposit Successful!</p>
            <p className="text-gray-600 mb-6">${amount} USDC deposited to vault</p>
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
