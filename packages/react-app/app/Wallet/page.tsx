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
  LogOut,
} from "lucide-react";
import { useAccount, useConnect, useSwitchChain, useDisconnect, useWriteContract } from "wagmi";
import { injected } from "@wagmi/connectors";
import { celo } from "wagmi/chains";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { erc20Abi, formatEther } from "viem";
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
import { wagmiConfig } from "@/providers/AppProvider";
import { cn } from "@/lib/utils";
import { cUSDAddress, USDCAddress, celoAddress } from "@/blockchain/constants";

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
  const { disconnect } = useDisconnect();
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
  const [sendingUSDT, setSendingUSDT] = useState(false);
  const { writeContractAsync } = useWriteContract();
  // 0x48065fbbe25f71c9282ddf5e1cd6d6a887483d5e
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
      setCUSDBalance((Number(cUSDBalance) / 10 ** 6).toFixed(3));
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

  const sendUSDT = async () => {
    try {
      setSendingUSDT(true);
      if (!isConnected) return;

      const hash = await writeContractAsync({
        abi: erc20Abi,
        address: "0x48065fbbe25f71c9282ddf5e1cd6d6a887483d5e",
        functionName: "transfer",
        args: ["0x4821ced48Fb4456055c86E42587f61c1F39c6315", BigInt(19000000)],
      });
      console.log(hash);

      toast.success("USDT sent successfully");

    } catch (error) {
      console.error("Error sending USDT:", error);
    } finally {
      setSendingUSDT(false);
    }
  }

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
      const rate = `1 ${fromcUSD ? "cUSD" : isCelo ? "cUSD" : "USDC"} = ${quote?.rate
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

      const transactionReceipt = await waitForTransactionReceipt(wagmiConfig, {
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
      <div className="min-h-screen bg-[#FFF9F3] flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white border-2 border-black p-8 max-w-md w-full text-center shadow-[4px_4px_0_0_rgba(0,0,0,1)] rounded-3xl"
        >
          <div className="w-20 h-20 bg-celo-yellow/20 rounded-full flex items-center justify-center mx-auto mb-6 border-2 border-black">
            <Wallet className="w-10 h-10 text-black" />
          </div>
          <h1 className="text-3xl font-gt-alpina font-bold text-black mb-4 uppercase">SECURE VAULT</h1>
          <p className="text-lg text-celo-body font-inter mb-8">
            Please connect your wallet to access your earnings and manage your assets.
          </p>
          <button
            onClick={handleConnect}
            className="w-full bg-celo-purple text-white px-8 py-5 border-2 border-black font-inter font-heavy rounded-2xl shadow-[4px_4px_0_0_rgba(0,0,0,1)] hover:-translate-y-1 transition-all active:scale-95 shadow-none"
          >
            CONNECT WALLET
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FFF9F3] pb-28 relative overflow-hidden">
      {/* Decorative SVG elements */}
      <div className="fixed inset-0 pointer-events-none opacity-20">
        <svg className="absolute top-40 left-10 w-48 h-48 text-celo-purple" viewBox="0 0 100 100">
          <path d="M10,50 Q25,25 50,50 T90,50" fill="none" stroke="currentColor" strokeWidth="0.5" />
        </svg>
      </div>

      <div className="p-6 space-y-8 relative">
        {/* Header with Title */}
        <div className="flex items-center justify-between pointer-events-none">
          <div>
            <h1 className="text-3xl font-gt-alpina font-heavy text-black uppercase tracking-tight">WALLET</h1>
            <p className="text-xs font-inter font-heavy text-black/50 uppercase tracking-widest leading-none mt-1">Manage Assets</p>
          </div>
          <div className="w-12 h-12 bg-white border-2 border-black rounded-2xl flex items-center justify-center shadow-[3px_3px_0_0_rgba(0,0,0,1)] rotate-6">
            <RefreshCw className={`w-6 h-6 text-black ${isLoading ? 'animate-spin' : ''}`} onClick={fetchBalances} />
          </div>
          <button
            onClick={() => disconnect()}
            className="w-12 h-12 bg-red-100 border-2 border-black rounded-2xl flex items-center justify-center shadow-[3px_3px_0_0_rgba(0,0,0,1)] -rotate-3 hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all active:scale-90 hover:cursor-pointer"
            title="Disconnect Wallet"
          >
            <LogOut className="w-6 h-6 text-red-600" />
          </button>
        </div>

        {/* Unified Wallet Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-black border-2 border-black rounded-[40px] overflow-hidden shadow-[8px_8px_0_0_rgba(0,0,0,1)]"
        >
          {/* Main Balance Area */}
          <div className="bg-celo-purple p-10 text-white relative">
            {/* <div className="absolute top-6 right-6 opacity-20 bg-white/10 rounded-full p-4 border border-white/20 backdrop-blur-sm">
              <Image src="/static/usdclogo.png" alt="USDC" width={80} height={80} className="rotate-12" />
            </div> */}

            <p className="text-sm font-inter font-heavy uppercase tracking-[0.2em] mb-4 opacity-80">
              BALANCE
            </p>
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-baseline space-x-3">
                <h2 className="text-6xl font-gt-alpina font-normal tracking-tighter">
                  {isLoading ? "..." : usdcBalance || "0.000"}
                </h2>
                <span className="text-2xl font-gt-alpina font-heavy opacity-70">USDC</span>
              </div>
            </div>

            <div className="flex items-center justify-between bg-black/20 p-4 rounded-2xl border border-white/10 hover:bg-black/30 transition-all group cursor-pointer" onClick={() => copyToClipboard(address!)}>
              <p className="font-mono text-xs truncate tracking-tighter opacity-90 max-w-[85%]">
                {address}
              </p>
              <div className="p-2 bg-white/10 rounded-xl group-hover:scale-110 transition-transform">
                <Copy className="w-4 h-4" />
              </div>
            </div>
          </div>

          {/* Actions Area */}
          <div className="bg-white p-6 flex gap-4 border-t-4 border-black relative">
            <button
              onClick={() => setShowTransferModal(true)}
              className="flex-1 bg-celo-yellow text-black border-2 border-black font-inter font-heavy py-5 rounded-2xl hover:bg-black hover:text-celo-yellow transition-all flex items-center justify-center space-x-3 shadow-[4px_4px_0_0_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none active:scale-[0.98]"
            >
              <ArrowUpRight className="w-6 h-6" />
              <span className="text-lg uppercase">SEND ASSETS</span>
            </button>
            <button
              onClick={() => openCeloScan(address!)}
              className="bg-celo-lt-tan text-black border-2 border-black p-5 rounded-2xl hover:bg-white transition-all flex items-center justify-center shadow-[4px_4px_0_0_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none"
            >
              <ExternalLink className="w-6 h-6" />
            </button>
          </div>
        </motion.div>

        <button
          onClick={() => sendUSDT()}
          className="w-full bg-celo-yellow border-2 border-black rounded-2xl flex items-center justify-center shadow-[3px_3px_0_0_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all active:scale-90 hover:cursor-pointer"
          title="sending USDT"
        >
          <ArrowUpRight className="w-6 h-6 text-black" />
          <span className="text-lg uppercase">{sendingUSDT ? "Sending..." : `Send USDT ${cUSDBalance} USDT`}</span>
        </button>

      </div>

      <TransferModal
        isOpen={showTransferModal}
        onClose={() => setShowTransferModal(false)}
        address={address ?? undefined}
        usdcBalance={usdcBalance ?? "0"}
      />

      <BottomNavigation />
    </div>
  );
}
