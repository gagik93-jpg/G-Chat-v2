import React, { useState, useEffect } from 'react';
import { Search, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../store/authStore';

export default function MobileChatList() {
  const [chats, setChats] = useState([]);
  const [search, setSearch] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    loadChats();
  }, []);

  const loadChats = async () => {
    try {
      const { data } = await api.get('/chats');
      setChats(data);
    } catch (error) {}
  };

  const getChatName = (chat) => {
    if (chat.type === 'DIRECT') {
      const other = chat.members.find(m => m.user.id !== getUserId());
      return other?.user.displayName || other?.user.username || 'Unknown';
    }
    return chat.name || 'Без названия';
  };

  const getUserId = () => JSON.parse(localStorage.getItem('user') || '{}').id;

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{
        padding: '12px 16px',
        borderBottom: '1px solid var(--border)',
        background: 'var(--bg-secondary)'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '12px'
        }}>
          <h1 style={{ fontSize: '24px', fontWeight: '700' }}>Чаты</h1>
          <button style={{
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            border: 'none',
            background: 'var(--primary)',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Plus size={20} />
          </button>
        </div>
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
              fontSize: '15px'
            }}
          />
        </div>
      </div>

      {/* Chat list */}
      <div style={{ flex: 1, overflow: 'auto' }}>
        {chats.map(chat => (
          <div
            key={chat.id}
            onClick={() => navigate(`/chat/${chat.id}`)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '12px 16px',
              borderBottom: '1px solid var(--border)',
              cursor: 'pointer'
            }}
          >
            <div style={{
              width: '52px',
              height: '52px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontWeight: '600',
              fontSize: '18px',
              flexShrink: 0
            }}>
              {getChatName(chat).charAt(0)}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '4px'
              }}>
                <span style={{
                  fontWeight: '600',
                  fontSize: '16px',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}>
                  {getChatName(chat)}
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
              <p style={{
                fontSize: '14px',
                color: 'var(--text-muted)',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}>
                {chat.messages?.[0]?.content || 'Нет сообщений'}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
