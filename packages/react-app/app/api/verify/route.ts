import { NextRequest, NextResponse } from "next/server";
import { countries, Country3LetterCode, SelfAppDisclosureConfig } from "@selfxyz/common";
import {
  countryCodes,
  SelfBackendVerifier,
  AllIds,
  DefaultConfigStore,
  VerificationConfig
} from "@selfxyz/core";

export async function POST(req: NextRequest) {
  console.log("Received request");
  console.log("req", req);
  try {
    const { attestationId, proof, publicSignals, userContextData } = await req.json();

    if (!proof || !publicSignals || !attestationId || !userContextData) {
      return NextResponse.json({
        message:
          "Proof, publicSignals, attestationId and userContextData are required",
      }, { status: 400 });
    }

    const disclosures_config: VerificationConfig = {
      excludedCountries: [],
      ofac: false,
      minimumAge: 18,
    };
    const configStore = new DefaultConfigStore(disclosures_config);

    const selfBackendVerifier = new SelfBackendVerifier(
      "earnbase",
      "https://fc7ec00ae380.ngrok-free.app/api/verify",
      true,
      AllIds,
      configStore,
      "hex",
    );

    const result = await selfBackendVerifier.verify(
      attestationId,
      proof,
      publicSignals,
      userContextData
    );
    console.log(result);
    if (!result.isValidDetails.isValid) {
      return NextResponse.json({
        status: "error",
        result: false,
        message: "Verification failed",
        details: result.isValidDetails,
      }, { status: 500 });
    }

    const saveOptions = (await configStore.getConfig(
      result.userData.userIdentifier
    )) as unknown as SelfAppDisclosureConfig;

    if (result.isValidDetails.isValid) {
      // Add age and gender validation
      const userAge = result.discloseOutput.minimumAge;
      const userGender = result.discloseOutput.gender;
      const userDateOfBirth = result.discloseOutput.dateOfBirth;
      
      // Calculate actual age from date of birth
      const birthYear = parseInt(userDateOfBirth.substring(0, 2));
      const birthMonth = parseInt(userDateOfBirth.substring(2, 4));
      const birthDay = parseInt(userDateOfBirth.substring(4, 6));
      
      // Convert YY to YYYY (assuming 19xx for birth years)
      const fullBirthYear = 1900 + birthYear;
      const birthDate = new Date(fullBirthYear, birthMonth - 1, birthDay);
      const today = new Date();
      let actualAge = today.getFullYear() - birthDate.getFullYear();
      
      // Check if month/day has passed this year
      const monthDiff = today.getMonth() - birthDate.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        actualAge--;
      }
      
      // Validate gender is female and age is between 75-80
      // if (userGender !== 'F') {
      //   return NextResponse.json(
      //      "Only female users are allowed.",
      //    { status: 403 });
      // }
      
      if (actualAge < 75 || actualAge > 80) {
        return NextResponse.json("You are not between 75-80 years old",
        { status: 403 });
      }

      return NextResponse.json({
        status: "success",
        result: result.isValidDetails.isValid,
        credentialSubject: result.discloseOutput,
        verificationOptions: {
          minimumAge: saveOptions.minimumAge,
          ofac: saveOptions.ofac,
          excludedCountries: saveOptions.excludedCountries?.map(
            (countryName) => {
              const entry = Object.entries(countryCodes).find(
                ([_, name]) => name === countryName
              );
              return entry ? entry[0] : countryName;
            }
          ),
        },
      });
    } else {
      return NextResponse.json({
        status: "error",
        result: result.isValidDetails.isValid,
        message: "Verification failed",
        details: result,
      });
    }
  } catch (error) {
    console.error("Error verifying proof:", error);
    return NextResponse.json({
      status: "error",
      result: false,
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
}