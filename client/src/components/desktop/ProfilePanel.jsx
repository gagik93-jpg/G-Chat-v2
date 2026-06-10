import React, { useState } from 'react';
import { X, Camera, Edit2, Check } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import toast from 'react-hot-toast';

export default function ProfilePanel({ onClose }) {
  const { user, updateProfile } = useAuthStore();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    displayName: user?.displayName || '',
    status: user?.status || ''
  });

  const handleSave = async () => {
    const result = await updateProfile(formData);
    if (result.success) {
      setIsEditing(false);
      toast.success('Профиль обновлён');
    }
  };

  return (
    <div style={{
      position: 'absolute',
      top: 0,
      right: 0,
      width: '320px',
      height: '100%',
      background: 'var(--bg-secondary)',
      borderLeft: '1px solid var(--border)',
      zIndex: 100,
      animation: 'slideIn 0.3s ease'
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '16px',
        borderBottom: '1px solid var(--border)'
      }}>
        <h3 style={{ fontSize: '16px', fontWeight: '600' }}>Профиль</h3>
        <button onClick={onClose} style={iconBtnStyle}>
          <X size={20} />
        </button>
      </div>

      <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        {/* Avatar */}
        <div style={{
          width: '100px',
          height: '100px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontSize: '36px',
          fontWeight: '700',
          marginBottom: '16px',
          position: 'relative'
        }}>
          {user?.displayName?.charAt(0) || user?.username?.charAt(0)}
          <button style={{
            position: 'absolute',
            bottom: '0',
            right: '0',
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            border: 'none',
            background: 'var(--bg-tertiary)',
            color: 'var(--text-primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer'
          }}>
            <Camera size={16} />
          </button>
        </div>

        {/* Name */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          {isEditing ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <input
                type="text"
                value={formData.displayName}
                onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                style={inputStyle}
                placeholder="Имя"
              />
              <input
                type="text"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                style={inputStyle}
                placeholder="Статус"
              />
              <button
                onClick={handleSave}
                style={{
                  padding: '8px 16px',
                  borderRadius: '8px',
                  border: 'none',
                  background: 'var(--primary)',
                  color: 'white',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px'
                }}
              >
                <Check size={16} />
                Сохранить
              </button>
            </div>
          ) : (
            <>
              <h2 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '4px' }}>
                {user?.displayName || user?.username}
              </h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>@{user?.username}</p>
              {user?.status && (
                <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '8px' }}>
                  {user.status}
                </p>
              )}
              <button
                onClick={() => setIsEditing(true)}
                style={{
                  marginTop: '12px',
                  padding: '6px 12px',
                  borderRadius: '8px',
                  border: '1px solid var(--border)',
                  background: 'transparent',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  margin: '12px auto 0'
                }}
              >
                <Edit2 size={14} />
                Редактировать
              </button>
            </>
          )}
        </div>

        {/* Info */}
        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <InfoRow label="Email" value={user?.email} />
          <InfoRow label="Роль" value={user?.isAdmin ? 'Администратор' : 'Пользователь'} />
          <InfoRow label="2FA" value={user?.twoFactorEnabled ? 'Включена' : 'Отключена'} />
        </div>
      </div>
    </div>
  );
}

function InfoRow({ label, value }) {
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      padding: '10px 0',
      borderBottom: '1px solid var(--border)'
    }}>
      <span style={{ color: 'var(--text-muted)', fontSize: '14px' }}>{label}</span>
      <span style={{ color: 'var(--text-primary)', fontSize: '14px', fontWeight: '500' }}>{value}</span>
    </div>
  );
}

const iconBtnStyle = {
  width: '32px',
  height: '32px',
  borderRadius: '50%',
  border: 'none',
  background: 'transparent',
  color: 'var(--text-secondary)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer'
};

const inputStyle = {
  width: '100%',
  padding: '10px 12px',
  borderRadius: '8px',
  border: '1px solid var(--border)',
  background: 'var(--bg-tertiary)',
  color: 'var(--text-primary)',
  outline: 'none',
  fontSize: '14px'
};
