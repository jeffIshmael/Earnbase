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
    label: 'Home',
    icon: Home,
    path: '/Start',
    color: 'from-indigo-500 to-purple-600'
  },
  {
    key: 'mytasks',
    label: 'My Tasks',
    icon: ClipboardList,
    path: '/myTasks',
    color: 'from-indigo-500 to-purple-600'
  },
  {
    key: 'create',
    label: 'Create',
    icon: Plus,
    path: '/CreateTask',
    color: 'from-indigo-500 to-purple-600'
  },
  {
    key: 'history',
    label: 'History',
    icon: Clock,
    path: '/History',
    color: 'from-indigo-500 to-purple-600'
  },
  {
    key: 'wallet',
    label: 'Wallet',
    icon: Wallet,
    path: '/Wallet',
    color: 'bg-indigo-400'
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
    const currentPath = navItems.find(item => item.path === pathname);
    setActiveTab(currentPath?.key || 'home');
  }, [pathname]);

  const handleNavigation = (item: NavItem) => {
    setActiveTab(item.key);
    router.push(item.path);
  };

  return (
    <div className="fixed bottom-0 max-w-sm mx-auto left-0 right-0 z-50 pb-safe">
      {/* Background blur effect */}
      <div className="absolute  inset-0 bg-white/80 backdrop-blur-xl border-t border-white/20" />
      
      {/* Navigation container */}
      <div className="relative">
        <div className="bg-white/90 backdrop-blur-xl rounded-2xl border border-white/20 shadow-2xl shadow-black/10">
          <div className="flex items-center justify-around relative">
            {navItems.map((item, index) => {
              const isActive = isMounted && activeTab === item.key;
              
              return (
                <div key={item.key} className="relative">
                  <motion.button
                    onClick={() => handleNavigation(item)}
                    className={cn(
                      'relative flex flex-col items-center px-3 py-3 rounded-xl transition-all duration-300 group',
                      isActive ? 'text-white' : 'text-gray-500 hover:text-gray-700',
                      // Special styling for create button
                      item.key === 'create' ? 'transform -translate-y-2' : ''
                    )}
                  >
                    {/* Active background - hidden for create button since it has permanent background */}
                    <AnimatePresence>
                      {isActive && item.key !== 'create' && (
                        <motion.div
                          initial={{ scale: 0, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          exit={{ scale: 0, opacity: 0 }}
                          transition={{ type: "spring", stiffness: 300, damping: 20 }}
                          className={cn(
                            'absolute inset-0 bg-indigo-400 rounded-xl shadow-lg'
                          )}
                        />
                      )}
                    </AnimatePresence>

                    {/* Icon container */}
                    <div className={cn(
                      'relative z-10 transition-all duration-300',
                      // Special permanent styling for create button
                      item.key === 'create' 
                        ? 'p-3 rounded-full bg-indigo-400  text-white' 
                        : cn(
                            'p-2 rounded-lg',
                            isActive 
                              ? 'text-white' 
                              : 'group-hover:bg-gray-100 group-hover:text-gray-700'
                          )
                    )}>
                      <item.icon className={cn(
                        'transition-all duration-300',
                        // Special icon size for create button
                        item.key === 'create' ? 'w-6 h-6' : 'w-5 h-5',
                        isActive ? 'scale-110' : 'scale-100'
                      )} />
                      
                      {/* Sparkle effect for active items */}
                      {isActive && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: 0.1 }}
                          className="absolute -top-1 -right-1"
                        >
                        </motion.div>
                      )}
                    </div>

                    {/* Label */}
                    <motion.span
                      className={cn(
                        'text-xs font-medium mt-1 transition-all duration-300 relative z-10',
                        // Special label styling for create button
                        item.key === 'create'
                          ? (isActive ? 'text-indigo-400' : 'text-gray-500')
                          : (isActive ? 'text-white' : 'text-gray-500 group-hover:text-gray-700')
                      )}
                      animate={{
                        scale: isActive ? 1.1 : 1,
                        fontWeight: isActive ? 600 : 500
                      }}
                    >
                      {item.label}
                    </motion.span>

                    {/* Active indicator - hidden for create button */}
                    {isActive && item.key !== 'create' && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.2, type: "spring", stiffness: 300 }}
                        className="absolute -bottom-1 w-6 h-1.5 bg-white rounded-full shadow-lg"
                      />
                    )}
                  </motion.button>

                  {/* Divider between items */}
                  {index < navItems.length - 1 && (
                    <div className="absolute right-0 top-1/2 transform -translate-y-1/2 w-px h-8 bg-gradient-to-b from-transparent via-gray-200 to-transparent" />
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