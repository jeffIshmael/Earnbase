"use client"
import React,{useState} from 'react'
import { sendWhatsappResponse } from '@/lib/Whatsapp'

const Page = () => {
    const [sending, setSending] = useState(false);
    const handleWhatsappSend = async() =>{
        try {
            setSending(true);
              await sendWhatsappResponse({
                 taskTitle: "Rexy fully done",
                 creatorPhoneNo: "254721567439", // Try with +254757149628 or 254757149628
                 participant: "0x232c...43",
                 response: "I fully understand the outcome.",
                 aiRating: "8",
                 Reward: "0.008",
                 TaskBalance: "0.02"
               })
        } catch (error) {
            console.log("error", error);
        }finally{
            setSending(false);
        }

    }
  return (
    <div>
        <button onClick={handleWhatsappSend}> {sending ? "sending..." : "Send WhatsApp"}</button>
    </div>
  )
}

export default Page