import React, { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import { useThemeStore } from './store/themeStore';
import Layout from './components/desktop/Layout';
import MobileLayout from './components/mobile/MobileLayout';
import AuthPage from './components/shared/AuthPage';
import AdminPanel from './components/shared/AdminPanel';
import CallModal from './components/shared/CallModal';
import { Toaster } from 'react-hot-toast';

function App() {
  const { user, checkAuth } = useAuthStore();
  const { theme, initTheme } = useThemeStore();

  useEffect(() => {
    checkAuth();
    initTheme();
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const isMobile = window.innerWidth < 768;

  if (!user) {
    return (
      <>
        <AuthPage />
        <Toaster position="top-center" />
      </>
    );
  }

  return (
    <>
      <Routes>
        <Route path="/*" element={isMobile ? <MobileLayout /> : <Layout />} />
        <Route path="/admin/*" element={user.isAdmin ? <AdminPanel /> : <Navigate to="/" />} />
      </Routes>
      <CallModal />
      <Toaster 
        position="top-right"
        toastOptions={{
          style: {
            background: 'var(--bg-secondary)',
            color: 'var(--text-primary)',
            border: '1px solid var(--border)',
          },
        }}
      />
    </>
  );
}

export default App;
