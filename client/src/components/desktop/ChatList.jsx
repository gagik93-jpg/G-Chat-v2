import React, { useState, useEffect } from 'react';
import { Search, Plus, Phone, MoreVertical, Pin } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../../store/authStore';
import { formatDistanceToNow } from 'date-fns';
import { ru } from 'date-fns/locale';

export default function ChatList({ activeTab }) {
  const [chats, setChats] = useState([]);
  const [search, setSearch] = useState('');
  const [showNewChat, setShowNewChat] = useState(false);
  const navigate = useNavigate();
  const { chatId } = useParams();

  useEffect(() => {
    loadChats();
  }, [activeTab]);

  const loadChats = async () => {
    try {
      const { data } = await api.get('/chats');
      setChats(data);
    } catch (error) {
      console.error('Failed to load chats');
    }
  };

  const filteredChats = chats.filter(chat => {
    const searchLower = search.toLowerCase();
    const name = chat.type === 'DIRECT' 
      ? chat.members.find(m => m.user.id !== getUserId())?.user.displayName || chat.name
      : chat.name;
    return name?.toLowerCase().includes(searchLower);
  });

  const getUserId = () => {
    // Get from auth store
    return JSON.parse(localStorage.getItem('user') || '{}').id;
  };

  const getChatName = (chat) => {
    if (chat.type === 'DIRECT') {
      const other = chat.members.find(m => m.user.id !== getUserId());
      return other?.user.displayName || other?.user.username || 'Unknown';
    }
    return chat.name || 'Без названия';
  };

  const getChatAvatar = (chat) => {
    if (chat.type === 'DIRECT') {
      const other = chat.members.find(m => m.user.id !== getUserId());
      return other?.user.avatar;
    }
    return chat.avatar;
  };

  const getLastMessage = (chat) => {
    if (chat.messages?.length > 0) {
      return chat.messages[0];
    }
    return null;
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      background: 'var(--bg-secondary)',
      borderRight: '1px solid var(--border)',
      height: '100vh'
    }}>
      {/* Header */}
      <div style={{
        padding: '16px',
        borderBottom: '1px solid var(--border)'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '12px'
        }}>
          <h2 style={{
            fontSize: '20px',
            fontWeight: '600',
            color: 'var(--text-primary)'
          }}>
            {activeTab === 'chats' && 'Чаты'}
            {activeTab === 'calls' && 'Звонки'}
            {activeTab === 'files' && 'Файлы'}
          </h2>
          <button
            onClick={() => setShowNewChat(true)}
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              border: 'none',
              background: 'var(--primary)',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer'
            }}
          >
            <Plus size={20} />
          </button>
        </div>

        {/* Search */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '8px 12px',
          background: 'var(--bg-tertiary)',
          borderRadius: '10px'
        }}>
          <Search size={18} color="var(--text-muted)" />
          <input
            type="text"
            placeholder="Поиск..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              flex: 1,
              border: 'none',
              background: 'transparent',
              color: 'var(--text-primary)',
              outline: 'none',
              fontSize: '14px'
            }}
          />
        </div>
      </div>

      {/* Chat List */}
      <div style={{
        flex: 1,
        overflow: 'auto',
        padding: '8px'
      }}>
        {filteredChats.map(chat => {
          const lastMessage = getLastMessage(chat);
          const isActive = chatId === chat.id;
          const other = chat.type === 'DIRECT' 
            ? chat.members.find(m => m.user.id !== getUserId())?.user 
            : null;

          return (
            <div
              key={chat.id}
              onClick={() => navigate(`/chat/${chat.id}`)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px',
                borderRadius: '10px',
                cursor: 'pointer',
                background: isActive ? 'var(--bg-tertiary)' : 'transparent',
                transition: 'var(--transition)',
                position: 'relative'
              }}
            >
              {/* Avatar */}
              <div style={{ position: 'relative' }}>
                <div style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '50%',
                  background: getChatAvatar(chat) 
                    ? `url(${getChatAvatar(chat)}) center/cover`
                    : 'linear-gradient(135deg, var(--primary), var(--secondary))',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontWeight: '600',
                  fontSize: '16px'
                }}>
                  {!getChatAvatar(chat) && getChatName(chat).charAt(0).toUpperCase()}
                </div>
                {other?.isOnline && (
                  <div style={{
                    position: 'absolute',
                    bottom: '2px',
                    right: '2px',
                    width: '12px',
                    height: '12px',
                    borderRadius: '50%',
                    background: 'var(--success)',
                    border: '2px solid var(--bg-secondary)'
                  }} />
                )}
              </div>

              {/* Info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '4px'
                }}>
                  <span style={{
                    fontWeight: '600',
                    color: 'var(--text-primary)',
                    fontSize: '14px',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}>
                    {getChatName(chat)}
                  </span>
                  {lastMessage && (
                    <span style={{
                      fontSize: '12px',
                      color: 'var(--text-muted)'
                    }}>
                      {formatDistanceToNow(new Date(lastMessage.createdAt), { 
                        addSuffix: false,
                        locale: ru 
                      })}
                    </span>
                  )}
                </div>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}>
                  <span style={{
                    fontSize: '13px',
                    color: 'var(--text-secondary)',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    maxWidth: '180px'
                  }}>
                    {lastMessage?.content || 'Нет сообщений'}
                  </span>
                  {chat.unreadCount > 0 && (
                    <span style={{
                      background: 'var(--primary)',
                      color: 'white',
                      fontSize: '12px',
                      fontWeight: '600',
                      padding: '2px 8px',
                      borderRadius: '10px'
                    }}>
                      {chat.unreadCount}
                    </span>
                  )}
                </div>
              </div>

              {chat.pinnedMessageId && (
                <Pin size={14} color="var(--primary)" style={{ position: 'absolute', top: '8px', right: '8px' }} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
