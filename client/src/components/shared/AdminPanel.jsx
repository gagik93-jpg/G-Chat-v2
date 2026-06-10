import React, { useState, useEffect } from 'react';
import { Routes, Route, Link } from 'react-router-dom';
import { 
  Users, MessageSquare, Phone, Shield, Ban, Trash2, 
  ArrowLeft, TrendingUp, Activity, UserCheck, UserX
} from 'lucide-react';
import { api } from '../store/authStore';
import toast from 'react-hot-toast';

export default function AdminPanel() {
  return (
    <div style={{
      display: 'flex',
      height: '100vh',
      background: 'var(--bg-primary)'
    }}>
      {/* Sidebar */}
      <div style={{
        width: '260px',
        background: 'var(--bg-secondary)',
        borderRight: '1px solid var(--border)',
        padding: '20px'
      }}>
        <Link to="/" style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          color: 'var(--text-secondary)',
          textDecoration: 'none',
          marginBottom: '24px',
          fontSize: '14px'
        }}>
          <ArrowLeft size={18} />
          Назад в чат
        </Link>

        <h1 style={{
          fontSize: '20px',
          fontWeight: '700',
          color: 'var(--text-primary)',
          marginBottom: '24px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <Shield size={24} color="var(--primary)" />
          Админ-панель
        </h1>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <NavLink to="/admin" icon={TrendingUp} label="Статистика" />
          <NavLink to="/admin/users" icon={Users} label="Пользователи" />
          <NavLink to="/admin/chats" icon={MessageSquare} label="Чаты" />
          <NavLink to="/admin/calls" icon={Phone} label="Звонки" />
        </nav>
      </div>

      {/* Content */}
      <div style={{
        flex: 1,
        overflow: 'auto',
        padding: '24px'
      }}>
        <Routes>
          <Route path="/" element={<StatsPage />} />
          <Route path="/users" element={<UsersPage />} />
          <Route path="/chats" element={<ChatsPage />} />
          <Route path="/calls" element={<CallsPage />} />
        </Routes>
      </div>
    </div>
  );
}

function NavLink({ to, icon: Icon, label }) {
  const isActive = window.location.pathname === to;
  return (
    <Link to={to} style={{
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      padding: '10px 14px',
      borderRadius: '10px',
      textDecoration: 'none',
      color: isActive ? 'var(--primary)' : 'var(--text-secondary)',
      background: isActive ? 'var(--bg-tertiary)' : 'transparent',
      fontSize: '14px',
      fontWeight: '500',
      transition: 'var(--transition)'
    }}>
      <Icon size={18} />
      {label}
    </Link>
  );
}

