import React, { useState } from 'react';
import { Coins, Flame, Gem, Paintbrush, Volume2, Gamepad, Sparkles, AlertCircle, ShoppingCart, Lock } from 'lucide-react';
import { UserProfile } from '../types';
import { VISUAL_THEMES, CUSTOM_SOUNDS, SHOP_ITEMS, synthesizeGameSound } from '../data';

interface ShopPanelProps {
  userProfile: UserProfile;
  onUnlockTheme: (themeId: string, price: number) => void;
  onSetTheme: (themeId: string) => void;
  onUnlockSound: (soundId: string, price: number) => void;
  onSetSound: (soundId: string) => void;
  onPurchaseShopItem: (itemId: string, price: number) => void;
  currentTheme: any;
  ownedThemeIds: string[];
  ownedSoundIds: string[];
}

export default function ShopPanel({
  userProfile,
  onUnlockTheme,
  onSetTheme,
  onUnlockSound,
  onSetSound,
  onPurchaseShopItem,
  currentTheme,
  ownedThemeIds,
  ownedSoundIds
}: ShopPanelProps) {
  
  const [activeTab, setActiveTab] = useState<'themes' | 'sounds' | 'goodies'>('themes');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Pop bubble wrap simulator state
  const [showStressWrap, setShowStressWrap] = useState(false);
  const [bubbles, setBubbles] = useState<boolean[]>(Array(24).fill(false)); // false = pristine, true = popped

  // Hatch Pet state
  const [hasPet, setHasPet] = useState(false);
  const [petEmotion, setPetEmotion] = useState<'happy' | 'neutral' | 'sleepy' | 'focus'>('neutral');

  const handleBuyTheme = (themeId: string, price: number) => {
    setErrorMessage(null);
    if (userProfile.coins < price) {
      setErrorMessage("Insufficient study coins! Study chapters, complete math tasks, or complete sections to earn coins.");
      synthesizeGameSound("triangle");
      return;
    }
    onUnlockTheme(themeId, price);
    synthesizeGameSound("success");
  };

  const handleBuySound = (soundId: string, price: number) => {
    setErrorMessage(null);
    if (userProfile.coins < price) {
      setErrorMessage("Insufficient study coins! Complete more daily routines.");
      synthesizeGameSound("triangle");
      return;
    }
    onUnlockSound(soundId, price);
    const targetSound = CUSTOM_SOUNDS.find(s => s.id === soundId);
    if (targetSound) {
      synthesizeGameSound(targetSound.soundType);
    }
  };

  const handleBuyGoodie = (itemId: string, price: number) => {
    setErrorMessage(null);
    if (userProfile.coins < price) {
      setErrorMessage("Insufficient study coins to buy this goodie item.");
      synthesizeGameSound("triangle");
      return;
    }
    if (itemId === "bubble-wrap") {
      setShowStressWrap(true);
      setBubbles(Array(24).fill(false));
    }
    if (itemId === "pixel-pet") {
      setHasPet(true);
      setPetEmotion('happy');
    }
    onPurchaseShopItem(itemId, price);
    synthesizeGameSound("chime");
  };

  const handlePopBubble = (index: number) => {
    if (bubbles[index]) return; // already popped
    const updated = [...bubbles];
    updated[index] = true;
    setBubbles(updated);
    // satisfying pop sound synthesized
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        const ctx = new AudioContextClass();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(400 + Math.random() * 200, ctx.currentTime);
        gain.gain.setValueAtTime(0.1, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.005, ctx.currentTime + 0.05);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.06);
      }
    } catch(e){}
  };

  const handleInteractPet = () => {
    const emotions: ('happy' | 'neutral' | 'sleepy' | 'focus')[] = ['happy', 'focus', 'neutral'];
    const randomEmotion = emotions[Math.floor(Math.random() * emotions.length)];
    setPetEmotion(randomEmotion);
    synthesizeGameSound("sine");
  };

  return (
    <div id="shop-container" className="space-y-6 animate-fade-in relative">
      {/* Gamification Hub Header Card */}
      <div className={`p-5 rounded-2xl ${currentTheme.cardColor} text-inherit flex flex-col md:flex-row items-center justify-between gap-5 shadow-lg relative overflow-hidden`}>
        {/* Background glow effects */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-indigo-500/10 rounded-full blur-xl" />

        <div className="flex items-center gap-4 relative z-10">
          <div className="w-14 h-14 bg-amber-500/10 rounded-2xl flex items-center justify-center text-amber-500 shrink-0 font-black animate-pulse">
            <Coins className="w-8 h-8" />
          </div>
          <div>
            <span className="text-2xs font-mono text-amber-500 font-bold uppercase tracking-widest">Gamified Vault</span>
            <h2 className="text-xl font-display font-bold tracking-tight">The Pre-Test Planner Store</h2>
            <p className="text-2xs opacity-75">Unlock beautiful styling paradigms, alert chords, and relaxation gadgets using coins acquired from focused revision sessions!</p>
          </div>
        </div>

        {/* Dynamic coins and Level gauges */}
        <div className="flex gap-4 self-stretch md:self-auto relative z-10 select-none">
          {/* Level card */}
          <div className="flex-1 md:flex-initial px-4 py-2.5 rounded-xl bg-slate-500/5 border border-inherit text-center min-w-[100px]">
            <span className="text-3xs font-mono text-indigo-400 font-bold uppercase">Study Level</span>
            <p className="text-lg font-mono font-bold text-indigo-500">Lv. {userProfile.level}</p>
            <p className="text-4xs opacity-50">{userProfile.experience}/100 XP to Up</p>
          </div>
          {/* Coins balance */}
          <div className="flex-1 md:flex-initial px-4 py-2.5 rounded-xl bg-slate-500/5 border border-amber-500/20 text-center min-w-[110px]">
            <span className="text-3xs font-mono text-amber-500 font-bold uppercase">My Coins</span>
            <p className="text-lg font-mono font-bold text-amber-500 flex items-center justify-center gap-1">
              🪙 {userProfile.coins}
            </p>
            <p className="text-4xs opacity-50">Estimated hours * difficulty reward</p>
          </div>
        </div>
      </div>

      {errorMessage && (
        <div className="p-3.5 bg-rose-500/15 text-rose-500 text-xs rounded-xl flex items-start gap-2.5 border border-rose-500/20">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <p className="font-medium">{errorMessage}</p>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-inherit bg-slate-500/5 p-1 rounded-xl">
        <button
          onClick={() => { setActiveTab('themes'); setErrorMessage(null); }}
          className={`flex-1 py-2 text-xs font-medium font-display leading-none rounded-lg transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'themes' ? 'bg-indigo-600 text-white shadow-sm' : 'hover:bg-slate-500/10'
          }`}
        >
          <Paintbrush className="w-3.5 h-3.5" />
          Themes Catalog ({VISUAL_THEMES.length})
        </button>
        <button
          onClick={() => { setActiveTab('sounds'); setErrorMessage(null); }}
          className={`flex-1 py-2 text-xs font-medium font-display leading-none rounded-lg transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'sounds' ? 'bg-indigo-600 text-white shadow-sm' : 'hover:bg-slate-500/10'
          }`}
        >
          <Volume2 className="w-3.5 h-3.5" />
          Audio Oscillators ({CUSTOM_SOUNDS.length})
        </button>
        <button
          onClick={() => { setActiveTab('goodies'); setErrorMessage(null); }}
          className={`flex-1 py-2 text-xs font-medium font-display leading-none rounded-lg transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'goodies' ? 'bg-indigo-600 text-white shadow-sm' : 'hover:bg-slate-500/10'
          }`}
        >
          <Gamepad className="w-3.5 h-3.5" />
          Relaxation Items
        </button>
      </div>

      {/* Active Tab Screen */}
      <div>
        {activeTab === 'themes' && (
          <div id="shop-themes-grid" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {VISUAL_THEMES.map(theme => {
              const isOwned = ownedThemeIds.includes(theme.id);
              const isCurrent = userProfile.currentTheme === theme.id;
              
              return (
                <div key={theme.id} className={`p-4 rounded-xl border transition-all hover:scale-[1.01] flex flex-col justify-between ${
                  isCurrent ? 'ring-2 ring-indigo-500 border-indigo-500' : 'border-slate-500/15'
                } bg-slate-500/5`}>
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-xs font-display">{theme.name}</span>
                      {isCurrent ? (
                        <span className="text-4xs px-2 py-0.5 rounded-full bg-indigo-500 text-white font-semibold font-mono animate-pulse">Running</span>
                      ) : isOwned ? (
                        <span className="text-4xs px-2 py-0.5 rounded-full bg-slate-500/20 font-mono text-inherit">Owned</span>
                      ) : (
                        <span className="text-4xs px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-500 font-bold font-mono">⚠️ {theme.price} Gold</span>
                      )}
                    </div>
                    <p className="text-3xs opacity-75">{theme.visualVibe}</p>
                    
                    {/* Visual Preview Swatch color squares */}
                    <div className={`w-full h-8 rounded-lg mt-2 flex overflow-hidden border border-slate-500/15 border-dashed ${theme.bgColor}`}>
                      <div className="flex-1 p-1">
                        <div className={`w-3/4 h-1.5 rounded ${theme.textColor} opacity-60 text-5xs scale-75 select-none`}>Aa</div>
                        <div className={`w-1/2 h-1 rounded mt-1 opacity-40 text-5xs scale-75 select-none`}>Text</div>
                      </div>
                      <div className="w-8 flex items-center justify-center p-1">
                        <div className={`w-4 h-4 rounded ${theme.primaryColor.split(' ')[0]} shrink-0`} />
                      </div>
                    </div>
                  </div>

                  <div className="mt-3.5 pt-3 border-t border-slate-500/10 flex items-center justify-end">
                    {isCurrent ? (
                      <span className="text-2xs font-bold text-indigo-500 select-none">Active Vibe</span>
                    ) : isOwned ? (
                      <button 
                        onClick={() => { onSetTheme(theme.id); synthesizeGameSound("sine"); }}
                        className="text-2xs px-3 py-1 rounded bg-indigo-600 hover:bg-indigo-700 text-white font-medium transition-all"
                      >
                        Apply Look
                      </button>
                    ) : (
                      <button 
                        onClick={() => handleBuyTheme(theme.id, theme.price)}
                        className="text-2xs px-3 py-1 rounded-full bg-amber-500/20 text-amber-500 border border-amber-500/35 hover:bg-amber-500 hover:text-black font-semibold transition-all flex items-center gap-1"
                      >
                        <ShoppingCart className="w-3 h-3" />
                        BuyLook ({theme.price})
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {activeTab === 'sounds' && (
          <div id="shop-sounds-grid" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {CUSTOM_SOUNDS.map(sound => {
              const isOwned = ownedSoundIds.includes(sound.id);
              const isCurrent = userProfile.currentSound === sound.id;
              
              return (
                <div key={sound.id} className={`p-4 rounded-xl border transition-all hover:scale-[1.01] flex flex-col justify-between ${
                  isCurrent ? 'ring-2 ring-indigo-500 border-indigo-500' : 'border-slate-500/15'
                } bg-slate-500/5`}>
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-xs font-display">{sound.name}</span>
                      {isCurrent ? (
                        <span className="text-4xs px-2 py-0.5 rounded-full bg-indigo-500 text-white font-semibold font-mono">Equipped</span>
                      ) : isOwned ? (
                        <span className="text-4xs px-2 py-0.5 rounded-full bg-slate-500/20 font-mono text-inherit">Owned</span>
                      ) : (
                        <span className="text-4xs px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-500 font-bold font-mono">⚠️ {sound.price} Gold</span>
                      )}
                    </div>
                    <p className="text-3xs opacity-70">Synthesized oscillator: {sound.soundType}</p>
                  </div>

                  <div className="mt-3.5 pt-3 border-t border-slate-500/10 flex items-center justify-between gap-2">
                    <button 
                      onClick={() => synthesizeGameSound(sound.soundType)}
                      title="Preview this sound sweep"
                      className="text-2xs font-bold hover:underline font-mono text-indigo-500"
                    >
                      ▶ Listen Test
                    </button>
                    
                    {isCurrent ? (
                      <span className="text-2xs font-bold text-indigo-500 select-none">Active</span>
                    ) : isOwned ? (
                      <button 
                        onClick={() => { onSetSound(sound.id); synthesizeGameSound(sound.soundType); }}
                        className="text-2xs px-3 py-1 rounded bg-indigo-600 hover:bg-indigo-700 text-white font-medium transition-all"
                      >
                        Set Sound
                      </button>
                    ) : (
                      <button 
                        onClick={() => handleBuySound(sound.id, sound.price)}
                        className="text-2xs px-3 py-1 rounded-full bg-amber-500/20 text-amber-500 border border-amber-500/35 hover:bg-amber-500 hover:text-black font-semibold transition-all flex items-center gap-1"
                      >
                        <ShoppingCart className="w-3 h-3" />
                        Unlock ({sound.price})
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {activeTab === 'goodies' && (
          <div className="space-y-6">
            <div id="shop-goodies-grid" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {SHOP_ITEMS.map(item => (
                <div key={item.id} className="p-4 rounded-xl border border-slate-500/15 bg-slate-500/5 flex flex-col justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-xs font-display">{item.name}</span>
                      <span className="text-4xs px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-500 font-bold font-mono">⚠️ {item.price} Gold</span>
                    </div>
                    <p className="text-3xs opacity-80 leading-relaxed mb-1">{item.description}</p>
                  </div>

                  <div className="mt-3.5 pt-3 border-t border-slate-500/10 flex justify-end">
                    <button 
                      onClick={() => handleBuyGoodie(item.id, item.price)}
                      className="text-2xs px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold flex items-center gap-1.5 transition-all"
                    >
                      <ShoppingCart className="w-3 h-3" />
                      Acquire Goodie
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Stress Popping Wrap Simulator Widget */}
            {showStressWrap && (
              <div id="bubble-wrap-widget" className={`p-5 rounded-2xl ${currentTheme.cardColor} border border-indigo-500/30 animate-scale-in space-y-4`}>
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold font-display tracking-tight flex items-center gap-2 text-indigo-500">
                      <Sparkles className="w-4 h-4" />
                      Interactive Stress Popping Wrap Activated!
                    </h3>
                    <p className="text-3xs opacity-70">Study stress is real. Pop some satisfying synthesized bubble wrapping to relax!</p>
                  </div>
                  <button 
                    onClick={() => setShowStressWrap(false)}
                    className="text-2xs text-indigo-500 font-bold hover:underline"
                  >
                    Close Sheet
                  </button>
                </div>

                <div className="grid grid-cols-6 sm:grid-cols-8 gap-2.5 max-w-md mx-auto p-4 bg-slate-500/5 rounded-xl border border-inherit">
                  {bubbles.map((popped, idx) => (
                    <button
                      key={idx}
                      onClick={() => handlePopBubble(idx)}
                      className={`w-9 h-9 rounded-full flex items-center justify-center transition-all focus:outline-none ${
                        popped 
                          ? 'bg-slate-500/10 border-2 border-inherit scale-90 opacity-40 shadow-inner' 
                          : 'bg-indigo-500/25 border-2 border-indigo-400 hover:bg-indigo-500/45 cursor-pointer shadow-md'
                      }`}
                    >
                      {!popped && <span className="w-1.5 h-1.5 bg-white/70 rounded-full select-none" />}
                    </button>
                  ))}
                </div>
                <div className="text-center">
                  <button 
                    onClick={() => { setBubbles(Array(24).fill(false)); synthesizeGameSound("success"); }}
                    className="text-2xs font-semibold px-3 py-1 bg-slate-500/10 rounded-lg hover:bg-slate-500/20 text-inherit border border-inherit"
                  >
                    🔁 Reset New Sheet
                  </button>
                </div>
              </div>
            )}

            {/* Pixel Pet Companion Box */}
            {hasPet && (
              <div id="companion-pet-box" className="p-4 rounded-xl bg-slate-500/5 border border-amber-500/20 max-w-sm flex items-center gap-4 animate-bounce-short">
                {/* Pet SVG rendering */}
                <div 
                  onClick={handleInteractPet}
                  title="Click to interact with your buddy"
                  className="w-14 h-14 rounded-xl bg-amber-500/15 flex items-center justify-center cursor-pointer relative shrink-0"
                >
                  <svg viewBox="0 0 40 40" className="w-11 h-11">
                    {/* Ears */}
                    <path d="M 12 15 Q 10 5, 14 10" stroke="#f59e0b" strokeWidth="3" fill="none" />
                    <path d="M 28 15 Q 30 5, 26 10" stroke="#f59e0b" strokeWidth="3" fill="none" />
                    {/* Character body */}
                    <circle cx="20" cy="24" r="10" fill="#f59e0b" />
                    {/* Eyes depending on emotion state */}
                    {petEmotion === 'focus' ? (
                      <>
                        <path d="M 15,22 Q 17,20, 19,22" stroke="#000" strokeWidth="1.5" fill="none" />
                        <path d="M 21,22 Q 23,20, 25,22" stroke="#000" strokeWidth="1.5" fill="none" />
                      </>
                    ) : petEmotion === 'sleepy' ? (
                      <>
                        <path d="M 15,22 M 15,23 L 18,23" stroke="#000" strokeWidth="1.5" />
                        <path d="M 22,23 L 25,23" stroke="#000" strokeWidth="1.5" />
                      </>
                    ) : (
                      <>
                        <circle cx="17" cy="23" r="1.5" fill="#000" />
                        <circle cx="23" cy="23" r="1.5" fill="#000" />
                      </>
                    )}
                    {/* Satisfying Smile */}
                    <path d="M 18,27 Q 20,29, 22,27" stroke="#000" strokeWidth="1" fill="none" />
                  </svg>
                  <span className="absolute -top-1 -right-1 bg-amber-500 text-black font-semibold text-4xs h-4 w-4 rounded-full flex items-center justify-center animate-ping">❤</span>
                </div>
                <div>
                  <h4 className="text-2xs font-semibold font-display">Study Buddy Mascot (Hatched!)</h4>
                  <p className="text-3xs opacity-80 mt-0.5">
                    {petEmotion === 'happy' && "Let's structure English 1st and Bangla Prose! I'm ready to study!"}
                    {petEmotion === 'focus' && "Sleek choice of theme! The Swiss Minimalist and Cosmic look are perfect."}
                    {petEmotion === 'neutral' && "Click me again for level motivation tips. Complete tasks to hatch double multipliers!"}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
