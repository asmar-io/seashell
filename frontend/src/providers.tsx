import { BrowserRouter } from "react-router";
import { ThemeProvider } from "./components/theme-provider";
import {
  createNetworkConfig,
  SuiClientProvider,
  useSuiClientContext,
  WalletProvider,
} from "@mysten/dapp-kit";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { isEnokiNetwork, registerEnokiWallets } from "@mysten/enoki";
import { useEffect } from "react";

const { networkConfig } = createNetworkConfig({
  testnet: { url: "https://fullnode.testnet.sui.io:443" },
  devnet: { url: "https://fullnode.devnet.sui.io:443" },
});

const queryClient = new QueryClient();

function RegisterEnokiWallets() {
  const { client, network } = useSuiClientContext();

  useEffect(() => {
    if (!isEnokiNetwork(network)) return;
    const { unregister } = registerEnokiWallets({
      apiKey: "enoki_public_488a4f0bc8b2831b6a4ab43335f028f6",
      providers: {
        google: {
          clientId:
            "seashell-google",
        },
        // Optional additional providers
        // facebook: { clientId: 'YOUR_FACEBOOK_CLIENT_ID' },
        // twitch: { clientId: 'YOUR_TWITCH_CLIENT_ID' },
      },
      // @ts-ignore
      client,
      network,
    });

    return unregister;
  }, [client, network]);

  return null;
}

export const Providers = ({ children }: { children: React.ReactNode }) => {
  return (
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <QueryClientProvider client={queryClient}>
        <SuiClientProvider networks={networkConfig} defaultNetwork="testnet">
          <RegisterEnokiWallets />
          <WalletProvider autoConnect>
            <BrowserRouter>{children}</BrowserRouter>
          </WalletProvider>
        </SuiClientProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
};
