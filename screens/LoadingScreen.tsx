
import React from 'react';

const LoadingScreen: React.FC = () => {
  return (
    <div className="fixed inset-0 bg-black flex flex-col items-center justify-center z-[9999]">
      <div className="relative">
        <div className="w-24 h-24 rounded-full border-4 border-red-600/20 animate-[spin_2s_linear_infinite]"></div>
        <div className="w-24 h-24 rounded-full border-4 border-t-red-600 border-r-transparent border-b-transparent border-l-transparent absolute top-0 left-0 animate-[spin_1.5s_linear_infinite]"></div>
        <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-12 h-12 bg-red-600 rounded-full animate-pulse"></div>
        </div>
      </div>
      <h1 className="mt-8 text-3xl font-black tracking-tighter text-white animate-[pulse_2s_ease-in-out_infinite]">
        Nexa<span className="text-red-600">Chat</span>
      </h1>
      <p className="mt-2 text-neutral-500 text-xs font-bold tracking-widest uppercase">Загрузка данных...</p>
    </div>
  );
};

export default LoadingScreen;
