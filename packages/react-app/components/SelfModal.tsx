"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { countries, getUniversalLink } from "@selfxyz/core";
import {
  SelfQRcodeWrapper,
  SelfAppBuilder,
  type SelfApp,
} from "@selfxyz/qrcode";
import { v4 } from "uuid";
import { ethers } from "ethers";
import { useAccount } from "wagmi";
import { X } from "lucide-react";

interface Requirements{
    age?: {
        min: number;
        max: number;
    };
    gender?: string;
    countries?: string[];
}

interface SelfModalProps {
    requirements: Requirements;
    onVerificationSuccess?: () => void;
    onClose?: () => void;
}

export default function SelfModal({requirements, onVerificationSuccess, onClose}: SelfModalProps) {
  const router = useRouter();
  const [linkCopied, setLinkCopied] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [selfApp, setSelfApp] = useState<SelfApp | null>(null);
  const [universalLink, setUniversalLink] = useState("");
  const [restrictions, setRestrictions] = useState<Requirements>(requirements);
  const {address, isConnected} = useAccount();
  // Use useMemo to cache the array to avoid creating a new array on each render
  const excludedCountries = useMemo(() => [countries.NORTH_KOREA], []);

  // Use useEffect to ensure code only executes on the client side
  useEffect(() => {
    if(requirements){
        setRestrictions(requirements);
    }
  }, [requirements]);

  useEffect(() => {
    try {
      const app = new SelfAppBuilder({
        version: 2,
        appName: process.env.NEXT_PUBLIC_SELF_APP_NAME || "Earnbase",
        scope: process.env.NEXT_PUBLIC_SELF_SCOPE || "earnbase",
        endpoint: "https://fc7ec00ae380.ngrok-free.app/api/verify",
        logoBase64:
          "https://i.postimg.cc/mrmVf9hm/self.png", // url of a png image, base64 is accepted but not recommended
        userId: address,
        endpointType: "staging_https",
        userIdType: "hex", // use 'hex' for ethereum address or 'uuid' for uuidv4
        userDefinedData: "Bonjour Cannes!",
        disclosures: {

        // // what you want to verify from users' identity
          minimumAge: restrictions.age?.min || 18,
          // ofac: false,
          excludedCountries: restrictions.countries || [],

        // //what you want users to reveal
          // name: false,
          // issuing_state: true,
          nationality: true,
          date_of_birth: restrictions.age?.min || restrictions.age?.max ? true : false,
          // passport_number: false,
          gender: restrictions.gender ? true : false,
          // expiry_date: false,
        }
      }).build();

      setSelfApp(app);
      setUniversalLink(getUniversalLink(app));
    } catch (error) {
      console.error("Failed to initialize Self app:", error);
    }
  }, [address, isConnected]);

  const displayToast = (message: string) => {
    setToastMessage(message);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const copyToClipboard = () => {
    if (!universalLink) return;

    navigator.clipboard
      .writeText(universalLink)
      .then(() => {
        setLinkCopied(true);
        displayToast("Universal link copied to clipboard!");
        setTimeout(() => setLinkCopied(false), 2000);
      })
      .catch((err) => {
        console.error("Failed to copy text: ", err);
        displayToast("Failed to copy link");
      });
  };

  const openSelfApp = () => {
    if (!universalLink) return;

    window.open(universalLink, "_blank");
    displayToast("Opening Self App...");
  };

  const handleSuccessfulVerification = () => {
    displayToast("Verification successful!");
    
    if (onVerificationSuccess) {
      onVerificationSuccess();
    } else {
      // Fallback to default behavior
      setTimeout(() => {
        router.push("/verified");
      }, 1500);
    }
  };

  return (
    <div className="w-full max-w-sm bg-white rounded-2xl shadow-2xl p-6">
      {/* Header */}
      <div className="text-center relative mb-6">
        {onClose && (
          <button
            onClick={onClose}
            className="absolute top-0 right-0 p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        )}
        <h1 className="text-xl font-bold mb-2 text-gray-800">
          {process.env.NEXT_PUBLIC_SELF_APP_NAME || "Self Protocol"}
        </h1>
        <p className="text-sm text-gray-600 mb-3">
          Scan QR code with Self Protocol App to verify
        </p>
        
        {/* Requirements Display */}
        {(restrictions.age || restrictions.gender || restrictions.countries) && (
          <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-3 mb-4">
            <div className="space-y-1 text-xs text-indigo-600">
              {restrictions.age && (
                <div className="flex items-center space-x-2">
                  <span className="font-semibold">Age:</span>
                  <span className="font-mono bg-white px-2 py-1 rounded border border-indigo-200">
                    {restrictions.age.min} - {restrictions.age.max} years
                  </span>
                </div>
              )}
              {restrictions.gender && (
                <div className="flex items-center space-x-2">
                  <span className="font-semibold">Gender:</span>
                  <span className="font-mono bg-white px-2 py-1 rounded border border-indigo-200">
                    {restrictions.gender === 'F' ? 'Female' : 'Male'}
                  </span>
                </div>
              )}
              {restrictions.countries && restrictions.countries.length > 0 && (
                <div className="flex items-center space-x-2">
                  <span className="font-semibold">Countries:</span>
                  <span className="font-mono bg-white px-2 py-1 rounded border border-indigo-200">
                    {restrictions.countries.join(', ')}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Main content */}
      <div className="w-full">
        <div className="flex justify-center mb-4">
          {selfApp ? (
            <SelfQRcodeWrapper
              selfApp={selfApp}
              onSuccess={handleSuccessfulVerification}
              onError={() => {
                displayToast("Error: Failed to verify identity");
              }}
            />
          ) : (
            <div className="w-[200px] h-[200px] bg-gray-200 animate-pulse flex items-center justify-center rounded-lg">
              <p className="text-gray-500 text-sm">Loading QR Code...</p>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-2 mb-4">
          <button
            type="button"
            onClick={copyToClipboard}
            disabled={!universalLink}
            className="w-full bg-gray-800 hover:bg-gray-700 transition-colors text-white p-3 rounded-lg text-sm disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {linkCopied ? "Copied!" : "Copy Universal Link"}
          </button>

          <button
            type="button"
            onClick={openSelfApp}
            disabled={!universalLink}
            className="w-full bg-blue-600 hover:bg-blue-500 transition-colors text-white p-3 rounded-lg text-sm disabled:bg-blue-300 disabled:cursor-not-allowed"
          >
            Open Self App
          </button>
        </div>
        <div className="text-center">
          <span className="text-gray-500 text-xs uppercase tracking-wide">Address</span>
          <div className="bg-gray-100 rounded-md px-3 py-2 w-full text-center break-all text-xs font-mono text-gray-800 border border-gray-200 mt-1">
            {address ? address : <span className="text-gray-400">Not connected</span>}
          </div>
        </div>

        {/* Toast notification */}
        {showToast && (
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white py-2 px-4 rounded shadow-lg animate-fade-in text-sm z-10">
            {toastMessage}
          </div>
        )}
      </div>
    </div>
  );
}
