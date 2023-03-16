import {
  FormEvent,
  FormEventHandler,
  Fragment,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import truncate from "truncate-eth-address";

const getCheckUrl = (address: string) =>
  "https://corsproxy.io/?" +
  encodeURIComponent(
    `https://arbitrum.foundation/_next/data/NDhqybgYBJYIbHFAh1PQB/eligibility.json?address=${address.toLowerCase()}`
  );

type CheckResult = {
  isEligible: boolean;
  isClaimingLive: boolean;
  isSmartContractWallet: boolean;
  hasClaimed: boolean;
  eligibility: {
    points: number;
    tokens: number;
    meets_criteria_2_1: number;
    meets_criteria_2_2_a: number;
    meets_criteria_2_2_b: number;
    meets_criteria_2_2_c: number;
    meets_criteria_2_3_a: number;
    meets_criteria_2_3_b: number;
    meets_criteria_2_3_c: number;
    meets_criteria_2_3_d: number;
    meets_criteria_2_4_a: number;
    meets_criteria_2_4_b: number;
    meets_criteria_2_4_c: number;
    meets_criteria_2_6: number;
    meets_criteria_2_7: number;
    meets_criteria_2_8: number;
    meets_criteria_4_1: number;
    meets_criteria_4_2: number;
    meets_criteria_4_3: number;
    meets_criteria_11_1: number;
    meets_criteria_11_2: number;
    meets_criteria_11_3: number;
    meets_criteria_11_4: number;
  };
};

type eligibilityResponse = { pageProps: CheckResult };

function App() {
  const [addresses, setAddresses] = useState<string>("");

  const allAddresses = useMemo(() => {
    const matches = addresses.matchAll(/0x[a-z0-9]{40}/gim);
    const result = Array.from(matches).map((m) => m[0]);
    // remove duplicates, ignoring case
    return [...new Set(result.map((a) => a.toLowerCase()))];
  }, [addresses]);

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

  const [result, setResult] = useState<CheckResult[] | null>(null);

  const fetchAirdropData = useCallback(
    (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      const promises = allAddresses.map(async (address) => {
        const res = await fetch(getCheckUrl(address));
        const json = (await res.json()) as eligibilityResponse;
        console.log(json);
        return json.pageProps;
      });
      Promise.all(promises).then((results) => {
        setResult(results);
      });
    },
    [allAddresses]
  );

  return (
    <div className="flex flex-col items-center">
      <h1 className="mb-8 mt-8 text-2xl">
        Arbitrum airdrop bulk address checker
      </h1>
      <form className="flex flex-col" onSubmit={fetchAirdropData}>
        <textarea
          ref={textArea}
          cols={42}
          rows={10}
          value={addresses}
          onChange={(e) => setAddresses(e.target.value)}
          className="text-sky-100-100 rounded border border-sky-700 bg-sky-800 px-4 py-2 font-mono placeholder:text-slate-400"
          placeholder="Paste addresses separated by commas, spaces, or carriage returns."
        />
        <input
          type="submit"
          value="Check Airdrop Eligibility"
          className="mt-4 mb-10 self-center rounded-sm bg-sky-800 py-1 px-3"
        />
      </form>
      {result && (
        <>
          <div className="grid grid-cols-2">
            <div className="mb-4 text-left font-bold">Address</div>
            {/* <th>Points</th> */}
            <div className="text-right font-bold">Tokens</div>

            {result.map((r: CheckResult, i) => (
              <Fragment key={i}>
                <div className="pr-10 font-mono">
                  {truncate(allAddresses[i])}
                </div>
                {/* <td>{r.eligibility.points}</td> */}
                <div className="text-right">
                  {r.eligibility.tokens.toLocaleString()}
                </div>
              </Fragment>
            ))}
            {/* Table with headers in the first column: Total tokens, token price, market cap, FDV, airdrop value */}
            <div className="col-span-2 mt-4 h-px bg-sky-800"></div>
            <div className="mt-4 font-bold">Total tokens</div>
            <div className="mt-4 text-right font-bold">
              {result
                ?.reduce((acc, r) => acc + r.eligibility.tokens, 0)
                .toLocaleString()}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default App;
