import { Web3Button } from "@web3modal/react";
import { formatUnits } from "ethers/lib/utils.js";
import { FormEvent, Fragment, useEffect, useState } from "react";
import { Toaster, default as toast } from "react-hot-toast";
import { ImSpinner10 } from "react-icons/im";
import { createSearchParams, useSearchParams } from "react-router-dom";
import truncateEthAddress from "truncate-eth-address";
import { useAccount, usePrepareContractWrite, useContractWrite } from "wagmi";
import tokenDistributorContract from "./contracts/tokenDistributor";
import { useArbBalances } from "./hooks/useArbBalance";
import { useClaimableTokens } from "./hooks/useClaimableTokens";
import queryClient from "./queryClient";
import { HiOutlineRefresh, HiOutlineTrash } from "react-icons/hi";
import { BigNumber } from "ethers";
import { AddAccountForm } from "./AddAccountForm";

// "Thu Mar 23 2023 12:54:13 GMT+0000"
const expectedClaimOpen = 1679576053000;
// 10 minute buffer
const buffer = 10 * 60 * 1000;

export const ClaimPage = () => {
  const { address: connectedAccount } = useAccount();

  const [searchParams, setSearchParams] = useSearchParams();
  const [closeToClaimPeriod, setCloseToClaimPeriod] = useState<boolean>(
    Date.now() > expectedClaimOpen - buffer
  );
  const addressList = searchParams.getAll("a");
  const [showAddForm, setshowAddForm] = useState(!addressList.length);

  useEffect(() => {
    // If not close to claim period, set a timeout to change the state when we are
    if (!closeToClaimPeriod) {
      const timeout = setTimeout(() => {
        setCloseToClaimPeriod(true);
      }, expectedClaimOpen - Date.now() - buffer);
      return () => clearTimeout(timeout);
    }
  }, [closeToClaimPeriod]);

  const addressesAndLabels = addressList.map((address) => {
    const [addr, label] = address.split(":");
    return [`0x${addr}`, label] as [`0x${string}`, string];
  });

  const claimQueries = useClaimableTokens(addressesAndLabels.map(([a]) => a));
  const balanceQueries = useArbBalances(addressesAndLabels.map(([a]) => a));

  // Handle adding an address to the list.
  const onSubmitNew = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formdata = new FormData(e.target as HTMLFormElement);
    const address = (formdata.get("newAddress") as string)?.toLowerCase();
    const label = formdata.get("newLabel");
    if (addressesAndLabels.some(([a]) => a.toLowerCase() === address)) {
      // Address already exists
    } else {
      setSearchParams(
        createSearchParams({
          a: [
            ...addressList,
            `${address.split("0x")[1]}${label ? `:${label}` : ""}`,
          ],
        })
      );
    }
    // Clear the form
    (e.target as HTMLFormElement).reset();
  };

  // Refresh balance and claim amount for an account
  const invalidateCacheForAccount = (address: string) => {
    queryClient.resetQueries([address.toLowerCase()]);
  };

  // Handle claiming
  const { config } = usePrepareContractWrite({
    ...tokenDistributorContract,
    functionName: "claim",
    staleTime: 10000,
    enabled: closeToClaimPeriod,
  });
  const { writeAsync: claim, isLoading: claimLoading } =
    useContractWrite(config);

  const onClaim = async () => {
    if (!claim) return;
    const claimPromise = claim();
    toast.promise(claimPromise, {
      loading: `Claiming ARB for ${truncateEthAddress(connectedAccount!)}`,
      success: `ARB claimed successfully for ${truncateEthAddress(
        connectedAccount!
      )}`,
      error: (e) =>
        `Error claiming ARB for ${truncateEthAddress(connectedAccount!)}: ${
          e.message
        }}`,
    });
    await claimPromise;
    invalidateCacheForAccount(connectedAccount!);
  };

  return (
    <div className="mx-auto box-border flex w-[800px] max-w-full flex-col gap-2 p-10">
      <div className="mb-5 self-end">
        <Web3Button />
      </div>
      <div className="mb-10 flex max-w-prose flex-col gap-2">
        <h2 className="text-lg font-semibold">
          ARB Airdrop eligibility & claim page
        </h2>
        <p>
          Use this page to set up a list of addresses, with optional labels for
          organisational purposes. The list will be saved in the URL, so you can
          bookmark use it across devices.
        </p>
        <p>
          The site will check the amount of ARB token each address can claim,
          and will also show the current ARB balance. Values are taken from the
          ARB token distributor and token contract directly. They will refresh
          after a successful claim, but you can also manually refresh by
          clicking the refresh button.
        </p>
        <p>
          The claim button will only show for the currently connected acccount,
          and will be disabled if the transaction would fail (i.e. claims aren't
          open, or you don't have any tokens to claim).
        </p>
        <p>Some wallets will require a refresh after you switch accounts.</p>
      </div>

      <div
        className="grid items-center gap-2"
        style={{ gridTemplateColumns: "repeat(4, auto)" }}
      >
        {addressesAndLabels.map(([address, label], i) => {
          return (
            <Fragment key={address}>
              <div className="flex flex-col">
                <div>{label ? label : <>Account {i}</>}</div>
                <span className="hidden text-xs sm:block">{address}</span>
                <span className="text-xs sm:hidden">
                  {truncateEthAddress(address)}
                </span>
              </div>

              {/* Claimable tokens */}
              <div>
                <div className="flex flex-row justify-end gap-2">
                  {claimQueries[i]?.isLoading ? (
                    <ImSpinner10 className="animate-spin justify-end text-right" />
                  ) : claimQueries[i]?.data ? (
                    <>
                      <span className="">
                        {formatUnits(claimQueries[i].data!, 18)}
                      </span>
                      {connectedAccount?.toLowerCase() ===
                        address.toLowerCase() &&
                        BigNumber.from(claimQueries[i].data!).gt(0) && (
                          <button
                            onClick={onClaim}
                            disabled={!claim || claimLoading}
                            className="flex flex-row items-center gap-1 rounded bg-green-600 px-1 text-xs uppercase disabled:opacity-50"
                          >
                            <span>Claim</span>
                            {claimLoading && (
                              <ImSpinner10 className="animate-spin" />
                            )}
                          </button>
                        )}
                    </>
                  ) : (
                    "0"
                  )}
                </div>
              </div>

              {/* ARB balance */}
              <div className="flex flex-row justify-end gap-2 text-right">
                {balanceQueries[i]?.isLoading ? (
                  <ImSpinner10 className="animate-spin justify-end" />
                ) : balanceQueries[i]?.data ? (
                  formatUnits(balanceQueries[i].data!, 18)
                ) : (
                  "0"
                )}
              </div>

              <div className="flex flex-row justify-end gap-6">
                <button
                  onClick={() => invalidateCacheForAccount(address)}
                  disabled={claimQueries[i]?.isLoading}
                >
                  <HiOutlineRefresh />
                </button>
                <button>
                  <HiOutlineTrash />
                </button>
              </div>
            </Fragment>
          );
        })}
      </div>

      <AddAccountForm onSubmit={onSubmitNew} className="mt-10 self-center" />
      <div className="mt-8 flex flex-col gap-2 text-sm">
        <p>
          This site was hacked together quickly by{" "}
          <a
            href="https://twitter.com/greypixel_"
            className="cursor-pointer underline"
            target="_blank"
          >
            greypixel
          </a>
          . The code is hosted{" "}
          <a href="https://github.com/gpxl-dev/arbi-airdrop-bulk-check">
            on github
          </a>{" "}
          - feel free to submit a PR if you find any bugs or wish to add
          features.
        </p>
        <p>
          If you found this useful, please consider donating to
          {/* copy on click */}
          <button
            className="font-mono"
            onClick={(e) => {
              try {
                navigator.clipboard.writeText(
                  "0xF0E146d9818C167FA0A67d711509d342DA845008"
                );
              } catch (e) {
                // failed to copy
              }
            }}
          >
            0xF0E146d9818C167FA0A67d711509d342DA845008
          </button>
          Any proceeds will go to Umami DAO's legal defense fund. Unspent funds
          will be donated to charity.
        </p>
      </div>
      <Toaster />
    </div>
  );
};
