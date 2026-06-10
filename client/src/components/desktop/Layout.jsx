import React, { useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import Sidebar from './Sidebar';
import ChatList from './ChatList';
import ChatWindow from './ChatWindow';
import ProfilePanel from './ProfilePanel';
import { useAuthStore } from '../../store/authStore';

export default function Layout() {
  const [activeTab, setActiveTab] = useState('chats');
  const [showProfile, setShowProfile] = useState(false);
  const { user } = useAuthStore();

  return (
    <div className="layout" style={{
      display: 'grid',
      gridTemplateColumns: '72px 320px 1fr',
      height: '100vh',
      background: 'var(--bg-primary)',
      overflow: 'hidden'
    }}>
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab}
        onProfileClick={() => setShowProfile(!showProfile)}
      />

      <ChatList activeTab={activeTab} />

      <div style={{ position: 'relative', display: 'flex', flexDirection: 'column' }}>
        <Routes>
          <Route path="/chat/:chatId" element={<ChatWindow />} />
          <Route path="/" element={
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              color: 'var(--text-muted)',
              fontSize: '18px'
            }}>
              Выберите чат для начала общения
            </div>
          } />
        </Routes>

        {showProfile && <ProfilePanel onClose={() => setShowProfile(false)} />}
      </div>
    </div>
  );
}
