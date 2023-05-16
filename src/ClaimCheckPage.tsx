import { formatUnits } from "ethers/lib/utils.js";
import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import { BsEyeFill, BsEyeSlashFill } from "react-icons/bs";
import { ImSpinner10 } from "react-icons/im";
import truncate from "truncate-eth-address";
import { useClaimableTokens } from "./hooks/useClaimableTokens";

function ClaimCheckPage() {
  const [addresses, setAddresses] = useState<string>("");

  const allAddresses = useMemo(() => {
    const matches = addresses.matchAll(/0x[a-z0-9]{40}/gim);
    const result = Array.from(matches).map((m) => m[0]);
    // remove duplicates, ignoring case
    return [...new Set(result.map((a) => a.toLowerCase()))];
  }, [addresses]);

  const claimQueries = useClaimableTokens(allAddresses);

  const textArea = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const textAreaEl = textArea.current;
    if (!textAreaEl) return;

    // add paste listener
    const pasteListener = (e: ClipboardEvent) => {
      setTimeout(() => {
        setAddresses(textAreaEl.value + "\n");
      }, 0);
    };

    textAreaEl.addEventListener("paste", pasteListener);
  }, []);

  const [blur, setBlur] = useState<boolean>(false);

  return (
    <div className="flex w-full flex-1 flex-col items-center px-4">
      <h1 className="mb-8 mt-8 text-2xl">
        Arbitrum airdrop bulk address checker
      </h1>
      <textarea
        ref={textArea}
        cols={42}
        rows={10}
        value={addresses}
        onChange={(e) => setAddresses(e.target.value)}
        className="mx-2 max-w-full rounded border border-sky-700 bg-sky-800 px-4 py-2 font-mono text-xs placeholder:text-slate-400 sm:text-base"
        placeholder="Paste addresses separated by commas, spaces, or carriage returns."
      />

      {claimQueries && (
        <>
          <div className="mt-8 grid grid-cols-2">
            <div className="mb-4 flex flex-row items-center gap-2 text-left font-bold">
              Address
              <button
                onClick={() => setBlur((b) => !b)}
                className="text-slate-400"
              >
                {blur ? <BsEyeFill /> : <BsEyeSlashFill />}
              </button>
            </div>
            {/* <th>Points</th> */}
            <div className="text-right font-bold">Tokens</div>

            {claimQueries.map(({ isLoading, data }, i) => (
              <Fragment key={i}>
                <div className={"pr-10 font-mono " + (blur ? "blur-sm" : "")}>
                  {truncate(allAddresses[i])}
                </div>
                {/* <td>{r.eligibility.points}</td> */}
                {isLoading ? (
                  <ImSpinner10 className="animate-spin" />
                ) : (
                  <div className="text-right">{formatUnits(data!, 18)}</div>
                )}
              </Fragment>
            ))}
            {/* Table with headers in the first column: Total tokens, token price, market cap, FDV, airdrop value */}
            <div className="col-span-2 mt-4 h-px bg-sky-800"></div>
          </div>
        </>
      )}
      <div className="flex-1"></div>
      <div className="mt-8 mb-10 flex w-[440px] max-w-full flex-col gap-2 text-sm">
        <p>
          This site was hacked together quickly by{" "}
          <a
            href="https://twitter.com/greypixel_"
            className="cursor-pointer underline"
            target="_blank"
          >
            greypixel
          </a>
          . It will probably break frequently, I'll try to push fixes as quickly
          as possible.
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
    </div>
  );
}

export default ClaimCheckPage;
