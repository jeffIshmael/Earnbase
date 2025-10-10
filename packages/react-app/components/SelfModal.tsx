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
    <div className="w-full max-w-sm bg-white border-4 border-black p-6">
      {/* Header */}
      <div className="text-center relative mb-8">
        {onClose && (
          <button
            onClick={onClose}
            className="absolute top-0 right-0 p-2 hover:bg-celo-dk-tan transition-colors border-2 border-black"
          >
            <X className="w-5 h-5 text-black" />
          </button>
        )}
        <h1 className="text-h3 font-gt-alpina font-thin mb-3 text-black">
          {process.env.NEXT_PUBLIC_SELF_APP_NAME || "EARNBASE"}
        </h1>
        <p className="text-body-s text-celo-body mb-4 font-inter">
          SCAN QR CODE WITH SELF PROTOCOL APP TO VERIFY
        </p>
        
        {/* Error Display */}
        {error && (
          <div className="bg-celo-error border-4 border-black p-4 mb-6">
            <div className="flex items-center space-x-3 text-white">
              <AlertCircle className="w-5 h-5" />
              <span className="text-body-s font-inter font-heavy">ERROR: {error}</span>
            </div>
            <p className="text-body-s text-white mt-2 font-inter">
              Please ensure your wallet is connected and try again.
            </p>
          </div>
        )}
        
        {/* Requirements Display */}
        {(restrictions.age || restrictions.gender || restrictions.countries) && (
          <div className="bg-celo-blue border-4 border-black p-4 mb-6">
            <div className="space-y-2 text-body-s text-black font-inter">
              {restrictions.age && (
                <div className="flex items-center space-x-3">
                  <span className="font-heavy">AGE:</span>
                  <span className="font-inter bg-white px-3 py-1 border-2 border-black">
                    {restrictions.age.min} - {restrictions.age.max} YEARS
                  </span>
                </div>
              )}
              {restrictions.gender && (
                <div className="flex items-center space-x-3">
                  <span className="font-heavy">GENDER:</span>
                  <span className="font-inter bg-white px-3 py-1 border-2 border-black">
                    {restrictions.gender === 'F' ? 'FEMALE' : 'MALE'}
                  </span>
                </div>
              )}
              {restrictions.countries && restrictions.countries.length > 0 && (
                <div className="flex items-center space-x-3">
                  <span className="font-heavy">COUNTRIES:</span>
                  <span className="font-inter bg-white px-3 py-1 border-2 border-black">
                    {restrictions.countries.join(', ').toUpperCase()}
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
            <div className={`mb-6 p-4 border-4 ${
              verificationResult === 'success' 
                ? 'bg-celo-success border-black text-white' 
                : 'bg-celo-error border-black text-white'
            }`}>
              <div className="flex items-center space-x-3">
                {verificationResult === 'success' ? (
                  <CheckCircle className="w-5 h-5" />
                ) : (
                  <AlertCircle className="w-5 h-5" />
                )}
                <span className="text-body-s font-inter font-heavy">
                  {verificationResult === 'success' 
                    ? 'VERIFICATION SUCCESSFUL! PROCESSING...' 
                    : 'VERIFICATION FAILED. PLEASE TRY AGAIN.'}
                </span>
              </div>
            </div>
          )}
          
          <div className="flex justify-center mb-6">
          {isVerifying ? (
            <div className="w-[200px] h-[200px] bg-celo-success border-4 border-black flex flex-col items-center justify-center">
              <div className="w-12 h-12 border-4 border-white border-t-transparent animate-spin mb-4"></div>
              <p className="text-white text-body-s font-inter font-heavy">VERIFYING...</p>
              <p className="text-white text-body-s font-inter">PLEASE WAIT</p>
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
            <div className="w-[200px] h-[200px] bg-celo-dk-tan animate-pulse flex items-center justify-center border-4 border-black">
              <p className="text-black text-body-s font-inter">LOADING QR CODE...</p>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-3 mb-6">
          <button
            type="button"
            onClick={copyToClipboard}
            disabled={!universalLink || isVerifying}
            className="w-full bg-celo-purple hover:bg-black hover:text-celo-purple transition-all duration-200 text-white p-4 border-4 border-black text-body-s font-inter font-heavy disabled:bg-celo-inactive disabled:cursor-not-allowed"
          >
            {linkCopied ? "COPIED!" : "COPY UNIVERSAL LINK"}
          </button>

          <button
            type="button"
            onClick={openSelfApp}
            disabled={!universalLink || isVerifying}
            className="w-full bg-celo-yellow hover:bg-black hover:text-celo-yellow transition-all duration-200 text-black p-4 border-4 border-black text-body-s font-inter font-heavy disabled:bg-celo-inactive disabled:cursor-not-allowed"
          >
            OPEN SELF APP
          </button>
        </div>
        <div className="text-center">
          <span className="text-celo-body text-eyebrow font-inter font-heavy uppercase tracking-wide">ADDRESS</span>
          <div className="bg-celo-dk-tan border-4 border-black px-4 py-3 w-full text-center break-all text-body-s font-inter text-black mt-2">
            {address ? address : <span className="text-celo-body">NOT CONNECTED</span>}
          </div>
        </div>

        {/* Toast notification */}
        {showToast && (
          <div className={`absolute bottom-6 left-1/2 transform -translate-x-1/2 py-4 px-6 border-4 border-black text-body-s z-10 transition-all duration-300 ${
            toastType === 'success' 
              ? 'bg-celo-success text-white' 
              : toastType === 'error'
              ? 'bg-celo-error text-white'
              : 'bg-celo-blue text-black'
          }`}>
            <div className="flex items-center space-x-3">
              {toastType === 'success' && <CheckCircle className="w-5 h-5" />}
              {toastType === 'error' && <AlertCircle className="w-5 h-5" />}
              {toastType === 'info' && <Info className="w-5 h-5" />}
              <span className="font-inter font-heavy">{toastMessage.toUpperCase()}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
