import {
  FormEvent,
  FormEventHandler,
  useCallback,
  useMemo,
  useState,
} from "react";
import truncate from "truncate-eth-address";

const getCheckUrl = (address: string) =>
  "https://corsproxy.io/?" +
  encodeURIComponent(
    `https://arbitrum.foundation/_next/data/lB0zTjQwwi0nJOMcTT0Td/eligibility.json?address=${address.toLowerCase()}`
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
          cols={42}
          rows={10}
          value={addresses}
          onChange={(e) => setAddresses(e.target.value)}
          className="text-sky-100-100 rounded border border-sky-700 bg-sky-800 px-4 py-2 font-mono placeholder:text-slate-400"
          placeholder="Enter addresses separated by commas, spaces, or carriage returns."
        />
        <input
          type="submit"
          value="Check Airdrop Eligibility"
          className="mt-4 mb-10 self-center rounded-sm bg-sky-800 py-1 px-3"
        />
      </form>
      {result && (
        <>
          <table>
            <thead>
              <tr>
                <th className="text-left">Address</th>
                {/* <th>Points</th> */}
                <th className="text-right">Tokens</th>
              </tr>
            </thead>
            <tbody>
              {result.map((r: CheckResult, i) => (
                <tr key={i}>
                  <td className="font-mono">{truncate(allAddresses[i])}</td>
                  {/* <td>{r.eligibility.points}</td> */}
                  <td className="text-right">{r.eligibility.tokens}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {/* Table with headers in the first column: Total tokens, token price, market cap, FDV, airdrop value */}
          <table>
            <tbody>
              <tr>
                <th>Total tokens</th>
                <td>
                  {result?.reduce((acc, r) => acc + r.eligibility.tokens, 0)}
                </td>
              </tr>
            </tbody>
          </table>
        </>
      )}
    </div>
  );
}

export default App;
