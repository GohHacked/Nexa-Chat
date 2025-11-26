
import React from 'react';

const MaintenanceScreen: React.FC = () => {
  return (
    <div className="fixed inset-0 bg-black flex flex-col items-center justify-center z-[9999] p-6 text-center">
      <div className="w-32 h-32 mb-8 relative">
           <div className="absolute inset-0 bg-red-600/20 blur-xl rounded-full animate-pulse"></div>
           <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-full h-full text-red-600 relative z-10">
                <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
           </svg>
      </div>
      <h1 className="text-4xl font-black text-white mb-4 tracking-tight">
        Технические работы
      </h1>
      <p className="text-neutral-400 text-lg max-w-md mb-8">
        Мы обновляем серверы NexaChat, чтобы сделать общение еще лучше. Приложение временно недоступно.
      </p>
      <div className="px-6 py-3 bg-neutral-900 border border-neutral-800 rounded-full">
          <p className="text-sm font-mono text-red-500 font-bold animate-pulse">SYSTEM_UPDATE_IN_PROGRESS</p>
      </div>
      <p className="absolute bottom-8 text-neutral-600 text-xs">
          NexaChat Team &copy; 2025
      </p>
    </div>
  );
};

export default MaintenanceScreen;
