/**
 * Custom hooks for contract interactions using wagmi
 */
import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseUnits, formatUnits } from 'viem';
import { VAULT_CONTRACT_ADDRESS, USDC_CONTRACT_ADDRESS, USDC_DECIMALS } from '../config/contracts';

// Import ABIs (will be loaded from contract artifacts)
import VaultABI from '../abi/AgentPaymentVault.json';
import USDCABI from '../abi/MockUSDC.json';

// Get fund account balance and limits
export function useFundAccount(address) {
  const { data, isLoading, error, refetch } = useReadContract({
    address: VAULT_CONTRACT_ADDRESS,
    abi: VaultABI.abi,
    functionName: 'getFundAccount',
    args: [address],
    enabled: !!address && VAULT_CONTRACT_ADDRESS !== '0x0000000000000000000000000000000000000000',
  });

  const formatBalance = (value) => {
    if (!value) return '0';
    return formatUnits(value, USDC_DECIMALS);
  };

  return {
    balance: data ? formatBalance(data[0]) : '0',
    dailySpendingLimit: data ? formatBalance(data[1]) : '0',
    perTransactionLimit: data ? formatBalance(data[2]) : '0',
    todaySpent: data ? formatBalance(data[3]) : '0',
    lastResetDay: data ? data[4].toString() : '0',
    isLoading,
    error,
    refetch,
  };
}

// Check if agent is authorized
export function useIsAgentAuthorized(fundAddress, agentAddress) {
  const { data, isLoading, refetch } = useReadContract({
    address: VAULT_CONTRACT_ADDRESS,
    abi: VaultABI.abi,
    functionName: 'isBotAuthorized',
    args: [fundAddress, agentAddress],
    enabled: !!fundAddress && !!agentAddress && VAULT_CONTRACT_ADDRESS !== '0x0000000000000000000000000000000000000000',
  });

  return {
    isAuthorized: data || false,
    isLoading,
    refetch,
  };
}

// Get USDC balance
export function useUSDCBalance(address) {
  const { data, isLoading, refetch } = useReadContract({
    address: USDC_CONTRACT_ADDRESS,
    abi: USDCABI.abi,
    functionName: 'balanceOf',
    args: [address],
    enabled: !!address,
  });

  return {
    balance: data ? formatUnits(data, USDC_DECIMALS) : '0',
    isLoading,
    refetch,
  };
}

// Approve USDC spending
export function useApproveUSDC() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();

  const approve = async (amount) => {
    const amountInWei = parseUnits(amount.toString(), USDC_DECIMALS);
    return writeContract({
      address: USDC_CONTRACT_ADDRESS,
      abi: USDCABI.abi,
      functionName: 'approve',
      args: [VAULT_CONTRACT_ADDRESS, amountInWei],
    });
  };

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  return {
    approve,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
  };
}

// Deposit USDC
export function useDeposit() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();

  const deposit = async (amount) => {
    const amountInWei = parseUnits(amount.toString(), USDC_DECIMALS);
    return writeContract({
      address: VAULT_CONTRACT_ADDRESS,
      abi: VaultABI.abi,
      functionName: 'deposit',
      args: [amountInWei],
    });
  };

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  return {
    deposit,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
  };
}

// Withdraw USDC
export function useWithdraw() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();

  const withdraw = async (amount) => {
    const amountInWei = parseUnits(amount.toString(), USDC_DECIMALS);
    return writeContract({
      address: VAULT_CONTRACT_ADDRESS,
      abi: VaultABI.abi,
      functionName: 'withdraw',
      args: [amountInWei],
    });
  };

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  return {
    withdraw,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
  };
}

// Authorize agent
export function useAuthorizeAgent() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();

  const authorizeAgent = async (agentAddress) => {
    return writeContract({
      address: VAULT_CONTRACT_ADDRESS,
      abi: VaultABI.abi,
      functionName: 'authorizeBot',
      args: [agentAddress],
    });
  };

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  return {
    authorizeAgent,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
  };
}

// Revoke agent
export function useRevokeAgent() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();

  const revokeAgent = async (agentAddress) => {
    return writeContract({
      address: VAULT_CONTRACT_ADDRESS,
      abi: VaultABI.abi,
      functionName: 'revokeBot',
      args: [agentAddress],
    });
  };

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  return {
    revokeAgent,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
  };
}

// Set spending limits
export function useSetLimits() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();

  const setLimits = async (dailyLimit, perTxLimit) => {
    const dailyLimitInWei = parseUnits(dailyLimit.toString(), USDC_DECIMALS);
    const perTxLimitInWei = parseUnits(perTxLimit.toString(), USDC_DECIMALS);
    return writeContract({
      address: VAULT_CONTRACT_ADDRESS,
      abi: VaultABI.abi,
      functionName: 'setLimits',
      args: [dailyLimitInWei, perTxLimitInWei],
    });
  };

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  return {
    setLimits,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
  };
}
