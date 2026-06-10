import React from 'react';
import { MessageSquare, Phone, User, Settings } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

export default function MobileBottomBar({ activeTab, setActiveTab }) {
  const navigate = useNavigate();
  const location = useLocation();

  const tabs = [
    { id: 'chats', icon: MessageSquare, label: 'Чаты', path: '/' },
    { id: 'calls', icon: Phone, label: 'Звонки', path: '/calls' },
    { id: 'profile', icon: User, label: 'Профиль', path: '/profile' },
  ];

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-around',
      padding: '8px 0',
      background: 'var(--bg-secondary)',
      borderTop: '1px solid var(--border)',
      paddingBottom: 'env(safe-area-inset-bottom, 8px)'
    }}>
      {tabs.map(tab => {
        const Icon = tab.icon;
        const isActive = location.pathname === tab.path;
        return (
          <button
            key={tab.id}
            onClick={() => {
              setActiveTab(tab.id);
              navigate(tab.path);
            }}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '4px',
              padding: '4px 16px',
              border: 'none',
              background: 'transparent',
              color: isActive ? 'var(--primary)' : 'var(--text-muted)',
              cursor: 'pointer',
              fontSize: '11px',
              fontWeight: isActive ? '600' : '400'
            }}
          >
            <Icon size={24} />
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
