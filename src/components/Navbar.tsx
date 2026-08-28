'use client';
import React, { useState } from 'react';
import { Palette, Sparkles, Heart, Smartphone, Download, Shirt, Users, Wand2, Image as ImageIcon } from 'lucide-react';

export interface NavbarProps {
  user: any;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onLogout: () => void;
  theme?: string;
  onThemeChange?: (theme: string) => void;
}

export function Navbar({ user, activeTab, setActiveTab, onLogout, theme = 'gold', onThemeChange }: NavbarProps) {
  const [showThemeMenu, setShowThemeMenu] = useState(false);

  const handleSelectTheme = (selectedTheme: string) => {
    if (onThemeChange) {
      onThemeChange(selectedTheme);
    }
    setShowThemeMenu(false);
  };

  const handleTriggerPwa = () => {
    window.dispatchEvent(new CustomEvent('open-pwa-install'));
  };

  return (
    <>
      <header className="sticky top-0 z-50 glass-panel border-b border-zinc-800/80 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* Brand Logo & Creators Credit */}
        <div className="flex items-center space-x-4 cursor-pointer" onClick={() => setActiveTab('wardrobe')}>
          <div
            className="w-10 h-10 rounded-full p-[1.5px] flex items-center justify-center shadow-lg"
            style={{
              background: theme === 'pinkbeautiass'
                ? 'linear-gradient(135deg, #FF8FAB, #FB6F92, #FFC2D1)'
                : 'linear-gradient(135deg, #92400e, #fbbf24, #fde68a)',
              boxShadow: theme === 'pinkbeautiass' ? '0 4px 16px rgba(255,143,171,0.3)' : '0 4px 16px rgba(251,191,36,0.1)'
            }}
          >
            <div className="w-full h-full bg-zinc-950 rounded-full flex items-center justify-center">
              <span
                className="font-serif font-bold text-lg"
                style={{ color: theme === 'pinkbeautiass' ? '#FF8FAB' : '#fbbf24' }}
              >F</span>
            </div>
          </div>
          <div>
            <h1 className="font-serif text-2xl font-bold tracking-widest gold-gradient-text uppercase">FAUVE</h1>
            <p className="text-[10px] tracking-wider text-zinc-400 uppercase">Haute Wardrobe & AI Try-On</p>
          </div>
        </div>

        {/* Navigation Tabs */}
        {user && (
          <nav className="hidden md:flex items-center space-x-1 glass-card p-1.5 rounded-full border border-zinc-800">
            <button
              onClick={() => setActiveTab('wardrobe')}
              className={`px-5 py-2 rounded-full text-xs uppercase tracking-widest font-medium transition-all ${
                activeTab === 'wardrobe'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              My Wardrobe
            </button>
            <button
              onClick={() => setActiveTab('share')}
              className={`px-5 py-2 rounded-full text-xs uppercase tracking-widest font-medium transition-all ${
                activeTab === 'share'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Shared Access
            </button>
            <button
              onClick={() => setActiveTab('gemini')}
              className={`px-5 py-2 rounded-full text-xs uppercase tracking-widest font-medium transition-all ${
                activeTab === 'gemini'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Gemini AI Stylist
            </button>
            <button
              onClick={() => setActiveTab('tryon')}
              className={`px-5 py-2 rounded-full text-xs uppercase tracking-widest font-medium transition-all ${
                activeTab === 'tryon'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Virtual Try-On
            </button>
          </nav>
        )}

        {/* User Account, Theme Switcher & PWA Option */}
        <div className="flex items-center space-x-3">
          {/* PWA Install Button */}
          <button
            onClick={handleTriggerPwa}
            className="px-3 py-1.5 rounded-full bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-400 hover:text-amber-300 text-xs font-semibold flex items-center space-x-1.5 transition shadow-sm"
            title="Install FAUVE App on Phone/Desktop"
          >
            <Smartphone className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
            <span className="hidden sm:inline">Install PWA</span>
          </button>

          {/* Theme Selector Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowThemeMenu(!showThemeMenu)}
              className="p-2 rounded-full bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-amber-400 transition-all flex items-center space-x-1.5 px-3 py-1.5"
              title="Change Color Theme"
            >
              <Palette className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-semibold capitalize hidden sm:inline text-zinc-200">
                {theme === 'pinkbeautiass' ? 'PinkBeautiass 💕' : 'Haute Gold ✨'}
              </span>
            </button>

            {showThemeMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-zinc-950 border border-zinc-800 rounded-xl p-2 shadow-2xl z-50 space-y-1 backdrop-blur-xl">
                <p className="text-[10px] uppercase font-bold tracking-wider text-zinc-500 px-2 py-1">
                  Color Themes
                </p>
                <button
                  onClick={() => handleSelectTheme('pinkbeautiass')}
                  className={`w-full text-left px-3 py-2 rounded-lg text-xs font-semibold flex items-center space-x-2 transition ${
                    theme === 'pinkbeautiass'
                      ? 'bg-[#FF8FAB]/20 text-[#FF8FAB] border border-[#FF8FAB]/40'
                      : 'text-zinc-300 hover:bg-zinc-900 hover:text-white'
                  }`}
                >
                  <span className="w-3.5 h-3.5 rounded-full bg-[#FF8FAB] shadow-sm inline-block border border-white/20" />
                  <span>PinkBeautiass 💕</span>
                </button>

                <button
                  onClick={() => handleSelectTheme('gold')}
                  className={`w-full text-left px-3 py-2 rounded-lg text-xs font-semibold flex items-center space-x-2 transition ${
                    theme === 'gold'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                      : 'text-zinc-300 hover:bg-zinc-900 hover:text-white'
                  }`}
                >
                  <span className="w-3.5 h-3.5 rounded-full bg-amber-400 shadow-sm inline-block border border-white/20" />
                  <span>Haute Gold ✨</span>
                </button>
              </div>
            )}
          </div>


          {user ? (
            <div className="flex items-center space-x-3">
              <div className="text-right hidden sm:block">
                <p className="text-xs font-medium text-zinc-200">{user.name}</p>
                <p className="text-[10px] text-zinc-500">{user.email}</p>
              </div>
              <button
                onClick={onLogout}
                className="px-3.5 py-1.5 rounded-lg text-xs font-medium border border-zinc-800 text-zinc-400 hover:text-zinc-100 hover:border-zinc-700 transition"
              >
                Sign Out
              </button>
            </div>
          ) : (
            <div className="text-xs text-amber-400/80 font-mono hidden xs:block">FAUVE Studio</div>
          )}
        </div>
      </div>
    </header>

      {/* Mobile Bottom Navigation */}
      {user && (
        <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 glass-panel border-t border-zinc-800/80 px-2 py-2 flex justify-around items-center shadow-[0_-10px_40px_rgba(0,0,0,0.5)] bg-zinc-950/90 backdrop-blur-xl">
          <button
            onClick={() => setActiveTab('wardrobe')}
            className={`flex flex-col items-center justify-center p-2 rounded-xl w-16 transition-all ${
              activeTab === 'wardrobe' ? 'text-amber-400 scale-110' : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <Shirt className="w-5 h-5 mb-1" />
            <span className="text-[9px] uppercase font-bold tracking-wider">Wardrobe</span>
          </button>
          
          <button
            onClick={() => setActiveTab('share')}
            className={`flex flex-col items-center justify-center p-2 rounded-xl w-16 transition-all ${
              activeTab === 'share' ? 'text-amber-400 scale-110' : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <Users className="w-5 h-5 mb-1" />
            <span className="text-[9px] uppercase font-bold tracking-wider">Shared</span>
          </button>
          
          <button
            onClick={() => setActiveTab('gemini')}
            className={`flex flex-col items-center justify-center p-2 rounded-xl w-16 transition-all ${
              activeTab === 'gemini' ? 'text-amber-400 scale-110' : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <Wand2 className="w-5 h-5 mb-1" />
            <span className="text-[9px] uppercase font-bold tracking-wider">AI Style</span>
          </button>
          
          <button
            onClick={() => setActiveTab('tryon')}
            className={`flex flex-col items-center justify-center p-2 rounded-xl w-16 transition-all ${
              activeTab === 'tryon' ? 'text-amber-400 scale-110' : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <ImageIcon className="w-5 h-5 mb-1" />
            <span className="text-[9px] uppercase font-bold tracking-wider">Try-On</span>
          </button>
        </div>
      )}
    </>
  );
}

