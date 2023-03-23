import { BigNumber, Contract } from "ethers";
import { useQueries } from "@tanstack/react-query";
import { useProvider } from "wagmi";
import tokenDistributorContract from "../contracts/tokenDistributor";

const contract = new Contract(
  tokenDistributorContract.address,
  tokenDistributorContract.abi
);

export const useClaimableTokens = (addresses: string[]) => {
  const provider = useProvider();

  return useQueries({
    queries: addresses.map((address) => ({
      queryKey: [address.toLowerCase(), "claimableArb"],
      queryFn: async () => {
        console.log("fetching", address);
        return (await contract
          .connect(provider)
          ["claimableTokens"](address)) as BigNumber;
      },
      enabled: !!address,
      refetchOnWindowFocus: false,
      staleTime: 60 * 1000 * 60 * 24, // 1 day
      cacheTime: Infinity,
    })),
  });
};
