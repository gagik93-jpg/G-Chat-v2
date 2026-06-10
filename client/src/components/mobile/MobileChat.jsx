import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Send, Paperclip, Mic, Smile } from 'lucide-react';
import { api } from '../../store/authStore';

export default function MobileChat() {
  const { chatId } = useParams();
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [chat, setChat] = useState(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    loadChat();
    loadMessages();
  }, [chatId]);

  const loadChat = async () => {
    try {
      const { data } = await api.get(`/chats/${chatId}`);
      setChat(data);
    } catch (error) {}
  };

  const loadMessages = async () => {
    try {
      const { data } = await api.get(`/messages/${chatId}`);
      setMessages(data);
    } catch (error) {}
  };

  const sendMessage = async () => {
    if (!input.trim()) return;
    try {
      await api.post(`/messages/${chatId}`, { content: input });
      setInput('');
      loadMessages();
    } catch (error) {}
  };

  const getUserId = () => JSON.parse(localStorage.getItem('user') || '{}').id;

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      background: 'var(--bg-primary)'
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '12px 16px',
        borderBottom: '1px solid var(--border)',
        background: 'var(--bg-secondary)'
      }}>
        <button onClick={() => navigate('/')} style={{
          background: 'none',
          border: 'none',
          color: 'var(--text-primary)',
          cursor: 'pointer'
        }}>
          <ArrowLeft size={24} />
        </button>
        <div style={{
          width: '40px',
          height: '40px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontWeight: '600'
        }}>
          {chat?.name?.charAt(0) || 'G'}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: '600', fontSize: '16px' }}>
            {chat?.name || 'Чат'}
          </div>
          <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
            {chat?.members?.length || 0} участников
          </div>
        </div>
      </div>

      {/* Messages */}
      <div style={{
        flex: 1,
        overflow: 'auto',
        padding: '12px',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px'
      }}>
        {messages.map(msg => {
          const isMe = msg.senderId === getUserId();
          return (
            <div key={msg.id} style={{
              display: 'flex',
              justifyContent: isMe ? 'flex-end' : 'flex-start'
            }}>
              <div style={{
                maxWidth: '80%',
                padding: '10px 14px',
                background: isMe ? 'var(--primary)' : 'var(--bg-tertiary)',
                color: isMe ? 'white' : 'var(--text-primary)',
                borderRadius: '16px',
                borderBottomLeftRadius: isMe ? '16px' : '4px',
                borderBottomRightRadius: isMe ? '4px' : '16px',
                fontSize: '15px',
                lineHeight: '1.4'
              }}>
                {msg.content}
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div style={{
        padding: '8px 12px',
        borderTop: '1px solid var(--border)',
        background: 'var(--bg-secondary)'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '8px 12px',
          background: 'var(--bg-tertiary)',
          borderRadius: '24px'
        }}>
          <button style={iconBtnStyle}>
            <Paperclip size={20} />
          </button>
          <input
            type="text"
            placeholder="Сообщение..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
            style={{
              flex: 1,
              border: 'none',
              background: 'transparent',
              color: 'var(--text-primary)',
              outline: 'none',
              fontSize: '15px'
            }}
          />
          <button style={iconBtnStyle}>
            <Smile size={20} />
          </button>
          {input.trim() ? (
            <button
              onClick={sendMessage}
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                border: 'none',
                background: 'var(--primary)',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Send size={18} />
            </button>
          ) : (
            <button style={iconBtnStyle}>
              <Mic size={20} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

const iconBtnStyle = {
  width: '36px',
  height: '36px',
  borderRadius: '50%',
  border: 'none',
  background: 'transparent',
  color: 'var(--text-secondary)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer'
};
