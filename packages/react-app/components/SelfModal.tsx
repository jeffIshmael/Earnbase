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
import { X, AlertCircle, CheckCircle, Info } from "lucide-react";
import { url } from "@/contexts/constants";

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
  const [toastType, setToastType] = useState<'success' | 'error' | 'info'>('info');
  const [selfApp, setSelfApp] = useState<SelfApp | null>(null);
  const [universalLink, setUniversalLink] = useState("");
  const [restrictions, setRestrictions] = useState<Requirements>(requirements);
  const [error, setError] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState<'success' | 'error' | null>(null);
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
      if (!address || !isConnected) {
        setError("Wallet not connected");
        return;
      }

      console.log("Building Self app with restrictions:", restrictions);
      
      const app = new SelfAppBuilder({
        version: 2,
        appName: process.env.NEXT_PUBLIC_SELF_APP_NAME || "Earnbase",
        scope: process.env.NEXT_PUBLIC_SELF_SCOPE || "earnbase",
        endpoint: `${url}/api/verify`,
        logoBase64:
          "https://i.postimg.cc/mrmVf9hm/self.png", // url of a png image, base64 is accepted but not recommended
        userId: address,
        endpointType: "staging_https",
        userIdType: "hex", // use 'hex' for ethereum address or 'uuid' for uuidv4
        userDefinedData: JSON.stringify(restrictions), // Send requirements as userDefinedData
        disclosures: {

        // // what you want to verify from users' identity
          minimumAge: restrictions.age?.min || 18,
          // ofac: false,
          excludedCountries: restrictions.countries || [],

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
      setError(null);
    } catch (error) {
      console.error("Failed to initialize Self app:", error);
      setError(error instanceof Error ? error.message : "Failed to initialize verification");
    }
  }, [address, isConnected, restrictions]);

  const displayToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToastMessage(message);
    setToastType(type);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 4000);
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
    setIsVerifying(true);
    setVerificationResult('success');
    displayToast("Verification successful! Processing...", 'success');
    
    // Simulate verification processing
    setTimeout(() => {
      setIsVerifying(false);
      onClose?.();
    }, 2000);
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
          {process.env.NEXT_PUBLIC_SELF_APP_NAME || "Earnbase"}
        </h1>
        <p className="text-sm text-gray-600 mb-3">
          Scan QR code with Self Protocol App to verify
        </p>
        
        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
            <div className="flex items-center space-x-2 text-red-700">
              <AlertCircle className="w-4 h-4" />
              <span className="text-sm font-medium">Error: {error}</span>
            </div>
            <p className="text-xs text-red-600 mt-1">
              Please ensure your wallet is connected and try again.
            </p>
          </div>
        )}
        
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
          {/* Verification Status */}
          {verificationResult && (
            <div className={`mb-4 p-3 rounded-lg border ${
              verificationResult === 'success' 
                ? 'bg-green-50 border-green-200 text-green-700' 
                : 'bg-red-50 border-red-200 text-red-700'
            }`}>
              <div className="flex items-center space-x-2">
                {verificationResult === 'success' ? (
                  <CheckCircle className="w-4 h-4" />
                ) : (
                  <AlertCircle className="w-4 h-4" />
                )}
                <span className="text-sm font-medium">
                  {verificationResult === 'success' 
                    ? 'Verification successful! Processing...' 
                    : 'Verification failed. Please try again.'}
                </span>
              </div>
            </div>
          )}
          
          <div className="flex justify-center mb-4">
          {isVerifying ? (
            <div className="w-[200px] h-[200px] bg-green-50 border-2 border-green-200 rounded-lg flex flex-col items-center justify-center">
              <div className="w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full animate-spin mb-3"></div>
              <p className="text-green-700 text-sm font-medium">Verifying...</p>
              <p className="text-green-600 text-xs">Please wait</p>
            </div>
          ) : selfApp ? (
            <SelfQRcodeWrapper
              selfApp={selfApp}
              onSuccess={handleSuccessfulVerification}
              onError={(error) => {
                console.error("Verification error:", error);
                setVerificationResult('error');
                displayToast("Verification failed. Please try again.", 'error');
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
            disabled={!universalLink || isVerifying}
            className="w-full bg-gray-800 hover:bg-gray-700 transition-colors text-white p-3 rounded-lg text-sm disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {linkCopied ? "Copied!" : "Copy Universal Link"}
          </button>

          <button
            type="button"
            onClick={openSelfApp}
            disabled={!universalLink || isVerifying}
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
          <div className={`absolute bottom-4 left-1/2 transform -translate-x-1/2 py-3 px-4 rounded-lg shadow-xl text-sm z-10 transition-all duration-300 ${
            toastType === 'success' 
              ? 'bg-green-500 text-white border border-green-400' 
              : toastType === 'error'
              ? 'bg-red-500 text-white border border-red-400'
              : 'bg-blue-500 text-white border border-blue-400'
          }`}>
            <div className="flex items-center space-x-2">
              {toastType === 'success' && <CheckCircle className="w-4 h-4" />}
              {toastType === 'error' && <AlertCircle className="w-4 h-4" />}
              {toastType === 'info' && <Info className="w-4 h-4" />}
              <span className="font-medium">{toastMessage}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
