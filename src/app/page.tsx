'use client';
import React, { useState, useEffect } from 'react';
import { Navbar } from '@/components/Navbar';
import { CameraUpload } from '@/components/CameraUpload';
import { AccessManager } from '@/components/AccessManager';
import { GeminiStylist } from '@/components/GeminiStylist';
import { VirtualTryOn } from '@/components/VirtualTryOn';
import { AuthModal } from '@/components/AuthModal';
import { PwaInstallPrompt } from '@/components/PwaInstallPrompt';
import { saveEncryptedUser, loadEncryptedUser, clearEncryptedUser } from '@/lib/authCrypto';
import { Plus, Tag, ShieldCheck, Heart, Sparkles, Filter, Trash2, Loader2 } from 'lucide-react';

export default function Home() {
  const [user, setUser] = useState<any>(null);
  const [isRestoringSession, setIsRestoringSession] = useState(false);
  const [activeTab, setActiveTab] = useState<'wardrobe' | 'share' | 'gemini' | 'tryon'>('wardrobe');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [theme, setTheme] = useState<string>('pinkbeautiass');

  // App data state
  const [myWardrobes, setMyWardrobes] = useState<any[]>([]);
  const [sharedAccess, setSharedAccess] = useState<any[]>([]);
  const [otherWardrobes, setOtherWardrobes] = useState<any[]>([]);
  const [clothes, setClothes] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedCombo, setSelectedCombo] = useState<any | null>(null);

  useEffect(() => {
    const savedTheme = localStorage.getItem('fauve_theme') || 'pinkbeautiass';
    setTheme(savedTheme);
    document.documentElement.setAttribute('data-theme', savedTheme);

    const restoreSession = async () => {
      setIsRestoringSession(true);
      const timeout = new Promise<null>(resolve => setTimeout(() => resolve(null), 3000));
      try {
        const savedUser = await Promise.race([loadEncryptedUser(), timeout]);
        if (savedUser) {
          setUser(savedUser);
        }
      } catch (err) {
        console.error('Failed to restore session:', err);
      } finally {
        setIsRestoringSession(false);
      }
    };
    restoreSession();
  }, []);

  const handleThemeChange = (newTheme: string) => {
    setTheme(newTheme);
    localStorage.setItem('fauve_theme', newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
  };

  const handleLoginSuccess = async (u: any) => {
    setUser(u);
    await saveEncryptedUser(u);
  };

  const fetchAppData = async () => {
    try {
      const [wardrobesRes, clothesRes] = await Promise.all([
        fetch('/api/wardrobe'),
        fetch('/api/clothes')
      ]);

      if (wardrobesRes.ok) {
        const wData = await wardrobesRes.json();
        setMyWardrobes(wData.myWardrobes || []);
        setSharedAccess(wData.sharedAccess || []);
        setOtherWardrobes(wData.otherWardrobes || []);
      }

      if (clothesRes.ok) {
        const cData = await clothesRes.json();
        setClothes(cData.clothes || []);
      }
    } catch (err) {
      console.error('Error fetching app data:', err);
    }
  };

  useEffect(() => {
    if (user) {
      fetchAppData();
    }
  }, [user]);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/biometric', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'logout' })
      });
    } catch (err) {}
    clearEncryptedUser();
    setUser(null);
  };

  const handleSaveItem = async (item: any) => {
    if (!myWardrobes.length) return;
    try {
      const defaultWardrobeId = myWardrobes[0].id;
      const res = await fetch('/api/clothes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...item, wardrobeId: defaultWardrobeId })
      });
      if (res.ok) {
        setShowUploadModal(false);
        fetchAppData();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to save item');
      }
    } catch (err) {
      alert('Error saving item');
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    if (!confirm('Are you sure you want to remove this item from your wardrobe?')) return;
    try {
      const res = await fetch(`/api/clothes?id=${itemId}`, { method: 'DELETE' });
      if (res.ok) {
        fetchAppData();
      }
    } catch (err) {}
  };

  const filteredClothes = selectedCategory === 'all'
    ? clothes
    : clothes.filter((c) => c.category === selectedCategory);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans selection:bg-amber-400 selection:text-zinc-950">
      {isRestoringSession && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md">
          <div className="flex items-center space-x-3 text-amber-400 font-serif">
            <Loader2 className="w-6 h-6 animate-spin text-amber-400" />
            <span className="text-sm uppercase tracking-widest">Restoring Vault Session...</span>
          </div>
        </div>
      )}

      {!isRestoringSession && !user && <AuthModal onSuccess={handleLoginSuccess} />}

      <Navbar
        user={user}
        activeTab={activeTab}
        setActiveTab={(tab: any) => setActiveTab(tab)}
        onLogout={handleLogout}
        theme={theme}
        onThemeChange={handleThemeChange}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-8">
        {user && activeTab === 'wardrobe' && (
          <div className="space-y-8">
            {/* Wardrobe Overview Banner */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between border-b border-zinc-800 pb-4 gap-4">
              <div>
                <h2 className="font-serif text-2xl font-bold gold-gradient-text uppercase tracking-wider">
                  Haute Wardrobe Vault
                </h2>
                <p className="text-xs text-zinc-400 mt-1">
                  Manage personal attire, size specifications, and background-removed imagery.
                </p>
              </div>

              <button
                onClick={() => setShowUploadModal(true)}
                className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 font-bold text-xs uppercase tracking-widest rounded-xl shadow-lg shadow-amber-500/20 flex items-center space-x-2 transition"
              >
                <Plus className="w-4 h-4 text-zinc-950" />
                <span>Add Apparel (Camera & Size)</span>
              </button>
            </div>

            {/* Category Filters */}
            <div className="flex items-center space-x-2 overflow-x-auto pb-2">
              {['all', 'top', 'bottom', 'shoes', 'accessory'].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider transition ${
                    selectedCategory === cat
                      ? 'bg-amber-500 text-zinc-950 shadow-md'
                      : 'bg-zinc-900 text-zinc-400 hover:text-zinc-200 border border-zinc-800'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Clothes Grid */}
            {filteredClothes.length === 0 ? (
              <div className="glass-panel p-16 rounded-2xl text-center border border-zinc-800 space-y-4">
                <Sparkles className="w-12 h-12 mx-auto text-amber-400/60" />
                <h3 className="text-base font-serif text-zinc-200">Your Vault is Empty</h3>
                <p className="text-xs text-zinc-400 max-w-sm mx-auto">
                  Click 'Add Apparel' to capture your clothes via camera, specify size, and remove background!
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
                {filteredClothes.map((item) => (
                  <div
                    key={item.id}
                    className="glass-card rounded-2xl p-3 border border-zinc-800 flex flex-col justify-between group hover:border-amber-500/40 transition relative"
                  >
                    {/* Size Pill Tag */}
                    <div className="absolute top-4 left-4 z-10 bg-zinc-950/80 backdrop-blur-md px-2 py-0.5 rounded text-[10px] font-mono text-amber-300 border border-amber-500/30">
                      Size: {item.size}
                    </div>

                    {/* Category Label */}
                    <div className="absolute top-4 right-4 z-10 bg-zinc-950/80 backdrop-blur-md px-2 py-0.5 rounded text-[9px] uppercase font-mono text-zinc-400 border border-zinc-800">
                      {item.category}
                    </div>

                    {/* Image Preview Container */}
                    <div className="h-48 w-full bg-zinc-950 rounded-xl p-3 flex items-center justify-center border border-zinc-800/80 my-2 overflow-hidden">
                      <img
                        src={item.image_data}
                        alt={item.name}
                        className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>

                    {/* Details & Delete */}
                    <div className="flex justify-between items-end pt-1">
                      <div>
                        <h4 className="text-xs font-bold text-zinc-200 truncate">{item.name}</h4>
                        <p className="text-[10px] text-zinc-500">{item.color} • {item.owner_name || 'Personal'}</p>
                      </div>

                      {item.owner_id ? null : (
                        <button
                          onClick={() => handleDeleteItem(item.id)}
                          className="text-zinc-600 hover:text-rose-400 p-1 transition"
                          title="Delete item"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {user && activeTab === 'share' && (
          <AccessManager
            currentUser={user}
            otherWardrobes={otherWardrobes}
            sharedAccess={sharedAccess}
          />
        )}

        {user && activeTab === 'gemini' && (
          <GeminiStylist
            onSelectCombination={(combo) => {
              setSelectedCombo(combo);
              setActiveTab('tryon');
            }}
          />
        )}

        {user && activeTab === 'tryon' && (
          <VirtualTryOn 
            currentUser={user} 
            selectedCombo={selectedCombo} 
            onBack={() => setActiveTab('gemini')}
          />
        )}
      </main>

      {showUploadModal && (
        <CameraUpload
          onCaptureComplete={handleSaveItem}
          onCancel={() => setShowUploadModal(false)}
        />
      )}

      <PwaInstallPrompt />

      {/* Footer Credits */}
      <footer className="border-t border-zinc-800/80 py-6 px-6 text-center glass-panel mt-12">
        <div className="max-w-7xl mx-auto space-y-2">
          <p className="text-xs font-serif font-bold text-amber-400/90 tracking-widest uppercase">
            FAUVE
          </p>
          <p className="text-[11px] text-zinc-400">
            Created by <span className="text-zinc-200 font-semibold">Lovely Gloria</span> and{' '}
            <span className="text-zinc-200 font-semibold">Sweet Vini</span>
          </p>
          <p className="text-[10px] text-zinc-500 uppercase tracking-widest">
            Supervised by <span className="text-amber-300 font-bold">Handsome, Genius, PB AJ</span>
          </p>
        </div>
      </footer>
    </div>
  );
}
