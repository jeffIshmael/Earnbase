'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Home, ClipboardList, Plus, Clock, Wallet } from 'lucide-react';
import { useRouter, usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

interface NavItem {
  key: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  path: string;
  color: string;
}

const navItems: NavItem[] = [
  { key: 'home', label: 'Home', icon: Home, path: '/Start', color: 'bg-celo-yellow' },
  { key: 'history', label: 'History', icon: Clock, path: '/History', color: 'bg-celo-orange' },
  { key: 'wallet', label: 'Wallet', icon: Wallet, path: '/Wallet', color: 'bg-celo-blue' }
];

export default function BottomNavigation() {
  const router = useRouter();
  const pathname = usePathname();
  const [activeTab, setActiveTab] = useState('home');
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    const timeout = setTimeout(() => {
      const currentPath = navItems.find(item => item.path === pathname);
      setActiveTab(currentPath?.key || 'home');
    }, 100);
    return () => clearTimeout(timeout);
  }, [pathname]);

  const handleNavigation = (item: NavItem) => {
    router.push(item.path);
  };

  return (
    <div className="fixed bottom-0 max-w-sm mx-auto left-0 right-0 z-50 pb-safe">
      {/* Shadow effect */}
      <div className="absolute inset-x-0 -top-8 h-8 bg-gradient-to-t from-black/5 to-transparent pointer-events-none" />

      {/* Navigation container */}
      <div className="relative">
        <div className="bg-white border-t-4 border-black shadow-[0_-8px_0_0_rgba(0,0,0,0.15)]">
          <div className="flex items-end justify-around relative px-3 py-2">
            {navItems.map((item, index) => {
              const isActive = isMounted && activeTab === item.key;

              return (
                <div key={item.key} className="relative flex-1 flex justify-center">
                  <motion.button
                    onClick={() => handleNavigation(item)}
                    whileTap={{ scale: 0.95 }}
                    className={cn(
                      'relative flex flex-col items-center px-2 py-1 transition-all duration-300 group w-full',
                      isActive ? 'text-black' : 'text-celo-body',
                      // Special styling for create button
                      item.key === 'create' ? 'transform -translate-y-1' : ''
                    )}
                  >
                    {/* Active background with rounded corners */}
                    <AnimatePresence>
                      {isActive && item.key !== 'create' && (
                        <motion.div
                          layoutId="activeTab"
                          initial={{ scale: 0.8, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          exit={{ scale: 0.8, opacity: 0 }}
                          transition={{ type: "spring", stiffness: 400, damping: 25 }}
                          className="absolute inset-0 bg-celo-yellow border-2 border-black shadow-[3px_3px_0_0_rgba(0,0,0,1)]"
                        />
                      )}
                    </AnimatePresence>

                    {/* Icon container */}
                    <div className={cn(
                      'relative z-10 transition-all duration-300',
                      // Special permanent styling for create button
                      item.key === 'create'
                        ? 'p-4 border-3 border-black bg-celo-forest text-white shadow-[5px_5px_0_0_rgba(0,0,0,1)] hover:shadow-[3px_3px_0_0_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px]'
                        : cn(
                          'p-2',
                          isActive
                            ? 'text-black'
                            : 'group-hover:bg-celo-dk-tan/40 group-hover:text-black'
                        )
                    )}>
                      <item.icon className={cn(
                        'transition-all duration-300',
                        // Special icon size for create button
                        item.key === 'create' ? 'w-7 h-7' : 'w-5 h-5',
                        isActive && item.key !== 'create' ? 'scale-110' : 'scale-100'
                      )} />
                    </div>

                    {/* Label */}
                    <motion.span
                      className={cn(
                        'text-[10px] font-inter font-heavy mt-1 tracking-wider transition-all duration-300 relative z-10',
                        // Special label styling for create button
                        item.key === 'create'
                          ? (isActive ? 'text-celo-forest' : 'text-celo-body')
                          : (isActive ? 'text-black' : 'text-celo-body/70 group-hover:text-black')
                      )}
                      animate={{
                        scale: isActive ? 1.08 : 1,
                      }}
                    >
                      {item.label}
                    </motion.span>

                    {/* Active indicator dot */}
                    {isActive && item.key !== 'create' && (
                      <motion.div
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 0.1, type: "spring", stiffness: 500 }}
                        className="absolute -bottom-1 w-2 h-2 bg-celo-purple border border-black"
                      />
                    )}
                  </motion.button>

                  {/* Divider between items - hide near create button */}
                  {index < navItems.length - 1 && item.key !== 'create' && navItems[index + 1].key !== 'create' && (
                    <div className="absolute right-0 top-1/2 transform -translate-y-1/2 w-0.5 h-8 bg-black/20" />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
