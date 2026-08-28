'use client';
import React, { useState, useRef, useEffect } from 'react';
import { Camera, RefreshCw, Scissors, Sparkles, AlertCircle, FlipHorizontal } from 'lucide-react';

interface CameraUploadProps {
  onCaptureComplete: (item: {
    category: string;
    name: string;
    size: string;
    color: string;
    imageData: string;
    bgRemoved: boolean;
  }) => void;
  onCancel: () => void;
}

export function CameraUpload({ onCaptureComplete, onCancel }: CameraUploadProps) {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [zoom, setZoom] = useState<0.5 | 1 | 2>(1);

  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [processedImage, setProcessedImage] = useState<string | null>(null);
  const [isProcessingBg, setIsProcessingBg] = useState(false);
  const [bgProgress, setBgProgress] = useState<string>('');

  // Item metadata state
  const [category, setCategory] = useState<'top' | 'bottom' | 'shoes' | 'accessory'>('top');
  const [name, setName] = useState('');
  const [size, setSize] = useState('M');
  const [color, setColor] = useState('Black');

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const startCamera = async (targetFacing = facingMode, zoomLevel = zoom) => {
    // Stop any existing stream
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
    }

    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: targetFacing,
          width: { ideal: 1920 },
          height: { ideal: 1440 },
          aspectRatio: { ideal: 3 / 4 }
        }
      });

      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }

      // Try hardware zoom if supported
      applyHardwareZoom(mediaStream, zoomLevel);
    } catch (err) {
      alert('Camera permission denied or unavailable. You can also upload a file.');
    }
  };

  const applyHardwareZoom = (mediaStream: MediaStream, zoomValue: number) => {
    const track = mediaStream.getVideoTracks()[0];
    if (track && 'applyConstraints' in track) {
      const caps = (track.getCapabilities ? track.getCapabilities() : {}) as any;
      if (caps.zoom) {
        const minZ = caps.zoom.min || 0.5;
        const maxZ = caps.zoom.max || 2;
        const target = Math.min(Math.max(zoomValue, minZ), maxZ);
        track.applyConstraints({ advanced: [{ zoom: target } as any] }).catch(() => {});
      }
    }
  };

  const toggleCameraFlip = () => {
    const nextFacing = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(nextFacing);
    if (stream) {
      startCamera(nextFacing, zoom);
    }
  };

  const handleZoomChange = (newZoom: 0.5 | 1 | 2) => {
    setZoom(newZoom);
    if (stream) {
      applyHardwareZoom(stream, newZoom);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
  };

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;

    // Strict 4:3 output resolution
    const targetWidth = 1200;
    const targetHeight = 900;
    canvas.width = targetWidth;
    canvas.height = targetHeight;

    const ctx = canvas.getContext('2d');
    if (ctx) {
      const vw = video.videoWidth || 640;
      const vh = video.videoHeight || 480;

      // Calculate 4:3 source crop
      let cropW = vw;
      let cropH = vh;
      if (vw / vh > 4 / 3) {
        cropW = vh * (4 / 3);
      } else {
        cropH = vw / (4 / 3);
      }

      // Apply zoom crop factor
      cropW = cropW / zoom;
      cropH = cropH / zoom;

      const sx = Math.max(0, (vw - cropW) / 2);
      const sy = Math.max(0, (vh - cropH) / 2);

      ctx.save();
      if (facingMode === 'user') {
        ctx.translate(targetWidth, 0);
        ctx.scale(-1, 1);
      }
      ctx.drawImage(video, sx, sy, cropW, cropH, 0, 0, targetWidth, targetHeight);
      ctx.restore();

      const dataUrl = canvas.toDataURL('image/png');
      setCapturedImage(dataUrl);
      setProcessedImage(dataUrl);
      stopCamera();
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string;
        setCapturedImage(dataUrl);
        setProcessedImage(dataUrl);
      };
      reader.readAsDataURL(file);
    }
  };

  // AI Background Removal using @imgly/background-removal
  const removeBackground = async () => {
    if (!capturedImage) return;
    setIsProcessingBg(true);
    setBgProgress('Starting...');

    try {
      // Dynamically import the library to avoid heavy initial bundle size
      const imglyRemoveBackground = (await import('@imgly/background-removal')).default;
      
      const blob = await imglyRemoveBackground(capturedImage, {
        progress: (key, current, total) => {
          if (key.includes('fetch')) {
            const percent = Math.round((current / total) * 100) || 0;
            setBgProgress(`Downloading AI Model... ${percent}%`);
          } else {
            setBgProgress('Processing image...');
          }
        }
      });
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setProcessedImage(reader.result as string);
        setIsProcessingBg(false);
        setBgProgress('');
      };
      reader.readAsDataURL(blob);
    } catch (error) {
      console.error("Failed to remove background:", error);
      alert("AI Background removal failed. Check console for details.");
      setIsProcessingBg(false);
      setBgProgress('');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('Please enter a clothing item name.');
      return;
    }
    const finalImage = processedImage || capturedImage;
    if (!finalImage) {
      alert('Please capture or upload an image first.');
      return;
    }

    onCaptureComplete({
      category,
      name,
      size,
      color,
      imageData: finalImage,
      bgRemoved: processedImage !== capturedImage
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
      <div className="glass-panel max-w-2xl w-full rounded-2xl border border-zinc-700/60 p-6 shadow-2xl my-8">
        <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
          <div>
            <h2 className="text-xl font-serif font-bold text-zinc-100 gold-gradient-text">Add New Apparel</h2>
            <p className="text-xs text-zinc-400">Capture 4:3 photo, adjust zoom & background removal</p>
          </div>
          <button
            onClick={() => {
              stopCamera();
              onCancel();
            }}
            className="text-zinc-400 hover:text-white text-sm"
          >
            ✕ Close
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-6">
          {/* Image Capture & View */}
          <div className="flex flex-col items-center justify-center border border-dashed border-zinc-700 rounded-xl p-4 bg-zinc-900/50 min-h-[300px] relative">
            {!capturedImage && !stream && (
              <div className="text-center space-y-3">
                <Camera className="w-12 h-12 mx-auto text-amber-400/80 animate-pulse" />
                <p className="text-xs text-zinc-400">Capture with device camera (4:3 ratio) or choose file</p>
                <div className="flex justify-center space-x-3">
                  <button
                    type="button"
                    onClick={() => startCamera()}
                    className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-medium text-xs rounded-lg transition"
                  >
                    Start Camera
                  </button>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-medium text-xs rounded-lg border border-zinc-700 transition"
                  >
                    Upload Photo
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileUpload}
                  />
                </div>
              </div>
            )}

            {stream && (
              <div className="relative w-full max-w-md flex flex-col items-center">
                {/* 4:3 Camera Frame Container */}
                <div className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden bg-black border-2 border-amber-500/40 shadow-2xl flex items-center justify-center">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    className="w-full h-full object-cover transition-transform duration-200 ease-out"
                    style={{
                      transform: `scale(${zoom}) ${facingMode === 'user' ? 'scaleX(-1)' : ''}`
                    }}
                  />

                  {/* Top Badge Overlay */}
                  <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-full text-[10px] font-mono text-amber-400 border border-amber-500/30">
                    4:3
                  </div>

                  {/* Flip Camera Button Top-Right */}
                  <button
                    type="button"
                    onClick={toggleCameraFlip}
                    title="Flip Camera (Front/Rear)"
                    className="absolute top-3 right-3 p-2 rounded-full bg-black/60 hover:bg-amber-500/80 hover:text-zinc-950 text-white backdrop-blur-md border border-zinc-700/80 transition-all duration-200 shadow-md"
                  >
                    <FlipHorizontal className="w-4 h-4" />
                  </button>

                  {/* Grid Framing Overlay */}
                  <div className="absolute inset-0 pointer-events-none border border-white/10 flex flex-col justify-between p-4">
                    <div className="flex justify-between">
                      <div className="w-4 h-4 border-t-2 border-l-2 border-amber-400/70" />
                      <div className="w-4 h-4 border-t-2 border-r-2 border-amber-400/70" />
                    </div>
                    <div className="flex justify-between">
                      <div className="w-4 h-4 border-b-2 border-l-2 border-amber-400/70" />
                      <div className="w-4 h-4 border-b-2 border-r-2 border-amber-400/70" />
                    </div>
                  </div>

                  {/* Zoom Controls Pill Bottom Center Overlay */}
                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center space-x-1 bg-black/70 backdrop-blur-md p-1 rounded-full border border-zinc-700/80 shadow-lg z-10">
                    {([0.5, 1, 2] as const).map((z) => (
                      <button
                        key={z}
                        type="button"
                        onClick={() => handleZoomChange(z)}
                        className={`px-3 py-1 text-xs font-semibold rounded-full transition-all duration-150 ${
                          zoom === z
                            ? 'bg-amber-400 text-zinc-950 shadow'
                            : 'text-zinc-300 hover:text-white hover:bg-zinc-800/60'
                        }`}
                      >
                        {z}x
                      </button>
                    ))}
                  </div>
                </div>

                <div className="mt-4 flex items-center space-x-3">
                  <button
                    type="button"
                    onClick={capturePhoto}
                    className="px-6 py-2.5 bg-amber-400 text-zinc-950 font-bold text-xs uppercase tracking-widest rounded-full shadow-lg shadow-amber-500/20 hover:scale-105 transition"
                  >
                    📸 Take Snap (4:3)
                  </button>
                </div>
              </div>
            )}

            {capturedImage && (
              <div className="w-full flex flex-col items-center space-y-4">
                <div className="relative w-64 aspect-[4/3] bg-zinc-950 border border-zinc-800 rounded-xl p-2 flex items-center justify-center overflow-hidden shadow-inner">
                  <img
                    src={processedImage || capturedImage}
                    alt="Captured apparel"
                    className="max-h-full max-w-full object-contain"
                  />
                  <div className="absolute bottom-2 right-2 bg-black/60 backdrop-blur-md px-2 py-0.5 rounded text-[9px] font-mono text-amber-400 border border-amber-500/20">
                    4:3 Output
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <button
                    type="button"
                    onClick={removeBackground}
                    disabled={isProcessingBg}
                    className={`flex-1 flex items-center justify-center space-x-2 py-3 rounded-xl border border-zinc-700/80 text-sm font-semibold transition ${
                      isProcessingBg ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed' : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200 shadow-lg'
                    }`}
                  >
                    <Scissors className={`w-4 h-4 ${isProcessingBg ? 'animate-pulse' : ''}`} />
                    <span>{isProcessingBg ? (bgProgress || 'Removing BG...') : 'Remove Background'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setCapturedImage(null);
                      setProcessedImage(null);
                    }}
                    className="px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs rounded-lg flex items-center space-x-1"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Retake</span>
                  </button>
                </div>
              </div>
            )}
            <canvas ref={canvasRef} className="hidden" />
          </div>

          {/* Form Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs uppercase tracking-wider text-zinc-400 mb-1">Item Category</label>
              <select
                value={category}
                onChange={(e: any) => setCategory(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2.5 text-xs text-zinc-200 focus:border-amber-500 outline-none"
              >
                <option value="top">Top (Shirt, Jacket, Blouse)</option>
                <option value="bottom">Bottom (Pants, Skirt, Jeans)</option>
                <option value="shoes">Shoes (Sneakers, Heels, Boots)</option>
                <option value="accessory">Accessory (Bag, Watch, Belt)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs uppercase tracking-wider text-zinc-400 mb-1">Clothing Title</label>
              <input
                type="text"
                placeholder="e.g. Silk Noir Blazer"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2.5 text-xs text-zinc-200 focus:border-amber-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs uppercase tracking-wider text-zinc-400 mb-1">Size Specification</label>
              <input
                type="text"
                placeholder="e.g. XS, S, M, L, XL or EU 38"
                value={size}
                onChange={(e) => setSize(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2.5 text-xs text-zinc-200 focus:border-amber-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs uppercase tracking-wider text-zinc-400 mb-1">Color Palette</label>
              <input
                type="text"
                placeholder="e.g. Emerald Green / Metallic Gold"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2.5 text-xs text-zinc-200 focus:border-amber-500 outline-none"
              />
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t border-zinc-800">
            <button
              type="button"
              onClick={onCancel}
              className="px-5 py-2.5 rounded-lg text-xs font-medium text-zinc-400 hover:text-zinc-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 text-zinc-950 font-bold text-xs uppercase tracking-wider rounded-lg shadow-md hover:from-amber-400 hover:to-amber-500 transition"
            >
              Save to Wardrobe
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

