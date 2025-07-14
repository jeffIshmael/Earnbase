import '@/styles/globals.css';
import type { Metadata } from "next";
import { AppProvider } from '@/providers/AppProvider';
import { Toaster } from 'sonner';
import { fcEmbed } from '@/lib/FarcasterMetadata';
import { IsFarcasterProvider } from './context/isFarcasterContext';


export const metadata: Metadata = {
  title: "Earnbase",
  description: "Submit Feedback & Earn Rewards",
  other: {
    "fc:frame": JSON.stringify(fcEmbed),
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`bg-gray-800  border-gray shadow-lg shadow-stone-400 border-rounded-lg max-w-sm mx-auto  min-h-screen`}
      >
        <AppProvider>
          <IsFarcasterProvider>

          {children}
          <Toaster />

          </IsFarcasterProvider>
        </AppProvider>
      </body>
    </html>
  );
}
