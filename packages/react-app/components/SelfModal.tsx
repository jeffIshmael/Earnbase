"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { countries, getUniversalLink } from "@selfxyz/core";
import {
  SelfQRcodeWrapper,
  SelfAppBuilder,
  type SelfApp,
} from "@selfxyz/qrcode";
import { useAccount } from "wagmi";
import { X, AlertCircle, CheckCircle, Info } from "lucide-react";
import { url } from "@/contexts/constants";

interface Requirements {
  age?: { min: number; max: number };
  gender?: string;
  countries?: string[];
}

interface SelfModalProps {
  requirements: Requirements;
  onVerificationSuccess?: () => void;
  onClose?: () => void;
}

export default function SelfModal({
  requirements,
  onVerificationSuccess,
  onClose,
}: SelfModalProps) {
  const router = useRouter();
  const { address, isConnected } = useAccount();
  const [selfApp, setSelfApp] = useState<SelfApp | null>(null);
  const [universalLink, setUniversalLink] = useState("");
  const [restrictions, setRestrictions] = useState<Requirements>(requirements);
  const [error, setError] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState<
    "success" | "error" | null
  >(null);
  const [linkCopied, setLinkCopied] = useState(false);
  const [toast, setToast] = useState<{
    show: boolean;
    message: string;
    type: "success" | "error" | "info";
  }>({ show: false, message: "", type: "info" });

  const excludedCountries = useMemo(() => [countries.NORTH_KOREA], []);

  useEffect(() => {
    setRestrictions(requirements);
  }, [requirements]);

  useEffect(() => {
    if (!address || !isConnected) {
      setError("Wallet not connected");
      return;
    }

    try {
      const app = new SelfAppBuilder({
        version: 2,
        appName: process.env.NEXT_PUBLIC_SELF_APP_NAME || "Earnbase",
        scope: process.env.NEXT_PUBLIC_SELF_SCOPE || "earnbase",
        endpoint: `${url}/api/verify`,
        logoBase64: "https://i.postimg.cc/mrmVf9hm/self.png",
        userId: address,
        endpointType: "staging_https",
        userIdType: "hex",
        userDefinedData: JSON.stringify(restrictions),
        disclosures: {
          minimumAge: restrictions.age?.min || 18,
          excludedCountries: restrictions.countries || [],
          nationality: true,
          date_of_birth:
            restrictions.age?.min || restrictions.age?.max ? true : false,
          gender: restrictions.gender ? true : false,
        },
      }).build();

      setSelfApp(app);
      setUniversalLink(getUniversalLink(app));
      setError(null);
    } catch (error) {
      console.error(error);
      setError("Failed to initialize verification");
    }
  }, [address, isConnected, restrictions]);

  const showToast = (
    message: string,
    type: "success" | "error" | "info" = "info"
  ) => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast((prev) => ({ ...prev, show: false })), 4000);
  };

  const copyLink = async () => {
    if (!universalLink) return;
    try {
      await navigator.clipboard.writeText(universalLink);
      setLinkCopied(true);
      showToast("Universal link copied!", "success");
      setTimeout(() => setLinkCopied(false), 2000);
    } catch {
      showToast("Failed to copy link", "error");
    }
  };

  const openSelfApp = () => {
    if (!universalLink) return;
    window.open(universalLink, "_blank");
    showToast("Opening Self App...", "info");
  };

  const handleVerificationSuccess = () => {
    setIsVerifying(true);
    setVerificationResult("success");
    showToast("Verification successful!", "success");
    setTimeout(() => {
      setIsVerifying(false);
      onClose?.();
      onVerificationSuccess?.();
    }, 2000);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-6">
      <div className="relative w-full max-w-sm bg-white border-4 border-black shadow-[8px_8px_0_0_rgba(0,0,0,1)] rounded-2xl p-6 space-y-6">
        {/* Header */}
        <div className="text-center relative">
          {onClose && (
            <button
              onClick={onClose}
              className="absolute top-0 right-0 p-2 border-2 border-black rounded-md hover:bg-black hover:text-yellow-400 transition"
            >
              <X className="w-5 h-5" />
            </button>
          )}
          <h1 className="text-2xl font-gt-alpina font-bold text-black mb-1">
            {process.env.NEXT_PUBLIC_SELF_APP_NAME || "EARNBASE"}
          </h1>
          <p className="text-sm text-gray-700 font-inter font-semibold">
            Scan QR with Self Protocol App to verify
          </p>
        </div>

        {/* Error message */}
        {error && (
          <div className="bg-red-500 border-4 border-black text-white p-3 text-sm flex items-start space-x-3 shadow-[4px_4px_0_0_rgba(0,0,0,1)]">
            <AlertCircle className="w-5 h-5 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Restrictions */}
        {(restrictions.age ||
          restrictions.gender ||
          restrictions.countries) && (
          <div className="bg-blue-200 border-4 border-black p-4 shadow-[4px_4px_0_0_rgba(0,0,0,1)] rounded-lg">
            <div className="space-y-2 text-sm font-inter text-black">
              {restrictions.age && (
                <p>
                  <span className="font-bold">Age:</span> {restrictions.age.min}
                  -{restrictions.age.max} years
                </p>
              )}
              {restrictions.gender && (
                <p>
                  <span className="font-bold">Gender:</span>{" "}
                  {restrictions.gender === "F" ? "Female" : "Male"}
                </p>
              )}
              {restrictions.countries?.length ? (
                <p>
                  <span className="font-bold">Countries:</span>{" "}
                  {restrictions.countries.join(", ")}
                </p>
              ) : null}
            </div>
          </div>
        )}

        {/* QR Section */}
        <div className="flex justify-center">
          {isVerifying ? (
            <div className="w-[200px] h-[200px] bg-green-600 border-4 border-black flex flex-col items-center justify-center shadow-[4px_4px_0_0_rgba(0,0,0,1)] text-white">
              <div className="w-10 h-10 border-4 border-white border-t-transparent rounded-full animate-spin mb-3" />
              <p className="font-bold text-sm">Verifying...</p>
            </div>
          ) : selfApp ? (
            <div>
              <SelfQRcodeWrapper
                selfApp={selfApp}
                onSuccess={handleVerificationSuccess}
                onError={(err) => {
                  console.error(err);
                  setVerificationResult("error");
                  showToast("Verification failed. Try again.", "error");
                }}
              />
            </div>
          ) : (
            <div className="w-[200px] h-[200px] bg-gray-200 border-4 border-black animate-pulse flex items-center justify-center text-sm font-inter">
              Loading QR...
            </div>
          )}
        </div>

        {/* Buttons */}
        <div className="space-y-3">
          <button
            onClick={copyLink}
            disabled={!universalLink || isVerifying}
            className="w-full bg-celo-forest text-white border-2 border-black py-3 font-inter font-bold shadow-[4px_4px_0_0_rgba(0,0,0,1)] rounded-md hover:bg-celo-purple hover:text-celo-yellow transition"
          >
            {linkCopied ? "Copied!" : "Copy Universal Link"}
          </button>

          <button
            onClick={openSelfApp}
            disabled={!universalLink || isVerifying}
            className="w-full bg-celo-yellow text-black border-2 border-black py-3 font-inter font-bold shadow-[4px_4px_0_0_rgba(0,0,0,1)] rounded-md hover:bg-celo-purple hover:text-celo-yellow transition"
          >
            Open Self App
          </button>
        </div>

        {/* Address */}
        <div className="text-center">
          <p className="uppercase text-xs font-bold text-gray-600">Address</p>
          <div className="bg-gray-100 border-4 border-black p-3 text-xs mt-2 break-all font-mono shadow-[4px_4px_0_0_rgba(0,0,0,1)] rounded-md">
            {address || "Not connected"}
          </div>
        </div>

        {/* Toast */}
        {toast.show && (
          <div
            className={`absolute bottom-6 left-1/2 -translate-x-1/2 px-5 py-3 border-4 border-black text-sm font-inter font-bold shadow-[4px_4px_0_0_rgba(0,0,0,1)] rounded-lg ${
              toast.type === "success"
                ? "bg-green-600 text-white"
                : toast.type === "error"
                ? "bg-red-500 text-white"
                : "bg-blue-300 text-black"
            }`}
          >
            <div className="flex items-center space-x-2">
              {toast.type === "success" && <CheckCircle className="w-4 h-4" />}
              {toast.type === "error" && <AlertCircle className="w-4 h-4" />}
              {toast.type === "info" && <Info className="w-4 h-4" />}
              <span>{toast.message}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
