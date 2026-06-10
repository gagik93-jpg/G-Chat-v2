import React from 'react';
import { MessageSquare, Video, FolderOpen, Settings, Shield, LogOut, Moon, Sun, Smartphone } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useThemeStore } from '../../store/themeStore';

export default function Sidebar({ activeTab, setActiveTab, onProfileClick }) {
  const { user, logout } = useAuthStore();
  const { theme, toggleTheme } = useThemeStore();

  const tabs = [
    { id: 'chats', icon: MessageSquare, label: 'Чаты' },
    { id: 'calls', icon: Video, label: 'Звонки' },
    { id: 'files', icon: FolderOpen, label: 'Файлы' },
  ];

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      padding: '12px 0',
      background: 'var(--bg-secondary)',
      borderRight: '1px solid var(--border)',
      gap: '8px'
    }}>
      {/* Logo */}
      <div style={{
        width: '48px',
        height: '48px',
        borderRadius: '14px',
        background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: 'bold',
        fontSize: '20px',
        color: 'white',
        marginBottom: '16px',
        cursor: 'pointer'
      }} onClick={onProfileClick}>
        G
      </div>

      {/* Tabs */}
      {tabs.map(tab => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              border: 'none',
              background: isActive ? 'var(--primary)' : 'transparent',
              color: isActive ? 'white' : 'var(--text-secondary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'var(--transition)',
              position: 'relative'
            }}
            title={tab.label}
          >
            <Icon size={22} />
            {isActive && (
              <div style={{
                position: 'absolute',
                left: '-12px',
                width: '3px',
                height: '24px',
                borderRadius: '0 3px 3px 0',
                background: 'var(--primary)'
              }} />
            )}
          </button>
        );
      })}

      <div style={{ flex: 1 }} />

      {/* Admin */}
      {user?.isAdmin && (
        <button
          onClick={() => window.location.href = '/admin'}
          style={{
            width: '48px',
            height: '48px',
            borderRadius: '12px',
            border: 'none',
            background: 'transparent',
            color: 'var(--text-secondary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer'
          }}
          title="Админ-панель"
        >
          <Shield size={22} />
        </button>
      )}

      {/* Theme */}
      <button
        onClick={toggleTheme}
        style={{
          width: '48px',
          height: '48px',
          borderRadius: '12px',
          border: 'none',
          background: 'transparent',
          color: 'var(--text-secondary)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer'
        }}
        title="Сменить тему"
      >
        {theme === 'light' ? <Sun size={22} /> : <Moon size={22} />}
      </button>

      {/* Logout */}
      <button
        onClick={logout}
        style={{
          width: '48px',
          height: '48px',
          borderRadius: '12px',
          border: 'none',
          background: 'transparent',
          color: 'var(--danger)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer'
        }}
        title="Выйти"
      >
        <LogOut size={22} />
      </button>
    </div>
  );
}
