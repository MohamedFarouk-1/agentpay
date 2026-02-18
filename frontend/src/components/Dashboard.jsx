/**
 * Dashboard component - shows balance, authorized agents, limits
 */
import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { useFundAccount, useUSDCBalance } from '../hooks/useContract';
import { useTransactions } from '../hooks/useApi';
import DepositModal from './DepositModal';
import WithdrawModal from './WithdrawModal';

export default function Dashboard() {
  const { address } = useAccount();
  const { balance, dailySpendingLimit, perTransactionLimit, todaySpent, refetch } = useFundAccount(address);
  const { balance: usdcBalance, refetch: refetchUSDC } = useUSDCBalance(address);
  const { transactions, refetch: refetchTransactions } = useTransactions(address);

  const [showDeposit, setShowDeposit] = useState(false);
  const [showWithdraw, setShowWithdraw] = useState(false);

  const handleSuccess = () => {
    refetch();
    refetchUSDC();
    refetchTransactions();
  };

  return (
    <div className="space-y-6">
      {/* Balance Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Vault Balance */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Vault Balance</h3>
          <p className="text-3xl font-bold text-gray-900">${balance} USDC</p>
          <div className="mt-4 flex gap-3">
            <button
              onClick={() => setShowDeposit(true)}
              className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition"
            >
              Deposit
            </button>
            <button
              onClick={() => setShowWithdraw(true)}
              className="flex-1 bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition"
            >
              Withdraw
            </button>
          </div>
        </div>

        {/* Wallet Balance */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Wallet Balance</h3>
          <p className="text-3xl font-bold text-gray-900">${usdcBalance} USDC</p>
          <p className="mt-2 text-sm text-gray-600">
            Available to deposit into vault
          </p>
        </div>
      </div>

      {/* Spending Limits */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Spending Limits</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <p className="text-sm text-gray-600">Daily Limit</p>
            <p className="text-xl font-semibold text-gray-900">
              {dailySpendingLimit === '0' ? 'Unlimited' : `$${dailySpendingLimit}`}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Per Transaction</p>
            <p className="text-xl font-semibold text-gray-900">
              {perTransactionLimit === '0' ? 'Unlimited' : `$${perTransactionLimit}`}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Spent Today</p>
            <p className="text-xl font-semibold text-gray-900">${todaySpent}</p>
          </div>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Transactions</h3>
        {transactions.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No transactions yet</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Agent</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fee</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tx Hash</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {transactions.slice(0, 5).map((tx) => (
                  <tr key={tx.id}>
                    <td className="px-4 py-3 text-sm text-gray-900">{tx.bot_name || 'Unknown'}</td>
                    <td className="px-4 py-3 text-sm text-gray-900">${tx.amount}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">${tx.fee}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {new Date(tx.timestamp).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <a
                        href={`https://sepolia.basescan.org/tx/${tx.tx_hash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800"
                      >
                        {tx.tx_hash.slice(0, 10)}...
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modals */}
      {showDeposit && (
        <DepositModal
          onClose={() => setShowDeposit(false)}
          onSuccess={handleSuccess}
        />
      )}
      {showWithdraw && (
        <WithdrawModal
          balance={balance}
          onClose={() => setShowWithdraw(false)}
          onSuccess={handleSuccess}
        />
      )}
    </div>
  );
}
