import React from 'react';
import { Home, CreditCard, History, UserCircle, Settings, Edit } from 'lucide-react';

export type NavTab = 'home' | 'cards' | 'history' | 'profile' | 'modify' | 'admin';

interface BottomNavProps {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  userRole?: 'customer' | 'staff' | 'admin';
}

export function BottomNav({ activeTab, onTabChange, userRole = 'customer' }: BottomNavProps) {
  // Customer: Home, Buy Cards, History, Profile (4 icons)
  // Staff: Home, History (2 icons)
  // Admin: Home, Modify, History, Admin (4 icons)
  
  const getTabsForRole = () => {
    if (userRole === 'customer') {
      return [
        { id: 'home' as NavTab, icon: Home, label: 'Home' },
        { id: 'cards' as NavTab, icon: CreditCard, label: 'Buy Cards' },
        { id: 'history' as NavTab, icon: History, label: 'History' },
        { id: 'profile' as NavTab, icon: UserCircle, label: 'Profile' }
      ];
    } else if (userRole === 'staff') {
      return [
        { id: 'home' as NavTab, icon: Home, label: 'Home' },
        { id: 'history' as NavTab, icon: History, label: 'History' }
      ];
    } else {
      // admin
      return [
        { id: 'home' as NavTab, icon: Home, label: 'Home' },
        { id: 'modify' as NavTab, icon: Edit, label: 'Modify' },
        { id: 'history' as NavTab, icon: History, label: 'History' },
        { id: 'admin' as NavTab, icon: Settings, label: 'Admin' }
      ];
    }
  };

  const tabs = getTabsForRole();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-brand-black border-t border-gray-700 safe-area-bottom z-50">
      <div className="max-w-md mx-auto px-2">
        <div className="flex items-center justify-around h-16">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`flex flex-col items-center justify-center gap-1 px-4 py-2 rounded-lg transition-colors duration-200 min-w-16 touch-target ${
                  isActive ? 'text-brand-yellow' : 'text-gray-400 hover:text-brand-white'
                }`}
              >
                <Icon size={24} className={isActive ? 'stroke-2' : ''} />
                <span className="text-xs font-medium">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
