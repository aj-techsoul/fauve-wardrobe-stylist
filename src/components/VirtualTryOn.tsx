'use client';
import React, { useEffect, useState, useRef } from 'react';
import { ShieldCheck, User, Camera, Layers, Lock, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';

interface VirtualTryOnProps {
  currentUser: any;
  selectedCombo: any | null;
  onBack?: () => void;
}

export function VirtualTryOn({ currentUser, selectedCombo, onBack }: VirtualTryOnProps) {
  const [facePhoto, setFacePhoto] = useState<string | null>(null);
  const [securityDenied, setSecurityDenied] = useState(false);
  const [loading, setLoading] = useState(true);

  // New states for Live AR & Photo Update
  const [isLiveMode, setIsLiveMode] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const startLiveCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user' }
      });
      setStream(mediaStream);
      setIsLiveMode(true);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      console.error("Camera error:", err);
      alert("Failed to access camera for Live AR mode.");
    }
  };

  const stopLiveCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setIsLiveMode(false);
  };

  // Cleanup camera on unmount
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const dataUrl = event.target?.result as string;
        setFacePhoto(dataUrl); // Optimistic UI update

        try {
          await fetch('/api/user/face-photo', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ photoDataUrl: dataUrl })
          });
        } catch (err) {
          console.error("Failed to save photo", err);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Fetch securely restricted .np face photo from /api/user/face-photo
  useEffect(() => {
    const loadFacePhoto = async () => {
      try {
        const res = await fetch('/api/user/face-photo');
        if (res.status === 403) {
          setSecurityDenied(true);
          return;
        }
        const data = await res.json();
        if (data.photoDataUrl) {
          setFacePhoto(data.photoDataUrl);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    loadFacePhoto();
  }, []);

  // Trigger celebration effect when combination preview renders
  const triggerConfetti = () => {
    confetti({
      particleCount: 60,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#d4af37', '#f8f6f0', '#fbbf24']
    });
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div className="border-b border-zinc-800 pb-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          {onBack && (
            <button onClick={onBack} className="text-zinc-400 hover:text-amber-400 text-xs font-semibold uppercase tracking-widest flex items-center mb-3 transition">
              ← Back to Stylist
            </button>
          )}
          <h2 className="font-serif text-2xl font-bold gold-gradient-text">Virtual Silhouette & Try-On Studio</h2>
          <p className="text-xs text-zinc-400 mt-1">
            Visualizing wardrobe combinations directly on your encrypted biometric profile photo.
          </p>
        </div>

        <div className="flex items-center space-x-1.5 px-3 py-1 bg-amber-500/10 border border-amber-500/30 rounded-full text-amber-300 text-[11px] font-mono">
          <Lock className="w-3 h-3 text-amber-400" />
          <span>Encrypted `usrnp/{currentUser.id}.np`</span>
        </div>
      </div>

      {securityDenied ? (
        <div className="p-6 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-center space-y-3">
          <Lock className="w-8 h-8 text-rose-400 mx-auto" />
          <h3 className="text-sm font-bold text-rose-300">Security Restriction Enforced</h3>
          <p className="text-xs text-zinc-400 max-w-md mx-auto">
            Face photo files saved in `usrnp/*.np` format cannot be opened or viewed by any user other than the owner itself.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
          {/* Mannequin / Canvas Try-On Stage */}
          <div className="glass-panel rounded-2xl p-4 md:p-6 border border-zinc-800 flex flex-col items-center justify-center space-y-4 text-center min-h-[480px]">
            <div className="relative w-full max-w-sm aspect-[3/4] max-h-[60vh] bg-zinc-950/90 rounded-2xl border border-amber-500/30 p-2 md:p-4 flex flex-col items-center justify-start overflow-hidden shadow-[0_10px_50px_rgba(245,158,11,0.15)] gold-border-glow">
              
              {/* Selected Combination Overlay (Rendered Behind Face/Body if desired, or carefully stacked) */}
              {selectedCombo ? (
                <div className="w-full h-full relative flex flex-col items-center pt-4 pb-8">
                  {/* Background: User Face Header or Live AR Video */}
                  {isLiveMode ? (
                    <div className="absolute inset-0 z-0 overflow-hidden rounded-xl">
                      <video 
                        ref={videoRef} 
                        autoPlay 
                        playsInline 
                        muted 
                        className="w-full h-full object-cover transform scale-x-[-1]"
                      />
                    </div>
                  ) : (
                    <div className="relative z-20 w-20 h-20 md:w-24 md:h-24 rounded-full border-[3px] border-amber-400/80 overflow-hidden bg-zinc-900 shadow-xl mx-auto">
                      {facePhoto ? (
                        <img src={facePhoto} alt="User Face" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center bg-zinc-800 text-zinc-500 text-[10px]">
                          <User className="w-8 h-8" />
                          <span>No Photo</span>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {/* Top */}
                  <div className="absolute top-[15%] w-4/5 h-[40%] flex items-center justify-center z-10 transition-transform duration-500 ease-out hover:scale-105">
                    <img src={selectedCombo.top.image_data} alt="Top" className="max-h-full max-w-full object-contain drop-shadow-2xl" />
                  </div>
                  
                  {/* Bottom */}
                  <div className="absolute top-[45%] w-3/4 h-[40%] flex items-center justify-center z-[5] transition-transform duration-500 ease-out hover:scale-105">
                    <img src={selectedCombo.bottom.image_data} alt="Bottom" className="max-h-full max-w-full object-contain drop-shadow-2xl" />
                  </div>
                  
                  {/* Shoes */}
                  <div className="absolute bottom-[2%] w-1/2 h-[15%] flex items-center justify-center z-0 transition-transform duration-500 ease-out hover:scale-105">
                    <img src={selectedCombo.shoes.image_data} alt="Shoes" className="max-h-full max-w-full object-contain drop-shadow-2xl" />
                  </div>
                </div>
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-zinc-500 space-y-4">
                  {/* User Face Header from .np (Isolated) */}
                  <div className="relative z-20 w-24 h-24 rounded-full border-2 border-amber-400/40 overflow-hidden bg-zinc-900 mx-auto opacity-50">
                    {facePhoto ? (
                      <img src={facePhoto} alt="User Face" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center bg-zinc-800 text-[10px]">
                        <User className="w-8 h-8" />
                      </div>
                    )}
                  </div>
                  <Layers className="w-10 h-10 mx-auto text-zinc-700 mt-4" />
                  <p className="text-xs max-w-[200px]">Select an outfit from the Gemini AI Stylist tab to render try-on visualization.</p>
                </div>
              )}

              {/* Label */}
              <div className="absolute bottom-2 left-0 right-0 z-30 text-[9px] md:text-[10px] text-amber-400 font-mono tracking-widest uppercase bg-zinc-950/80 backdrop-blur-sm py-1 mx-4 rounded-full border border-amber-500/20">
                {selectedCombo ? selectedCombo.styleTitle : 'Silhouette Canvas'}
              </div>
            </div>

            {/* Try-On Controls */}
            <div className="w-full max-w-sm flex space-x-3">
              <input 
                type="file" 
                accept="image/*" 
                ref={fileInputRef} 
                onChange={handlePhotoUpload} 
                className="hidden" 
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex-1 py-2.5 bg-zinc-900 border border-zinc-700 hover:border-zinc-500 text-zinc-300 text-xs font-semibold rounded-xl flex flex-col items-center justify-center space-y-1 transition"
              >
                <Camera className="w-4 h-4" />
                <span>Update Photo</span>
              </button>
              
              <button
                onClick={isLiveMode ? stopLiveCamera : startLiveCamera}
                className={`flex-1 py-2.5 border text-xs font-semibold rounded-xl flex flex-col items-center justify-center space-y-1 transition ${
                  isLiveMode 
                    ? 'bg-rose-500/20 border-rose-500/50 text-rose-300 hover:bg-rose-500/30' 
                    : 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300 hover:bg-emerald-500/30'
                }`}
              >
                <div className={`w-2 h-2 rounded-full ${isLiveMode ? 'bg-rose-500 animate-pulse' : 'bg-emerald-500'}`} />
                <span>{isLiveMode ? 'Stop Live AR' : 'Live AR Mirror'}</span>
              </button>
            </div>

            {selectedCombo && (
              <button
                onClick={triggerConfetti}
                className="w-full max-w-sm px-5 py-3 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-semibold rounded-xl flex items-center justify-center space-x-1.5 transition"
              >
                <Sparkles className="w-4 h-4" />
                <span>Celebrate Outfit Look</span>
              </button>
            )}
          </div>

          {/* Outfit Specs & User Info */}
          <div className="glass-panel rounded-2xl p-6 border border-zinc-800 space-y-6">
            <div className="border-b border-zinc-800 pb-3">
              <h3 className="font-serif text-lg font-bold text-zinc-100">Outfit & Profile Details</h3>
              <p className="text-xs text-zinc-400">Authenticated User: {currentUser.name}</p>
            </div>

            {selectedCombo ? (
              <div className="space-y-4 text-xs">
                <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl">
                  <span className="font-bold text-amber-300 block text-xs">{selectedCombo.styleTitle}</span>
                  <span className="text-[11px] text-zinc-300 mt-1 block">{selectedCombo.aiReasoning}</span>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-center p-2.5 bg-zinc-900/60 rounded-lg border border-zinc-800">
                    <span className="text-zinc-400">Top Piece:</span>
                    <span className="font-medium text-zinc-200">{selectedCombo.top.name} (Size {selectedCombo.top.size})</span>
                  </div>
                  <div className="flex justify-between items-center p-2.5 bg-zinc-900/60 rounded-lg border border-zinc-800">
                    <span className="text-zinc-400">Bottom Piece:</span>
                    <span className="font-medium text-zinc-200">{selectedCombo.bottom.name} (Size {selectedCombo.bottom.size})</span>
                  </div>
                  <div className="flex justify-between items-center p-2.5 bg-zinc-900/60 rounded-lg border border-zinc-800">
                    <span className="text-zinc-400">Footwear:</span>
                    <span className="font-medium text-zinc-200">{selectedCombo.shoes.name} (Size {selectedCombo.shoes.size})</span>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-xs text-zinc-500 italic">
                No combination selected yet. Go to Gemini AI Stylist to generate and choose a matching set.
              </p>
            )}

            <div className="p-4 bg-zinc-900/80 rounded-xl border border-zinc-800 space-y-2 text-[11px] text-zinc-400">
              <div className="flex items-center space-x-2 text-amber-400 font-semibold">
                <ShieldCheck className="w-4 h-4" />
                <span>Security Protocol Standard</span>
              </div>
              <p>
                Your photo data is stored on server file path <code className="text-amber-300 font-mono">usrnp/{currentUser.id}.np</code> in DataURL extension format and is protected against cross-account access.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
