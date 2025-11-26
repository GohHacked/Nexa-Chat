
import React, { useState, useEffect } from 'react';
import { User, ThemeMode } from '../types';
import { IconChevronLeft, IconBarChart, IconUsers, IconShield, IconBan, IconVerified, IconSettings } from '../components/Icons';
import { fetchCloudData, updateCloudData } from '../services/cloudLayer';

interface AdminScreenProps {
  onBack: () => void;
  theme: ThemeMode;
}

const USERS_STORAGE_KEY = 'nexachat_users_db';
const MAINTENANCE_KEY = 'nexachat_maintenance';
const CLOUD_ID_KEY = 'nexachat_cloud_id';

const AdminScreen: React.FC<AdminScreenProps> = ({ onBack, theme }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [stats, setStats] = useState({
      totalUsers: 0,
      totalAdmins: 0,
      bannedUsers: 0
  });
  const [verifyUsername, setVerifyUsername] = useState('');
  const [verifyStatus, setVerifyStatus] = useState('');
  
  const [isMaintenance, setIsMaintenance] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');

  const isDark = theme === 'dark';
  const bgBase = isDark ? 'bg-black text-white' : 'bg-white text-gray-900';
  const cardBg = isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-gray-100 shadow-sm';
  const textSub = isDark ? 'text-neutral-400' : 'text-gray-500';
  const inputBg = isDark ? 'bg-neutral-800 border-neutral-700 text-white placeholder-neutral-500' : 'bg-gray-50 border-gray-200 text-black placeholder-gray-400';

  useEffect(() => {
    loadData();
    const maint = localStorage.getItem(MAINTENANCE_KEY) === 'true';
    setIsMaintenance(maint);
  }, []);

  const loadData = () => {
      const db: User[] = JSON.parse(localStorage.getItem(USERS_STORAGE_KEY) || '[]');
      setUsers(db);
      
      setStats({
          totalUsers: db.length,
          totalAdmins: db.filter(u => u.isAdmin).length,
          bannedUsers: db.filter(u => u.isBanned).length
      });
  };

  const toggleBan = (userId: string, currentStatus: boolean) => {
      const updatedUsers = users.map(u => 
        u.id === userId ? { ...u, isBanned: !currentStatus } : u
      );
      setUsers(updatedUsers);
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(updatedUsers));
      loadData(); 
  };
  
  const toggleVerify = (userId: string, currentStatus: boolean) => {
      const updatedUsers = users.map(u => 
        u.id === userId ? { ...u, isVerified: !currentStatus } : u
      );
      setUsers(updatedUsers);
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(updatedUsers));
      loadData(); 
  };

  const handleManualVerify = () => {
      if(!verifyUsername.trim()) return;
      
      const cleanName = verifyUsername.replace('@', '').toLowerCase();
      const targetUser = users.find(u => u.username.toLowerCase() === cleanName);

      if (targetUser) {
          const updatedUsers = users.map(u => 
             u.id === targetUser.id ? { ...u, isVerified: true } : u
          );
          setUsers(updatedUsers);
          localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(updatedUsers));
          loadData();
          setVerifyStatus(`Пользователь @${targetUser.username} верифицирован!`);
          setVerifyUsername('');
          setTimeout(() => setVerifyStatus(''), 3000);
      } else {
          setVerifyStatus('Пользователь не найден.');
          setTimeout(() => setVerifyStatus(''), 3000);
      }
  };

  const handleToggleMaintenance = async () => {
      const newState = !isMaintenance;
      setIsMaintenance(newState);
      localStorage.setItem(MAINTENANCE_KEY, String(newState));
      
      const cloudId = localStorage.getItem(CLOUD_ID_KEY);
      if (cloudId) {
          setStatusMsg('Обновление облака...');
          const data = await fetchCloudData(cloudId);
          if (data) {
              data.maintenanceMode = newState;
              await updateCloudData(cloudId, data);
              setStatusMsg(newState ? 'Тех. работы ВКЛЮЧЕНЫ (Global)' : 'Тех. работы ВЫКЛЮЧЕНЫ (Global)');
          } else {
              setStatusMsg('Ошибка подключения к облаку');
          }
      } else {
          setStatusMsg(newState ? 'Тех. работы ВКЛЮЧЕНЫ (Local)' : 'Тех. работы ВЫКЛЮЧЕНЫ (Local)');
      }
      setTimeout(() => setStatusMsg(''), 3000);
  };

  return (
    <div className={`flex flex-col h-full w-full max-w-4xl mx-auto ${bgBase}`}>
      {/* Header */}
      <div className={`flex items-center p-4 border-b sticky top-0 z-10 backdrop-blur-md ${isDark ? 'border-neutral-800 bg-black/80' : 'border-gray-200 bg-white/80'}`}>
        <button onClick={onBack} className={`p-2 rounded-full mr-4 ${isDark ? 'hover:bg-neutral-800' : 'hover:bg-gray-100'}`}>
          <IconChevronLeft className="w-6 h-6" />
        </button>
        <div>
            <h1 className="text-xl font-bold flex items-center">
                <IconShield className="w-6 h-6 mr-2 text-red-600" />
                Админ Панель
            </h1>
            <p className={`text-xs ${textSub}`}>Управление пользователями и статистика</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className={`p-6 rounded-3xl border flex items-center justify-between ${cardBg}`}>
                <div>
                    <p className={`text-sm font-bold uppercase tracking-wider mb-1 ${textSub}`}>Пользователей</p>
                    <p className="text-3xl font-black">{stats.totalUsers}</p>
                </div>
                <div className="p-4 rounded-full bg-blue-500/10 text-blue-500">
                    <IconUsers className="w-8 h-8" />
                </div>
            </div>
            
            <div className={`p-6 rounded-3xl border flex items-center justify-between ${cardBg}`}>
                <div>
                    <p className={`text-sm font-bold uppercase tracking-wider mb-1 ${textSub}`}>Администраторов</p>
                    <p className="text-3xl font-black">{stats.totalAdmins}</p>
                </div>
                <div className="p-4 rounded-full bg-green-500/10 text-green-500">
                    <IconShield className="w-8 h-8" />
                </div>
            </div>

            <div className={`p-6 rounded-3xl border flex items-center justify-between ${cardBg}`}>
                <div>
                    <p className={`text-sm font-bold uppercase tracking-wider mb-1 ${textSub}`}>Забанено</p>
                    <p className="text-3xl font-black text-red-600">{stats.bannedUsers}</p>
                </div>
                <div className="p-4 rounded-full bg-red-500/10 text-red-600">
                    <IconBan className="w-8 h-8" />
                </div>
            </div>
        </div>

        {/* Global Controls */}
        <div className={`p-6 rounded-3xl border mb-8 border-red-900/30 bg-gradient-to-r from-red-950/20 to-black`}>
            <h3 className="font-bold text-lg mb-4 flex items-center text-red-500">
                <IconSettings className="w-5 h-5 mr-2" />
                Глобальное Управление
            </h3>
            <div className="flex items-center justify-between">
                <div>
                    <p className="font-bold text-white">Режим Технических Работ</p>
                    <p className="text-xs text-neutral-400">Блокирует доступ всем пользователям кроме админов</p>
                </div>
                <button 
                    onClick={handleToggleMaintenance}
                    className={`relative w-14 h-8 rounded-full transition-colors duration-300 ${isMaintenance ? 'bg-red-600' : 'bg-neutral-700'}`}
                >
                    <div className={`absolute top-1 bg-white w-6 h-6 rounded-full transition-all duration-300 shadow-sm ${isMaintenance ? 'left-7' : 'left-1'}`}></div>
                </button>
            </div>
            {statusMsg && <p className="text-xs font-bold text-red-400 mt-2 text-right">{statusMsg}</p>}
        </div>
        
        {/* Manual Verification */}
        <div className={`p-6 rounded-3xl border mb-8 ${cardBg}`}>
            <h3 className="font-bold text-lg mb-4 flex items-center">
                <IconVerified className="w-5 h-5 text-blue-500 mr-2" />
                Выдать верификацию
            </h3>
            <div className="flex gap-4">
                <input 
                    type="text" 
                    value={verifyUsername}
                    onChange={(e) => setVerifyUsername(e.target.value)}
                    placeholder="Введите @username" 
                    className={`flex-1 p-3 rounded-xl border focus:outline-none focus:ring-1 focus:ring-blue-500 ${inputBg}`}
                />
                <button 
                    onClick={handleManualVerify}
                    className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-6 rounded-xl transition-colors"
                >
                    Выдать
                </button>
            </div>
            {verifyStatus && <p className={`mt-2 text-sm font-bold ${verifyStatus.includes('не найден') ? 'text-red-500' : 'text-green-500'}`}>{verifyStatus}</p>}
        </div>

        {/* User List */}
        <h2 className="text-xl font-bold mb-4 px-1">Список Пользователей</h2>
        <div className={`rounded-3xl border overflow-hidden ${cardBg}`}>
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead className={`border-b ${isDark ? 'border-neutral-800 bg-neutral-800/50' : 'border-gray-100 bg-gray-50'}`}>
                        <tr>
                            <th className={`p-4 text-xs font-bold uppercase tracking-wider ${textSub}`}>Пользователь</th>
                            <th className={`p-4 text-xs font-bold uppercase tracking-wider ${textSub}`}>Email</th>
                            <th className={`p-4 text-xs font-bold uppercase tracking-wider ${textSub}`}>Статус</th>
                            <th className={`p-4 text-xs font-bold uppercase tracking-wider ${textSub} text-right`}>Действия</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-800/10">
                        {users.map(user => (
                            <tr key={user.id} className={`${isDark ? 'hover:bg-neutral-800/30' : 'hover:bg-gray-50'}`}>
                                <td className="p-4">
                                    <div className="flex items-center">
                                        <img src={user.avatar} className="w-10 h-10 rounded-full mr-3 bg-neutral-800" alt="ava" />
                                        <div>
                                            <p className="font-bold text-sm flex items-center">
                                                {user.name}
                                                {user.isVerified && <IconVerified className="w-3 h-3 text-blue-500 ml-1" />}
                                            </p>
                                            <p className={`text-xs ${textSub}`}>@{user.username}</p>
                                        </div>
                                    </div>
                                </td>
                                <td className={`p-4 text-sm ${textSub}`}>{user.email}</td>
                                <td className="p-4">
                                    {user.isAdmin && <span className="mr-2 px-2 py-1 rounded-md bg-red-600 text-white text-[10px] font-bold uppercase">Admin</span>}
                                    {user.isVerified && <span className="px-2 py-1 rounded-md bg-blue-600/20 text-blue-500 text-[10px] font-bold uppercase border border-blue-500/20">Verified</span>}
                                </td>
                                <td className="p-4 text-right flex justify-end gap-2">
                                    {!user.isAdmin && (
                                        <>
                                        <button 
                                            onClick={() => toggleVerify(user.id, !!user.isVerified)}
                                            className={`p-2 rounded-xl text-xs font-bold transition-all border ${
                                                user.isVerified 
                                                ? 'bg-transparent text-neutral-500 border-neutral-700' 
                                                : 'bg-blue-600/10 text-blue-500 border-blue-600/20 hover:bg-blue-600/20'
                                            }`}
                                            title={user.isVerified ? "Снять верификацию" : "Выдать верификацию"}
                                        >
                                           <IconVerified className="w-4 h-4" />
                                        </button>
                                        <button 
                                            onClick={() => toggleBan(user.id, !!user.isBanned)}
                                            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                                                user.isBanned 
                                                ? 'bg-green-600 text-white hover:bg-green-500' 
                                                : 'bg-neutral-800 text-red-500 hover:bg-neutral-700'
                                            }`}
                                        >
                                            {user.isBanned ? 'Разбанить' : 'Забанить'}
                                        </button>
                                        </>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>

      </div>
    </div>
  );
};

export default AdminScreen;
