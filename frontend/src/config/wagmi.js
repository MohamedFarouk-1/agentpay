/**
 * Wagmi and RainbowKit configuration
 */
import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { baseSepolia } from './contracts';

export const wagmiConfig = getDefaultConfig({
  appName: 'Agent Payment Platform',
  projectId: 'YOUR_WALLETCONNECT_PROJECT_ID', // Get from https://cloud.walletconnect.com
  chains: [baseSepolia],
  ssr: false,
});
