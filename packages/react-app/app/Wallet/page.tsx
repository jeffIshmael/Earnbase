"use client";

import { useState, useEffect } from "react";
import {
  Wallet,
  Copy,
  ExternalLink,
  TrendingUp,
  ArrowUpRight,
  ArrowDownLeft,
  RefreshCw,
  LucideArrowDownLeftSquare,
  ArrowUpDown,
} from "lucide-react";
import { useAccount, useConnect, useSwitchChain } from "wagmi";
import { injected } from "@wagmi/connectors";
import { celo } from "wagmi/chains";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { formatEther } from "viem";
import { getBalances } from "@/lib/Balance";
import { getUser } from "@/lib/Prismafnctns";
import { useUserSmartAccount } from "../hooks/useUserSmartAccount";
import BottomNavigation from "@/components/BottomNavigation";
import TransferModal from "@/components/TransferModal";
import { CeloLogo } from "@/components/CeloLogo";
import Image from "next/image";
import { useDebouncedValue } from "@/utils/Hook";
import { TradablePair } from "@mento-protocol/mento-sdk";
import {
  getTheQuote,
  approveSwap,
  executeSwap,
  getCeloCusdQuote,
} from "@/lib/Swapping";
import { waitForTransactionReceipt } from "@wagmi/core";
import { config } from "@/providers/AppProvider";
import { cn } from "@/lib/utils";
import { cUSDAddress, USDCAddress, celoAddress } from "@/contexts/constants";

interface Quote {
  amountWei: string;
  quoteWei: string;
  quote: string;
  rate: string;
  tradablePair: TradablePair;
}

