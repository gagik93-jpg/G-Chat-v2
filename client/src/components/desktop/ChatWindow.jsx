import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { 
  Send, Paperclip, Mic, Smile, Reply, Trash2, Pin, 
  Phone, Video, MoreVertical, Check, CheckCheck, Heart,
  ThumbsUp, Laugh, Frown, Zap, Search, Download
} from 'lucide-react';
import { api } from '../../store/authStore';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import toast from 'react-hot-toast';

const REACTIONS = ['👍', '❤️', '😂', '😮', '😢', '🔥'];

export default function ChatWindow() {
  const { chatId } = useParams();
  const [messages, setMessages] = useState([]);
  const [chat, setChat] = useState(null);
  const [input, setInput] = useState('');
  const [replyTo, setReplyTo] = useState(null);
  const [showEmoji, setShowEmoji] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [typingUsers, setTypingUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const mediaRecorderRef = useRef(null);

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
    if (!input.trim() && !replyTo) return;

    try {
      await api.post(`/messages/${chatId}`, {
        content: input,
        replyToId: replyTo?.id
      });
      setInput('');
      setReplyTo(null);
      loadMessages();
    } catch (error) {
      toast.error('Не удалось отправить сообщение');
    }
  };

  const deleteMessage = async (messageId) => {
    try {
      await api.delete(`/messages/${messageId}`);
      loadMessages();
      toast.success('Сообщение удалено');
    } catch (error) {
      toast.error('Не удалось удалить');
    }
  };

  const pinMessage = async (messageId) => {
    try {
      await api.post(`/messages/${messageId}/pin`);
      loadChat();
      toast.success('Сообщение закреплено');
    } catch (error) {}
  };

  const addReaction = async (messageId, emoji) => {
    try {
      await api.post(`/messages/${messageId}/reaction`, { emoji });
      loadMessages();
    } catch (error) {}
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      const chunks = [];

      mediaRecorder.ondataavailable = (e) => chunks.push(e.data);
      mediaRecorder.onstop = async () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        const formData = new FormData();
        formData.append('voice', blob);
        formData.append('duration', '10');

        try {
          await api.post(`/voice/upload/${chatId}`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
          });
          loadMessages();
          toast.success('Голосовое отправлено');
        } catch (error) {
          toast.error('Не удалось отправить голосовое');
        }
      };

      mediaRecorder.start();
      mediaRecorderRef.current = mediaRecorder;
      setIsRecording(true);

      setTimeout(() => stopRecording(), 60000); // Max 60 sec
    } catch (error) {
      toast.error('Нет доступа к микрофону');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);
    formData.append('chatId', chatId);

    try {
      const { data } = await api.post('/files/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      await api.post(`/messages/${chatId}`, {
        content: file.name,
        contentType: 'FILE',
        fileUrl: data.url,
        fileName: data.name,
        fileSize: data.size
      });

      loadMessages();
      toast.success('Файл отправлен');
    } catch (error) {
      toast.error('Не удалось загрузить файл');
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(scrollToBottom, [messages]);

  const getUserId = () => JSON.parse(localStorage.getItem('user') || '{}').id;

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      background: 'var(--bg-primary)'
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 16px',
        borderBottom: '1px solid var(--border)',
        background: 'var(--bg-secondary)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
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
          <div>
            <div style={{ fontWeight: '600', color: 'var(--text-primary)' }}>
              {chat?.name || 'Чат'}
            </div>
            <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
              {typingUsers.length > 0 
                ? `${typingUsers.join(', ')} печатает...` 
                : `${chat?.members?.length || 0} участников`}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button style={iconButtonStyle} onClick={() => setShowSearch(!showSearch)}>
            <Search size={20} />
          </button>
          <button style={iconButtonStyle}>
            <Phone size={20} />
          </button>
          <button style={iconButtonStyle}>
            <Video size={20} />
          </button>
          <button style={iconButtonStyle}>
            <MoreVertical size={20} />
          </button>
        </div>
      </div>

      {/* Search bar */}
      {showSearch && (
        <div style={{
          padding: '8px 16px',
          borderBottom: '1px solid var(--border)',
          background: 'var(--bg-secondary)'
        }}>
          <input
            type="text"
            placeholder="Поиск по сообщениям..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '8px 12px',
              borderRadius: '8px',
              border: '1px solid var(--border)',
              background: 'var(--bg-tertiary)',
              color: 'var(--text-primary)',
              outline: 'none'
            }}
          />
        </div>
      )}

      {/* Pinned message */}
      {chat?.pinnedMessageId && (
        <div style={{
          padding: '8px 16px',
          background: 'var(--bg-secondary)',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <Pin size={16} color="var(--primary)" />
          <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
            Закреплённое сообщение
          </span>
        </div>
      )}

      {/* Messages */}
      <div style={{
        flex: 1,
        overflow: 'auto',
        padding: '16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px'
      }}>
        {messages.map((msg, index) => {
          const isMe = msg.senderId === getUserId();
          const showDate = index === 0 || 
            new Date(msg.createdAt).toDateString() !== 
            new Date(messages[index - 1].createdAt).toDateString();

          return (
            <React.Fragment key={msg.id}>
              {showDate && (
                <div style={{
                  textAlign: 'center',
                  padding: '8px',
                  color: 'var(--text-muted)',
                  fontSize: '12px'
                }}>
                  {format(new Date(msg.createdAt), 'dd MMMM yyyy', { locale: ru })}
                </div>
              )}

              <div style={{
                display: 'flex',
                justifyContent: isMe ? 'flex-end' : 'flex-start',
                alignItems: 'flex-end',
                gap: '8px'
              }}>
                {!isMe && (
                  <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontSize: '12px',
                    fontWeight: '600',
                    flexShrink: 0
                  }}>
                    {msg.sender.displayName?.charAt(0) || '?'}
                  </div>
                )}

                <div style={{
                  maxWidth: '70%',
                  position: 'relative'
                }}>
                  {/* Reply */}
                  {msg.replyTo && (
                    <div style={{
                      padding: '6px 12px',
                      background: 'var(--bg-tertiary)',
                      borderRadius: '8px 8px 0 0',
                      borderLeft: '3px solid var(--primary)',
                      marginBottom: '2px'
                    }}>
                      <div style={{ fontSize: '12px', color: 'var(--primary)', fontWeight: '600' }}>
                        {msg.replyTo.sender.displayName}
                      </div>
                      <div style={{ fontSize: '13px', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {msg.replyTo.content}
                      </div>
                    </div>
                  )}

                  {/* Message bubble */}
                  <div style={{
                    padding: '10px 14px',
                    background: isMe ? 'var(--primary)' : 'var(--bg-tertiary)',
                    color: isMe ? 'white' : 'var(--text-primary)',
                    borderRadius: msg.replyTo ? '0 0 12px 12px' : '12px',
                    borderBottomLeftRadius: isMe ? '12px' : '4px',
                    borderBottomRightRadius: isMe ? '4px' : '12px',
                    position: 'relative'
                  }}>
                    {/* File attachment */}
                    {msg.fileUrl && (
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '8px',
                        background: 'rgba(0,0,0,0.1)',
                        borderRadius: '8px',
                        marginBottom: '6px',
                        cursor: 'pointer'
                      }} onClick={() => window.open(msg.fileUrl, '_blank')}>
                        <Download size={18} />
                        <div style={{ overflow: 'hidden' }}>
                          <div style={{ fontSize: '13px', fontWeight: '500' }}>{msg.fileName}</div>
                          <div style={{ fontSize: '11px', opacity: 0.7 }}>
                            {(msg.fileSize / 1024 / 1024).toFixed(2)} MB
                          </div>
                        </div>
                      </div>
                    )}

                    <div style={{ fontSize: '14px', lineHeight: '1.5', wordBreak: 'break-word' }}>
                      {msg.content}
                    </div>

                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'flex-end',
                      gap: '4px',
                      marginTop: '4px',
                      fontSize: '11px',
                      opacity: 0.7
                    }}>
                      {format(new Date(msg.createdAt), 'HH:mm')}
                      {isMe && <CheckCheck size={14} />}
                    </div>
                  </div>

                  {/* Reactions */}
                  {msg.reactions?.length > 0 && (
                    <div style={{
                      display: 'flex',
                      gap: '4px',
                      marginTop: '4px',
                      flexWrap: 'wrap'
                    }}>
                      {msg.reactions.map((reaction, i) => (
                        <span key={i} style={{
                          padding: '2px 6px',
                          background: 'var(--bg-tertiary)',
                          borderRadius: '10px',
                          fontSize: '13px',
                          cursor: 'pointer'
                        }} onClick={() => addReaction(msg.id, reaction.emoji)}>
                          {reaction.emoji}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Actions */}
                  <div style={{
                    display: 'flex',
                    gap: '4px',
                    marginTop: '4px',
                    opacity: 0,
                    transition: 'opacity 0.2s',
                  }} className="message-actions">
                    <button 
                      style={actionButtonStyle}
                      onClick={() => setReplyTo(msg)}
                      title="Ответить"
                    >
                      <Reply size={14} />
                    </button>
                    <button 
                      style={actionButtonStyle}
                      onClick={() => pinMessage(msg.id)}
                      title="Закрепить"
                    >
                      <Pin size={14} />
                    </button>
                    {isMe && (
                      <button 
                        style={actionButtonStyle}
                        onClick={() => deleteMessage(msg.id)}
                        title="Удалить"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}

                    {/* Reaction picker */}
                    <div style={{ display: 'flex', gap: '2px' }}>
                      {REACTIONS.map(emoji => (
                        <button
                          key={emoji}
                          style={{
                            ...actionButtonStyle,
                            fontSize: '14px',
                            padding: '2px 4px'
                          }}
                          onClick={() => addReaction(msg.id, emoji)}
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </React.Fragment>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Reply indicator */}
      {replyTo && (
        <div style={{
          padding: '8px 16px',
          background: 'var(--bg-secondary)',
          borderTop: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Reply size={16} color="var(--primary)" />
            <div>
              <div style={{ fontSize: '12px', color: 'var(--primary)', fontWeight: '600' }}>
                Ответить {replyTo.sender.displayName}
              </div>
              <div style={{ fontSize: '13px', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '400px' }}>
                {replyTo.content}
              </div>
            </div>
          </div>
          <button style={iconButtonStyle} onClick={() => setReplyTo(null)}>
            <Trash2 size={16} />
          </button>
        </div>
      )}

      {/* Input */}
      <div style={{
        padding: '12px 16px',
        borderTop: '1px solid var(--border)',
        background: 'var(--bg-secondary)'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '8px 12px',
          background: 'var(--bg-tertiary)',
          borderRadius: '20px'
        }}>
          <button 
            style={iconButtonStyle}
            onClick={() => fileInputRef.current?.click()}
          >
            <Paperclip size={20} />
          </button>
          <input
            type="file"
            ref={fileInputRef}
            style={{ display: 'none' }}
            onChange={handleFileUpload}
          />

          <input
            type="text"
            placeholder="Написать сообщение..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
            style={{
              flex: 1,
              border: 'none',
              background: 'transparent',
              color: 'var(--text-primary)',
              outline: 'none',
              fontSize: '14px'
            }}
          />

          <button 
            style={iconButtonStyle}
            onClick={() => setShowEmoji(!showEmoji)}
          >
            <Smile size={20} />
          </button>

          {isRecording ? (
            <button 
              style={{
                ...iconButtonStyle,
                color: 'var(--danger)',
                animation: 'pulse 1s infinite'
              }}
              onClick={stopRecording}
            >
              <div style={{
                width: '20px',
                height: '20px',
                borderRadius: '4px',
                background: 'var(--danger)'
              }} />
            </button>
          ) : (
            <button 
              style={iconButtonStyle}
              onMouseDown={startRecording}
              onMouseUp={stopRecording}
              onTouchStart={startRecording}
              onTouchEnd={stopRecording}
            >
              <Mic size={20} />
            </button>
          )}

          <button 
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              border: 'none',
              background: 'var(--primary)',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer'
            }}
            onClick={sendMessage}
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}

const iconButtonStyle = {
  width: '36px',
  height: '36px',
  borderRadius: '50%',
  border: 'none',
  background: 'transparent',
  color: 'var(--text-secondary)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
  transition: 'var(--transition)'
};

const actionButtonStyle = {
  width: '28px',
  height: '28px',
  borderRadius: '50%',
  border: 'none',
  background: 'var(--bg-tertiary)',
  color: 'var(--text-secondary)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
  fontSize: '12px'
};
