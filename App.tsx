
import React, { useState, useEffect, useRef } from 'react';
import BottomNav from './components/BottomNav';
import ChatList from './screens/ChatList';
import SearchScreen from './screens/SearchScreen';
import SettingsScreen from './screens/SettingsScreen';
import ChatScreen from './screens/ChatScreen';
import AuthScreen from './screens/AuthScreen';
import AdminScreen from './screens/AdminScreen';
import InfoPage from './screens/InfoPages';
import LoadingScreen from './screens/LoadingScreen';
import MaintenanceScreen from './screens/MaintenanceScreen';
import { AppScreen, ChatSession, User, Message, PRESET_USERS, ThemeMode, Invitation, GlobalState } from './types';
import { IconUserPlus } from './components/Icons';
import { fetchCloudData, updateCloudData } from './services/cloudLayer';

const STORAGE_KEY = 'nexachat_sessions_v1';
const AUTH_USER_ID_KEY = 'nexachat_auth_user_id';
const THEME_KEY = 'nexachat_theme';
const USERS_STORAGE_KEY = 'nexachat_users_db';
const INVITES_PREFIX = 'nexachat_invites_';
const CLOUD_ID_KEY = 'nexachat_cloud_id';
const MAINTENANCE_KEY = 'nexachat_maintenance';

const DEFAULT_GROUP_ID = 'group_friends_nearby';

