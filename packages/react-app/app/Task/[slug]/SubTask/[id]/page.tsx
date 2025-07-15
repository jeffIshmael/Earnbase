'use client';

import React, { use, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { useUserSmartAccount } from '@/app/hooks/useUserSmartAccount';
import { checkIfSmartAccount, setSmartAccount } from '@/lib/Prismafnctns';
import Task1Form from '@/components/Forms/Task1';
import Task2Form from '@/components/Forms/Task2';
import Task3Form from '@/components/Forms/Task3';
import Task4Form from '@/components/Forms/Task4';
import Task5Form from '@/components/Forms/Task5';
import Task6Form from '@/components/Forms/Task6';

const Page = ({ params }: { params: Promise<{ slug: string; id: string }> }) => {
  const { slug,id } = use(params);
  const {address} = useAccount();
  const { smartAccount ,smartAccountClient } = useUserSmartAccount();


  // function to set the smartaccount on bc
const setSmartAccountToBC = async (userAddress: `0x${string}`,smartAddress: string) =>{
  try {
    // 1. Add the reward to the user
    const res = await fetch('/api/add-smartAccount', {
      method: 'POST',
      body: JSON.stringify({
        userAddress: userAddress as string,
        smartAddress: smartAddress,
      }),
    });

    const data = await res.json();
    if (!data.success) throw new Error(data.error);
    return data;
  } catch (error) {
    console.log("unable to register s.a", error);
    return null;
  }

}
  // checks if the smart account of the address is been set
  useEffect(()=>{
    const checkSetSmartAccount = async() =>{
     if(!smartAccount || !address) return;
     const isRegistered = await checkIfSmartAccount(address as string);
     if(isRegistered) return;
     // set smart account
     const hash = await setSmartAccountToBC(address, smartAccount.address);
     if(!hash) return;
     await setSmartAccount(address as string, smartAccount.address as string);
    }
    checkSetSmartAccount();
 }, [address, smartAccount])

  const renderTask = () => {
    switch (id) {
      case '1':
        return <Task1Form id={id} />;
      case '2':
        return <Task2Form id={id} />;
      case '3':
        return <Task3Form id={id} />;
      case '4':
        return <Task4Form />;
      case '5':
        return <Task5Form id={id} />;
      case '6':
        return <Task6Form />;
      default:
        return (
          <div className="p-4 text-center text-red-500 font-semibold">
            Invalid task ID. Please check your URL.
          </div>
        );
    }
  };

  return <div>{renderTask()}</div>;
};

export default Page;
