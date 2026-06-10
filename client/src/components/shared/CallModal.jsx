import React, { useState, useEffect, useRef } from 'react';
import { Phone, PhoneOff, Mic, MicOff, Video, VideoOff, Monitor } from 'lucide-react';
import { useAuthStore } from '../store/authStore';

export default function CallModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [isIncoming, setIsIncoming] = useState(false);
  const [isVideo, setIsVideo] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const timerRef = useRef(null);

  const { ws } = useAuthStore();

  useEffect(() => {
    if (!ws) return;

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'call_offer') {
        setIsIncoming(true);
        setIsOpen(true);
      }
    };
  }, [ws]);

  useEffect(() => {
    if (isOpen && !isIncoming) {
      timerRef.current = setInterval(() => {
        setCallDuration(d => d + 1);
      }, 1000);
    }
    return () => clearInterval(timerRef.current);
  }, [isOpen, isIncoming]);

  const startCall = async (video = true) => {
    setIsVideo(video);
    setIsOpen(true);
    setIsIncoming(false);
    setCallDuration(0);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: video,
        audio: true
      });
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
    } catch (error) {
      console.error('Failed to get media:', error);
    }
  };

  const acceptCall = async () => {
    setIsIncoming(false);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: isVideo,
        audio: true
      });
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
    } catch (error) {
      console.error('Failed to get media:', error);
    }
  };

  const endCall = () => {
    setIsOpen(false);
    setIsIncoming(false);
    setCallDuration(0);

    if (localVideoRef.current?.srcObject) {
      localVideoRef.current.srcObject.getTracks().forEach(track => track.stop());
    }
  };

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.9)',
      zIndex: 1000,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      {/* Remote video (full screen) */}
      <video
        ref={remoteVideoRef}
        autoPlay
        playsInline
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover'
        }}
      />

      {/* Local video (picture in picture) */}
      <video
        ref={localVideoRef}
        autoPlay
        playsInline
        muted
        style={{
          position: 'absolute',
          bottom: '100px',
          right: '20px',
          width: '200px',
          height: '150px',
          borderRadius: '12px',
          objectFit: 'cover',
          border: '2px solid rgba(255, 255, 255, 0.2)',
          display: isVideoOff ? 'none' : 'block'
        }}
      />

      {/* Incoming call overlay */}
      {isIncoming && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          textAlign: 'center',
          color: 'white'
        }}>
          <div style={{
            width: '100px',
            height: '100px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 24px',
            animation: 'pulse 2s infinite'
          }}>
            <Phone size={48} />
          </div>
          <h2 style={{ fontSize: '24px', marginBottom: '8px' }}>Входящий звонок</h2>
          <p style={{ opacity: 0.7, marginBottom: '32px' }}>Пользователь звонит вам</p>
          <div style={{ display: 'flex', gap: '24px', justifyContent: 'center' }}>
            <button
              onClick={endCall}
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                border: 'none',
                background: 'var(--danger)',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer'
              }}
            >
              <PhoneOff size={28} />
            </button>
            <button
              onClick={acceptCall}
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                border: 'none',
                background: 'var(--success)',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer'
              }}
            >
              <Phone size={28} />
            </button>
          </div>
        </div>
      )}

      {/* Call controls */}
      {!isIncoming && (
        <div style={{
          position: 'absolute',
          bottom: '40px',
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '16px'
        }}>
          <div style={{
            color: 'white',
            fontSize: '18px',
            fontWeight: '500'
          }}>
            {formatDuration(callDuration)}
          </div>
          <div style={{ display: 'flex', gap: '16px' }}>
            <ControlButton
              icon={isMuted ? MicOff : Mic}
              active={isMuted}
              onClick={() => setIsMuted(!isMuted)}
              label="Микрофон"
            />
            <ControlButton
              icon={isVideoOff ? VideoOff : Video}
              active={isVideoOff}
              onClick={() => setIsVideoOff(!isVideoOff)}
              label="Камера"
            />
            <ControlButton
              icon={PhoneOff}
              onClick={endCall}
              danger
              label="Завершить"
            />
          </div>
        </div>
      )}
    </div>
  );
}

function ControlButton({ icon: Icon, active, onClick, danger, label }) {
  return (
    <button
      onClick={onClick}
      style={{
        width: '56px',
        height: '56px',
        borderRadius: '50%',
        border: 'none',
        background: danger ? 'var(--danger)' : active ? 'var(--bg-tertiary)' : 'rgba(255, 255, 255, 0.2)',
        color: 'white',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        backdropFilter: 'blur(10px)'
      }}
      title={label}
    >
      <Icon size={24} />
    </button>
  );
}
