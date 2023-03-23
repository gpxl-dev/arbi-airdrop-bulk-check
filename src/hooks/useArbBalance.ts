import { useQueries } from "@tanstack/react-query";
import { BigNumber, Contract } from "ethers";
import { useProvider } from "wagmi";
import arbToken from "../contracts/arbToken";

const contract = new Contract(arbToken.address, arbToken.abi);

export const useArbBalances = (addresses: string[]) => {
  const provider = useProvider();

  return useQueries({
    queries: addresses.map((address) => ({
      queryKey: [address.toLowerCase(), "arbBalance"],
      queryFn: async () => {
        return (await contract
          .connect(provider)
          ["balanceOf"](address)) as BigNumber;
      },
      enabled: !!address,
      refetchOnWindowFocus: true,
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: Infinity,
    })),
  });
};
