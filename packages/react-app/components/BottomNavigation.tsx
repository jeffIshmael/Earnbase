'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Home, ClipboardList, Plus, Clock, Wallet, Sparkles } from 'lucide-react';
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
  {
    key: 'home',
    label: 'HOME',
    icon: Home,
    path: '/Start',
    color: 'bg-celo-yellow'
  },
  {
    key: 'mytasks',
    label: 'MY TASKS',
    icon: ClipboardList,
    path: '/myTasks',
    color: 'bg-celo-purple'
  },
  {
    key: 'create',
    label: 'CREATE',
    icon: Plus,
    path: '/CreateTask',
    color: 'bg-celo-forest'
  },
  {
    key: 'history',
    label: 'HISTORY',
    icon: Clock,
    path: '/History',
    color: 'bg-celo-orange'
  },
  {
    key: 'wallet',
    label: 'WALLET',
    icon: Wallet,
    path: '/Wallet',
    color: 'bg-celo-blue'
  }
];

export default function BottomNavigation() {
  const router = useRouter();
  const pathname = usePathname();
  const [activeTab, setActiveTab] = useState('home');
  const [isMounted, setIsMounted] = useState(false);

  // Set the active tab after component mounts to avoid premature coloring
  useEffect(() => {
    setIsMounted(true);
    const timeout = setTimeout(() => {
      const currentPath = navItems.find(item => item.path === pathname);
      setActiveTab(currentPath?.key || 'home');
    }, 100); // 100ms delay prevents premature highlight
  
    return () => clearTimeout(timeout);
  }, [pathname]);
  

  const handleNavigation = (item: NavItem) => {
    router.push(item.path);
  };
  

  return (
    <div className="fixed bottom-0 max-w-sm mx-auto left-0 right-0 z-50 pb-safe">
      {/* Navigation container */}
      <div className="relative">
        <div className="bg-white border-t-4 border-black">
          <div className="flex items-center justify-around relative">
            {navItems.map((item, index) => {
              const isActive = isMounted && activeTab === item.key;
              
              return (
                <div key={item.key} className="relative">
                  <motion.button
                    onClick={() => handleNavigation(item)}
                    className={cn(
                      'relative flex flex-col items-center px-2 py-3 transition-all duration-200 group',
                      isActive ? 'text-black' : 'text-celo-body',
                      // Special styling for create button
                      item.key === 'create' ? 'transform -translate-y-2' : ''
                    )}
                  >
                    {/* Active background */}
                    <AnimatePresence>
                      {isActive && (
                        <motion.div
                          initial={{ scale: 0, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          exit={{ scale: 0, opacity: 0 }}
                          transition={{ type: "spring", stiffness: 300, damping: 20 }}
                          className={cn(
                            'absolute inset-0 border-2 border-black',
                            item.key === 'create' ? 'bg-celo-forest' : 'bg-celo-yellow'
                          )}
                        />
                      )}
                    </AnimatePresence>

                    {/* Icon container */}
                    <div className={cn(
                      'relative z-10 transition-all duration-200',
                      // Special permanent styling for create button
                      item.key === 'create' 
                        ? 'p-3 border-2 border-black bg-celo-forest text-white' 
                        : cn(
                            'p-2',
                            isActive 
                              ? 'text-black' 
                              : 'group-hover:bg-celo-dk-tan group-hover:text-black'
                          )
                    )}>
                      <item.icon className={cn(
                        'transition-all duration-200',
                        // Special icon size for create button
                        item.key === 'create' ? 'w-6 h-6' : 'w-5 h-5',
                        isActive ? 'scale-110' : 'scale-100'
                      )} />
                    </div>

                    {/* Label */}
                    <motion.span
                      className={cn(
                        'text-eyebrow font-inter font-heavy mt-1 transition-all duration-200 relative z-10',
                        // Special label styling for create button
                        item.key === 'create'
                          ? (isActive ? 'text-celo-forest' : 'text-celo-body')
                          : (isActive ? 'text-black' : 'text-celo-body group-hover:text-black')
                      )}
                      animate={{
                        scale: isActive ? 1.05 : 1,
                        fontWeight: isActive ? 750 : 400
                      }}
                    >
                      {item.label}
                    </motion.span>

                    {/* Active indicator */}
                    {isActive && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.1, type: "spring", stiffness: 300 }}
                        className="absolute -bottom-1 w-8 h-1 bg-black"
                      />
                    )}
                  </motion.button>

                  {/* Divider between items */}
                  {index < navItems.length - 1 && (
                    <div className="absolute right-0 top-1/2 transform -translate-y-1/2 w-px h-8 bg-black" />
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