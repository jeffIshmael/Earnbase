import '@/styles/globals.css';

import { AppProvider } from '@/providers/AppProvider';
import { Toaster } from 'sonner';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`bg-gray-800  border-gray shadow-lg shadow-stone-400 border-rounded-lg max-w-sm mx-auto  min-h-screen`}
      >
        <AppProvider>{children}
          <Toaster />
        </AppProvider>
      </body>
    </html>
  );
}
