import React from 'react';
import { LogOut, Shield, Moon } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useThemeStore } from '../../store/themeStore';

export default function MobileProfile() {
  const { user, logout } = useAuthStore();
  const { theme, toggleTheme } = useThemeStore();

  return (
    <div style={{
      padding: '20px',
      display: 'flex',
      flexDirection: 'column',
      gap: '20px'
    }}>
      {/* Avatar */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '12px'
      }}>
        <div style={{
          width: '100px',
          height: '100px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontSize: '40px',
          fontWeight: '700'
        }}>
          {user?.displayName?.charAt(0) || user?.username?.charAt(0)}
        </div>
        <div style={{ textAlign: 'center' }}>
          <h2 style={{ fontSize: '22px', fontWeight: '700' }}>
            {user?.displayName || user?.username}
          </h2>
          <p style={{ color: 'var(--text-muted)' }}>@{user?.username}</p>
        </div>
      </div>

      {/* Settings */}
      <div style={{
        background: 'var(--bg-secondary)',
        borderRadius: '16px',
        overflow: 'hidden'
      }}>
        <SettingItem
          icon={Moon}
          label="Тема"
          value={theme === 'dark' ? 'Тёмная' : theme === 'light' ? 'Светлая' : 'AMOLED'}
          onClick={toggleTheme}
        />
        {user?.isAdmin && (
          <SettingItem
            icon={Shield}
            label="Админ-панель"
            onClick={() => window.location.href = '/admin'}
          />
        )}
      </div>

      {/* Logout */}
      <button
        onClick={logout}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          padding: '16px',
          borderRadius: '16px',
          border: 'none',
          background: 'var(--bg-secondary)',
          color: 'var(--danger)',
          fontSize: '16px',
          fontWeight: '600',
          cursor: 'pointer'
        }}
      >
        <LogOut size={20} />
        Выйти
      </button>
    </div>
  );
}

function SettingItem({ icon: Icon, label, value, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        padding: '16px',
        width: '100%',
        border: 'none',
        background: 'transparent',
        color: 'var(--text-primary)',
        cursor: 'pointer',
        borderBottom: '1px solid var(--border)',
        textAlign: 'left'
      }}
    >
      <Icon size={22} color="var(--primary)" />
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: '16px', fontWeight: '500' }}>{label}</div>
      </div>
      {value && (
        <span style={{ color: 'var(--text-muted)', fontSize: '14px' }}>{value}</span>
      )}
    </button>
  );
}
