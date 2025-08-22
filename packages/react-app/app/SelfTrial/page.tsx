'use client';

import React, { useState, useEffect } from 'react';
import { getUniversalLink } from "@selfxyz/core";
import {
  SelfQRcodeWrapper,
  SelfAppBuilder,
  type SelfApp,
} from "@selfxyz/qrcode";
import { ethers } from "ethers";

function VerificationPage() {
  const [selfApp, setSelfApp] = useState<SelfApp | null>(null);
  const [universalLink, setUniversalLink] = useState("");
  const [userId] = useState(ethers.constants.AddressZero);

  useEffect(() => {
    try {
      const app = new SelfAppBuilder({
        version: 2,
        appName: process.env.NEXT_PUBLIC_SELF_APP_NAME || "Self Workshop",
        scope: process.env.NEXT_PUBLIC_SELF_SCOPE || "self-workshop",
        endpoint: `${process.env.NEXT_PUBLIC_SELF_ENDPOINT}`,
        logoBase64: "https://i.postimg.cc/mrmVf9hm/self.png",
        userId: userId,
        endpointType: "staging_https",
        userIdType: "hex",
        userDefinedData: "Bonjour Cannes!",
        disclosures: {
          /* 1. what you want to verify from users' identity */
          minimumAge: 18,
          // ofac: false,
          // excludedCountries: [countries.BELGIUM],

          /* 2. what you want users to reveal */
          // name: false,
          // issuing_state: true,
          nationality: true,
          date_of_birth: true,
          // passport_number: false,
          gender: true,
          // expiry_date: false,
        }
      }).build();

      setSelfApp(app);
      setUniversalLink(getUniversalLink(app));
    } catch (error) {
      console.error("Failed to initialize Self app:", error);
    }
  }, [userId]);

  const handleSuccessfulVerification = () => {
    console.log("Verification successful!");
    // Handle success - redirect, update UI, etc.
  };
  const openSelfApp = () => {
    if (universalLink) {
      window.open(universalLink, "_blank");
    }
  };

  return (
    <div className="verification-container">
      <h1>Verify Your Identity</h1>
      <p>Scan this QR code with the Self app</p>
      
      {selfApp ? (
        <div>
            <SelfQRcodeWrapper
              selfApp={selfApp}
              onSuccess={handleSuccessfulVerification}
              onError={() => {
                console.error("Error: Failed to verify identity");
              }}
            />
             {/* Universal Link button for mobile */}
                  <button onClick={openSelfApp}>
                  Open Self App
                </button>
        </div>
      ) : (
        <div>Loading QR Code...</div>
      )}
    </div>
  );
}

export default VerificationPage;