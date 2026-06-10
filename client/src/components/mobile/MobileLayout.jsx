import React, { useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import MobileChatList from './MobileChatList';
import MobileChat from './MobileChat';
import MobileBottomBar from './MobileBottomBar';
import MobileProfile from './MobileProfile';

export default function MobileLayout() {
  const [activeTab, setActiveTab] = useState('chats');

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      background: 'var(--bg-primary)'
    }}>
      <div style={{ flex: 1, overflow: 'hidden' }}>
        <Routes>
          <Route path="/" element={<MobileChatList />} />
          <Route path="/chat/:chatId" element={<MobileChat />} />
          <Route path="/profile" element={<MobileProfile />} />
        </Routes>
      </div>
      <MobileBottomBar activeTab={activeTab} setActiveTab={setActiveTab} />
    </div>
  );
}
