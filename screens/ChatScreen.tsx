
import React, { useState, useEffect, useRef } from 'react';
import { ChatSession, Message, ThemeMode, User, AttachmentType } from '../types';
import { 
  IconChevronLeft, IconSend, IconPaperclip, IconSmile, IconX,
  IconImage, IconVideo, IconMusic, IconFile, IconTrash, IconEdit, IconCheck, IconChecks, IconVerified, IconUser, IconGroup, IconUserPlus, IconCopy, IconMessageCircle
} from '../components/Icons';
import { getChatResponse } from '../services/geminiService';

interface ChatScreenProps {
  chat: ChatSession;
  onBack: () => void;
  onUpdateChat: (chatId: string, messages: Message[]) => void;
  onAddMember: (chatId: string, username: string) => Promise<{success: boolean, message: string}>;
  onJoinGroup?: (chatId: string) => void;
  onStartDirectChat?: (user: User) => void;
  theme: ThemeMode;
  currentUser: User;
}

const STICKERS = [
  "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExajZ6eGg4eHl5eHl5eHl5eHl5eHl5eHl5eHl5eHl5eHl5eSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9cw/Wj7lNjMNDxSmc/giphy.gif",
  "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExM3B4eHl5eHl5eHl5eHl5eHl5eHl5eHl5eHl5eHl5eSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9cw/l0HlCqV35hdEg2CNy/giphy.gif",
  "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExYnZ4eHl5eHl5eHl5eHl5eHl5eHl5eHl5eHl5eHl5eSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9cw/3o7TKr3nzbh5Q14M3m/giphy.gif",
  "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExOXJ4eHl5eHl5eHl5eHl5eHl5eHl5eHl5eHl5eHl5eSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9cw/MDJ9IbxxvDUQM/giphy.gif",
  "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExNmN4eHl5eHl5eHl5eHl5eHl5eHl5eHl5eHl5eHl5eSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9cw/13CoXDiaCcCoyk/giphy.gif",
  "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExbDV4eHl5eHl5eHl5eHl5eHl5eHl5eHl5eHl5eHl5eSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9cw/26FLdmIp6wJr91JAI/giphy.gif",
  "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExanJ4eHl5eHl5eHl5eHl5eHl5eHl5eHl5eHl5eHl5eSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9cw/l0MYt5jPR6QX5pnqM/giphy.gif",
  "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExNDN4eHl5eHl5eHl5eHl5eHl5eHl5eHl5eHl5eHl5eSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9cw/3oEjI6SIIHBdRxXI40/giphy.gif"
];

const GIFS = [
  "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExaTJ4eHl5eHl5eHl5eHl5eHl5eHl5eHl5eHl5eHl5eSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/Ld77zD3fF3Run8olIt/giphy.gif",
  "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExM3Z4eHl5eHl5eHl5eHl5eHl5eHl5eHl5eHl5eHl5eSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/26AHvcW0UBznU4C5y/giphy.gif",
  "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExbDd4eHl5eHl5eHl5eHl5eHl5eHl5eHl5eHl5eHl5eSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/xT0xezQGU5xJQvx5KQ/giphy.gif",
  "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExbzJ4eHl5eHl5eHl5eHl5eHl5eHl5eHl5eHl5eHl5eSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/l0HlO3BJ8LALPW4sE/giphy.gif",
  "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExOHJ4eHl5eHl5eHl5eHl5eHl5eHl5eHl5eHl5eHl5eSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/3o6UB3VhArvomJHtdK/giphy.gif",
  "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExNnh4eHl5eHl5eHl5eHl5eHl5eHl5eHl5eHl5eHl5eSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/l2JdZOeZq9r1e/giphy.gif"
];

const TYPING_SIGNAL_KEY = 'nexachat_typing_signals';

