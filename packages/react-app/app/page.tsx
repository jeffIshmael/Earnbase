"use client";

import { motion } from "framer-motion";
import { ArrowRight, Bot, User } from "lucide-react";
import { useEffect, useState, useRef } from "react";
import { sdk } from "@farcaster/miniapp-sdk";
import { useRouter } from "next/navigation";
import Image from "next/image";

const HAS_SEEN_WELCOME_KEY = "earnbase_has_seen_welcome";

export default function LandingPage() {
  const [isInterfaceReady, setIsInterfaceReady] = useState(false);
  const [step, setStep] = useState(0);
  const [botThinking, setBotThinking] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const [isFarcaster, setIsFarcaster] = useState<boolean | null>(null);
  const router = useRouter();
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  // Constants
  const BOT_THINKING_DELAY = 2000;
  const BOT_REPLY_DELAY = 1000;

  const chatMessages = [
    { from: "user", text: "What’s EarnBase? 🤔" },
    {
      from: "bot",
      text: "I’m the EarnBase Agent 🤖. I source high-value tasks from other AI agents who need human feedback to evolve.",
    },
    { from: "user", text: "That’s unique! What’s my role? 🤩" },
    {
      from: "bot",
      text: "You provide the human insights these agents need and get rewarded instantly in USDC 💬💰.",
    },

    { from: "user", text: "Perfect, I’m in! 💯" },
  ];



  // Detect Farcaster context early
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const context = await sdk.context;
        if (!cancelled && context?.user) {
          setIsFarcaster(true);
        } else if (!cancelled) {
          setIsFarcaster(false);
        }
      } catch {
        if (!cancelled) setIsFarcaster(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // First-time logic with Farcaster-safe flow
  useEffect(() => {
    if (isFarcaster === null) return; // wait until we know

    const proceed = async () => {
      // Always initialize frame in Farcaster BEFORE any navigation
      if (isFarcaster) {
        try {
          await sdk.actions.ready();
          await sdk.actions.addFrame();
        } catch (err) {
          // Non-farcaster or error – continue
        }
      }

      if (typeof window !== "undefined") {
        const hasSeenWelcome = localStorage.getItem(HAS_SEEN_WELCOME_KEY);
        if (hasSeenWelcome === "true") {
          router.replace("/Start");
          return;
        }
        setIsChecking(false);
        setIsInterfaceReady(true);
      }
    };

    proceed();
  }, [isFarcaster, router]);

  // Initialize Farcaster
  useEffect(() => {
    if (!isChecking) {
      setIsInterfaceReady(true);
    }
  }, [isChecking]);

  useEffect(() => {
    const init = async () => {
      if (isInterfaceReady && !isFarcaster) {
        // Only try to init frame for browsers if desired; safe noop otherwise
        try {
          await sdk.actions.ready();
          await sdk.actions.addFrame();
        } catch {
          // ignore outside Farcaster
        }
      }
    };
    init();
  }, [isInterfaceReady, isFarcaster]);

  // Chat sequence
  useEffect(() => {
    // ✅ Stop logic completely once all messages are shown
    if (step >= chatMessages.length - 1) return;

    const currentMsg = chatMessages[step];

    if (currentMsg.from === "user") {
      // Only start thinking if there’s a next message (bot)
      const hasNextMessage =
        step + 1 < chatMessages.length && chatMessages[step + 1].from === "bot";

      if (hasNextMessage) {
        const thinkTimer = setTimeout(() => {
          setBotThinking(true);

          const replyTimer = setTimeout(() => {
            setBotThinking(false);
            setStep((prev) => prev + 1);
          }, BOT_REPLY_DELAY);

          return () => clearTimeout(replyTimer);
        }, BOT_THINKING_DELAY);

        return () => clearTimeout(thinkTimer);
      }
    } else {
      // Bot message delay before next user message
      const botTimer = setTimeout(() => {
        setStep((prev) => prev + 1);
      }, 2000);
      return () => clearTimeout(botTimer);
    }
  }, [step]);

  // Auto-scroll
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [step, botThinking]);

  // Don't render anything while checking localStorage (to avoid flash)
  if (isChecking) {
    return null;
  }

  return (
    <div className="min-h-screen bg-celo-lt-tan flex flex-col items-center justify-center relative overflow-hidden">
      {/* Background Blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-celo-yellow/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-celo-purple/20 rounded-full blur-3xl animate-pulse"></div>
      </div>

      {/* Mobile Device Mockup */}
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.6 }}
        className="relative bg-white border-[6px] border-black rounded-[2rem] w-[320px] h-[720px] shadow-[10px_10px_0_rgba(0,0,0,1)] flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="bg-celo-forest text-white text-center py-3 font-bold text-lg flex items-center justify-center gap-2">
          <Image
            src="/logo.png"
            alt="EarnBase"
            width={30}
            height={30}
            className="w-5 h-5 rounded-full"
          />
          EarnBase ChatRoom
        </div>

        {/* Chat Window */}
        <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
          {chatMessages.slice(0, step + 1).map((msg, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className={`flex ${msg.from === "user" ? "justify-end" : "justify-start"
                }`}
            >
              <div
                className={`max-w-[75%] p-3 rounded-2xl text-sm font-medium leading-snug ${msg.from === "user"
                  ? "bg-celo-yellow text-black rounded-br-none"
                  : "bg-celo-purple text-white rounded-bl-none"
                  }`}
              >
                <div className="flex items-start gap-2">
                  {msg.from === "bot" && (
                    <Bot className="w-4 h-4 mt-1 flex-shrink-0" />
                  )}
                  <span>{msg.text}</span>
                  {msg.from === "user" && (
                    <User className="w-4 h-4 mt-1 flex-shrink-0" />
                  )}
                </div>
              </div>
            </motion.div>
          ))}

          {/* Bot thinking (disabled after last message) */}
          {botThinking && step < chatMessages.length - 1 && (
            <div className="flex justify-start">
              <div className="bg-celo-purple text-white rounded-2xl rounded-bl-none p-3 px-4 max-w-[75%] text-sm font-medium flex items-center gap-1">
                <span className="animate-bounce">.</span>
                <span className="animate-bounce [animation-delay:0.15s]">
                  .
                </span>
                <span className="animate-bounce [animation-delay:0.3s]">.</span>
              </div>
            </div>
          )}

          <div ref={chatEndRef}></div>
        </div>

        {/* CTA Button */}
        {step >= chatMessages.length - 1 && !botThinking && (
          <motion.button
            onClick={() => {
              // Mark user as having seen the welcome screen
              if (typeof window !== "undefined") {
                localStorage.setItem(HAS_SEEN_WELCOME_KEY, "true");
              }
              router.push("/Start");
            }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="m-4 bg-celo-yellow border-4 border-black text-black font-bold text-base py-3 rounded-xl flex items-center justify-center gap-2 shadow-[4px_4px_0_rgba(0,0,0,1)] hover:bg-black hover:text-celo-yellow transition-all"
          >
            Start Earning Now <ArrowRight className="w-5 h-5" />
          </motion.button>
        )}
      </motion.div>
    </div>
  );
}
