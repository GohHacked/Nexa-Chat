
import React, { useState, useEffect } from 'react';
import { User, PRESET_USERS, ThemeMode } from '../types';
import { IconSearch, IconCheck, IconVerified, IconUser } from '../components/Icons';
import { fetchCloudData } from '../services/cloudLayer';

interface SearchScreenProps {
  onStartChat: (user: User) => void;
  theme: ThemeMode;
}

const USERS_STORAGE_KEY = 'nexachat_users_db';
const AUTH_USER_ID_KEY = 'nexachat_auth_user_id';
const CLOUD_ID_KEY = 'nexachat_cloud_id';

const SearchScreen: React.FC<SearchScreenProps> = ({ onStartChat, theme }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<User[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isCloudActive, setIsCloudActive] = useState(false);

  const isDark = theme === 'dark';
  const textMain = isDark ? 'text-white' : 'text-gray-900';
  const textSub = isDark ? 'text-neutral-400' : 'text-gray-500';
  const inputBg = isDark ? 'bg-neutral-900 text-white border-neutral-800' : 'bg-white text-black border-gray-200';
  const cardBg = isDark ? 'bg-neutral-900 border-neutral-800 hover:bg-neutral-800' : 'bg-white border-gray-100 shadow-sm hover:bg-gray-50';

  useEffect(() => {
      setResults([]);
      setIsCloudActive(!!localStorage.getItem(CLOUD_ID_KEY));
  }, []);

  const handleSearch = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
    
    if (val.trim() === '') {
      setResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    
    // Debounce slightly to allow user to type, but ensure we fetch fresh data
    setTimeout(async () => {
        const lowerVal = val.toLowerCase().trim();
        const isUsernameSearch = val.startsWith('@');
        
        let allUsers: User[] = [];
        
        // Strategy: 
        // 1. Try to fetch from Cloud first if active to get absolutely latest users
        // 2. Fallback to local storage
        const cloudId = localStorage.getItem(CLOUD_ID_KEY);
        if (cloudId) {
            try {
                const cloudData = await fetchCloudData(cloudId);
                if (cloudData && cloudData.users) {
                    allUsers = cloudData.users;
                    // Also update local for future
                    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(cloudData.users));
                }
            } catch (e) {}
        }

        // If cloud fetch failed or not active, read local
        if (allUsers.length === 0) {
             allUsers = JSON.parse(localStorage.getItem(USERS_STORAGE_KEY) || '[]');
        }

        const currentUserId = localStorage.getItem(AUTH_USER_ID_KEY);
        
        const allPotentialUsers = [...PRESET_USERS, ...allUsers];
        
        const filtered = allPotentialUsers.filter(u => {
            if (u.id === currentUserId) return false;
            
            const uName = u.name ? u.name.toLowerCase() : '';
            const uUsername = u.username ? u.username.toLowerCase() : '';

            if (isUsernameSearch) {
                const cleanQuery = lowerVal.substring(1);
                if (cleanQuery.length === 0) return false;
                // Strict equality for username search makes it feel like a "database lookup"
                // But partial match is better UX. Let's do partial but prioritize exact.
                return uUsername.includes(cleanQuery);
            }

            return uName.includes(lowerVal) || uUsername.includes(lowerVal);
        });

        // Deduplicate based on ID
        const unique = Array.from(new Map(filtered.map(item => [item.id, item])).values());

        setResults(unique);
        setIsSearching(false);
    }, 600);
  };

  const renderAvatar = (url: string) => {
    if (url && url.trim() !== '') {
        return <img src={url} alt="avatar" className="w-12 h-12 rounded-full mr-4 object-cover ring-2 ring-red-600/20 bg-neutral-800" />;
    }
    return (
        <div className="w-12 h-12 rounded-full mr-4 ring-2 ring-red-600/20 bg-neutral-800 flex items-center justify-center">
            <IconUser className="w-6 h-6 text-neutral-500" />
        </div>
    );
  };

  return (
    <div className="flex flex-col h-full pt-6 px-4 pb-20 max-w-2xl mx-auto w-full">
      <h2 className={`text-3xl font-extrabold mb-6 px-1 ${textMain}`}>Поиск</h2>
      
      <div className="relative mb-6">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <IconSearch className={`h-5 w-5 ${textSub} ${query.startsWith('@') ? 'text-red-600' : ''}`} />
        </div>
        <input
          type="text"
          value={query}
          onChange={handleSearch}
          placeholder="Поиск людей по @username"
          className={`block w-full pl-11 pr-4 py-4 border rounded-2xl leading-5 placeholder-opacity-50 focus:outline-none focus:ring-2 focus:ring-red-600 transition-all ${inputBg}`}
          autoFocus
        />
        {query.length > 0 && isSearching && (
             <div className="absolute inset-y-0 right-4 flex items-center">
                 <div className="animate-spin h-4 w-4 border-2 border-red-600 border-t-transparent rounded-full"></div>
             </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto">
        {query === '' && (
          <div className={`text-center mt-20 ${textSub} animate-[fadeIn_0.5s_ease-out]`}>
            <div className="w-16 h-16 rounded-full bg-neutral-800/30 flex items-center justify-center mx-auto mb-4">
                <IconSearch className="w-8 h-8 opacity-40" />
            </div>
            <p className="mb-2 font-bold text-lg">Найдите собеседника</p>
            <p className="text-sm opacity-60 max-w-xs mx-auto">Введите <span className="text-red-500 font-bold">@</span> чтобы искать конкретного пользователя.</p>
            
            {!isCloudActive && (
                <div className="mt-8 p-4 rounded-2xl border border-dashed border-neutral-700 bg-neutral-900/50">
                    <p className="text-[10px] uppercase font-bold text-neutral-500 mb-1">Совет</p>
                    <p className="text-xs">Чтобы найти друга на другом телефоне, подключите <strong>Облако NexaCloud</strong> в настройках и используйте один код.</p>
                </div>
            )}
          </div>
        )}

        {!isSearching && query !== '' && results.length === 0 && (
             <div className={`text-center mt-20 ${textSub}`}>
                 <p className="font-medium">Пользователь не найден.</p>
                 <p className="text-xs mt-2 opacity-60">
                    {query.startsWith('@') ? 'Проверьте правильность написания @username' : 'Попробуйте ввести точный @username'}
                 </p>
                 {!isCloudActive && (
                     <p className="text-xs mt-4 text-red-500">
                         Если друг на другом устройстве, включите синхронизацию в Настройках!
                     </p>
                 )}
             </div>
        )}

        {results.length > 0 && (
            <div className="animate-[slideUp_0.3s_ease-out]">
                <p className={`text-xs font-bold uppercase tracking-widest mb-4 ml-1 ${textSub}`}>
                    {query.startsWith('@') ? 'Результат поиска' : 'Найденные контакты'}
                </p>
                <div className="space-y-3">
                    {results.map(user => (
                        <div 
                            key={user.id} 
                            onClick={() => onStartChat(user)}
                            className={`${cardBg} p-4 rounded-2xl flex items-center justify-between group transition-all active:scale-[0.98] border cursor-pointer hover:border-red-600/30`}
                        >
                            <div className="flex items-center flex-1 min-w-0">
                                {renderAvatar(user.avatar)}
                                <div className="flex-1 min-w-0 pr-4">
                                    <h3 className={`font-bold flex items-center truncate ${textMain}`}>
                                        {user.name}
                                        {user.isVerified && <IconVerified className="w-4 h-4 text-blue-500 ml-1 flex-shrink-0" />}
                                        {user.isAdmin && <span className="ml-2 text-[10px] bg-red-600 text-white px-1.5 py-0.5 rounded font-bold uppercase flex-shrink-0">Admin</span>}
                                    </h3>
                                    <p className={`text-sm font-medium truncate ${query.startsWith('@') ? 'text-red-500' : 'text-neutral-500'}`}>
                                        @{user.username}
                                    </p>
                                    {user.bio && <p className={`text-xs mt-1 truncate opacity-60 ${textSub}`}>{user.bio}</p>}
                                </div>
                            </div>
                            <div 
                                className="p-3 bg-red-600 rounded-full hover:bg-red-500 transition-colors shadow-lg shadow-red-600/20 text-white flex-shrink-0"
                                title="Написать сообщение"
                            >
                                <IconCheck className="w-5 h-5" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        )}
      </div>
    </div>
  );
};

export default SearchScreen;
