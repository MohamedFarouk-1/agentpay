/**
 * WalletConnect component - RainbowKit connect button
 */
import { ConnectButton } from '@rainbow-me/rainbowkit';

export default function WalletConnect() {
  return (
    <ConnectButton
      chainStatus="icon"
      showBalance={true}
      accountStatus={{
        smallScreen: 'avatar',
        largeScreen: 'full',
      }}
    />
  );
}
