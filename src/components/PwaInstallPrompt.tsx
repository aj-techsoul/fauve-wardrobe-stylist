'use client';
import React, { useState, useEffect } from 'react';
import { Download, Smartphone, X, Sparkles, CheckCircle2, Share2, Monitor, PlusSquare } from 'lucide-react';

export function PwaInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    // Register Service Worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .then((reg) => console.log('FAUVE PWA Service Worker Registered:', reg.scope))
        .catch((err) => console.error('Service Worker registration error:', err));
    }

    // Listen for BeforeInstallPromptEvent
    const handleBeforeInstallPrompt = async (e: any) => {
      e.preventDefault();
      // Prompt native PWA installation immediately
      e.prompt();
      const choiceResult = await e.userChoice;
      if (choiceResult.outcome === 'accepted') {
        console.log('User accepted the PWA install prompt');
        setInstalled(true);
      }
    };

    // Listen for manual trigger from Navbar or buttons
    const handleManualTrigger = () => {
      setShowModal(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('open-pwa-install', handleManualTrigger);

    // Detect if already running in standalone PWA mode
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setInstalled(true);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('open-pwa-install', handleManualTrigger);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      if (choiceResult.outcome === 'accepted') {
        setInstalled(true);
        setShowBanner(false);
        setShowModal(false);
      }
      setDeferredPrompt(null);
    } else {
      setShowModal(true);
    }
  };

  return (
    <>
      {/* Floating Bottom-Right Banner */}
      {!installed && showBanner && !showModal && (
        <div className="fixed bottom-6 right-6 z-[100] max-w-sm w-full glass-panel border border-amber-500/40 rounded-2xl p-4 shadow-2xl space-y-3 gold-border-glow animate-bounce-subtle">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 font-serif font-bold text-lg">
                F
              </div>
              <div>
                <h4 className="text-xs font-serif font-bold gold-gradient-text uppercase">Install FAUVE PWA</h4>
                <p className="text-[10px] text-zinc-400">Install as native app on Android, iOS or Desktop</p>
              </div>
            </div>
            <button
              onClick={() => setShowBanner(false)}
              className="text-zinc-500 hover:text-zinc-300 p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center space-x-2 pt-1">
            <button
              onClick={handleInstallClick}
              className="flex-1 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 font-bold text-xs uppercase tracking-wider rounded-xl flex items-center justify-center space-x-1.5 shadow-md transition"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Install App</span>
            </button>

            <button
              onClick={() => setShowBanner(false)}
              className="px-3 py-2 bg-zinc-900 border border-zinc-800 text-zinc-400 text-xs rounded-xl hover:text-zinc-200"
            >
              Later
            </button>
          </div>
        </div>
      )}

      {/* PWA Install Details & Instructions Modal */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="glass-panel max-w-lg w-full rounded-2xl border border-amber-500/40 p-6 shadow-2xl space-y-6 relative gold-border-glow">
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 text-zinc-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 font-serif font-bold text-2xl shadow-lg">
                F
              </div>
              <div>
                <h3 className="font-serif text-lg font-bold gold-gradient-text uppercase">
                  Install FAUVE PWA App
                </h3>
                <p className="text-xs text-zinc-400">Offline support, fast performance & full-screen experience</p>
              </div>
            </div>

            {/* Direct Browser Prompt Button if available */}
            {deferredPrompt && (
              <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-center space-y-3">
                <p className="text-xs text-amber-300 font-medium">Your device supports instant 1-click installation!</p>
                <button
                  onClick={handleInstallClick}
                  className="w-full py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 font-bold text-xs uppercase tracking-widest rounded-xl shadow-lg flex items-center justify-center space-x-2 transition"
                >
                  <Download className="w-4 h-4" />
                  <span>Click Here to Install Now</span>
                </button>
              </div>
            )}

            {/* Manual Instructions by Device */}
            <div className="space-y-4 pt-2">
              <h4 className="text-xs uppercase font-bold tracking-wider text-zinc-400 border-b border-zinc-800 pb-2">
                Device Installation Steps
              </h4>

              <div className="space-y-3">
                {/* iOS Safari */}
                <div className="p-3 rounded-xl bg-zinc-900/80 border border-zinc-800 flex items-start space-x-3">
                  <div className="p-2 rounded-lg bg-zinc-800 text-amber-400">
                    <Smartphone className="w-5 h-5" />
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-zinc-200 flex items-center space-x-1">
                      <span>Apple iOS (Safari)</span>
                    </h5>
                    <p className="text-[11px] text-zinc-400 mt-1">
                      1. Tap the <Share2 className="w-3 h-3 inline text-amber-400" /> <strong>Share</strong> button in Safari toolbar.<br />
                      2. Scroll down & tap <PlusSquare className="w-3 h-3 inline text-amber-400" /> <strong>Add to Home Screen</strong>.<br />
                      3. Confirm to launch FAUVE as a standalone app!
                    </p>
                  </div>
                </div>

                {/* Android Chrome */}
                <div className="p-3 rounded-xl bg-zinc-900/80 border border-zinc-800 flex items-start space-x-3">
                  <div className="p-2 rounded-lg bg-zinc-800 text-amber-400">
                    <Smartphone className="w-5 h-5" />
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-zinc-200">Android (Chrome)</h5>
                    <p className="text-[11px] text-zinc-400 mt-1">
                      1. Tap the <strong>⋮ Menu</strong> icon in top-right of Chrome.<br />
                      2. Select <Download className="w-3 h-3 inline text-amber-400" /> <strong>Install App</strong> or <strong>Add to Home screen</strong>.
                    </p>
                  </div>
                </div>

                {/* Desktop Chrome / Edge */}
                <div className="p-3 rounded-xl bg-zinc-900/80 border border-zinc-800 flex items-start space-x-3">
                  <div className="p-2 rounded-lg bg-zinc-800 text-amber-400">
                    <Monitor className="w-5 h-5" />
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-zinc-200">Desktop (Chrome / Edge / Brave)</h5>
                    <p className="text-[11px] text-zinc-400 mt-1">
                      Look for the <Download className="w-3 h-3 inline text-amber-400" /> <strong>Install FAUVE</strong> icon at the right end of your browser's address bar.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-2 text-center">
              <button
                onClick={() => setShowModal(false)}
                className="px-6 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-medium rounded-xl transition"
              >
                Got It
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
