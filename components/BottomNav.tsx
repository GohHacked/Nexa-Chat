import React from 'react';
import { AppScreen, ThemeMode } from '../types';
import { IconMessageCircle, IconSearch, IconSettings } from './Icons';

interface BottomNavProps {
  currentScreen: AppScreen;
  setScreen: (screen: AppScreen) => void;
  theme: ThemeMode;
  unreadCount?: number;
}

const BottomNav: React.FC<BottomNavProps> = ({ currentScreen, setScreen, theme, unreadCount = 0 }) => {
  if (currentScreen === AppScreen.CHAT_ROOM) return null;

  const navItems = [
    { id: AppScreen.CHATS, icon: IconMessageCircle, label: 'Чаты', badge: unreadCount },
    { id: AppScreen.SEARCH, icon: IconSearch, label: 'Поиск' },
    { id: AppScreen.SETTINGS, icon: IconSettings, label: 'Настройки' },
  ];

  // Theme Styles
  const containerClass = theme === 'dark' 
    ? 'bg-black/80 border-neutral-900' 
    : 'bg-white/90 border-gray-200 shadow-lg';
  
  const activeClass = 'text-red-600';
  const inactiveClass = theme === 'dark' ? 'text-neutral-600 hover:text-neutral-400' : 'text-gray-400 hover:text-gray-600';

  return (
    <div className={`fixed bottom-0 left-0 w-full backdrop-blur-xl border-t pb-safe z-50 transition-colors duration-300 ${containerClass}`}>
      <div className="flex justify-around items-center h-20 max-w-2xl mx-auto px-6">
        {navItems.map((item) => {
          const isActive = currentScreen === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setScreen(item.id)}
              className={`flex flex-col items-center justify-center w-full h-full transition-all duration-200 active:scale-90 relative ${
                isActive ? activeClass : inactiveClass
              }`}
            >
              <div className={`p-1.5 rounded-full mb-1 transition-all relative ${isActive && theme === 'dark' ? 'bg-red-600/10' : ''}`}>
                <item.icon className={`w-6 h-6 ${isActive ? 'stroke-[2.5px]' : 'stroke-2'}`} />
                {item.badge && item.badge > 0 ? (
                    <div className="absolute -top-1 -right-1 bg-red-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] flex items-center justify-center border-2 border-black z-10 animate-bounce">
                        {item.badge > 99 ? '99+' : item.badge}
                    </div>
                ) : null}
              </div>
              <span className="text-[10px] font-semibold tracking-wide">{item.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default BottomNav;