const App: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeScreen, setActiveScreen] = useState<AppScreen>(AppScreen.CHATS);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [cloudId, setCloudId] = useState<string | null>(null);
  
  const [incomingInvite, setIncomingInvite] = useState<Invitation | null>(null);
  const [isMaintenance, setIsMaintenance] = useState(false);
  
  const sessionsRef = useRef<ChatSession[]>([]);
  const activeScreenRef = useRef<AppScreen>(AppScreen.CHATS);
  const currentChatIdRef = useRef<string | null>(null);
  
  const [theme, setTheme] = useState<ThemeMode>('dark');
  const [userProfile, setUserProfile] = useState<User>({ id: 'guest', name: 'Гость', username: 'guest', avatar: '', bio: '' });

  const pollIntervalRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
      sessionsRef.current = sessions;
      activeScreenRef.current = activeScreen;
      currentChatIdRef.current = currentChatId;
  }, [sessions, activeScreen, currentChatId]);

  useEffect(() => {
    // Initial Setup
    const usersDb: User[] = JSON.parse(localStorage.getItem(USERS_STORAGE_KEY) || '[]');
    if (!usersDb.find(u => u.email === 'goh@gmajl.com')) {
        const adminUser: User = { id: 'admin_goh', name: 'Администратор', username: 'admin', email: 'goh@gmajl.com', password: '123', avatar: 'https://api.dicebear.com/9.x/adventurer/svg?seed=AdminBoss', bio: 'Системный администратор', isAdmin: true, isBanned: false, isVerified: true };
        localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify([...usersDb, adminUser]));
    }
    const storedTheme = localStorage.getItem(THEME_KEY) as ThemeMode;
    if (storedTheme) setTheme(storedTheme);
    const storedCloud = localStorage.getItem(CLOUD_ID_KEY);
    if (storedCloud) setCloudId(storedCloud);
    const maint = localStorage.getItem(MAINTENANCE_KEY) === 'true';
    setIsMaintenance(maint);

    // Auth Check with Delay for Splash Screen
    const storedUserId = localStorage.getItem(AUTH_USER_ID_KEY);
    
    // Simulate Loading Process
    setTimeout(() => {
        if (storedUserId) {
            const currentDb: User[] = JSON.parse(localStorage.getItem(USERS_STORAGE_KEY) || '[]');
            const user = currentDb.find(u => u.id === storedUserId);
            if (user && !user.isBanned) {
                setUserProfile(user);
                setIsAuthenticated(true);
                loadUserSessions(user.id);
            } else {
                localStorage.removeItem(AUTH_USER_ID_KEY);
                setIsAuthenticated(false);
            }
        } else {
            setIsAuthenticated(false);
        }
        setIsLoading(false);
    }, 1500);

    if ("Notification" in window && Notification.permission !== "granted") Notification.requestPermission();
  }, []);

  useEffect(() => {
    localStorage.setItem(THEME_KEY, theme);
    document.body.style.backgroundColor = theme === 'dark' ? '#000000' : '#ffffff';
  }, [theme]);

  useEffect(() => {
      if (isAuthenticated && userProfile.id && !isLoading) {
          const poll = async () => {
              // Poll Maintenance status
              const localMaint = localStorage.getItem(MAINTENANCE_KEY) === 'true';
              if (!cloudId && localMaint !== isMaintenance) {
                   setIsMaintenance(localMaint);
              }

              if (cloudId) {
                  const cloudData = await fetchCloudData(cloudId);
                  if (cloudData) {
                      // Maintenance check from cloud
                      if (cloudData.maintenanceMode !== undefined && cloudData.maintenanceMode !== isMaintenance) {
                          setIsMaintenance(cloudData.maintenanceMode);
                          localStorage.setItem(MAINTENANCE_KEY, String(cloudData.maintenanceMode));
                      }

                      // User Sync Logic
                      const userInCloud = cloudData.users.find(u => u.id === userProfile.id);
                      let needUpdate = false;
                      
                      // 1. Sync self to cloud if missing or updated
                      if (!userInCloud || JSON.stringify(userInCloud) !== JSON.stringify(userProfile)) {
                          if (!userInCloud) {
                              cloudData.users.push(userProfile);
                          } else {
                              cloudData.users = cloudData.users.map(u => u.id === userProfile.id ? userProfile : u);
                          }
                          needUpdate = true;
                      }

                      // 2. Sync cloud users to local DB (CRITICAL FOR SEARCH)
                      const localUsersStr = localStorage.getItem(USERS_STORAGE_KEY);
                      if (JSON.stringify(cloudData.users) !== localUsersStr) {
                          localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(cloudData.users));
                      }
                      
                      // 3. Deep Sync Profile (Check if other users updated their avatar/name)
                      const newSessions = [...sessionsRef.current];
                      let sessionsChanged = false;
                      
                      newSessions.forEach((session, idx) => {
                          if (!session.isGroup) {
                             const updatedPeer = cloudData.users.find(u => u.id === session.participant.id);
                             if (updatedPeer && (updatedPeer.avatar !== session.participant.avatar || updatedPeer.name !== session.participant.name || updatedPeer.isVerified !== session.participant.isVerified)) {
                                 newSessions[idx] = { ...session, participant: { ...session.participant, ...updatedPeer } };
                                 sessionsChanged = true;
                             }
                          } else if (session.isGroup && session.participants) {
                              // Sync group participants
                              const updatedParticipants = session.participants.map(p => {
                                  const freshP = cloudData.users.find(u => u.id === p.id);
                                  return freshP ? freshP : p;
                              });
                              if (JSON.stringify(updatedParticipants) !== JSON.stringify(session.participants)) {
                                  newSessions[idx] = { ...session, participants: updatedParticipants };
                                  sessionsChanged = true;
                              }
                          }
                      });

                      if (sessionsChanged) {
                           setSessions(newSessions);
                           localStorage.setItem(`${STORAGE_KEY}_${userProfile.id}`, JSON.stringify(newSessions));
                      }
                      
                      // 4. Update cloud if we changed something about ourselves
                      if (needUpdate) {
                          await updateCloudData(cloudId, cloudData);
                      }

                      const mySessions = cloudData.chats[userProfile.id] || [];
                      
                      if (JSON.stringify(mySessions) !== JSON.stringify(sessionsRef.current) && !sessionsChanged) {
                           mySessions.forEach(newSession => {
                               const oldSession = sessionsRef.current.find(s => s.id === newSession.id);
                               if (newSession.lastMessage && (!oldSession || (oldSession.lastMessage?.id !== newSession.lastMessage.id))) {
                                   if (newSession.lastMessage.sender !== 'me' && newSession.lastMessage.sender !== 'system') notify(newSession);
                               }
                           });
                           setSessions(mySessions);
                           localStorage.setItem(`${STORAGE_KEY}_${userProfile.id}`, JSON.stringify(mySessions));
                      }
                      const myInvites = cloudData.invites[userProfile.id] || [];
                      if (myInvites.length > 0) { setIncomingInvite(myInvites[0]); localStorage.setItem(`${INVITES_PREFIX}${userProfile.id}`, JSON.stringify(myInvites)); } else { setIncomingInvite(null); }
                      return;
                  }
              }

              // Local Fallback logic
              const userSessionKey = `${STORAGE_KEY}_${userProfile.id}`;
              const stored = localStorage.getItem(userSessionKey);
              if (stored) {
                  try {
                      const parsed = JSON.parse(stored) as ChatSession[];
                      parsed.forEach(newSession => {
                          const oldSession = sessionsRef.current.find(s => s.id === newSession.id);
                          if (newSession.lastMessage && (!oldSession || (oldSession.lastMessage?.id !== newSession.lastMessage.id))) {
                              if (newSession.lastMessage.sender !== 'me' && newSession.lastMessage.sender !== 'system') notify(newSession);
                          }
                      });
                      setSessions(prev => JSON.stringify(prev) !== stored ? parsed : prev);
                  } catch(e) {}
              }
              const inviteKey = `${INVITES_PREFIX}${userProfile.id}`;
              const invitesStr = localStorage.getItem(inviteKey);
              if (invitesStr) {
                  try {
                      const invites = JSON.parse(invitesStr);
                      setIncomingInvite(invites.length > 0 ? invites[0] : null);
                  } catch(e) {}
              }
          };
          pollIntervalRef.current = setInterval(poll, 3000);
      }
      return () => { if (pollIntervalRef.current) clearInterval(pollIntervalRef.current); }
  }, [isAuthenticated, userProfile.id, cloudId, isLoading]);

  const notify = (session: ChatSession) => {
      const isChatOpen = activeScreenRef.current === AppScreen.CHAT_ROOM && currentChatIdRef.current === session.id;
      if (!isChatOpen || document.hidden) {
          if (Notification.permission === "granted") {
              const notif = new Notification(session.participant.name, { body: session.lastMessage?.text || 'Новое сообщение', icon: session.participant.avatar });
              setTimeout(() => notif.close(), 4000);
          }
      }
  }

  const loadUserSessions = (userId: string) => {
      const userSessionKey = `${STORAGE_KEY}_${userId}`;
      const storedSessions = localStorage.getItem(userSessionKey);
      let loadedSessions: ChatSession[] = [];

      if (storedSessions) {
        try { loadedSessions = JSON.parse(storedSessions); } catch (e) { console.error(e); }
      } 
      
      // Ensure Welcome Chat exists
      if (!loadedSessions.find(s => s.id === 'welcome-chat')) {
          const initialChat: ChatSession = {
              id: 'welcome-chat',
              participant: PRESET_USERS[0],
              messages: [{ id: '1', text: `Привет! Я Nexa Ассистент.`, sender: 'other', timestamp: Date.now(), status: 'read' }],
              lastMessage: { id: '1', text: 'Привет! Я Nexa Ассистент.', sender: 'other', timestamp: Date.now(), status: 'read' },
              unreadCount: 1, updatedAt: Date.now()
          };
          loadedSessions.push(initialChat);
      }

      // Ensure Default Group exists
      if (!loadedSessions.find(s => s.id === DEFAULT_GROUP_ID)) {
          const defaultGroup: ChatSession = {
              id: DEFAULT_GROUP_ID,
              participant: {
                  id: DEFAULT_GROUP_ID,
                  name: 'Друзья рядом!',
                  username: 'friends_nearby',
                  avatar: 'https://api.dicebear.com/9.x/initials/svg?seed=Friends&backgroundColor=16a34a',
                  bio: 'Открытая группа для всех пользователей NexaChat.'
              },
              messages: [
                  { id: 'g1', text: 'Добро пожаловать в общий чат! Здесь можно найти новых друзей.', sender: 'system', timestamp: Date.now(), status: 'read', isSystem: true }
              ],
              lastMessage: { id: 'g1', text: 'Добро пожаловать в общий чат!', sender: 'system', timestamp: Date.now(), status: 'read' },
              unreadCount: 0,
              updatedAt: Date.now(),
              isGroup: true,
              hasJoined: false, 
              participants: []
          };
          loadedSessions.push(defaultGroup);
      }

      setSessions(loadedSessions);
      localStorage.setItem(userSessionKey, JSON.stringify(loadedSessions));
  };

  const handleUpdateProfile = async (updatedUser: User) => {
      setUserProfile(updatedUser);
      const usersDb: User[] = JSON.parse(localStorage.getItem(USERS_STORAGE_KEY) || '[]');
      const newDb = usersDb.map(u => u.id === updatedUser.id ? updatedUser : u);
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(newDb));
      if (cloudId) {
          const cloudData = await fetchCloudData(cloudId);
          if (cloudData) {
              const newCloudUsers = cloudData.users.map(u => u.id === updatedUser.id ? updatedUser : u);
              await updateCloudData(cloudId, { ...cloudData, users: newCloudUsers });
          }
      }
  };

  const handleLogin = async (user: User) => {
      setUserProfile(user);
      setIsAuthenticated(true);
      localStorage.setItem(AUTH_USER_ID_KEY, user.id);
      loadUserSessions(user.id);
      setActiveScreen(AppScreen.CHATS);
      if (cloudId) {
          const cloudData = await fetchCloudData(cloudId);
          if (cloudData) {
              if (!cloudData.users.find(u => u.id === user.id)) {
                  cloudData.users.push(user);
                  await updateCloudData(cloudId, cloudData);
              }
          }
      }
  };

  const handleLogout = () => { setIsAuthenticated(false); localStorage.removeItem(AUTH_USER_ID_KEY); setSessions([]); setActiveScreen(AppScreen.AUTH); };
  const handleSetCloudId = (id: string | null) => { id ? localStorage.setItem(CLOUD_ID_KEY, id) : localStorage.removeItem(CLOUD_ID_KEY); setCloudId(id); };

  const handleSelectChat = (chatId: string) => {
    const updatedSessions = sessions.map(s => s.id === chatId ? { ...s, unreadCount: 0 } : s);
    setSessions(updatedSessions);
    localStorage.setItem(`${STORAGE_KEY}_${userProfile.id}`, JSON.stringify(updatedSessions));
    if (cloudId) {
        fetchCloudData(cloudId).then(data => {
            if(data) {
                if(!data.chats[userProfile.id]) data.chats[userProfile.id] = [];
                data.chats[userProfile.id] = updatedSessions;
                updateCloudData(cloudId, data);
            }
        });
    }
    setCurrentChatId(chatId);
    setActiveScreen(AppScreen.CHAT_ROOM);
  };

  const handleStartChat = async (user: User) => {
    const existing = sessions.find(s => s.participant.id === user.id);
    if (existing) { 
        handleSelectChat(existing.id); 
        setCurrentChatId(existing.id);
        setActiveScreen(AppScreen.CHAT_ROOM);
        return; 
    }
    const newChat: ChatSession = { id: Date.now().toString() + "_" + Math.random().toString(36).substr(2, 9), participant: user, messages: [], unreadCount: 0, updatedAt: Date.now() };
    const newSessions = [newChat, ...sessions];
    setSessions(newSessions);
    localStorage.setItem(`${STORAGE_KEY}_${userProfile.id}`, JSON.stringify(newSessions));
    if (cloudId) {
        const data = await fetchCloudData(cloudId);
        if (data) {
            if(!data.chats[userProfile.id]) data.chats[userProfile.id] = [];
            data.chats[userProfile.id] = newSessions;
            await updateCloudData(cloudId, data);
        }
    }
    setCurrentChatId(newChat.id);
    setActiveScreen(AppScreen.CHAT_ROOM);
  };

  const handleJoinGroup = async (chatId: string) => {
      const chat = sessions.find(s => s.id === chatId);
      if (!chat) return;

      const systemMsg: Message = {
          id: Date.now().toString(),
          text: `Пользователь ${userProfile.name} присоединился к группе`,
          sender: 'system',
          senderName: 'System',
          timestamp: Date.now(),
          status: 'read',
          isSystem: true
      };

      const updatedParticipants = [...(chat.participants || []), userProfile];
      const uniqueParticipants = Array.from(new Map(updatedParticipants.map(item => [item.id, item])).values());

      const updatedChat: ChatSession = {
          ...chat,
          hasJoined: true,
          participants: uniqueParticipants,
          messages: [...chat.messages, systemMsg],
          lastMessage: systemMsg,
          updatedAt: Date.now()
      };

      const updatedSessions = sessions.map(s => s.id === chatId ? updatedChat : s);
      setSessions(updatedSessions);
      localStorage.setItem(`${STORAGE_KEY}_${userProfile.id}`, JSON.stringify(updatedSessions));

      if (cloudId) {
          const data = await fetchCloudData(cloudId);
          if (data) {
              data.chats[userProfile.id] = updatedSessions;
              for (const p of uniqueParticipants) {
                  if (p.id === userProfile.id) continue;
                  const theirSessions = data.chats[p.id] || [];
                  const theirChat = theirSessions.find(s => s.id === chatId);
                  if (theirChat) {
                       theirChat.messages = updatedChat.messages;
                       theirChat.lastMessage = systemMsg;
                       theirChat.updatedAt = Date.now();
                       theirChat.participants = uniqueParticipants;
                       data.chats[p.id] = theirSessions;
                  }
              }
              await updateCloudData(cloudId, data);
          }
      } else {
          for (const p of uniqueParticipants) {
               if (p.id === userProfile.id) continue;
               const recipientStorageKey = `${STORAGE_KEY}_${p.id}`;
               const recipientSessionsRaw = localStorage.getItem(recipientStorageKey);
               if (recipientSessionsRaw) {
                   const rSessions: ChatSession[] = JSON.parse(recipientSessionsRaw);
                   const rChat = rSessions.find(s => s.id === chatId);
                   if (rChat) {
                       rChat.messages = updatedChat.messages;
                       rChat.lastMessage = systemMsg;
                       rChat.participants = uniqueParticipants;
                       rChat.updatedAt = Date.now();
                       localStorage.setItem(recipientStorageKey, JSON.stringify(rSessions));
                   }
               }
          }
      }
  };
  
  const handleCreateGroup = async (name: string) => {
      const groupUser: User = {
          id: 'group_' + Date.now(),
          name: name,
          username: 'group',
          avatar: `https://api.dicebear.com/9.x/initials/svg?seed=${name}&backgroundColor=ef4444`,
          bio: 'Групповой чат'
      };
      const newChat: ChatSession = {
          id: groupUser.id,
          participant: groupUser,
          messages: [],
          unreadCount: 0,
          updatedAt: Date.now(),
          isGroup: true,
          adminId: userProfile.id,
          participants: [userProfile],
          hasJoined: true
      };
      const newSessions = [newChat, ...sessions];
      setSessions(newSessions);
      localStorage.setItem(`${STORAGE_KEY}_${userProfile.id}`, JSON.stringify(newSessions));
      if(cloudId) {
          const data = await fetchCloudData(cloudId);
          if(data) {
              data.chats[userProfile.id] = newSessions;
              await updateCloudData(cloudId, data);
          }
      }
      setCurrentChatId(newChat.id);
      setActiveScreen(AppScreen.CHAT_ROOM);
  };

  const handleAddMemberToGroup = async (chatId: string, username: string): Promise<{success: boolean, message: string}> => {
      const cleanName = username.replace('@','').toLowerCase();
      // Ensure we look at the freshest DB
      const db: User[] = JSON.parse(localStorage.getItem(USERS_STORAGE_KEY) || '[]');
      const targetUser = db.find(u => u.username.toLowerCase() === cleanName);
      
      if (!targetUser) return { success: false, message: 'Пользователь не найден' };
      
      const currentChat = sessions.find(s => s.id === chatId);
      if (!currentChat) return { success: false, message: 'Ошибка чата' };
      if (currentChat.participants?.find(p => p.id === targetUser.id)) return { success: false, message: 'Уже в группе' };

      const systemMsg: Message = {
          id: Date.now().toString(),
          text: `Пользователь ${userProfile.name} добавил ${targetUser.name}`,
          sender: 'system',
          senderName: 'System',
          timestamp: Date.now(),
          status: 'read',
          isSystem: true
      };

      const updatedParticipants = [...(currentChat.participants || []), targetUser];
      // De-duplicate just in case
      const uniqueParticipants = Array.from(new Map(updatedParticipants.map(item => [item.id, item])).values());

      const updatedChat = { 
          ...currentChat, 
          participants: uniqueParticipants,
          messages: [...currentChat.messages, systemMsg],
          lastMessage: systemMsg,
          updatedAt: Date.now()
      };
      
      const updatedSessions = sessions.map(s => s.id === chatId ? updatedChat : s);
      setSessions(updatedSessions);
      localStorage.setItem(`${STORAGE_KEY}_${userProfile.id}`, JSON.stringify(updatedSessions));

      if (cloudId) {
          const data = await fetchCloudData(cloudId);
          if (data) {
              data.chats[userProfile.id] = updatedSessions;
              
              // Propagate to ALL participants
              for (const p of uniqueParticipants) {
                   if (p.id === userProfile.id) continue;
                   const theirSessions = data.chats[p.id] || [];
                   const theirChat = theirSessions.find(s => s.id === chatId);
                   if (theirChat) {
                       theirChat.participants = uniqueParticipants;
                       theirChat.messages = updatedChat.messages;
                       theirChat.lastMessage = systemMsg;
                       theirChat.updatedAt = Date.now();
                       data.chats[p.id] = theirSessions.map(s => s.id === chatId ? theirChat : s);
                   } else {
                       // New member getting the chat
                       data.chats[p.id] = [{...updatedChat, unreadCount: 1, hasJoined: true}, ...theirSessions];
                   }
              }
              await updateCloudData(cloudId, data);
          }
      } else {
          // Local propagation
           for (const p of uniqueParticipants) {
               if (p.id === userProfile.id) continue;
               const targetKey = `${STORAGE_KEY}_${p.id}`;
               const theirSessionsRaw = localStorage.getItem(targetKey);
               const theirSessions: ChatSession[] = theirSessionsRaw ? JSON.parse(theirSessionsRaw) : [];
               
               const theirChat = theirSessions.find(s => s.id === chatId);
               if (theirChat) {
                   theirChat.participants = uniqueParticipants;
                   theirChat.messages = updatedChat.messages;
                   theirChat.lastMessage = systemMsg;
                   theirChat.updatedAt = Date.now();
                   localStorage.setItem(targetKey, JSON.stringify(theirSessions.map(s => s.id === chatId ? theirChat : s)));
               } else {
                   localStorage.setItem(targetKey, JSON.stringify([{...updatedChat, unreadCount: 1, hasJoined: true}, ...theirSessions]));
               }
          }
      }

      return { success: true, message: 'Участник добавлен' };
  };

  const handleUpdateChat = async (chatId: string, messages: Message[]) => {
    const chatToUpdate = sessions.find(s => s.id === chatId);
    if (!chatToUpdate) return;
    const lastMsg = messages[messages.length - 1];
    const updatedSessions = sessions.map(s => s.id === chatId ? { ...s, messages, lastMessage: lastMsg, updatedAt: Date.now() } : s);
    setSessions(updatedSessions);
    localStorage.setItem(`${STORAGE_KEY}_${userProfile.id}`, JSON.stringify(updatedSessions));

    if (chatToUpdate.isGroup && chatToUpdate.participants) {
        if (cloudId) {
            const data = await fetchCloudData(cloudId);
            if (data) {
                data.chats[userProfile.id] = updatedSessions; 
                for (const p of chatToUpdate.participants) {
                    if (p.id === userProfile.id) continue;
                    const theirSessions = data.chats[p.id] || [];
                    const theirChat = theirSessions.find(s => s.id === chatId);
                    if (theirChat) {
                        theirChat.messages = messages;
                        theirChat.lastMessage = lastMsg;
                        if (lastMsg.sender !== p.id) theirChat.unreadCount += 1;
                        theirChat.updatedAt = Date.now();
                        data.chats[p.id] = theirSessions;
                    } else {
                        data.chats[p.id] = [{...chatToUpdate, messages, lastMessage: lastMsg, unreadCount: 1, hasJoined: true}, ...theirSessions];
                    }
                }
                await updateCloudData(cloudId, data);
            }
        } else {
            for (const p of chatToUpdate.participants) {
                if (p.id === userProfile.id) continue;
                deliverMessageToRecipientLocal(p.id, userProfile, lastMsg, true, chatId, messages);
            }
        }
    } else {
        const recipient = chatToUpdate.participant;
        const isBot = PRESET_USERS.some(u => u.id === recipient.id);
        if (lastMsg && lastMsg.sender === 'me' && !isBot) {
            if (cloudId) {
                const data = await fetchCloudData(cloudId);
                if (data) {
                    data.chats[userProfile.id] = updatedSessions;
                    if (!data.chats[recipient.id]) data.chats[recipient.id] = [];
                    let theirSessions = data.chats[recipient.id];
                    let chatWithMe = theirSessions.find(s => s.participant.id === userProfile.id);
                    const incomingMsg: Message = { ...lastMsg, sender: 'other', status: 'delivered' };
                    if (chatWithMe) {
                        chatWithMe.messages.push(incomingMsg);
                        chatWithMe.lastMessage = incomingMsg;
                        chatWithMe.unreadCount += 1;
                        chatWithMe.updatedAt = Date.now();
                    } else {
                        const newSession: ChatSession = { id: Date.now().toString(), participant: userProfile, messages: [incomingMsg], lastMessage: incomingMsg, unreadCount: 1, updatedAt: Date.now() };
                        theirSessions = [newSession, ...theirSessions];
                    }
                    data.chats[recipient.id] = theirSessions;
                    await updateCloudData(cloudId, data);
                }
            } else {
                deliverMessageToRecipientLocal(recipient.id, userProfile, lastMsg);
            }
        }
    }
  };

  const deliverMessageToRecipientLocal = (recipientId: string, sender: User, messageSent: Message, isGroup = false, groupId?: string, fullMessages?: Message[]) => {
      const recipientStorageKey = `${STORAGE_KEY}_${recipientId}`;
      const recipientSessionsRaw = localStorage.getItem(recipientStorageKey);
      let recipientSessions: ChatSession[] = recipientSessionsRaw ? JSON.parse(recipientSessionsRaw) : [];

      if (isGroup && groupId) {
           let groupChat = recipientSessions.find(s => s.id === groupId);
           if (groupChat) {
               groupChat.messages = fullMessages || [];
               groupChat.lastMessage = messageSent;
               groupChat.unreadCount += 1;
               groupChat.updatedAt = Date.now();
               recipientSessions = recipientSessions.map(s => s.id === groupId ? groupChat! : s);
           }
      } else {
          let chatWithMe = recipientSessions.find(s => s.participant.id === sender.id);
          const incomingMsg: Message = { ...messageSent, sender: 'other', status: 'delivered' };
          if (chatWithMe) {
              chatWithMe.messages.push(incomingMsg);
              chatWithMe.lastMessage = incomingMsg;
              chatWithMe.unreadCount += 1;
              chatWithMe.updatedAt = Date.now();
              recipientSessions = recipientSessions.map(s => s.id === chatWithMe?.id ? chatWithMe : s);
          } else {
              const newSession: ChatSession = { id: Date.now().toString(), participant: sender, messages: [incomingMsg], lastMessage: incomingMsg, unreadCount: 1, updatedAt: Date.now() };
              recipientSessions = [newSession, ...recipientSessions];
          }
      }
      localStorage.setItem(recipientStorageKey, JSON.stringify(recipientSessions));
  };

  const handleReset = () => { if(window.confirm("Удалить все чаты?")) { setSessions([]); if (userProfile.id) { localStorage.removeItem(`${STORAGE_KEY}_${userProfile.id}`); localStorage.removeItem(`${INVITES_PREFIX}${userProfile.id}`); } window.location.reload(); } };
  const clearInvites = async () => { setIncomingInvite(null); localStorage.removeItem(`${INVITES_PREFIX}${userProfile.id}`); if (cloudId) { const data = await fetchCloudData(cloudId); if (data) { data.invites[userProfile.id] = []; await updateCloudData(cloudId, data); } } };
  const acceptInvite = () => { if (incomingInvite) { handleStartChat(incomingInvite.fromUser); clearInvites(); } };
  const getCurrentChat = () => sessions.find(s => s.id === currentChatId);
  const totalUnread = sessions.reduce((acc, s) => acc + s.unreadCount, 0);

  // RENDERING
  if (isLoading) return <LoadingScreen />;

  // Maintenance Check: If maintenance is ON and user is NOT admin, show blocker
  if (isAuthenticated && isMaintenance && !userProfile.isAdmin) {
      return <MaintenanceScreen />;
  }

  if (!isAuthenticated) return <AuthScreen onLogin={handleLogin} />;
  const bgClass = theme === 'dark' ? 'bg-black text-white' : 'bg-white text-black';
  const isDark = theme === 'dark';

  return (
    <div className={`min-h-screen font-sans antialiased ${bgClass}`}>
      {activeScreen === AppScreen.CHATS && (
        <ChatList chats={sessions} onSelectChat={handleSelectChat} onNewChat={() => setActiveScreen(AppScreen.SEARCH)} onCreateGroup={handleCreateGroup} theme={theme} currentUser={userProfile} />
      )}
      {activeScreen === AppScreen.SEARCH && <SearchScreen onStartChat={handleStartChat} theme={theme} />}
      {activeScreen === AppScreen.SETTINGS && (
        <SettingsScreen userProfile={userProfile} onUpdateProfile={handleUpdateProfile} theme={theme} onToggleTheme={() => setTheme(prev => prev === 'dark' ? 'light' : 'dark')} onReset={handleReset} onLogout={handleLogout} onOpenAdmin={() => setActiveScreen(AppScreen.ADMIN_PANEL)} onOpenRules={() => setActiveScreen(AppScreen.RULES)} onOpenPrivacy={() => setActiveScreen(AppScreen.PRIVACY)} cloudId={cloudId} onSetCloudId={handleSetCloudId} />
      )}
      {activeScreen === AppScreen.ADMIN_PANEL && <AdminScreen onBack={() => setActiveScreen(AppScreen.SETTINGS)} theme={theme} />}
      {(activeScreen === AppScreen.RULES || activeScreen === AppScreen.PRIVACY) && <InfoPage type={activeScreen === AppScreen.RULES ? 'rules' : 'privacy'} onBack={() => setActiveScreen(AppScreen.SETTINGS)} theme={theme} />}
      {activeScreen === AppScreen.CHAT_ROOM && getCurrentChat() && (
        <ChatScreen 
            chat={getCurrentChat()!} 
            onBack={() => setActiveScreen(AppScreen.CHATS)} 
            onUpdateChat={handleUpdateChat} 
            onAddMember={handleAddMemberToGroup} 
            onJoinGroup={handleJoinGroup}
            onStartDirectChat={handleStartChat}
            theme={theme} 
            currentUser={userProfile} 
        />
      )}
      {![AppScreen.ADMIN_PANEL, AppScreen.RULES, AppScreen.PRIVACY, AppScreen.CHAT_ROOM].includes(activeScreen) && <BottomNav currentScreen={activeScreen} setScreen={setActiveScreen} theme={theme} unreadCount={totalUnread} />}
      
      {incomingInvite && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-[fadeIn_0.3s_ease-out]">
              <div className={`w-full max-w-sm rounded-3xl p-6 relative ${isDark ? 'bg-neutral-900 border border-neutral-800' : 'bg-white'}`}>
                  <div className="text-center mb-6">
                      <div className="w-20 h-20 rounded-full mx-auto mb-4 border-4 border-blue-600/30 p-1"><img src={incomingInvite.fromUser.avatar} className="w-full h-full rounded-full object-cover bg-black" /></div>
                      <h3 className="text-xl font-bold flex items-center justify-center gap-1">{incomingInvite.fromUser.name}<IconUserPlus className="w-5 h-5 text-blue-500" /></h3>
                      <p className="text-blue-500 font-bold mb-2">@{incomingInvite.fromUser.username}</p>
                      <p className={`text-sm ${isDark ? 'text-neutral-400' : 'text-gray-500'}`}>Хочет пообщаться с вами</p>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                      <button onClick={clearInvites} className={`py-3 rounded-xl font-bold text-sm ${isDark ? 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>Отмена</button>
                      <button onClick={acceptInvite} className="py-3 rounded-xl font-bold text-sm bg-blue-600 text-white hover:bg-blue-500 shadow-lg shadow-blue-600/20">В чат</button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default App;
