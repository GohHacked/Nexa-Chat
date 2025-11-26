
import React, { useState } from 'react';
import { ChatSession, ThemeMode, User } from '../types';
import { IconPencil, IconMessageCircle, IconVerified, IconGroup, IconUserPlus, IconX, IconCheck, IconMusic, IconSend, IconUser } from '../components/Icons';

interface ChatListProps {
  chats: ChatSession[];
  onSelectChat: (chatId: string) => void;
  onNewChat: () => void;
  onCreateGroup: (name: string) => void;
  theme: ThemeMode;
  currentUser: User;
}

const ChatList: React.FC<ChatListProps> = ({ chats, onSelectChat, onNewChat, onCreateGroup, theme, currentUser }) => {
  const [showMenu, setShowMenu] = useState(false);
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [viewingUser, setViewingUser] = useState<User | null>(null);

  const isDark = theme === 'dark';
  const textMain = isDark ? 'text-white' : 'text-gray-900';
  const textSub = isDark ? 'text-neutral-400' : 'text-gray-500';
  
  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    if (date.toDateString() === now.toDateString()) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  const handleCreateGroup = () => {
      if (groupName.trim()) {
          onCreateGroup(groupName);
          setGroupName('');
          setShowGroupModal(false);
          setShowMenu(false);
      }
  };

  const handleAvatarClick = (e: React.MouseEvent, user: User) => {
      e.stopPropagation();
      setViewingUser(user);
  };

  return (
    <div className="flex flex-col h-full pt-6 pb-20 px-4 max-w-2xl mx-auto w-full relative">
      <header className="flex justify-between items-center mb-6">
        <div>
            <h1 className="text-4xl font-black tracking-tighter text-red-600">
            Nexa<span className={textMain}>Chat</span>
            </h1>
            <p className={`text-sm font-medium mt-1 ${textSub}`}>
                Добро пожаловать, <span className={textMain}>{currentUser.name}</span>
            </p>
        </div>
        
        {/* Floating Action Button (Pencil) */}
        <div className="relative">
             <button 
                onClick={() => setShowMenu(!showMenu)}
                className="p-3.5 bg-red-600 rounded-full hover:bg-red-500 active:scale-90 transition-all shadow-[0_4px_12px_rgba(220,38,38,0.4)] text-white"
                >
                <IconPencil className="w-6 h-6" />
            </button>
            
            {/* Popover Menu */}
            {showMenu && (
                <div className={`absolute top-14 right-0 w-48 rounded-2xl shadow-2xl p-2 z-50 animate-[fadeIn_0.1s_ease-out] border ${isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-gray-100'}`}>
                    <button 
                        onClick={() => { setShowGroupModal(true); setShowMenu(false); }}
                        className={`w-full text-left flex items-center gap-3 p-3 rounded-xl transition-colors ${isDark ? 'hover:bg-neutral-800 text-white' : 'hover:bg-gray-50 text-gray-900'}`}
                    >
                        <div className="bg-blue-600/20 text-blue-500 p-2 rounded-full">
                            <IconGroup className="w-5 h-5" />
                        </div>
                        <span className="font-bold text-sm">Создать группу</span>
                    </button>
                    <button 
                        onClick={() => { onNewChat(); setShowMenu(false); }}
                        className={`w-full text-left flex items-center gap-3 p-3 rounded-xl transition-colors ${isDark ? 'hover:bg-neutral-800 text-white' : 'hover:bg-gray-50 text-gray-900'}`}
                    >
                        <div className="bg-red-600/20 text-red-500 p-2 rounded-full">
                            <IconUserPlus className="w-5 h-5" />
                        </div>
                        <span className="font-bold text-sm">Найти контакт</span>
                    </button>
                </div>
            )}
        </div>
      </header>

      {/* Backdrop for menu */}
      {showMenu && <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)}></div>}

      <div className="flex-1 overflow-y-auto space-y-3">
        {chats.length === 0 ? (
          <div className={`flex flex-col items-center justify-center h-64 ${textSub}`}>
            <div className="w-20 h-20 rounded-full bg-neutral-800/50 flex items-center justify-center mb-4">
                <IconMessageCircle className="w-10 h-10 opacity-40" />
            </div>
            <p className="text-lg font-bold">Пусто</p>
            <p className="text-sm opacity-60">Начните общение прямо сейчас</p>
          </div>
        ) : (
          chats
            .sort((a, b) => b.updatedAt - a.updatedAt)
            .map((chat) => (
              <div
                key={chat.id}
                onClick={() => onSelectChat(chat.id)}
                className={`flex items-center p-4 rounded-3xl transition-all cursor-pointer group relative border ${isDark ? 'border-neutral-800 hover:bg-neutral-900 active:bg-black' : 'border-transparent bg-white shadow-sm hover:shadow-md active:scale-[0.99]'}`}
              >
                <div className="relative flex-shrink-0" onClick={(e) => !chat.isGroup && handleAvatarClick(e, chat.participant)}>
                  <img
                    src={chat.participant.avatar}
                    alt={chat.participant.name}
                    className={`w-14 h-14 rounded-full object-cover border-2 transition-colors bg-neutral-800 ${isDark ? 'border-neutral-800 group-hover:border-neutral-700' : 'border-gray-100'}`}
                  />
                  {chat.unreadCount > 0 && (
                    <div className="absolute -top-1 -right-1 bg-red-600 min-w-[20px] h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white border-2 border-black px-1">
                      {chat.unreadCount}
                    </div>
                  )}
                  {chat.isGroup && (
                      <div className="absolute -bottom-1 -right-1 bg-neutral-800 rounded-full p-1 border border-black">
                          <IconGroup className="w-3 h-3 text-white" />
                      </div>
                  )}
                </div>
                
                <div className="ml-4 flex-1 min-w-0">
                  <div className="flex justify-between items-baseline mb-1">
                    <h3 className={`text-base font-bold truncate flex items-center ${textMain}`}>
                      {chat.participant.name}
                      {chat.participant.isVerified && <IconVerified className="w-4 h-4 text-blue-500 ml-1" />}
                      {chat.participant.id === 'ai-helper' && (
                          <span className="ml-2 bg-blue-600 text-white text-[9px] px-1.5 py-0.5 rounded font-black tracking-wide">BOT</span>
                      )}
                    </h3>
                    {chat.lastMessage && (
                      <span className={`text-xs font-semibold ml-2 ${chat.unreadCount > 0 ? 'text-red-500' : textSub}`}>
                        {formatTime(chat.lastMessage.timestamp)}
                      </span>
                    )}
                  </div>
                  <div className={`text-sm truncate flex items-center ${chat.unreadCount > 0 ? (isDark ? 'text-white font-medium' : 'text-black font-semibold') : textSub}`}>
                    {chat.isGroup && chat.lastMessage?.senderName && chat.lastMessage.sender !== 'me' && (
                        <span className="text-red-500 mr-1 text-xs">{chat.lastMessage.senderName}:</span>
                    )}
                    {chat.lastMessage 
                      ? (chat.lastMessage.sender === 'me' ? <span className="opacity-60 mr-1">Вы:</span> : '') + chat.lastMessage.text 
                      : <span className="text-red-500 italic font-medium">Начать диалог...</span>}
                  </div>
                </div>
              </div>
            ))
        )}
      </div>

      {/* Create Group Modal */}
      {showGroupModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-[fadeIn_0.2s_ease-out]">
              <div className={`w-full max-w-sm rounded-3xl p-6 relative ${isDark ? 'bg-neutral-900 border border-neutral-800' : 'bg-white'}`}>
                  <button onClick={() => setShowGroupModal(false)} className="absolute top-4 right-4 text-neutral-500 hover:text-red-500">
                      <IconX className="w-6 h-6" />
                  </button>
                  <div className="text-center mb-6">
                      <div className="w-16 h-16 rounded-full bg-blue-600/10 text-blue-500 flex items-center justify-center mx-auto mb-4 border border-blue-600/20">
                          <IconGroup className="w-8 h-8" />
                      </div>
                      <h3 className="text-xl font-bold">Новая группа</h3>
                      <p className={`text-sm mt-2 ${textSub}`}>Придумайте название для группы</p>
                  </div>
                  
                  <input 
                    type="text" 
                    value={groupName}
                    onChange={(e) => setGroupName(e.target.value)}
                    className={`w-full p-4 rounded-xl border mb-4 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-all ${isDark ? 'bg-neutral-800 border-neutral-700 text-white placeholder-neutral-500' : 'bg-gray-50 border-gray-200 text-black placeholder-gray-400'}`}
                    placeholder="Название группы"
                    autoFocus
                  />
                  
                  <button 
                    onClick={handleCreateGroup}
                    disabled={!groupName.trim()}
                    className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl shadow-lg shadow-blue-600/20 active:scale-95 transition-all disabled:opacity-50"
                  >
                      Создать
                  </button>
              </div>
          </div>
      )}

      {/* Viewing Profile Modal */}
      {viewingUser && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-[fadeIn_0.2s_ease-out]">
               <div className={`w-full max-w-sm rounded-3xl p-6 relative ${isDark ? 'bg-neutral-900 border border-neutral-800' : 'bg-white'}`}>
                   <button onClick={() => setViewingUser(null)} className="absolute top-4 right-4 text-neutral-500 hover:text-red-500"><IconX className="w-6 h-6" /></button>
                   
                   <div className="flex flex-col items-center">
                       <img src={viewingUser.avatar} className="w-24 h-24 rounded-full border-4 border-neutral-800 object-cover mb-4 shadow-xl" />
                       <h3 className="text-2xl font-bold flex items-center gap-1">
                           {viewingUser.name}
                           {viewingUser.isVerified && <IconVerified className="w-5 h-5 text-blue-500" />}
                           {viewingUser.id === 'ai-helper' && (
                               <span className="bg-blue-600 text-white text-[10px] px-1.5 py-0.5 rounded font-black tracking-wide">BOT</span>
                           )}
                        </h3>
                       <p className="text-red-500 font-bold mb-4">@{viewingUser.username}</p>
                       
                       <div className={`w-full p-4 rounded-2xl mb-4 text-center text-sm ${isDark ? 'bg-neutral-800 text-neutral-300' : 'bg-gray-100 text-gray-700'}`}>
                           {viewingUser.bio || 'Нет информации'}
                       </div>

                       {viewingUser.profileMusic && (
                            <div className={`w-full p-3 rounded-xl mb-4 flex items-center gap-3 ${isDark ? 'bg-black/40' : 'bg-gray-50'}`}>
                                <div className="w-8 h-8 rounded-full bg-red-600 flex items-center justify-center text-white flex-shrink-0">
                                    <IconMusic className="w-4 h-4" />
                                </div>
                                <div className="flex-1 overflow-hidden">
                                    <p className="text-xs font-bold truncate mb-1">Музыка профиля</p>
                                    <audio controls src={viewingUser.profileMusic} className="w-full h-6" />
                                </div>
                            </div>
                       )}
                       
                       <button 
                            onClick={() => { onSelectChat(viewingUser.id); setViewingUser(null); }}
                            className="w-full py-3 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl shadow-lg shadow-red-600/20 active:scale-95 transition-all flex items-center justify-center gap-2"
                        >
                            <IconMessageCircle className="w-4 h-4" />
                            Перейти в чат
                       </button>
                   </div>
               </div>
          </div>
      )}
    </div>
  );
};

export default ChatList;