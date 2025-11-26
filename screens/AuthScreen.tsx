
import React, { useState } from 'react';
import { User } from '../types';
import { IconLock, IconMail, IconUser, IconCheck } from '../components/Icons';

interface AuthScreenProps {
  onLogin: (user: User) => void;
}

const USERS_STORAGE_KEY = 'nexachat_users_db';

const AuthScreen: React.FC<AuthScreenProps> = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    email: '',
    username: '',
    password: '',
    name: ''
  });
  const [error, setError] = useState('');

  const handleAuth = () => {
    setError('');
    const usersDb: User[] = JSON.parse(localStorage.getItem(USERS_STORAGE_KEY) || '[]');

    if (isLogin) {
      // LOGIN LOGIC
      if (!formData.email || !formData.password) {
        setError('Заполните все поля');
        return;
      }
      
      const loginInput = formData.email.toLowerCase();

      // Allow login by email or username (case insensitive check)
      const user = usersDb.find(u => 
        (u.email && u.email.toLowerCase() === loginInput) || 
        (u.username && u.username.toLowerCase() === loginInput.replace('@', ''))
      );

      // Verify password
      if (user && user.password === formData.password) {
        if (user.isBanned) {
            setError('Ваш аккаунт заблокирован администратором.');
            return;
        }
        onLogin(user);
      } else {
        setError('Неверные данные для входа');
      }

    } else {
      // REGISTRATION LOGIC
      if (!formData.email || !formData.password || !formData.name || !formData.username) {
        setError('Заполните все поля');
        return;
      }

      // Clean input
      const cleanUsername = formData.username.replace('@', '').trim();
      const cleanEmail = formData.email.trim();

      // Check if exists (Case Insensitive)
      const exists = usersDb.find(u => 
          (u.email && u.email.toLowerCase() === cleanEmail.toLowerCase()) || 
          (u.username && u.username.toLowerCase() === cleanUsername.toLowerCase())
      );
      
      if (exists) {
        setError('Пользователь с таким Email или Username уже существует');
        return;
      }

      const newUser: User = {
        id: Date.now().toString(),
        name: formData.name,
        username: cleanUsername, // Store without @
        email: cleanEmail,
        password: formData.password, // In real app, hash this!
        avatar: `https://api.dicebear.com/9.x/adventurer/svg?seed=${cleanUsername}`,
        bio: 'Новый пользователь NexaChat',
        isAdmin: false,
        isBanned: false,
        isVerified: false
      };

      const updatedDb = [...usersDb, newUser];
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(updatedDb));
      onLogin(newUser);
    }
  };

  return (
    <div className="min-h-screen w-full bg-black flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-red-600/20 blur-[120px] rounded-full pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-red-900/20 blur-[120px] rounded-full pointer-events-none"></div>

      <div className="w-full max-w-md z-10">
        <div className="text-center mb-10">
          <h1 className="text-5xl font-black text-red-600 mb-2 tracking-tighter">Nexa<span className="text-white">Chat</span></h1>
          <p className="text-neutral-400 text-sm font-medium">Безопасный. Быстрый. Твой.</p>
        </div>

        <div className="bg-neutral-900/50 backdrop-blur-xl border border-neutral-800 p-8 rounded-3xl shadow-2xl">
          <div className="flex mb-8 border-b border-neutral-800">
            <button 
              onClick={() => {setIsLogin(true); setError('');}}
              className={`flex-1 pb-4 font-bold text-sm transition-colors ${isLogin ? 'text-white border-b-2 border-red-600' : 'text-neutral-500'}`}
            >
              Вход
            </button>
            <button 
              onClick={() => {setIsLogin(false); setError('');}}
              className={`flex-1 pb-4 font-bold text-sm transition-colors ${!isLogin ? 'text-white border-b-2 border-red-600' : 'text-neutral-500'}`}
            >
              Регистрация
            </button>
          </div>

          <div className="space-y-4">
            {!isLogin && (
              <>
                 <div className="relative group">
                    <IconUser className="absolute left-4 top-4 text-neutral-500 w-5 h-5 group-focus-within:text-red-500 transition-colors" />
                    <input 
                      type="text" 
                      placeholder="Ваше Имя"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      className="w-full bg-black/50 border border-neutral-800 text-white p-4 pl-12 rounded-xl focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600 transition-all placeholder-neutral-600"
                    />
                </div>
                <div className="relative group">
                    <span className="absolute left-4 top-4 text-neutral-500 font-bold group-focus-within:text-red-500 transition-colors">@</span>
                    <input 
                      type="text" 
                      placeholder="Username"
                      value={formData.username}
                      onChange={(e) => setFormData({...formData, username: e.target.value})}
                      className="w-full bg-black/50 border border-neutral-800 text-white p-4 pl-12 rounded-xl focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600 transition-all placeholder-neutral-600"
                    />
                </div>
              </>
            )}

            <div className="relative group">
              <IconMail className="absolute left-4 top-4 text-neutral-500 w-5 h-5 group-focus-within:text-red-500 transition-colors" />
              <input 
                type="text" 
                placeholder={isLogin ? "Email или Username" : "Email"}
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                className="w-full bg-black/50 border border-neutral-800 text-white p-4 pl-12 rounded-xl focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600 transition-all placeholder-neutral-600"
              />
            </div>

            <div className="relative group">
              <IconLock className="absolute left-4 top-4 text-neutral-500 w-5 h-5 group-focus-within:text-red-500 transition-colors" />
              <input 
                type="password" 
                placeholder="Пароль"
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
                className="w-full bg-black/50 border border-neutral-800 text-white p-4 pl-12 rounded-xl focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600 transition-all placeholder-neutral-600"
              />
            </div>
          </div>

          {error && (
            <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-xs font-bold text-center">
              {error}
            </div>
          )}

          <button 
            onClick={handleAuth}
            className="w-full mt-8 bg-red-600 hover:bg-red-500 text-white font-bold py-4 rounded-xl shadow-lg shadow-red-600/20 transition-all active:scale-[0.98] flex items-center justify-center"
          >
            {isLogin ? 'Войти' : 'Создать аккаунт'}
          </button>

        </div>
        
        <p className="text-center text-neutral-600 text-xs mt-8">
            &copy; 2025 NexaChat Inc. Все права защищены.
        </p>
      </div>
    </div>
  );
};

export default AuthScreen;
