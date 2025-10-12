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
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Kalam:wght@300;400;700&family=Caveat:wght@400;500;600;700&family=Licorice:wght@400&family=Instrument+Serif:ital,wght@0,400;0,500;0,600;1,400;1,500;1,600&family=Smooch+Sans:wght@100;200;300;400;500;600;700;800;900&display=swap" rel="stylesheet" />
      </head>
      <body className="bg-gray-800  border-gray shadow-lg shadow-stone-400 border-rounded-lg max-w-sm mx-auto  min-h-screen"
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