// Stats Page
function StatsPage() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const { data } = await api.get('/admin/stats');
      setStats(data);
    } catch (error) {}
  };

  if (!stats) return <div>Загрузка...</div>;

  const cards = [
    { label: 'Всего пользователей', value: stats.totalUsers, icon: Users, color: 'var(--primary)' },
    { label: 'Активные сейчас', value: stats.activeUsers, icon: Activity, color: 'var(--success)' },
    { label: 'Новые за 24ч', value: stats.newUsersToday, icon: UserCheck, color: 'var(--warning)' },
    { label: 'Всего чатов', value: stats.totalChats, icon: MessageSquare, color: 'var(--secondary)' },
    { label: 'Всего сообщений', value: stats.totalMessages, icon: MessageSquare, color: 'var(--primary)' },
    { label: 'Всего звонков', value: stats.totalCalls, icon: Phone, color: 'var(--danger)' },
  ];

  return (
    <div>
      <h2 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '24px' }}>
        Статистика
      </h2>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
        gap: '16px'
      }}>
        {cards.map((card, i) => {
          const Icon = card.icon;
          return (
            <div key={i} style={{
              padding: '20px',
              background: 'var(--bg-secondary)',
              borderRadius: 'var(--radius)',
              border: '1px solid var(--border)'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '12px'
              }}>
                <Icon size={24} color={card.color} />
                <span style={{
                  fontSize: '28px',
                  fontWeight: '700',
                  color: 'var(--text-primary)'
                }}>
                  {card.value}
                </span>
              </div>
              <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                {card.label}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Users Page
function UsersPage() {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const { data } = await api.get('/admin/users');
      setUsers(data);
    } catch (error) {}
  };

  const toggleBan = async (id, isActive) => {
    try {
      await api.post(`/admin/users/${id}/ban`, { isActive: !isActive });
      loadUsers();
      toast.success(isActive ? 'Пользователь заблокирован' : 'Пользователь разблокирован');
    } catch (error) {
      toast.error('Ошибка');
    }
  };

  const deleteUser = async (id) => {
    if (!confirm('Удалить пользователя навсегда?')) return;
    try {
      await api.delete(`/admin/users/${id}`);
      loadUsers();
      toast.success('Пользователь удалён');
    } catch (error) {
      toast.error('Ошибка');
    }
  };

  return (
    <div>
      <h2 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '24px' }}>
        Пользователи ({users.length})
      </h2>
      <div style={{
        background: 'var(--bg-secondary)',
        borderRadius: 'var(--radius)',
        border: '1px solid var(--border)',
        overflow: 'hidden'
      }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)' }}>
              <th style={tableHeaderStyle}>Пользователь</th>
              <th style={tableHeaderStyle}>Email</th>
              <th style={tableHeaderStyle}>Статус</th>
              <th style={tableHeaderStyle}>Сообщений</th>
              <th style={tableHeaderStyle}>Дата регистрации</th>
              <th style={tableHeaderStyle}>Действия</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user.id} style={{ borderBottom: '1px solid var(--border)' }}>
                <td style={tableCellStyle}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      fontWeight: '600',
                      fontSize: '14px'
                    }}>
                      {user.displayName?.charAt(0) || user.username.charAt(0)}
                    </div>
                    <div>
                      <div style={{ fontWeight: '600' }}>{user.displayName || user.username}</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>@{user.username}</div>
                    </div>
                  </div>
                </td>
                <td style={tableCellStyle}>{user.email}</td>
                <td style={tableCellStyle}>
                  <span style={{
                    padding: '4px 10px',
                    borderRadius: '20px',
                    fontSize: '12px',
                    fontWeight: '600',
                    background: user.isActive ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                    color: user.isActive ? 'var(--success)' : 'var(--danger)'
                  }}>
                    {user.isActive ? 'Активен' : 'Заблокирован'}
                  </span>
                  {user.isOnline && (
                    <span style={{
                      marginLeft: '8px',
                      padding: '2px 8px',
                      borderRadius: '20px',
                      fontSize: '11px',
                      background: 'rgba(99, 102, 241, 0.2)',
                      color: 'var(--primary)'
                    }}>
                      Онлайн
                    </span>
                  )}
                </td>
                <td style={tableCellStyle}>{user._count?.messages || 0}</td>
                <td style={tableCellStyle}>
                  {new Date(user.createdAt).toLocaleDateString('ru-RU')}
                </td>
                <td style={tableCellStyle}>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      onClick={() => toggleBan(user.id, user.isActive)}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '6px',
                        border: 'none',
                        background: user.isActive ? 'var(--danger)' : 'var(--success)',
                        color: 'white',
                        cursor: 'pointer',
                        fontSize: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      {user.isActive ? <Ban size={14} /> : <UserCheck size={14} />}
                      {user.isActive ? 'Бан' : 'Разбан'}
                    </button>
                    <button
                      onClick={() => deleteUser(user.id)}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '6px',
                        border: 'none',
                        background: 'var(--bg-tertiary)',
                        color: 'var(--danger)',
                        cursor: 'pointer',
                        fontSize: '12px'
                      }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Chats Page
function ChatsPage() {
  const [chats, setChats] = useState([]);

  useEffect(() => {
    loadChats();
  }, []);

  const loadChats = async () => {
    try {
      const { data } = await api.get('/admin/chats');
      setChats(data);
    } catch (error) {}
  };

  return (
    <div>
      <h2 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '24px' }}>
        Чаты ({chats.length})
      </h2>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
        gap: '16px'
      }}>
        {chats.map(chat => (
          <div key={chat.id} style={{
            padding: '16px',
            background: 'var(--bg-secondary)',
            borderRadius: 'var(--radius)',
            border: '1px solid var(--border)'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '8px'
            }}>
              <span style={{ fontWeight: '600' }}>{chat.name || 'Без названия'}</span>
              <span style={{
                padding: '2px 8px',
                borderRadius: '10px',
                fontSize: '12px',
                background: 'var(--bg-tertiary)',
                color: 'var(--text-secondary)'
              }}>
                {chat.type}
              </span>
            </div>
            <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
              Владелец: {chat.owner?.displayName || chat.owner?.username}
            </div>
            <div style={{
              display: 'flex',
              gap: '16px',
              marginTop: '12px',
              fontSize: '13px',
              color: 'var(--text-secondary)'
            }}>
              <span>{chat._count?.members || 0} участников</span>
              <span>{chat._count?.messages || 0} сообщений</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Calls Page
function CallsPage() {
  return (
    <div>
      <h2 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '24px' }}>
        История звонков
      </h2>
      <div style={{
        padding: '40px',
        textAlign: 'center',
        color: 'var(--text-muted)'
      }}>
        <Phone size={48} style={{ marginBottom: '16px', opacity: 0.5 }} />
        <p>История звонков будет здесь</p>
      </div>
    </div>
  );
}

const tableHeaderStyle = {
  padding: '12px 16px',
  textAlign: 'left',
  fontSize: '13px',
  fontWeight: '600',
  color: 'var(--text-muted)',
  textTransform: 'uppercase',
  letterSpacing: '0.5px'
};

const tableCellStyle = {
  padding: '12px 16px',
  fontSize: '14px',
  color: 'var(--text-primary)'
};
