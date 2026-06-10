import React, { useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { MessageSquare, Eye, EyeOff, Lock, User, Mail, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [requires2FA, setRequires2FA] = useState(false);
  const [userId, setUserId] = useState(null);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    displayName: '',
    totpCode: ''
  });

  const { login, register } = useAuthStore();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (requires2FA) {
      const result = await login({
        username: formData.username,
        password: formData.password,
        totpCode: formData.totpCode
      });
      if (result.success) {
        toast.success('Вход выполнен!');
      } else {
        toast.error(result.error);
      }
      return;
    }

    if (isLogin) {
      const result = await login({
        username: formData.username,
        password: formData.password
      });

      if (result.requires2FA) {
        setRequires2FA(true);
        setUserId(result.userId);
      } else if (result.success) {
        toast.success('Вход выполнен!');
      } else {
        toast.error(result.error);
      }
    } else {
      const result = await register({
        username: formData.username,
        email: formData.email,
        password: formData.password,
        displayName: formData.displayName
      });

      if (result.success) {
        toast.success('Регистрация успешна!');
      } else {
        toast.error(result.error);
      }
    }
  };

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #312e81 100%)',
      padding: '20px'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '420px',
        padding: '40px',
        background: 'rgba(30, 41, 59, 0.8)',
        backdropFilter: 'blur(20px)',
        borderRadius: '24px',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
      }}>
        {/* Logo */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '32px'
        }}>
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: '20px',
            background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 10px 40px -10px rgba(99, 102, 241, 0.5)'
          }}>
            <MessageSquare size={32} color="white" />
          </div>
        </div>

        <h1 style={{
          textAlign: 'center',
          fontSize: '28px',
          fontWeight: '700',
          color: 'white',
          marginBottom: '8px'
        }}>
          G-Chat
        </h1>
        <p style={{
          textAlign: 'center',
          color: 'rgba(255, 255, 255, 0.6)',
          marginBottom: '32px',
          fontSize: '14px'
        }}>
          {isLogin ? 'Войдите в свой аккаунт' : 'Создайте новый аккаунт'}
        </p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Username */}
          <div style={{ position: 'relative' }}>
            <User size={18} style={{
              position: 'absolute',
              left: '14px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'rgba(255, 255, 255, 0.5)'
            }} />
            <input
              type="text"
              placeholder="Имя пользователя"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              style={{
                width: '100%',
                padding: '14px 14px 14px 44px',
                borderRadius: '12px',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                background: 'rgba(255, 255, 255, 0.05)',
                color: 'white',
                fontSize: '15px',
                outline: 'none',
                transition: 'all 0.2s'
              }}
              required
            />
          </div>

          {/* Email (register only) */}
          {!isLogin && (
            <div style={{ position: 'relative' }}>
              <Mail size={18} style={{
                position: 'absolute',
                left: '14px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'rgba(255, 255, 255, 0.5)'
              }} />
              <input
                type="email"
                placeholder="Email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                style={{
                  width: '100%',
                  padding: '14px 14px 14px 44px',
                  borderRadius: '12px',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  background: 'rgba(255, 255, 255, 0.05)',
                  color: 'white',
                  fontSize: '15px',
                  outline: 'none'
                }}
                required
              />
            </div>
          )}

          {/* Display name (register only) */}
          {!isLogin && (
            <input
              type="text"
              placeholder="Отображаемое имя (необязательно)"
              value={formData.displayName}
              onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
              style={{
                width: '100%',
                padding: '14px',
                borderRadius: '12px',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                background: 'rgba(255, 255, 255, 0.05)',
                color: 'white',
                fontSize: '15px',
                outline: 'none'
              }}
            />
          )}

          {/* Password */}
          <div style={{ position: 'relative' }}>
            <Lock size={18} style={{
              position: 'absolute',
              left: '14px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'rgba(255, 255, 255, 0.5)'
            }} />
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="Пароль"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              style={{
                width: '100%',
                padding: '14px 44px 14px 44px',
                borderRadius: '12px',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                background: 'rgba(255, 255, 255, 0.05)',
                color: 'white',
                fontSize: '15px',
                outline: 'none'
              }}
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              style={{
                position: 'absolute',
                right: '14px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                color: 'rgba(255, 255, 255, 0.5)',
                cursor: 'pointer'
              }}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          {/* 2FA Code */}
          {requires2FA && (
            <input
              type="text"
              placeholder="Код 2FA"
              value={formData.totpCode}
              onChange={(e) => setFormData({ ...formData, totpCode: e.target.value })}
              style={{
                width: '100%',
                padding: '14px',
                borderRadius: '12px',
                border: '1px solid var(--primary)',
                background: 'rgba(255, 255, 255, 0.05)',
                color: 'white',
                fontSize: '15px',
                outline: 'none',
                textAlign: 'center',
                letterSpacing: '8px'
              }}
              maxLength={6}
              required
            />
          )}

          {/* Submit */}
          <button
            type="submit"
            style={{
              width: '100%',
              padding: '14px',
              borderRadius: '12px',
              border: 'none',
              background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
              color: 'white',
              fontSize: '16px',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              boxShadow: '0 10px 30px -10px rgba(99, 102, 241, 0.5)',
              transition: 'all 0.2s'
            }}
          >
            {isLogin ? 'Войти' : 'Создать аккаунт'}
            <ArrowRight size={18} />
          </button>
        </form>

        {/* Toggle */}
        <p style={{
          textAlign: 'center',
          marginTop: '24px',
          color: 'rgba(255, 255, 255, 0.6)',
          fontSize: '14px'
        }}>
          {isLogin ? 'Нет аккаунта?' : 'Уже есть аккаунт?'}{' '}
          <button
            onClick={() => {
              setIsLogin(!isLogin);
              setRequires2FA(false);
            }}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--primary)',
              cursor: 'pointer',
              fontWeight: '600',
              fontSize: '14px'
            }}
          >
            {isLogin ? 'Зарегистрироваться' : 'Войти'}
          </button>
        </p>
      </div>
    </div>
  );
}
