'use client';
import React, { useState } from 'react';
import { Sparkles, Layers, ArrowRight, Zap, RefreshCw } from 'lucide-react';

interface GeminiStylistProps {
  onSelectCombination: (combo: any) => void;
}

export function GeminiStylist({ onSelectCombination }: GeminiStylistProps) {
  const [loading, setLoading] = useState(false);
  const [matches, setMatches] = useState<any[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const generateCombinations = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch('/api/gemini/match', { method: 'POST' });
      const data = await res.json();
      if (res.ok && data.matches) {
        setMatches(data.matches);
      } else {
        setErrorMsg(data.error || 'Failed to generate outfit combinations.');
      }
    } catch (err) {
      setErrorMsg('Server connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between border-b border-zinc-800 pb-4 gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <Sparkles className="w-5 h-5 text-amber-400 animate-spin" />
            <h2 className="font-serif text-2xl font-bold gold-gradient-text">Gemini AI Wardrobe Matcher</h2>
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            Analyzing apparel across your wardrobe & granted shared wardrobes to craft trending Top + Bottom + Shoes combinations.
          </p>
        </div>

        <button
          onClick={generateCombinations}
          disabled={loading}
          className="px-6 py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 font-bold text-xs uppercase tracking-widest rounded-xl shadow-lg shadow-amber-500/20 flex items-center space-x-2 transition"
        >
          {loading ? (
            <RefreshCw className="w-4 h-4 animate-spin text-zinc-950" />
          ) : (
            <Zap className="w-4 h-4 fill-current text-zinc-950" />
          )}
          <span>{loading ? 'Synthesizing Outfits...' : 'Generate Gemini Combinations'}</span>
        </button>
      </div>

      {errorMsg && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-xs">
          {errorMsg}
        </div>
      )}

      {matches.length === 0 && !loading && !errorMsg && (
        <div className="glass-panel p-12 rounded-2xl text-center border border-zinc-800 space-y-4">
          <Layers className="w-12 h-12 mx-auto text-zinc-600" />
          <h3 className="text-base font-serif text-zinc-200">No Outfits Synthesized Yet</h3>
          <p className="text-xs text-zinc-400 max-w-md mx-auto">
            Click the button above to ask Gemini AI to curate full Top, Bottom, and Shoe matches from all wardrobes accessible to you.
          </p>
        </div>
      )}

      {/* Display Outfit Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {matches.map((combo) => (
          <div key={combo.id} className="glass-card rounded-2xl p-5 border border-zinc-700/60 space-y-4 flex flex-col justify-between hover:border-amber-500/50 transition">
            <div>
              <div className="flex justify-between items-center pb-2 border-b border-zinc-800">
                <h3 className="font-serif font-bold text-sm text-amber-300">{combo.styleTitle}</h3>
                <span className="text-[10px] font-mono bg-amber-500/10 text-amber-300 border border-amber-500/20 px-2 py-0.5 rounded">
                  {combo.score}
                </span>
              </div>
              <p className="text-xs text-zinc-300 mt-3 font-serif italic line-clamp-3 leading-relaxed border-l-2 border-amber-500/30 pl-3">"{combo.aiReasoning}"</p>

              {/* 3 Item Stack Preview - Swipeable on Mobile */}
              <div className="flex overflow-x-auto snap-x md:grid md:grid-cols-3 gap-3 mt-5 pb-2 -mx-1 px-1 custom-scrollbar">
                {/* Top */}
                <div className="snap-center shrink-0 w-32 md:w-auto bg-zinc-950/80 rounded-xl p-3 border border-zinc-800 text-center shadow-inner">
                  <span className="text-[10px] uppercase font-bold tracking-widest text-zinc-500 block">Top</span>
                  <div className="h-24 flex items-center justify-center my-2 relative">
                    <img src={combo.top.image_data} alt={combo.top.name} className="max-h-full max-w-full object-contain drop-shadow-xl" />
                  </div>
                  <p className="text-xs font-medium text-zinc-200 truncate">{combo.top.name}</p>
                  <p className="text-[9px] text-zinc-500 mt-1 bg-zinc-900 px-2 py-0.5 rounded-full inline-block">Size {combo.top.size}</p>
                </div>

                {/* Bottom */}
                <div className="snap-center shrink-0 w-32 md:w-auto bg-zinc-950/80 rounded-xl p-3 border border-zinc-800 text-center shadow-inner">
                  <span className="text-[10px] uppercase font-bold tracking-widest text-zinc-500 block">Bottom</span>
                  <div className="h-24 flex items-center justify-center my-2 relative">
                    <img src={combo.bottom.image_data} alt={combo.bottom.name} className="max-h-full max-w-full object-contain drop-shadow-xl" />
                  </div>
                  <p className="text-xs font-medium text-zinc-200 truncate">{combo.bottom.name}</p>
                  <p className="text-[9px] text-zinc-500 mt-1 bg-zinc-900 px-2 py-0.5 rounded-full inline-block">Size {combo.bottom.size}</p>
                </div>

                {/* Shoes */}
                <div className="snap-center shrink-0 w-32 md:w-auto bg-zinc-950/80 rounded-xl p-3 border border-zinc-800 text-center shadow-inner">
                  <span className="text-[10px] uppercase font-bold tracking-widest text-zinc-500 block">Shoes</span>
                  <div className="h-24 flex items-center justify-center my-2 relative">
                    <img src={combo.shoes.image_data} alt={combo.shoes.name} className="max-h-full max-w-full object-contain drop-shadow-xl" />
                  </div>
                  <p className="text-xs font-medium text-zinc-200 truncate">{combo.shoes.name}</p>
                  <p className="text-[9px] text-zinc-500 mt-1 bg-zinc-900 px-2 py-0.5 rounded-full inline-block">Size {combo.shoes.size}</p>
                </div>
              </div>
            </div>

            <button
              onClick={() => onSelectCombination(combo)}
              className="w-full mt-2 py-3.5 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs uppercase tracking-widest rounded-xl flex items-center justify-center space-x-2 transition shadow-[0_4px_16px_rgba(245,158,11,0.25)] active:scale-[0.98]"
            >
              <span>Preview On Me</span>
              <ArrowRight className="w-4 h-4 text-zinc-950" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
