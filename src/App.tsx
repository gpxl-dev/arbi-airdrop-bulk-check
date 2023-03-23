import { createSyncStoragePersister } from "@tanstack/query-sync-storage-persister";
// import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import {
  EthereumClient,
  w3mConnectors,
  w3mProvider,
} from "@web3modal/ethereum";
import { Web3Modal } from "@web3modal/react";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { configureChains, createClient, WagmiConfig } from "wagmi";
import { arbitrum, mainnet, polygon } from "wagmi/chains";
import ClaimCheckPage from "./ClaimCheckPage";
import { ClaimPage } from "./ClaimPage";
import queryClient from "./queryClient";

const chains = [arbitrum];
const projectId = "6c186b8fe36fd92c453e14617f4e3467";

const { provider } = configureChains(chains, [w3mProvider({ projectId })]);
const wagmiClient = createClient({
  autoConnect: true,
  connectors: w3mConnectors({ projectId, version: 1, chains }),
  provider,
});
const ethereumClient = new EthereumClient(wagmiClient, chains);

const persister = createSyncStoragePersister({
  storage: window.localStorage,
});

const router = createBrowserRouter([
  {
    path: "/",
    element: <ClaimPage />,
  },
  {
    path: "/legacy",
    element: <ClaimCheckPage />,
  },
]);

function App() {
  return (
    <>
      <PersistQueryClientProvider
        client={queryClient}
        persistOptions={{ persister }}
      >
        <WagmiConfig client={wagmiClient}>
          <RouterProvider router={router} />
        </WagmiConfig>
        {/* <ReactQueryDevtools initialIsOpen={false} /> */}
      </PersistQueryClientProvider>

      <Web3Modal projectId={projectId} ethereumClient={ethereumClient} />
    </>
  );
}

export default App;