const ChatScreen: React.FC<ChatScreenProps> = ({ chat, onBack, onUpdateChat, onAddMember, onJoinGroup, onStartDirectChat, theme, currentUser }) => {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>(chat.messages);
  const [isTyping, setIsTyping] = useState(false); // AI Typing or Partner Typing
  const [showAttachments, setShowAttachments] = useState(false);
  const [showStickers, setShowStickers] = useState(false);
  const [stickerTab, setStickerTab] = useState<'stickers' | 'gifs'>('stickers');
  const [activeAttachmentType, setActiveAttachmentType] = useState<AttachmentType>('image');
  
  // Message Actions State
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [isEditingMessage, setIsEditingMessage] = useState(false);
  
  // Group Info Modal
  const [showGroupInfo, setShowGroupInfo] = useState(false);
  const [addMemberUsername, setAddMemberUsername] = useState('');
  const [addMemberStatus, setAddMemberStatus] = useState('');
  
  // Participant View Modal
  const [viewingParticipant, setViewingParticipant] = useState<User | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isDark = theme === 'dark';
  const hasJoined = chat.isGroup ? (chat.hasJoined ?? true) : true;
  
  // Colors
  const bgHeader = isDark ? 'bg-black/90 border-neutral-900' : 'bg-white/90 border-gray-100';
  const bgBody = isDark ? 'bg-black' : 'bg-[#f0f2f5]';
  const textMain = isDark ? 'text-white' : 'text-gray-900';
  const textSub = isDark ? 'text-neutral-500' : 'text-gray-500';
  const bubbleMe = 'bg-red-600 text-white';
  const bubbleOther = isDark ? 'bg-neutral-800 text-gray-100' : 'bg-white text-gray-900 shadow-sm';
  const bubbleSystem = isDark ? 'bg-neutral-900/50 text-neutral-400' : 'bg-gray-200/50 text-gray-500';
  const inputAreaBg = isDark ? 'bg-black border-neutral-900' : 'bg-white border-gray-200';
  const inputFieldBg = isDark ? 'bg-neutral-900 text-white placeholder-neutral-500' : 'bg-gray-100 text-black placeholder-gray-400';

  useEffect(() => {
    setMessages(chat.messages);
  }, [chat.messages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping, showStickers, showAttachments]);

  useEffect(() => {
      if (messages.length === 0) return;
      const lastMsg = messages[messages.length - 1];
      if (lastMsg.sender !== 'me' && lastMsg.status !== 'read') {
          // If in a group, logic is simpler for now, just mark all read if I see them
          const myUnreadMessages = messages.filter(m => m.sender === 'me' && m.status !== 'read');
           if (myUnreadMessages.length > 0) {
              const updatedMessages = messages.map(m => {
                  if (m.sender === 'me' && m.status !== 'read') return { ...m, status: 'read' as const };
                  return m;
              });
              if (JSON.stringify(updatedMessages) !== JSON.stringify(messages)) {
                setMessages(updatedMessages);
                onUpdateChat(chat.id, updatedMessages);
              }
          }
      }
  }, [messages, chat.id, onUpdateChat]);

  // TYPING LOGIC
  useEffect(() => {
      if (chat.participant.id === 'ai-helper') return;
      const pollTyping = () => {
          const signalsStr = localStorage.getItem(TYPING_SIGNAL_KEY);
          if (signalsStr) {
              try {
                  const signals = JSON.parse(signalsStr);
                  const chatSignal = signals[chat.id];
                  if (chatSignal) {
                      // Check if ANYONE else in the chat is typing
                      const otherTyping = Object.keys(chatSignal).some(uid => uid !== currentUser.id && (Date.now() - chatSignal[uid] < 3000));
                      setIsTyping(otherTyping);
                  } else {
                      setIsTyping(false);
                  }
              } catch(e) {}
          }
      };
      const interval = setInterval(pollTyping, 1000);
      return () => clearInterval(interval);
  }, [chat.id, chat.participant.id]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value;
      setInput(val);
      if (chat.participant.id !== 'ai-helper') {
          const signalsStr = localStorage.getItem(TYPING_SIGNAL_KEY);
          let signals: any = signalsStr ? JSON.parse(signalsStr) : {};
          if (!signals[chat.id]) signals[chat.id] = {};
          signals[chat.id][currentUser.id] = Date.now();
          localStorage.setItem(TYPING_SIGNAL_KEY, JSON.stringify(signals));
      }
  };

  const sendMessage = async (text: string, attachment?: Message['attachment']) => {
    const userMsg: Message = {
      id: Date.now().toString(),
      text: text,
      sender: 'me',
      senderName: currentUser.name,
      timestamp: Date.now(),
      status: 'sent',
      attachment
    };

    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    onUpdateChat(chat.id, newMessages);
    
    setShowAttachments(false);
    setShowStickers(false);
    setInput('');
    
    if (chat.participant.id === 'ai-helper') {
        setIsTyping(true);
        try {
            const contentForGemini = text.trim() === '' && attachment ? `[User sent a ${attachment.type}]` : text;
            const stream = await getChatResponse(newMessages, contentForGemini, chat.participant.systemInstruction || "You are a helpful assistant.");
            let aiMsgId = (Date.now() + 1).toString();
            let aiFullText = "";
            setMessages(prev => [...prev, { id: aiMsgId, text: "", sender: 'other', senderName: 'Nexa Assistant', timestamp: Date.now(), status: 'sent' }]);
            for await (const chunk of stream) {
                aiFullText += chunk;
                setMessages(prev => prev.map(m => m.id === aiMsgId ? { ...m, text: aiFullText } : m));
            }
            const finalAiMsg: Message = { id: aiMsgId, text: aiFullText, sender: 'other', senderName: 'Nexa Assistant', timestamp: Date.now(), status: 'read' };
            onUpdateChat(chat.id, [...newMessages, finalAiMsg]);
        } catch (e) {
            console.error(e);
        } finally {
            setIsTyping(false);
        }
    }
  };

  const handleSendText = () => {
    if (!input.trim()) return;
    if (isEditingMessage && selectedMessage) {
        const updatedMessages = messages.map(m => m.id === selectedMessage.id ? { ...m, text: input, isEdited: true } : m);
        setMessages(updatedMessages);
        onUpdateChat(chat.id, updatedMessages);
        setIsEditingMessage(false);
        setSelectedMessage(null);
        setInput('');
    } else {
        sendMessage(input);
    }
  };

  const handleSendMedia = (type: AttachmentType, url: string, name?: string, size?: string) => {
    sendMessage("", { type, url, name, size });
  };

  const triggerFilePicker = (type: AttachmentType) => {
    setActiveAttachmentType(type);
    setTimeout(() => { fileInputRef.current?.click(); }, 100);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
        const file = e.target.files[0];
        const sizeInMB = (file.size / (1024 * 1024)).toFixed(2) + ' MB';
        const objectUrl = URL.createObjectURL(file);
        handleSendMedia(activeAttachmentType, objectUrl, file.name, sizeInMB);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSendText();
    }
  };

  const handleLongPressStart = (msg: Message) => {
    if (msg.isSystem) return;
    longPressTimer.current = setTimeout(() => { setSelectedMessage(msg); if (navigator.vibrate) navigator.vibrate(50); }, 500);
  };
  const handleLongPressEnd = () => { if (longPressTimer.current) { clearTimeout(longPressTimer.current); longPressTimer.current = null; } };

  const handleDeleteMessage = () => {
      if (!selectedMessage) return;
      const filtered = messages.filter(m => m.id !== selectedMessage.id);
      setMessages(filtered);
      onUpdateChat(chat.id, filtered);
      setSelectedMessage(null);
  };

  const handleEditMessageInit = () => {
      if (!selectedMessage) return;
      setInput(selectedMessage.text);
      setIsEditingMessage(true);
      setSelectedMessage(null); 
      inputRef.current?.focus();
  };
  
  const handleAddMemberSubmit = async () => {
      if (!addMemberUsername.trim()) return;
      setAddMemberStatus('Поиск...');
      const res = await onAddMember(chat.id, addMemberUsername.trim());
      if (res.success) {
          setAddMemberStatus('Участник добавлен!');
          setAddMemberUsername('');
          setTimeout(() => setAddMemberStatus(''), 2000);
      } else {
          setAddMemberStatus(res.message);
      }
  };
  
  const handleParticipantClick = (user: User) => {
      // If clicking on yourself, maybe show info but not "message" button
      setViewingParticipant(user);
  };

  const handleWriteMessage = () => {
      if (viewingParticipant && onStartDirectChat && viewingParticipant.id !== currentUser.id) {
          onStartDirectChat(viewingParticipant);
          setViewingParticipant(null);
          setShowGroupInfo(false);
      }
  };

  const renderStatusIcon = (status: Message['status']) => {
      if (status === 'read') return <IconChecks className="w-3.5 h-3.5 text-blue-300 ml-1" />;
      return <IconCheck className="w-3.5 h-3.5 text-red-200 ml-1" />;
  };

  const renderAttachment = (msg: Message) => {
      if (!msg.attachment) return null;
      const { type, url, name, size } = msg.attachment;
      if (type === 'image') return <div className="rounded-lg overflow-hidden mb-1"><img src={url} alt="att" className="max-w-full h-auto max-h-64 object-cover" /></div>;
      if (type === 'sticker' || type === 'gif') return <div className="mb-1"><img src={url} alt="stk" className="w-32 h-32 object-contain bg-transparent" /></div>;
      if (type === 'video') return <div className="rounded-lg overflow-hidden mb-1 max-w-[250px] bg-black min-h-[150px] flex items-center justify-center"><video controls playsInline src={url} className="w-full h-auto rounded-lg max-h-64" /></div>;
      if (type === 'audio') return <div className={`flex items-center p-2 rounded-lg ${msg.sender === 'me' ? 'bg-white/10' : 'bg-black/5'} min-w-[200px]`}><div className="bg-red-600 p-2 rounded-full mr-3 text-white flex-shrink-0"><IconMusic className="w-5 h-5" /></div><div className="flex-1 min-w-0"><p className="text-xs font-bold truncate mb-1">{name}</p><audio controls src={url} className="w-full h-8 max-w-[180px]" /></div></div>;
      if (type === 'file') return <div className={`flex items-center p-2 rounded-lg ${msg.sender === 'me' ? 'bg-white/10' : 'bg-black/5'} min-w-[150px]`}><div className="bg-red-600 p-2 rounded-full mr-3 text-white"><IconFile className="w-5 h-5" /></div><div className="flex-1 min-w-0"><p className="text-sm font-bold truncate">{name}</p><p className="text-xs opacity-70">{size}</p></div></div>;
      return null;
  };

  // Open profile of chat participant (for 1-on-1 chats)
  const handleHeaderClick = () => {
      if (chat.isGroup) {
          setShowGroupInfo(true);
      } else {
          setViewingParticipant(chat.participant);
      }
  };

  return (
    <div className={`flex flex-col h-screen w-full max-w-2xl mx-auto relative ${bgBody}`}>
      {/* Header */}
      <div className={`flex items-center px-4 py-3 backdrop-blur-md border-b z-30 sticky top-0 transition-colors ${bgHeader}`}>
        <button onClick={onBack} className={`mr-2 p-2 -ml-2 rounded-full transition-colors active:scale-95 ${isDark ? 'hover:bg-neutral-800 text-white' : 'hover:bg-gray-200 text-black'}`}>
          <IconChevronLeft className="w-6 h-6" />
        </button>
        <div className="relative cursor-pointer" onClick={handleHeaderClick}>
            <img src={chat.participant.avatar} className="w-10 h-10 rounded-full object-cover bg-neutral-800" alt="avatar" />
            {!chat.isGroup && <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-black"></div>}
        </div>
        <div className="ml-3 flex-1 overflow-hidden cursor-pointer" onClick={handleHeaderClick}>
          <h2 className={`font-bold text-base truncate leading-tight flex items-center ${textMain}`}>
              {chat.participant.name}
              {chat.participant.isVerified && <IconVerified className="w-4 h-4 text-blue-500 ml-1" />}
              {chat.participant.id === 'ai-helper' && (
                  <span className="ml-2 bg-blue-600 text-white text-[9px] px-1.5 py-0.5 rounded font-black tracking-wide">BOT</span>
              )}
          </h2>
          <p className={`text-xs truncate ${textSub}`}>
              {chat.isGroup ? `${chat.participants?.length || 1} участников` : (
                  <>@{chat.participant.username} • {isTyping ? <span className="text-red-500 font-semibold animate-pulse ml-1">печатает...</span> : <span className="text-green-500 ml-1">Online</span>}</>
              )}
          </p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6" onClick={() => { setShowAttachments(false); setShowStickers(false); }}>
        <div className="text-center py-8"><div className={`text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full inline-block ${isDark ? 'bg-neutral-900 text-neutral-500' : 'bg-gray-200 text-gray-500'}`}>Nexa Encrypted</div></div>
        
        {messages.map((msg, idx) => {
          const isMe = msg.sender === 'me';
          const isSticker = msg.attachment?.type === 'sticker' || msg.attachment?.type === 'gif';
          
          if (msg.isSystem) {
              return (
                  <div key={msg.id} className="flex justify-center my-2">
                      <span className={`text-[10px] px-3 py-1 rounded-full font-medium ${bubbleSystem}`}>
                          {msg.text}
                      </span>
                  </div>
              )
          }

          return (
            <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} animate-[fadeIn_0.2s_ease-out]`}>
              <div className={`flex max-w-[85%] ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                  {!isMe && (
                     <div className="w-8 mr-2 flex-shrink-0 flex flex-col justify-end">
                        {chat.isGroup ? <div className="w-8 h-8 rounded-full bg-neutral-800 flex items-center justify-center mb-1 font-bold text-xs border border-white/10">{msg.senderName?.charAt(0)}</div> : 
                        (chat.participant.avatar ? <img src={chat.participant.avatar} className="w-8 h-8 rounded-full mb-1" alt="bot" /> : <div className="w-8 h-8 rounded-full bg-neutral-800 flex items-center justify-center mb-1"><IconUser className="w-4 h-4 text-neutral-500"/></div>)}
                     </div>
                  )}
                  <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                     {chat.isGroup && !isMe && <span className="text-[10px] text-red-500 font-bold ml-2 mb-0.5">{msg.senderName}</span>}
                     <div className={isSticker ? 'mx-2' : `px-4 py-3 rounded-[20px] text-[15px] leading-relaxed break-words relative shadow-sm select-none transition-all active:scale-95 ${isMe ? `${bubbleMe} rounded-br-none` : `${bubbleOther} rounded-bl-none`}`}
                        onMouseDown={() => handleLongPressStart(msg)} onMouseUp={handleLongPressEnd} onTouchStart={() => handleLongPressStart(msg)} onTouchEnd={handleLongPressEnd}
                     >
                        {renderAttachment(msg)}
                        {msg.text && <p>{msg.text}</p>}
                        {msg.isEdited && <span className="text-[10px] opacity-60 italic block text-right mt-1">изменено</span>}
                     </div>
                  </div>
              </div>
               <span className={`flex items-center text-[10px] mt-1.5 font-medium opacity-60 ${textSub} ${isMe ? 'mr-1' : 'ml-12'}`}>
                    {new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    {isMe && renderStatusIcon(msg.status)}
               </span>
            </div>
          );
        })}
        {isTyping && <div className="text-xs text-neutral-500 ml-12">печатает...</div>}
        <div ref={messagesEndRef} className="h-4" />
      </div>

      {/* Input or Join Button */}
      <div className={`border-t pb-safe z-40 relative transition-all ${inputAreaBg}`}>
        {!hasJoined ? (
             <div className="p-4 flex items-center justify-center">
                 <button 
                    onClick={() => onJoinGroup && onJoinGroup(chat.id)}
                    className="w-full py-4 bg-red-600 hover:bg-red-500 text-white font-bold rounded-2xl shadow-lg shadow-red-600/20 active:scale-95 transition-all flex items-center justify-center gap-2"
                 >
                     <IconUserPlus className="w-5 h-5" />
                     Присоединиться к группе
                 </button>
             </div>
        ) : (
            <>
                {isEditingMessage && <div className={`flex items-center justify-between p-3 text-sm border-b ${isDark ? 'bg-neutral-900 border-neutral-800 text-white' : 'bg-gray-50 border-gray-200 text-black'}`}><div className="flex items-center"><IconEdit className="w-4 h-4 mr-2 text-red-600" /><span className="font-bold">Редактирование</span></div><button onClick={() => {setIsEditingMessage(false); setInput('');}}><IconX className="w-5 h-5 text-red-500" /></button></div>}
                {showAttachments && <div className={`absolute bottom-full left-4 mb-2 rounded-2xl shadow-2xl p-4 flex flex-col gap-3 z-50 border ${isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-gray-100'}`}>
                    <div onClick={() => triggerFilePicker('image')} className={`flex items-center gap-3 p-2 rounded-xl cursor-pointer ${isDark ? 'hover:bg-neutral-800' : 'hover:bg-gray-50'}`}><div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white"><IconImage className="w-4 h-4" /></div><span className={textMain}>Фото</span></div>
                    <div onClick={() => triggerFilePicker('video')} className={`flex items-center gap-3 p-2 rounded-xl cursor-pointer ${isDark ? 'hover:bg-neutral-800' : 'hover:bg-gray-50'}`}><div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center text-white"><IconVideo className="w-4 h-4" /></div><span className={textMain}>Видео</span></div>
                    <div onClick={() => triggerFilePicker('audio')} className={`flex items-center gap-3 p-2 rounded-xl cursor-pointer ${isDark ? 'hover:bg-neutral-800' : 'hover:bg-gray-50'}`}><div className="w-8 h-8 rounded-full bg-orange-600 flex items-center justify-center text-white"><IconMusic className="w-4 h-4" /></div><span className={textMain}>Музыка</span></div>
                    <div onClick={() => triggerFilePicker('file')} className={`flex items-center gap-3 p-2 rounded-xl cursor-pointer ${isDark ? 'hover:bg-neutral-800' : 'hover:bg-gray-50'}`}><div className="w-8 h-8 rounded-full bg-teal-600 flex items-center justify-center text-white"><IconFile className="w-4 h-4" /></div><span className={textMain}>Файл</span></div>
                    <input type="file" ref={fileInputRef} className="hidden" accept="*/*" onChange={handleFileSelect} />
                </div>}
                {showStickers && <div className={`absolute bottom-full left-0 w-full h-64 border-b flex flex-col z-50 ${isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-gray-200'}`}><div className="flex border-b"><button onClick={() => setStickerTab('stickers')} className="flex-1 py-3 text-red-600 border-b-2 border-red-600">Стикеры</button><button onClick={() => setStickerTab('gifs')} className="flex-1 py-3 text-gray-500">GIFs</button></div><div className="flex-1 overflow-y-auto p-4 grid grid-cols-4 gap-2">{(stickerTab === 'stickers' ? STICKERS : GIFS).map((url, i) => <div key={i} onClick={() => handleSendMedia(stickerTab === 'stickers' ? 'sticker' : 'gif', url)} className="aspect-square cursor-pointer"><img src={url} className="w-full h-full object-contain" /></div>)}</div></div>}

                <div className="p-3">
                    <div className={`flex items-end rounded-3xl transition-all ${inputFieldBg}`}>
                        <div className="flex items-center pb-3 pl-3 gap-1">
                            <button onClick={() => {setShowAttachments(!showAttachments); setShowStickers(false);}} className="p-2 text-neutral-500"><IconPaperclip className="w-6 h-6" /></button>
                            <button onClick={() => {setShowStickers(!showStickers); setShowAttachments(false);}} className="p-2 text-neutral-500"><IconSmile className="w-6 h-6" /></button>
                        </div>
                        <input ref={inputRef} className="flex-1 bg-transparent p-4 focus:outline-none resize-none overflow-hidden min-h-[56px] text-base" placeholder="Сообщение..." value={input} onFocus={() => {setShowAttachments(false); setShowStickers(false);}} onChange={handleInputChange} onKeyDown={handleKeyDown} autoComplete="off" />
                        <button disabled={!input.trim()} onClick={handleSendText} className={`p-3 mr-2 mb-2 rounded-full flex items-center justify-center ${input.trim() ? 'bg-red-600 text-white' : 'text-gray-500'}`}>{isEditingMessage ? <IconCheck className="w-5 h-5" /> : <IconSend className="w-5 h-5" />}</button>
                    </div>
                </div>
            </>
        )}
      </div>

      {/* Context Menu */}
      {selectedMessage && <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm" onClick={() => setSelectedMessage(null)}><div className={`w-full max-w-2xl p-6 rounded-t-3xl ${isDark ? 'bg-neutral-900' : 'bg-white'}`} onClick={e => e.stopPropagation()}><div className="space-y-2">{selectedMessage.sender === 'me' && <button onClick={handleEditMessageInit} className="w-full p-4 rounded-2xl flex items-center font-bold text-lg bg-neutral-800 text-white"><IconEdit className="w-6 h-6 mr-4" />Изменить</button>}<button onClick={handleDeleteMessage} className="w-full p-4 rounded-2xl flex items-center font-bold text-lg text-red-500 bg-neutral-800"><IconTrash className="w-6 h-6 mr-4" />Удалить</button></div></div></div>}

      {/* Group Info Modal */}
      {showGroupInfo && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-[fadeIn_0.2s_ease-out]">
              <div className={`w-full max-w-md rounded-3xl p-6 relative max-h-[80vh] flex flex-col ${isDark ? 'bg-neutral-900 border border-neutral-800' : 'bg-white'}`}>
                  <button onClick={() => setShowGroupInfo(false)} className="absolute top-4 right-4 text-neutral-500 hover:text-red-500"><IconX className="w-6 h-6" /></button>
                  
                  <div className="text-center mb-6">
                      <div className="w-20 h-20 rounded-full bg-blue-600/10 text-blue-500 flex items-center justify-center mx-auto mb-4 border border-blue-600/20">
                          <IconGroup className="w-10 h-10" />
                      </div>
                      <h3 className="text-2xl font-bold">{chat.participant.name}</h3>
                      <p className={`text-sm mt-1 ${textSub}`}>{chat.participants?.length || 1} участников</p>
                      <p className={`text-xs mt-2 ${textSub}`}>{chat.participant.bio}</p>
                  </div>

                  {hasJoined && (
                      <div className="mb-6">
                          <label className="text-xs font-bold uppercase text-neutral-500 mb-2 block">Добавить участника</label>
                          <div className="flex gap-2">
                              <input 
                                value={addMemberUsername}
                                onChange={(e) => setAddMemberUsername(e.target.value)}
                                placeholder="@username"
                                className={`flex-1 p-3 rounded-xl border focus:outline-none focus:border-blue-600 ${isDark ? 'bg-neutral-800 border-neutral-700 text-white' : 'bg-white border-gray-200 text-black'}`}
                              />
                              <button onClick={handleAddMemberSubmit} className="bg-blue-600 text-white px-4 rounded-xl font-bold hover:bg-blue-500"><IconUserPlus className="w-5 h-5" /></button>
                          </div>
                          {addMemberStatus && <p className={`text-xs mt-2 font-bold ${addMemberStatus.includes('добавлен') ? 'text-green-500' : 'text-red-500'}`}>{addMemberStatus}</p>}
                      </div>
                  )}

                  <div className="flex-1 overflow-y-auto space-y-2">
                       <label className="text-xs font-bold uppercase text-neutral-500 mb-2 block">Участники</label>
                       {chat.participants?.map(p => (
                           <div 
                                key={p.id} 
                                onClick={() => handleParticipantClick(p)}
                                className={`flex items-center p-3 rounded-xl cursor-pointer active:scale-95 transition-all ${isDark ? 'bg-neutral-800 hover:bg-neutral-700' : 'bg-gray-50 hover:bg-gray-100'}`}
                            >
                               <img src={p.avatar} className="w-10 h-10 rounded-full mr-3 bg-black object-cover" />
                               <div className="flex-1">
                                   <p className="text-sm font-bold flex items-center">
                                       {p.name}
                                       {p.id === chat.adminId && <span className="ml-2 text-[8px] bg-red-600 text-white px-1 rounded uppercase">Admin</span>}
                                   </p>
                                   <p className="text-xs opacity-50">@{p.username}</p>
                               </div>
                           </div>
                       ))}
                  </div>
              </div>
          </div>
      )}

      {/* Participant View Modal */}
      {viewingParticipant && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-[fadeIn_0.2s_ease-out]">
               <div className={`w-full max-w-sm rounded-3xl p-6 relative ${isDark ? 'bg-neutral-900 border border-neutral-800' : 'bg-white'}`}>
                   <button onClick={() => setViewingParticipant(null)} className="absolute top-4 right-4 text-neutral-500 hover:text-red-500"><IconX className="w-6 h-6" /></button>
                   
                   <div className="flex flex-col items-center">
                       <img src={viewingParticipant.avatar} className="w-24 h-24 rounded-full border-4 border-neutral-800 object-cover mb-4 shadow-xl" />
                       <h3 className="text-2xl font-bold flex items-center gap-1">
                           {viewingParticipant.name}
                           {viewingParticipant.isVerified && <IconVerified className="w-5 h-5 text-blue-500" />}
                           {viewingParticipant.id === 'ai-helper' && (
                               <span className="bg-blue-600 text-white text-[10px] px-1.5 py-0.5 rounded font-black tracking-wide">BOT</span>
                           )}
                        </h3>
                       <p className="text-red-500 font-bold mb-4">@{viewingParticipant.username}</p>
                       
                       <div className={`w-full p-4 rounded-2xl mb-6 text-center text-sm ${isDark ? 'bg-neutral-800 text-neutral-300' : 'bg-gray-100 text-gray-700'}`}>
                           {viewingParticipant.bio || 'Нет информации'}
                       </div>

                       {viewingParticipant.profileMusic && (
                            <div className={`w-full p-3 rounded-xl mb-4 flex items-center gap-3 ${isDark ? 'bg-black/40' : 'bg-gray-50'}`}>
                                <div className="w-8 h-8 rounded-full bg-red-600 flex items-center justify-center text-white flex-shrink-0">
                                    <IconMusic className="w-4 h-4" />
                                </div>
                                <div className="flex-1 overflow-hidden">
                                    <p className="text-xs font-bold truncate mb-1">Музыка профиля</p>
                                    <audio controls src={viewingParticipant.profileMusic} className="w-full h-6" />
                                </div>
                            </div>
                       )}
                       
                       <button 
                            onClick={handleWriteMessage}
                            className={`w-full py-3 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl shadow-lg shadow-red-600/20 active:scale-95 transition-all flex items-center justify-center gap-2 ${viewingParticipant.id === currentUser.id ? 'opacity-50 cursor-not-allowed' : ''}`}
                            disabled={viewingParticipant.id === currentUser.id}
                        >
                            <IconMessageCircle className="w-4 h-4" />
                            Написать сообщение
                       </button>
                   </div>
               </div>
          </div>
      )}
    </div>
  );
};

export default ChatScreen;