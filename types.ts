
export interface User {
  id: string;
  name: string;
  username: string;
  avatar: string;
  bio: string;
  email?: string; // Added for auth
  password?: string; // Stored locally for demo purposes only
  systemInstruction?: string; // For AI persona
  isAdmin?: boolean; // Admin privilege
  isBanned?: boolean; // Ban status
  isVerified?: boolean; // Blue checkmark status
  profileMusic?: string; // Base64 MP3 string
}

export type AttachmentType = 'image' | 'video' | 'audio' | 'file' | 'sticker' | 'gif';

export interface Attachment {
  type: AttachmentType;
  url: string;
  name?: string; // For files
  size?: string; // For files
}

export interface Message {
  id: string;
  text: string;
  sender: 'me' | 'other' | string; // string = userId in groups
  timestamp: number;
  status: 'sent' | 'delivered' | 'read';
  attachment?: Attachment;
  isEdited?: boolean; // Track if message was edited
  senderName?: string; // Display name for groups
  isSystem?: boolean; // New: for system messages like "User joined"
}

export interface ChatSession {
  id: string;
  participant: User; // For 1-on-1, this is the other person. For Group, this is a "Fake" User object representing the Group info
  messages: Message[];
  lastMessage?: Message;
  unreadCount: number;
  updatedAt: number;
  // Group specific
  isGroup?: boolean;
  hasJoined?: boolean; // New: check if user joined the group
  adminId?: string;
  participants?: User[]; // List of all members
}

export interface Invitation {
  fromUser: User;
  timestamp: number;
}

export enum AppScreen {
  AUTH = 'auth',
  CHATS = 'chats',
  SEARCH = 'search',
  SETTINGS = 'settings',
  CHAT_ROOM = 'chat_room',
  ADMIN_PANEL = 'admin_panel',
  RULES = 'rules',
  PRIVACY = 'privacy',
  MAINTENANCE = 'maintenance',
}

export type ThemeMode = 'dark' | 'light';

export interface GlobalState {
    users: User[];
    chats: Record<string, ChatSession[]>; // userId -> sessions
    invites: Record<string, Invitation[]>; // userId -> invites
    typing: Record<string, Record<string, number>>; // chatId -> userId -> timestamp
    maintenanceMode?: boolean; // Global maintenance flag
}

export const PRESET_USERS: User[] = [
  {
    id: 'ai-helper',
    name: 'Nexa Ассистент',
    username: 'assistant',
    avatar: 'https://api.dicebear.com/9.x/bottts-neutral/svg?seed=Nexa',
    bio: 'Официальный ИИ-помощник NexaChat. Всегда онлайн.',
    systemInstruction: 'Ты официальный ассистент NexaChat. Твоя задача — помогать пользователю, отвечать на вопросы и поддерживать диалог. Ты вежлив, умен и лаконичен. Твой стиль общения - профессиональный, но дружелюбный. Если пользователь присылает фото или стикер, реагируй на это.',
    isVerified: true
  }
];
