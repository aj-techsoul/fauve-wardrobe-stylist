'use client';
import React, { useState, useRef, useEffect } from 'react';
import { Camera, Fingerprint, Lock, Mail, User, ShieldCheck, Sparkles, Smartphone, Download, Palette } from 'lucide-react';

interface AuthModalProps {
  onSuccess: (user: any) => void;
}

export function AuthModal({ onSuccess }: AuthModalProps) {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentTheme, setCurrentTheme] = useState<string>('pinkbeautiass');

  useEffect(() => {
    const saved = localStorage.getItem('fauve_theme') || 'pinkbeautiass';
    setCurrentTheme(saved);
  }, []);

  const toggleTheme = () => {
    const nextTheme = currentTheme === 'pinkbeautiass' ? 'gold' : 'pinkbeautiass';
    document.documentElement.setAttribute('data-theme', nextTheme);
    localStorage.setItem('fauve_theme', nextTheme);
    setCurrentTheme(nextTheme);
  };

  // Biometric / Face Photo capture state
  const [photoDataUrl, setPhotoDataUrl] = useState<string | null>(null);
  const [showFaceCamera, setShowFaceCamera] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const startFaceCamera = async () => {
    try {
      setShowFaceCamera(true);
      const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 400, height: 400 } });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      alert('Camera access unavailable. You can proceed with text registration or file upload.');
    }
  };

  const captureFaceSnap = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = 300;
    canvas.height = 300;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(videoRef.current, 0, 0, 300, 300);
      const url = canvas.toDataURL('image/png');
      setPhotoDataUrl(url);
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setShowFaceCamera(false);
  };

  const handleStandardAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const endpoint = isRegister ? '/api/auth/register' : '/api/auth/login';
    const payload = isRegister ? { name, email, password, photoDataUrl } : { email, password };

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (res.ok && data.user) {
        onSuccess(data.user);
      } else {
        setError(data.error || 'Authentication failed');
      }
    } catch (err) {
      setError('Connection error');
    } finally {
      setLoading(false);
    }
  };

  const handleBiometricAuth = async () => {
    if (!email) {
      setError('Please enter your email to proceed with Face / Fingerprint login');
      return;
    }

    setLoading(true);
    setError(null);

    // Simulate WebAuthn/Biometric Hardware Prompt
    try {
      const res = await fetch('/api/auth/biometric', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'login', email })
      });
      const data = await res.json();
      if (res.ok && data.user) {
        onSuccess(data.user);
      } else {
        setError(data.error || 'Biometric authentication failed. Ensure biometrics are enabled on your account.');
      }
    } catch (err) {
      setError('Biometric sensor error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-lg">
      <div className="glass-panel max-w-md w-full rounded-2xl border border-zinc-700/70 p-8 shadow-2xl space-y-6 relative gold-border-glow">
        
        {/* Theme Switcher Button Top-Left of Login Modal */}
        <button
          type="button"
          onClick={toggleTheme}
          className="absolute top-4 left-4 px-2.5 py-1 rounded-full bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-amber-400 hover:text-amber-300 text-[10px] font-semibold flex items-center space-x-1.5 transition shadow-sm"
          title="Switch Color Theme"
        >
          <Palette className="w-3.5 h-3.5 text-amber-400" />
          <span className="capitalize">{currentTheme === 'pinkbeautiass' ? 'PinkBeautiass 💕' : 'Haute Gold ✨'}</span>
        </button>

        {/* PWA Install Button Top-Right of Login Modal */}
        <button
          type="button"
          onClick={() => window.dispatchEvent(new CustomEvent('open-pwa-install'))}
          className="absolute top-4 right-4 px-2.5 py-1 rounded-full bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/40 text-amber-400 hover:text-amber-300 text-[10px] font-semibold flex items-center space-x-1 transition shadow-sm"
          title="Install FAUVE App on Phone/Desktop"
        >
          <Smartphone className="w-3.5 h-3.5 animate-pulse" />
          <span>Install PWA</span>
        </button>

        {/* Brand Header */}
        <div className="text-center space-y-2">
            <div
              className="w-12 h-12 rounded-full p-[1.5px] mx-auto flex items-center justify-center shadow-lg"
              style={{
                background: currentTheme === 'pinkbeautiass'
                  ? 'linear-gradient(135deg, #FF8FAB, #FB6F92, #FFC2D1)'
                  : 'linear-gradient(135deg, #92400e, #fbbf24, #fde68a)',
                boxShadow: currentTheme === 'pinkbeautiass' ? '0 4px 20px rgba(255,143,171,0.4)' : '0 4px 20px rgba(251,191,36,0.2)'
              }}
            >
              <div className="w-full h-full bg-zinc-950 rounded-full flex items-center justify-center">
                <span
                  className="font-serif font-bold text-xl"
                  style={{ color: currentTheme === 'pinkbeautiass' ? '#FF8FAB' : '#fbbf24' }}
                >F</span>
              </div>
            </div>
          <h2 className="font-serif text-2xl font-bold tracking-widest gold-gradient-text uppercase">FAUVE</h2>
          <p className="text-xs text-zinc-400">
            {isRegister ? 'Create your Haute Wardrobe Account' : 'Sign in to access your Haute Wardrobe'}
          </p>
        </div>

        {error && (
          <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-xs text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleStandardAuth} className="space-y-4">
          {isRegister && (
            <div>
              <label className="block text-xs uppercase tracking-wider text-zinc-400 mb-1">Full Name</label>
              <div className="relative">
                <User className="w-4 h-4 text-zinc-500 absolute left-3 top-3" />
                <input
                  type="text"
                  required
                  placeholder="Lovely Gloria / Sweet Vini"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg pl-9 pr-3 py-2.5 text-xs text-zinc-200 focus:border-amber-400 outline-none"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs uppercase tracking-wider text-zinc-400 mb-1">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-zinc-500 absolute left-3 top-3" />
              <input
                type="email"
                required
                placeholder="user@fauve.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg pl-9 pr-3 py-2.5 text-xs text-zinc-200 focus:border-amber-400 outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs uppercase tracking-wider text-zinc-400 mb-1">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-zinc-500 absolute left-3 top-3" />
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg pl-9 pr-3 py-2.5 text-xs text-zinc-200 focus:border-amber-400 outline-none"
              />
            </div>
          </div>

          {/* Registration Face Photo Upload (saved as usrnp/{{userid}}.np) */}
          {isRegister && (
            <div className="p-3 bg-zinc-900/60 rounded-xl border border-zinc-800 space-y-2">
              <label className="block text-[11px] uppercase tracking-wider text-zinc-300 font-semibold">
                Upload Face Photo for Virtual Try-On
              </label>
              <p className="text-[10px] text-zinc-400">
                Photo will be stored encrypted as <code className="text-amber-400">usrnp/{`{{userid}}`}.np</code> and can ONLY be opened by you.
              </p>

              {showFaceCamera ? (
                <div className="flex flex-col items-center space-y-2">
                  <video ref={videoRef} autoPlay playsInline className="w-36 h-36 rounded-full object-cover border-2 border-amber-400 bg-black" />
                  <button
                    type="button"
                    onClick={captureFaceSnap}
                    className="px-3 py-1 bg-amber-400 text-zinc-950 font-bold text-[11px] rounded-full"
                  >
                    Snap Face Photo
                  </button>
                </div>
              ) : photoDataUrl ? (
                <div className="flex items-center space-x-3">
                  <img src={photoDataUrl} alt="Face preview" className="w-12 h-12 rounded-full border border-amber-400 object-cover" />
                  <span className="text-xs text-emerald-400 flex items-center space-x-1">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Photo Secured (.np)</span>
                  </span>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={startFaceCamera}
                  className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-amber-300 border border-amber-500/30 rounded-lg text-xs flex items-center space-x-1.5 transition"
                >
                  <Camera className="w-3.5 h-3.5" />
                  <span>Snap Face Photo via Camera</span>
                </button>
              )}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 font-bold text-xs uppercase tracking-widest rounded-xl transition shadow-lg shadow-amber-500/20"
          >
            {loading ? 'Authenticating...' : isRegister ? 'Create Account & Save Profile' : 'Sign In'}
          </button>
        </form>

        {/* Biometric Auth Option */}
        <div className="pt-4 border-t border-zinc-800 space-y-3 text-center">
          <p className="text-[11px] text-zinc-400 uppercase tracking-wider">Or Quick Biometric Access</p>
          <button
            type="button"
            onClick={handleBiometricAuth}
            disabled={loading}
            className="w-full py-2.5 bg-zinc-900 hover:bg-zinc-800 border border-amber-500/40 text-amber-300 font-semibold text-xs rounded-xl flex items-center justify-center space-x-2 transition"
          >
            <Fingerprint className="w-4 h-4 text-amber-400" />
            <span>Login with Face ID / Fingerprint</span>
          </button>
        </div>

        {/* Toggle between Register and Login */}
        <div className="text-center pt-2">
          <button
            type="button"
            onClick={() => {
              setIsRegister(!isRegister);
              setError(null);
            }}
            className="text-xs text-zinc-400 hover:text-amber-400 transition"
          >
            {isRegister ? 'Already have an account? Sign In' : 'Need an account? Register Now'}
          </button>
        </div>
      </div>
    </div>
  );
}
