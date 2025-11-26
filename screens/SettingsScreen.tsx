
import React, { useState, useRef, useEffect } from 'react';
import { User, ThemeMode, Invitation } from '../types';
import { IconTrash, IconEdit, IconCamera, IconMoon, IconSun, IconLogOut, IconHelpCircle, IconShield, IconVerified, IconBook, IconDoc, IconUser, IconImage, IconUserPlus, IconX, IconCheck, IconMusic } from '../components/Icons';
import { createCloudChannel, fetchCloudData } from '../services/cloudLayer';

interface SettingsScreenProps {
    userProfile: User;
    onUpdateProfile: (user: User) => void;
    theme: ThemeMode;
    onToggleTheme: () => void;
    onReset: () => void;
    onLogout: () => void;
    onOpenAdmin?: () => void;
    onOpenRules: () => void;
    onOpenPrivacy: () => void;
    cloudId: string | null;
    onSetCloudId: (id: string | null) => void;
}

const USERS_STORAGE_KEY = 'nexachat_users_db';
const INVITES_PREFIX = 'nexachat_invites_';

const SettingsScreen: React.FC<SettingsScreenProps> = ({ 
    userProfile, onUpdateProfile, theme, onToggleTheme, onReset, onLogout, onOpenAdmin, onOpenRules, onOpenPrivacy, cloudId, onSetCloudId
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<User>(userProfile);
  
  // Invite Modal
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteUsername, setInviteUsername] = useState('');
  const [inviteStatus, setInviteStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [inviteMessage, setInviteMessage] = useState('');
  
  // Cloud Modal
  const [showCloudModal, setShowCloudModal] = useState(false);
  const [inputCloudId, setInputCloudId] = useState('');
  const [cloudStatus, setCloudStatus] = useState('');
  const [isCloudLoading, setIsCloudLoading] = useState(false);

  const [imgError, setImgError] = useState(false);
  const [musicError, setMusicError] = useState('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const musicInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
      setImgError(false);
  }, [userProfile.avatar, editForm.avatar]);

  const isDark = theme === 'dark';
  const bgBase = isDark ? 'bg-black text-white' : 'bg-white text-gray-900';
  const cardBg = isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-gray-100 shadow-sm';
  const textSub = isDark ? 'text-neutral-400' : 'text-gray-500';
  const inputBg = isDark ? 'bg-neutral-800 border-neutral-700 text-white placeholder-neutral-500' : 'bg-gray-50 border-gray-200 text-black placeholder-gray-400';

  const handleSave = () => {
    let cleanUsername = editForm.username.trim();
    if (cleanUsername.startsWith('@')) cleanUsername = cleanUsername.substring(1);
    
    onUpdateProfile({
        ...editForm,
        username: cleanUsername
    });
    setIsEditing(false);
  };

  const handleAvatarGen = () => {
      const seeds = ['Felix', 'Aneka', 'Zoe', 'Bear', 'Leo', 'Max', 'Sky', 'River', 'Alex', 'Jordan', 'Casey', 'Sam', 'Riley'];
      const randomSeed = seeds[Math.floor(Math.random() * seeds.length)] + Math.random().toString(36).substring(7);
      setEditForm({...editForm, avatar: `https://api.dicebear.com/9.x/adventurer/svg?seed=${randomSeed}`});
      setImgError(false);
  }

  const handleClearAvatar = () => {
      setEditForm({...editForm, avatar: ''});
      setImgError(false);
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
        const file = e.target.files[0];
        const imageUrl = URL.createObjectURL(file);
        setEditForm({...editForm, avatar: imageUrl});
        setImgError(false);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleMusicUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      setMusicError('');
      if (e.target.files && e.target.files[0]) {
          const file = e.target.files[0];
          
          // INCREASED LIMIT TO 5MB
          if (file.size > 5 * 1024 * 1024) { 
              setMusicError('Файл слишком большой! Максимум 5 МБ.');
              return;
          }

          const reader = new FileReader();
          reader.onload = (event) => {
              if (event.target?.result) {
                  setEditForm(prev => ({ ...prev, profileMusic: event.target?.result as string }));
              }
          };
          reader.readAsDataURL(file);
      }
      if (musicInputRef.current) musicInputRef.current.value = '';
  }

  const handleRemoveMusic = () => {
      setEditForm({ ...editForm, profileMusic: undefined });
  }

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const triggerMusicInput = () => {
    musicInputRef.current?.click();
  };
  
  const handleSendInvite = () => {
      if (!inviteUsername.trim()) return;
      
      const cleanTarget = inviteUsername.replace('@', '').toLowerCase().trim();
      
      if (cleanTarget === userProfile.username.toLowerCase()) {
          setInviteStatus('error');
          setInviteMessage('Нельзя пригласить самого себя');
          return;
      }

      const db: User[] = JSON.parse(localStorage.getItem(USERS_STORAGE_KEY) || '[]');
      const targetUser = db.find(u => u.username.toLowerCase() === cleanTarget);

      if (targetUser) {
          const inviteKey = `${INVITES_PREFIX}${targetUser.id}`;
          const currentInvitesStr = localStorage.getItem(inviteKey);
          let invites: Invitation[] = currentInvitesStr ? JSON.parse(currentInvitesStr) : [];
          
          if (invites.find(i => i.fromUser.id === userProfile.id)) {
              setInviteStatus('error');
              setInviteMessage('Приглашение уже отправлено');
              return;
          }

          const newInvite: Invitation = {
              fromUser: userProfile,
              timestamp: Date.now()
          };
          
          localStorage.setItem(inviteKey, JSON.stringify([...invites, newInvite]));
          
          setInviteStatus('success');
          setInviteMessage('Приглашение отправлено!');
          setInviteUsername('');
          
          setTimeout(() => {
              setShowInviteModal(false);
              setInviteStatus('idle');
              setInviteMessage('');
          }, 2000);
          
      } else {
          setInviteStatus('error');
          setInviteMessage('Пользователь не найден. Вы в одном канале?');
      }
  };

  const renderAvatar = (url: string, size: string = "w-24 h-24", iconSize: string = "w-10 h-10") => {
      const hasUrl = url && url.trim() !== '';
      
      if (hasUrl && !imgError) {
          return (
            <img 
                src={url} 
                alt="Profile" 
                onError={() => setImgError(true)}
                className={`${size} rounded-full object-cover bg-neutral-800 block shadow-xl border-4 ${isDark ? 'border-neutral-800' : 'border-white'}`} 
            />
          );
      }
      
      return (
          <div className={`${size} rounded-full bg-neutral-800 border-4 border-neutral-700 flex items-center justify-center shadow-xl`}>
              <IconUser className={`${iconSize} text-neutral-500`} />
          </div>
      );
  };

  const handleCreateChannel = async () => {
      setIsCloudLoading(true);
      setCloudStatus('Создание канала...');
      
      const localUsers = JSON.parse(localStorage.getItem(USERS_STORAGE_KEY) || '[]');
      
      const initialState = {
          users: localUsers,
          chats: {},
          invites: {},
          typing: {}
      };

      const newId = await createCloudChannel(initialState);
      if (newId) {
          onSetCloudId(newId);
          setCloudStatus('Канал создан! Код скопирован.');
          navigator.clipboard.writeText(newId);
          setTimeout(() => setShowCloudModal(false), 2000);
      } else {
          setCloudStatus('Ошибка соединения с сервером.');
      }
      setIsCloudLoading(false);
  };

  const handleJoinChannel = async () => {
      if (!inputCloudId.trim()) return;
      setIsCloudLoading(true);
      setCloudStatus('Проверка кода...');
      
      const data = await fetchCloudData(inputCloudId.trim());
      if (data) {
          onSetCloudId(inputCloudId.trim());
          setCloudStatus('Успешное подключение!');
          setTimeout(() => setShowCloudModal(false), 1500);
      } else {
          setCloudStatus('Неверный код или ошибка сети.');
      }
      setIsCloudLoading(false);
  };

  const handleDisconnectCloud = () => {
      if(window.confirm("Выйти из облачного канала? Приложение перейдет в локальный режим.")) {
          onSetCloudId(null);
      }
  };

  // Render Edit Form
  if (isEditing) {
      return (
        <div className={`fixed inset-0 h-full w-full z-50 overflow-y-auto ${bgBase}`}>
          <div className="flex flex-col min-h-full max-w-2xl mx-auto p-4 pb-20">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">Редактирование</h2>
                <button onClick={handleSave} className="bg-red-600 text-white px-5 py-2 rounded-xl font-bold text-sm shadow-lg shadow-red-600/20 active:scale-95 transition-all">
                    Сохранить
                </button>
            </div>

            <div className="flex flex-col items-center mb-8">
                <div className="relative group cursor-pointer" onClick={triggerFileInput}>
                    {renderAvatar(editForm.avatar, "w-32 h-32", "w-14 h-14")}
                    <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm">
                         <IconImage className="text-white w-8 h-8" />
                    </div>
                </div>
                
                <div className="flex gap-2 mt-6 flex-wrap justify-center">
                     <button onClick={triggerFileInput} className="flex items-center gap-2 bg-neutral-800 px-4 py-2 rounded-lg text-xs font-bold hover:bg-neutral-700 transition-colors text-white">
                        <IconImage className="w-4 h-4" />
                        Загрузить
                    </button>
                     <button onClick={handleAvatarGen} className="flex items-center gap-2 bg-neutral-800 px-4 py-2 rounded-lg text-xs font-bold hover:bg-neutral-700 transition-colors text-white">
                        <IconCamera className="w-4 h-4" />
                        Генерация
                    </button>
                    <button onClick={handleClearAvatar} className="flex items-center gap-2 bg-neutral-800 px-4 py-2 rounded-lg text-xs font-bold text-red-500 hover:bg-neutral-700 transition-colors">
                        <IconTrash className="w-4 h-4" />
                        Удалить
                    </button>
                </div>
                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileUpload} />
            </div>

            <div className="space-y-6">
                <div>
                    <label className={`block text-[11px] font-bold tracking-wider mb-2 ml-1 ${textSub} uppercase`}>Ваше имя</label>
                    <input 
                        type="text" 
                        value={editForm.name}
                        onChange={e => setEditForm({...editForm, name: e.target.value})}
                        className={`w-full p-4 rounded-xl border focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600 transition-all ${inputBg}`}
                        placeholder="Как вас зовут?"
                    />
                </div>
                <div>
                    <label className={`block text-[11px] font-bold tracking-wider mb-2 ml-1 ${textSub} uppercase`}>Юзернейм (@)</label>
                    <div className="relative">
                        <span className={`absolute left-4 top-4 ${textSub}`}>@</span>
                        <input 
                            type="text" 
                            value={editForm.username.replace('@','')}
                            onChange={e => setEditForm({...editForm, username: e.target.value})}
                            className={`w-full p-4 pl-8 rounded-xl border focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600 transition-all ${inputBg}`}
                            placeholder="username"
                        />
                    </div>
                </div>
                <div>
                    <label className={`block text-[11px] font-bold tracking-wider mb-2 ml-1 ${textSub} uppercase`}>О себе</label>
                    <textarea 
                        value={editForm.bio}
                        onChange={e => setEditForm({...editForm, bio: e.target.value})}
                        className={`w-full p-4 rounded-xl border focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600 transition-all h-32 resize-none ${inputBg}`}
                        placeholder="Напишите пару слов о себе..."
                    />
                </div>

                {/* Music Upload Section */}
                <div>
                    <label className={`block text-[11px] font-bold tracking-wider mb-2 ml-1 ${textSub} uppercase`}>Музыка профиля</label>
                    <div className={`w-full p-4 rounded-xl border ${inputBg} flex flex-col items-center`}>
                        {editForm.profileMusic ? (
                            <div className="w-full">
                                <p className="text-xs font-bold text-green-500 mb-2">Музыка загружена!</p>
                                <audio controls src={editForm.profileMusic} className="w-full mb-3 h-8" />
                                <button onClick={handleRemoveMusic} className="w-full py-2 bg-red-600/10 text-red-500 rounded-lg text-xs font-bold">
                                    Удалить музыку
                                </button>
                            </div>
                        ) : (
                            <div onClick={triggerMusicInput} className="cursor-pointer flex flex-col items-center py-4">
                                <div className="w-10 h-10 rounded-full bg-neutral-700 flex items-center justify-center mb-2">
                                    <IconMusic className="w-5 h-5 text-white" />
                                </div>
                                <span className="text-xs font-bold">Добавить MP3</span>
                                <span className="text-[10px] opacity-50 mt-1">Макс. 5 МБ</span>
                            </div>
                        )}
                        <input type="file" ref={musicInputRef} className="hidden" accept="audio/mp3,audio/mpeg" onChange={handleMusicUpload} />
                    </div>
                    {musicError && <p className="text-red-500 text-xs font-bold mt-2 ml-1">{musicError}</p>}
                </div>
            </div>
            
            <button onClick={() => setIsEditing(false)} className="mt-8 w-full py-4 text-center text-red-500 font-medium hover:text-red-400 transition-colors">
                Отмена
            </button>
          </div>
        </div>
      )
  }

  // Render Main Settings
  return (
    <div className={`h-full w-full overflow-y-auto ${bgBase}`}>
      <div className="max-w-2xl mx-auto flex flex-col pt-4 px-4 pb-24">
          <div className="flex justify-between items-center mb-6 px-1">
            <h2 className="text-3xl font-extrabold tracking-tight">Настройки</h2>
            <button 
                onClick={onLogout}
                className="p-2 bg-neutral-800 rounded-full hover:bg-red-600 hover:text-white transition-colors"
                title="Выйти из аккаунта"
            >
                <IconLogOut className="w-5 h-5" />
            </button>
          </div>

          {/* Profile Card */}
          <div className={`rounded-3xl p-6 mb-6 border w-full ${cardBg}`}>
            <div className="flex flex-col items-center w-full">
                <div className="mb-4 cursor-pointer hover:opacity-80 transition-opacity" onClick={() => setIsEditing(true)}>
                    {renderAvatar(userProfile.avatar, "w-24 h-24", "w-10 h-10")}
                </div>
                
                <div className="flex items-center justify-center gap-2 mb-1 flex-wrap w-full">
                    <h3 className={`text-xl font-bold truncate max-w-[80%] ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {userProfile.name || 'Без имени'}
                    </h3>
                    {userProfile.isVerified && <IconVerified className="w-5 h-5 text-blue-500 flex-shrink-0" />}
                    {userProfile.isAdmin && <IconShield className="w-4 h-4 text-red-600 flex-shrink-0" />}
                </div>
                
                <p className="text-red-500 font-bold text-sm mb-4">@{userProfile.username || 'username'}</p>
                
                {userProfile.bio && (
                    <div className={`text-sm text-center w-full px-4 py-3 rounded-xl mb-5 ${isDark ? 'bg-black/40 text-neutral-300' : 'bg-gray-50 text-gray-600'}`}>
                        <p className="line-clamp-3">{userProfile.bio}</p>
                    </div>
                )}

                {userProfile.profileMusic && (
                    <div className={`w-full p-3 rounded-xl mb-5 flex items-center gap-3 ${isDark ? 'bg-black/40' : 'bg-gray-50'}`}>
                         <div className="w-8 h-8 rounded-full bg-red-600 flex items-center justify-center text-white flex-shrink-0">
                             <IconMusic className="w-4 h-4 animate-pulse" />
                         </div>
                         <div className="flex-1 overflow-hidden">
                             <p className="text-xs font-bold truncate">Играет музыка</p>
                             <audio controls src={userProfile.profileMusic} className="w-full h-6 mt-1" />
                         </div>
                    </div>
                )}
                
                <button 
                    onClick={() => setIsEditing(true)}
                    className={`w-full py-3 rounded-xl text-xs font-bold border transition-all active:scale-[0.98] flex items-center justify-center ${isDark ? 'border-neutral-700 bg-neutral-800 hover:bg-neutral-700 text-white' : 'border-gray-200 bg-white hover:bg-gray-50 text-black'}`}
                >
                    <IconEdit className="w-3.5 h-3.5 mr-2 text-red-500" />
                    Редактировать
                </button>
            </div>
          </div>

          <div className="space-y-3">
            {/* Invite Friend */}
            <button 
                onClick={() => setShowInviteModal(true)}
                className="w-full p-4 rounded-2xl flex items-center justify-between transition-colors bg-gradient-to-r from-blue-900/40 to-black border border-blue-900/30 hover:border-blue-600 group"
            >
                <div className="flex items-center">
                    <div className="p-2.5 rounded-xl mr-4 bg-blue-600 text-white shadow-lg shadow-blue-600/30">
                        <IconUserPlus className="w-5 h-5" />
                    </div>
                    <div className="text-left">
                        <span className="block font-bold text-sm text-blue-500 group-hover:text-blue-400">Пригласить друга</span>
                        <span className={`text-xs ${textSub}`}>Отправить приглашение в чат</span>
                    </div>
                </div>
            </button>

            {/* Cloud Sync */}
            <button 
                onClick={() => setShowCloudModal(true)}
                className={`w-full p-4 rounded-2xl flex items-center justify-between transition-colors border group ${
                    cloudId 
                    ? 'bg-gradient-to-r from-green-900/40 to-black border-green-900/30 hover:border-green-600' 
                    : 'bg-gradient-to-r from-purple-900/40 to-black border-purple-900/30 hover:border-purple-600'
                }`}
            >
                <div className="flex items-center">
                    <div className={`p-2.5 rounded-xl mr-4 text-white shadow-lg ${cloudId ? 'bg-green-600 shadow-green-600/30' : 'bg-purple-600 shadow-purple-600/30'}`}>
                        {cloudId ? <IconCheck className="w-5 h-5" /> : <IconDoc className="w-5 h-5" />}
                    </div>
                    <div className="text-left">
                        <span className={`block font-bold text-sm ${cloudId ? 'text-green-500' : 'text-purple-500'}`}>
                            {cloudId ? 'Облако подключено' : 'Облако NexaCloud'}
                        </span>
                        <span className={`text-xs ${textSub}`}>
                            {cloudId ? 'Синхронизация активна' : 'Синхронизация устройств'}
                        </span>
                    </div>
                </div>
            </button>

            {/* Admin Panel */}
            {userProfile.isAdmin && (
                <button 
                    onClick={onOpenAdmin}
                    className="w-full p-4 rounded-2xl flex items-center justify-between transition-colors bg-gradient-to-r from-red-900/40 to-black border border-red-900/30 hover:border-red-600 group"
                >
                    <div className="flex items-center">
                        <div className="p-2.5 rounded-xl mr-4 bg-red-600 text-white shadow-lg shadow-red-600/30">
                            <IconShield className="w-5 h-5" />
                        </div>
                        <div className="text-left">
                            <span className="block font-bold text-sm text-red-500 group-hover:text-red-400">Админ Панель</span>
                            <span className={`text-xs ${textSub}`}>Управление пользователями</span>
                        </div>
                    </div>
                </button>
            )}

            <div className={`rounded-2xl overflow-hidden border ${cardBg}`}>
                <button 
                    onClick={onToggleTheme}
                    className={`w-full p-4 border-b flex justify-between items-center transition-colors ${isDark ? 'border-neutral-800 hover:bg-neutral-800' : 'border-gray-100 hover:bg-gray-50'}`}
                >
                    <div className="flex items-center">
                        <div className={`p-2.5 rounded-xl mr-4 ${isDark ? 'bg-white/5 text-white' : 'bg-black/5 text-black'}`}>
                            {isDark ? <IconMoon className="w-5 h-5" /> : <IconSun className="w-5 h-5" />}
                        </div>
                        <div className="text-left">
                            <span className="block font-semibold text-sm">Тема оформления</span>
                            <span className={`text-xs ${textSub}`}>{isDark ? 'Nexa Dark' : 'Nexa Light'}</span>
                        </div>
                    </div>
                    <div className={`w-12 h-7 rounded-full relative transition-colors ${isDark ? 'bg-red-600' : 'bg-gray-300'}`}>
                        <div className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-all shadow-sm ${isDark ? 'right-1' : 'left-1'}`}></div>
                    </div>
                </button>
                
                <button 
                    onClick={onOpenPrivacy}
                    className={`w-full p-4 flex justify-between items-center ${isDark ? 'hover:bg-neutral-800' : 'hover:bg-gray-50'} transition-colors cursor-pointer border-b ${isDark ? 'border-neutral-800' : 'border-gray-100'}`}>
                    <div className="flex items-center">
                        <div className={`p-2.5 rounded-xl mr-4 ${isDark ? 'bg-white/5 text-white' : 'bg-black/5 text-black'}`}>
                            <IconDoc className="w-5 h-5" />
                        </div>
                        <div className="text-left">
                            <span className="block font-semibold text-sm">Политика конфиденциальности</span>
                        </div>
                    </div>
                </button>

                <button 
                    onClick={onOpenRules}
                    className={`w-full p-4 flex justify-between items-center ${isDark ? 'hover:bg-neutral-800' : 'hover:bg-gray-50'} transition-colors cursor-pointer border-b ${isDark ? 'border-neutral-800' : 'border-gray-100'}`}>
                    <div className="flex items-center">
                        <div className={`p-2.5 rounded-xl mr-4 ${isDark ? 'bg-white/5 text-white' : 'bg-black/5 text-black'}`}>
                            <IconBook className="w-5 h-5" />
                        </div>
                        <div className="text-left">
                            <span className="block font-semibold text-sm">Правила пользования</span>
                        </div>
                    </div>
                </button>

                <a 
                    href="https://t.me/NexaChatSupportBot" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className={`p-4 flex justify-between items-center ${isDark ? 'hover:bg-neutral-800' : 'hover:bg-gray-50'} transition-colors cursor-pointer`}
                >
                    <div className="flex items-center">
                        <div className={`p-2.5 rounded-xl mr-4 ${isDark ? 'bg-white/5 text-white' : 'bg-black/5 text-black'}`}>
                            <IconHelpCircle className="w-5 h-5" />
                        </div>
                        <div className="text-left">
                            <span className="block font-semibold text-sm">Техническая поддержка</span>
                            <span className={`text-xs ${textSub}`}>Telegram: @NexaChatSupportBot</span>
                        </div>
                    </div>
                </a>
            </div>

            <button 
                onClick={onReset}
                className={`w-full p-4 rounded-2xl flex items-center justify-center transition-colors font-semibold text-sm ${isDark ? 'bg-red-900/10 text-red-500 hover:bg-red-900/20' : 'bg-red-50 text-red-600 hover:bg-red-100'}`}
            >
                <IconTrash className="w-5 h-5 mr-2" />
                Сброс данных
            </button>

            <div className="mt-6 text-center pb-8">
                <p className="text-xs font-bold uppercase tracking-widest text-red-600 mb-1">NexaChat</p>
                <p className={`text-[10px] ${textSub}`}>Версия v1.0 • Stable</p>
            </div>
          </div>
      </div>

      {/* Invite Modal */}
      {showInviteModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-[fadeIn_0.2s_ease-out]">
              <div className={`w-full max-w-sm rounded-3xl p-6 relative ${isDark ? 'bg-neutral-900 border border-neutral-800' : 'bg-white'}`}>
                  <button onClick={() => setShowInviteModal(false)} className="absolute top-4 right-4 text-neutral-500 hover:text-red-500">
                      <IconX className="w-6 h-6" />
                  </button>
                  <div className="text-center mb-6">
                      <div className="w-16 h-16 rounded-full bg-blue-600/10 text-blue-500 flex items-center justify-center mx-auto mb-4 border border-blue-600/20">
                          <IconUserPlus className="w-8 h-8" />
                      </div>
                      <h3 className="text-xl font-bold">Пригласить друга</h3>
                      <p className={`text-sm mt-2 ${textSub}`}>Введите юзернейм пользователя</p>
                  </div>
                  <div className="space-y-4">
                      <div className="relative">
                          <span className="absolute left-4 top-4 text-neutral-500 font-bold z-10">@</span>
                          <input 
                                type="text" 
                                value={inviteUsername}
                                onChange={e => {
                                    const val = e.target.value;
                                    setInviteUsername(val.startsWith('@') ? val.substring(1) : val);
                                }}
                                className={`w-full p-4 pl-8 rounded-xl border focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-all ${inputBg}`}
                                placeholder="username"
                                autoFocus
                          />
                      </div>
                      {inviteMessage && (
                          <div className={`p-3 rounded-lg text-center text-xs font-bold ${inviteStatus === 'success' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                              {inviteMessage}
                          </div>
                      )}
                      <button onClick={handleSendInvite} disabled={!inviteUsername.trim()} className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl shadow-lg shadow-blue-600/20 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                          Отправить
                      </button>
                  </div>
              </div>
          </div>
      )}

      {/* Cloud Modal */}
      {showCloudModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-[fadeIn_0.2s_ease-out]">
              <div className={`w-full max-w-sm rounded-3xl p-6 relative ${isDark ? 'bg-neutral-900 border border-neutral-800' : 'bg-white'}`}>
                  <button onClick={() => setShowCloudModal(false)} className="absolute top-4 right-4 text-neutral-500 hover:text-red-500">
                      <IconX className="w-6 h-6" />
                  </button>
                  <div className="text-center mb-6">
                      <h3 className="text-xl font-bold mb-2">Облако NexaCloud</h3>
                      <p className={`text-xs ${textSub}`}>Чтобы общаться на разных устройствах, подключите их к одному каналу.</p>
                  </div>
                  {cloudId ? (
                      <div className="space-y-4 text-center">
                          <div className="p-4 bg-green-900/20 border border-green-900/50 rounded-xl">
                              <p className="text-xs text-green-500 uppercase font-bold mb-2">Активный Код Канала</p>
                              <p className="text-xl font-mono font-black tracking-widest text-white">{cloudId}</p>
                          </div>
                          <button onClick={handleDisconnectCloud} className="w-full py-3 bg-red-600/10 text-red-500 font-bold rounded-xl hover:bg-red-600/20 transition-all">Отключиться</button>
                      </div>
                  ) : (
                      <div className="space-y-6">
                          <div>
                            <button onClick={handleCreateChannel} disabled={isCloudLoading} className="w-full py-3 bg-white text-black font-bold rounded-xl hover:bg-gray-200 transition-all">{isCloudLoading ? '...' : 'Создать новый канал'}</button>
                            <p className="text-[10px] text-center mt-2 text-neutral-500">Создаст новый сервер для ваших чатов</p>
                          </div>
                          <div className="relative flex items-center justify-center"><div className="border-t border-neutral-800 w-full absolute"></div><span className="bg-neutral-900 px-2 relative z-10 text-xs text-neutral-500 font-bold">ИЛИ</span></div>
                          <div>
                              <label className="text-xs font-bold text-neutral-400 mb-2 block uppercase">Подключиться к каналу</label>
                              <div className="flex gap-2">
                                  <input value={inputCloudId} onChange={e => setInputCloudId(e.target.value)} placeholder="Введите код" className={`flex-1 p-3 rounded-xl border focus:outline-none focus:border-purple-600 focus:ring-1 focus:ring-purple-600 ${inputBg}`} />
                                  <button onClick={handleJoinChannel} disabled={isCloudLoading || !inputCloudId} className="px-4 bg-purple-600 text-white font-bold rounded-xl hover:bg-purple-500 disabled:opacity-50">OK</button>
                              </div>
                          </div>
                          {cloudStatus && <p className={`text-center text-xs font-bold ${cloudStatus.includes('Ошиб') ? 'text-red-500' : 'text-purple-400'}`}>{cloudStatus}</p>}
                      </div>
                  )}
              </div>
          </div>
      )}
    </div>
  );
};

export default SettingsScreen;
