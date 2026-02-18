/**
 * Custom hooks for backend API calls
 */
import { useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../config/contracts';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Fetch agents from marketplace
export function useAgents() {
  const [agents, setAgents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAgents = async () => {
    try {
      setIsLoading(true);
      const response = await api.get('/agents');
      setAgents(response.data);
      setError(null);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching agents:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAgents();
  }, []);

  return { agents, isLoading, error, refetch: fetchAgents };
}

// Fetch transactions for a wallet
export function useTransactions(walletAddress) {
  const [transactions, setTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchTransactions = async () => {
    if (!walletAddress) {
      setTransactions([]);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const response = await api.get(`/transactions/wallet/${walletAddress}`);
      setTransactions(response.data);
      setError(null);
    } catch (err) {
      // 404 is expected if no fund exists yet
      if (err.response?.status === 404) {
        setTransactions([]);
        setError(null);
      } else {
        setError(err.message);
        console.error('Error fetching transactions:', err);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [walletAddress]);

  return { transactions, isLoading, error, refetch: fetchTransactions };
}

// Create fund account
export async function createFund(walletAddress) {
  try {
    const response = await api.post('/funds', { wallet_address: walletAddress });
    return response.data;
  } catch (err) {
    // Ignore "already exists" errors
    if (err.response?.status === 400 && err.response?.data?.detail?.includes('already exists')) {
      return null;
    }
    throw err;
  }
}

// Create agent
export async function createAgent(agentData) {
  const response = await api.post('/agents', agentData);
  return response.data;
}

// Record transaction
export async function recordTransaction(txData) {
  try {
    const response = await api.post('/transactions', txData);
    return response.data;
  } catch (err) {
    console.error('Error recording transaction:', err);
    // Don't throw - transaction already happened on-chain
    return null;
  }
}

// Get fund balance from backend (uses blockchain service)
export async function getFundBalance(walletAddress) {
  try {
    const response = await api.get(`/funds/${walletAddress}/balance`);
    return response.data;
  } catch (err) {
    console.error('Error fetching fund balance:', err);
    return null;
  }
}