export default function WalletPage() {
  const { address, isConnected, chain } = useAccount();
  const { connect, connectors } = useConnect();
  const { switchChain, isPending } = useSwitchChain();
  const { smartAccount } = useUserSmartAccount();

  const [cUSDBalance, setCUSDBalance] = useState<string | null>(null);
  const [usdcBalance, setUsdcBalance] = useState<string | null>(null);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [currencyFrom, setCurrencyFrom] = useState<
    "cUSD" | "USDC" | "CELO" | null
  >(null);
  const [amountFrom, setAmountFrom] = useState("");
  const [amountTo, setAmountTo] = useState("");
  const [isSwapping, setIsSwapping] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [exchangeRate, setExchangeRate] = useState("1 cUSD = 0.999 USDC");
  const [isFetchingQuote, setIsFetchingQuote] = useState(false);
  const [quoteInterface, setQuoteInterface] = useState<Quote | null>(null);
  const [celoBalance, setCeloBalance] = useState<string | null>(null);
  const debouncedAmount = useDebouncedValue(amountFrom, 500);

  useEffect(() => {
    if (isConnected && address) {
      fetchBalances();
    }
  }, [isConnected, address]);

  useEffect(() => {
    if (chain?.id !== celo.id && isConnected) {
      switchChain({ chainId: celo.id });
    }
  }, [chain, isConnected]);

  const fetchBalances = async () => {
    if (!address) return;

    try {
      setIsLoading(true);
      const { cUSDBalance, USDCBalance, celoBalance } = await getBalances(
        address as `0x${string}`
      );
      setCUSDBalance(Number(formatEther(cUSDBalance)).toFixed(3));
      setUsdcBalance((Number(USDCBalance) / 10 ** 6).toFixed(3));
      setCeloBalance((Number(celoBalance) / 10 ** 18).toFixed(3));
    } catch (error) {
      console.error("Error fetching balances:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConnect = async () => {
    try {
      connect({ connector: injected({ target: "metaMask" }) });
    } catch (error) {
      console.error(error);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Address copied to clipboard");
  };

  const openCeloScan = (address: string) => {
    window.open(`https://celoscan.io/address/${address}`, "_blank");
  };

  // function to handle getting quote with specific amount
  const getQuoteWithAmount = async (
    amount: string,
    fromcUSD: boolean,
    isCelo: boolean
  ) => {
    if (isNaN(Number(amount)) || Number(amount) <= 0) return;
    try {
      setIsFetchingQuote(true);
      const quote = isCelo
        ? await getCeloCusdQuote(amount, isCelo)
        : await getTheQuote(amount, fromcUSD);
      console.log(quote);
      setQuoteInterface(quote);
      const rate = `1 ${fromcUSD ? "cUSD" : isCelo ? "cUSD" : "USDC"} = ${
        quote?.rate
      } ${fromcUSD ? "USDC" : isCelo ? "CELO" : "cUSD"}`;
      setExchangeRate(rate);
      setAmountTo(quote?.quote ?? "");
      setIsFetchingQuote(false);
    } catch (error) {
      console.log(error);
      toast.error("Unable to fetch price quote.");
    } finally {
      setIsFetchingQuote(false);
    }
  };

  // function to do the swap
  const handleSwap = async (
    fromcUSD: boolean,
    isCelo: boolean,
    event: React.MouseEvent<HTMLButtonElement>
  ) => {
    if (!quoteInterface) {
      toast.error("Quote not available. Please try again.");
      return;
    }
    if (!address || !isConnected) {
      toast.error("Please connect wallet.");
      return;
    }

    // ensure its connected to celo
    if (chain?.id !== celo.id) {
      switchChain({ chainId: celo.id });
    }

    const fromTokenSymbol = fromcUSD ? "cUSD" : isCelo ? "CELO" : "USDC";
    const toTokenSymbol = fromcUSD ? "USDC" : isCelo ? "cUSD" : "cUSD";
    const fromTokenAddress = fromcUSD
      ? cUSDAddress
      : isCelo
      ? celoAddress
      : USDCAddress;
    const toTokenAddress = fromcUSD
      ? USDCAddress
      : isCelo
      ? cUSDAddress
      : cUSDAddress;

    try {
      setIsApproving(true);
      toast.loading("Approving token for swap...");

      const approvalTx = await approveSwap(
        fromTokenAddress,
        quoteInterface.amountWei
      );

      if (!approvalTx) {
        toast.dismiss();
        toast.error("Approval failed. Please try again.");
        return;
      }

      toast.dismiss();
      toast.success("Approval successful.");

      setIsApproving(false);
      setIsSwapping(true);
      toast.loading("Swapping tokens...");

      const swapTx = await executeSwap(
        fromTokenAddress,
        toTokenAddress,
        quoteInterface.amountWei,
        quoteInterface.quoteWei,
        quoteInterface.tradablePair,
        fromcUSD
      );

      if (!swapTx) {
        toast.dismiss();
        toast.error("Swap failed. Please try again.");
        return;
      }

      const transactionReceipt = await waitForTransactionReceipt(config, {
        chainId: celo.id,
        hash: swapTx,
      });

      if (transactionReceipt && transactionReceipt.status === "success") {
        setIsSwapping(false);
        toast.dismiss();
        toast(
          <div className="flex flex-col">
            <span>
              ✅ Successfully swapped {amountFrom} {fromTokenSymbol} to{" "}
              {Number(amountTo).toFixed(4)} {toTokenSymbol}
            </span>
            <a
              href={`https://celoscan.io/tx/${swapTx}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-block w-fit rounded-md bg-green-500 px-3 py-1 text-white text-sm font-medium hover:bg-green-600 transition"
            >
              View on CeloScan
            </a>
          </div>
        );
        setAmountFrom("");
        setAmountTo("");
        // get the balances again
        await getBalances(address as `0x${string}`);
      } else {
        toast.dismiss();
        toast.error("Swap transaction failed or reverted.");
      }
    } catch (error) {
      console.error("Swap error:", error);
      toast.dismiss();
      toast.error("An error occurred. Please try again.");
    } finally {
      setIsApproving(false);
      setIsSwapping(false);
    }
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-celo-lt-tan flex items-center justify-center p-4">
        <div className="bg-white border-4 border-black p-8 max-w-md w-full text-center">
          <Wallet className="w-16 h-16 text-celo-body mx-auto mb-4" />
          <h1 className="text-h3 font-gt-alpina font-thin text-black mb-2">
            CONNECT WALLET
          </h1>
          <p className="text-body-m text-celo-body mb-6 font-inter">
            Please connect your wallet to view your wallet information.
          </p>
          <button
            onClick={handleConnect}
            className="bg-celo-purple text-white px-8 py-3 border-4 border-black font-inter font-heavy hover:bg-black hover:text-celo-purple transition-all duration-200"
          >
            CONNECT WALLET
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-celo-lt-tan pb-28">
      <div className="p-4 space-y-8">
        {/* Wallet Status */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white border-4 border-black p-6 rounded-2xl shadow-[6px_6px_0_0_rgba(0,0,0,1)] hover:shadow-[8px_8px_0_0_rgba(0,0,0,1)] transition-all duration-200"
        >
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-h5 font-gt-alpina font-bold text-black tracking-wide">
              WALLET STATUS
            </h2>
            <div className="flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-celo-success"></span>
              <span className="text-body-s text-celo-success font-inter font-heavy">
                CONNECTED
              </span>
            </div>
          </div>

          {/* Wallet Address */}
          <div className="bg-celo-dk-tan border-4 border-black p-4 rounded-xl">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-body-s text-celo-body mb-1 font-inter font-heavy">
                  WALLET ADDRESS
                </p>
                <p className="text-body-s font-mono text-black truncate font-inter">
                  {address}
                </p>
              </div>
              <div className="flex items-center space-x-2 ml-3">
                <button
                  onClick={() => copyToClipboard(address!)}
                  className="p-2 text-celo-body bg-white border-2 border-black hover:bg-celo-yellow hover:text-black transition-all duration-200 rounded-lg"
                >
                  <Copy className="w-4 h-4" />
                </button>
                <button
                  onClick={() => openCeloScan(address!)}
                  className="p-2 text-celo-body bg-white border-2 border-black hover:bg-celo-yellow hover:text-black transition-all duration-200 rounded-lg"
                >
                  <ExternalLink className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Smart Account */}
          {smartAccount && (
            <div className="mt-4 bg-celo-purple border-4 border-black p-4 rounded-xl">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-body-s text-white mb-1 font-inter font-heavy">
                    SMART ACCOUNT
                  </p>
                  <p className="text-body-s font-mono text-white truncate font-inter">
                    {smartAccount.address}
                  </p>
                </div>
                <button
                  onClick={() => copyToClipboard(smartAccount.address)}
                  className="p-2 text-white bg-transparent border-2 border-white hover:bg-white hover:text-celo-purple transition-all duration-200 rounded-lg ml-3"
                >
                  <Copy className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </motion.div>

        {/* Token Balances */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white border-4 border-black p-6 rounded-2xl shadow-[6px_6px_0_0_rgba(0,0,0,1)]"
        >
          <h2 className="text-h5 font-gt-alpina font-bold text-black mb-5 tracking-wide">
            TOKEN BALANCES
          </h2>

          <div className="grid grid-cols-2 gap-5">
            {/* cUSD Card */}
            <div className="bg-celo-yellow border-2 border-black p-5 text-black rounded-xl hover:scale-[1.02] transition-transform duration-200">
              <div className="flex items-center space-x-2 mb-3">
                <div className="relative w-10 h-10">
                  <Image
                    src="/static/cusdLogo.jpg"
                    alt="CUSD"
                    width={50}
                    height={50}
                    className="object-cover border-2 border-white bg-white rounded-full"
                  />
                  <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full">
                    <CeloLogo />
                  </div>
                </div>
                <p className="text-body-s font-inter font-heavy">
                  CUSD BALANCE
                </p>
              </div>
              <p className="text-h4 font-gt-alpina font-thin">
                {isLoading ? "..." : cUSDBalance || "0.000"}
              </p>
            </div>

            {/* USDC Card */}
            <div className="bg-celo-purple border-2 border-black p-4 text-white rounded-xl hover:scale-[1.02] transition-transform duration-200">
              <div className="flex items-center space-x-2 mb-3">
                <div className="relative w-8 h-8">
                  <Image
                    src="/static/usdclogo.png"
                    alt="USDC"
                    width={50}
                    height={50}
                    className="object-cover border-2 border-white bg-white rounded-full"
                  />
                  <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full">
                    <CeloLogo />
                  </div>
                </div>
                <p className="text-body-s font-inter font-heavy">
                  USDC BALANCE
                </p>
              </div>
              <p className="text-h4 font-gt-alpina font-thin">
                {isLoading ? "..." : usdcBalance || "0.000"}
              </p>
            </div>
          </div>

          {/* Send Button */}
          <div className="flex justify-center mt-8">
            <button
              onClick={() => setShowTransferModal(true)}
              className="bg-celo-forest text-white border-4 border-black font-inter font-heavy py-3 px-10 hover:bg-black hover:text-celo-forest transition-all duration-200 flex items-center space-x-2 rounded-xl"
            >
              <ArrowUpRight className="w-4 h-4" />
              <span>SEND TOKENS</span>
            </button>
          </div>
        </motion.div>

        {/* Swap Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white border-4 border-black p-6 rounded-2xl shadow-[6px_6px_0_0_rgba(0,0,0,1)]"
        >
          <h3 className="text-h5 font-gt-alpina font-bold text-black mb-5 tracking-wide">
            SWAP TOKENS
          </h3>

          <div className="space-y-6 relative z-0">
            {/* From */}
            <div>
              <label className="text-body-s text-celo-body mb-2 block font-inter font-heavy">
                FROM
              </label>
              <div className="bg-celo-lk-tan border-4 border-black p-4 rounded-xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Image
                      src={
                        currencyFrom === "cUSD"
                          ? "/static/cusdLogo.jpg"
                          : currencyFrom === "USDC"
                          ? "/static/usdclogo.png"
                          : "/static/celoLogo.png"
                      }
                      alt={currencyFrom || "Token"}
                      width={28}
                      height={28}
                      className=" rounded-full"
                    />
                    <select
                      value={currencyFrom || ""}
                      onChange={(e) => {
                        setAmountFrom("");
                        setAmountTo("");
                        setCurrencyFrom(
                          e.target.value as "cUSD" | "USDC" | "CELO"
                        );
                      }}
                      className="bg-white border-2 border-black text-body-s font-inter font-heavy text-black px-3 py-1 rounded-md focus:outline-none focus:border-black"
                    >
                      <option value="">SELECT</option>
                      <option value="cUSD">CUSD</option>
                      <option value="USDC">USDC</option>
                      <option value="CELO">CELO</option>
                    </select>
                  </div>
                  <input
                    type="number"
                    placeholder="0.0"
                    value={amountFrom}
                    onChange={async (e) => {
                      const value = e.target.value;
                      setAmountFrom(value);
                      if (Number(value) > 0 && currencyFrom) {
                        await getQuoteWithAmount(
                          value,
                          currencyFrom === "cUSD",
                          currencyFrom === "CELO"
                        );
                      }
                    }}
                    className="bg-transparent text-right text-body-l font-inter font-heavy text-black placeholder-celo-body outline-none w-1/2"
                  />
                </div>
                <div className="text-right text-body-s text-celo-body font-inter mt-2">
                  Balance: {currencyFrom === "cUSD" ? (cUSDBalance || "0.000") : currencyFrom === "USDC" ? (usdcBalance || "0.000") : (celoBalance || "0.000")}
                </div>
              </div>
            </div>

            {/* Swap Arrow */}
            <div className="absolute left-1/2 top-[32%] -translate-x-1/2 -translate-y-1/2 z-10">
              <button
                onClick={async () => {
                  if (!currencyFrom) return;
                  const newCurrencyFrom =
                    currencyFrom === "cUSD"
                      ? "USDC"
                      : currencyFrom === "USDC"
                      ? "CELO"
                      : "cUSD";
                  setCurrencyFrom(newCurrencyFrom);
                  if (amountFrom) {
                    await getQuoteWithAmount(
                      amountFrom,
                      newCurrencyFrom === "cUSD",
                      newCurrencyFrom === "CELO"
                    );
                  }
                }}
                className="bg-celo-yellow border-4 border-black p-2 rounded-lg hover:bg-black hover:text-celo-yellow transition-all duration-200"
              >
                <ArrowUpDown className="w-5 h-5 text-black" />
              </button>
            </div>

            {/* To */}
            <div>
              <label className="text-body-s text-celo-body mb-2 block font-inter font-heavy">
                TO
              </label>
              <div className="bg-celo-dk-tan border-4 border-black p-4 rounded-xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Image
                      src={
                        currencyFrom === "cUSD"
                          ? "/static/usdclogo.png"
                          : currencyFrom === "USDC"
                          ? "/static/cusdLogo.jpg"
                          : "/static/cusdLogo.jpg"
                      }
                      alt="toToken"
                      width={28}
                      height={28}
                      className="rounded-full"
                    />
                    <span className="font-inter font-heavy text-celo-body">
                      {currencyFrom === "cUSD"
                        ? "USDC"
                        : currencyFrom === "USDC"
                        ? "cUSD"
                        : "cUSD"}
                    </span>
                  </div>
                  {isFetchingQuote ? (
                    <div className="flex items-center justify-end w-1/2">
                      <div className="w-5 h-5 border-4 border-black border-t-transparent animate-spin"></div>
                    </div>
                  ) : (
                    <input
                      type="text"
                      placeholder="0.0"
                      value={amountTo}
                      readOnly
                      className="bg-transparent text-right text-body-l font-inter font-heavy text-celo-body outline-none w-1/2"
                    />
                  )}
                </div>
                <div className="text-right text-body-s text-celo-body font-inter mt-2">
                  Balance: {currencyFrom === "cUSD" ? (usdcBalance || "0.000") : currencyFrom === "USDC" ? (cUSDBalance || "0.000") : (cUSDBalance || "0.000")}
                </div>
              </div>
            </div>

            {/* Exchange Rate */}
            <div className="text-center pt-2">
              {isFetchingQuote ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-3 h-3 border-4 border-black border-t-transparent animate-spin"></div>
                  <p className="text-body-s text-celo-body font-inter">
                    FETCHING RATE...
                  </p>
                </div>
              ) : (
                <p className="text-body-s text-celo-body font-inter">
                  {exchangeRate}
                </p>
              )}
            </div>

            {/* Swap Button */}
            <button
              onClick={(e) =>
                handleSwap(currencyFrom === "cUSD", currencyFrom === "CELO", e)
              }
              disabled={
                !isConnected ||
                isNaN(Number(amountFrom)) ||
                Number(amountFrom) <= 0 ||
                !amountFrom ||
                !currencyFrom ||
                isSwapping ||
                isFetchingQuote ||
                isApproving
              }
              className={cn(
                "w-full bg-celo-yellow text-black border-4 border-black font-inter font-heavy py-4 rounded-xl transition-all duration-200",
                (isNaN(Number(amountFrom)) ||
                  Number(amountFrom) <= 0 ||
                  !amountFrom ||
                  !currencyFrom ||
                  isFetchingQuote) &&
                  "opacity-50 cursor-not-allowed",
                (isApproving || isSwapping) && "opacity-70 cursor-not-allowed"
              )}
            >
              {isApproving ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-4 h-4 border-4 border-black border-t-transparent animate-spin"></div>
                  <span>APPROVING TX...</span>
                </div>
              ) : isSwapping ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-4 h-4 border-4 border-black border-t-transparent animate-spin"></div>
                  <span>SWAPPING...</span>
                </div>
              ) : (
                "SWAP"
              )}
            </button>
          </div>
        </motion.div>
      </div>

      {/* Transfer Modal */}
      {showTransferModal && (
        <TransferModal
          cUSDBalance={cUSDBalance ?? "0"}
          usdcBalance={usdcBalance ?? "0"}
          onClose={() => setShowTransferModal(false)}
        />
      )}

      <BottomNavigation />
    </div>
  );
}
