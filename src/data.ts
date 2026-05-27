import { CustomizeTheme, CustomizeSound, Chapter } from './types';

// Let's outline the 20+ responsive themes
export const VISUAL_THEMES: CustomizeTheme[] = [
  {
    id: "cosmic-slate",
    name: "Cosmic Slate",
    price: 0,
    primaryColor: "bg-indigo-600 hover:bg-indigo-700 text-white border-indigo-500",
    bgColor: "bg-slate-900 text-slate-100",
    cardColor: "bg-slate-800/80 border border-slate-700/60",
    textColor: "text-slate-100",
    accentColor: "indigo",
    visualVibe: "Cosmic Dark Theme"
  },
  {
    id: "swiss-minimal",
    name: "Swiss Minimalist",
    price: 0,
    primaryColor: "bg-neutral-900 hover:bg-neutral-800 text-white border-neutral-700",
    bgColor: "bg-stone-50 text-neutral-900",
    cardColor: "bg-white border border-stone-200 shadow-sm",
    textColor: "text-neutral-900",
    accentColor: "neutral",
    visualVibe: "Swiss Clean Modernism"
  },
  {
    id: "nord-frost",
    name: "Nord Frost",
    price: 150,
    primaryColor: "bg-sky-600 hover:bg-sky-500 text-white border-sky-400",
    bgColor: "bg-slate-950 text-sky-100",
    cardColor: "bg-slate-900/90 border border-sky-900/50",
    textColor: "text-sky-100",
    accentColor: "sky",
    visualVibe: "Deep Cold Polar Vibe"
  },
  {
    id: "neo-brutalist",
    name: "Neo-Brutalist",
    price: 200,
    primaryColor: "bg-yellow-400 hover:bg-yellow-300 text-black border-4 border-black font-black font-mono",
    bgColor: "bg-lime-50 text-black",
    cardColor: "bg-white border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]",
    textColor: "text-neutral-900",
    accentColor: "yellow",
    visualVibe: "High Contrast Retro Comic"
  },
  {
    id: "emerald-hills",
    name: "Emerald Hills",
    price: 100,
    primaryColor: "bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-500",
    bgColor: "bg-emerald-950/80 text-emerald-50",
    cardColor: "bg-emerald-900/60 border border-emerald-800/50",
    textColor: "text-emerald-50",
    accentColor: "emerald",
    visualVibe: "Enchanted Nature Mint"
  },
  {
    id: "solar-system",
    name: "Solar System",
    price: 250,
    primaryColor: "bg-amber-500 hover:bg-amber-600 text-black font-medium border-amber-400",
    bgColor: "bg-neutral-950 text-amber-50",
    cardColor: "bg-neutral-900 border border-amber-500/30",
    textColor: "text-amber-50",
    accentColor: "amber",
    visualVibe: "Astronomic Interstellar Gold"
  },
  {
    id: "cherry-blossom",
    name: "Sakura Blossom",
    price: 120,
    primaryColor: "bg-rose-500 hover:bg-rose-400 text-white border-rose-300",
    bgColor: "bg-rose-50 text-rose-950",
    cardColor: "bg-white border border-rose-200/80 shadow-rose-100/50 shadow-sm",
    textColor: "text-rose-950",
    accentColor: "rose",
    visualVibe: "Delicate Pastel Cherry"
  },
  {
    id: "midnight-grape",
    name: "Midnight Grape",
    price: 180,
    primaryColor: "bg-purple-600 hover:bg-purple-500 text-white border-purple-400",
    bgColor: "bg-zinc-950 text-purple-50",
    cardColor: "bg-zinc-900 border border-purple-900/40",
    textColor: "text-purple-50",
    accentColor: "purple",
    visualVibe: "Ultra Glowing Neon"
  },
  {
    id: "peach-punch",
    name: "Sweet Peach",
    price: 110,
    primaryColor: "bg-orange-500 hover:bg-orange-400 text-white border-orange-300",
    bgColor: "bg-orange-50/80 text-orange-950",
    cardColor: "bg-white border border-orange-200 shadow-sm",
    textColor: "text-orange-950",
    accentColor: "orange",
    visualVibe: "Warm Sunshine Glow"
  },
  {
    id: "indigo-cyber",
    name: "Cyber Indigo",
    price: 300,
    primaryColor: "bg-fuchsia-600 hover:bg-fuchsia-500 text-white",
    bgColor: "bg-slate-950 text-cyan-400",
    cardColor: "bg-slate-900 border border-cyan-500/20 shadow-cyan-950/20 shadow-lg",
    textColor: "text-cyan-100",
    accentColor: "cyan",
    visualVibe: "Cyberpunk Terminal Neon"
  },
  {
    id: "forest-retreat",
    name: "Forest Retreat",
    price: 140,
    primaryColor: "bg-green-700 hover:bg-green-600 text-white",
    bgColor: "bg-slate-950 text-stone-300",
    cardColor: "bg-stone-900 border border-stone-800",
    textColor: "text-stone-100",
    accentColor: "green",
    visualVibe: "Cozy Log Cabin Woods"
  },
  {
    id: "oceanic-deep",
    name: "Oceanic Deep",
    price: 160,
    primaryColor: "bg-blue-600 hover:bg-blue-500 text-white",
    bgColor: "bg-blue-950 text-blue-100",
    cardColor: "bg-blue-900/85 border border-blue-800/40",
    textColor: "text-blue-150",
    accentColor: "blue",
    visualVibe: "Quiet Deep Sea Dive"
  },
  {
    id: "pumpkin-harvest",
    name: "Pumpkin Spice",
    price: 130,
    primaryColor: "bg-amber-600 hover:bg-amber-500 text-white",
    bgColor: "bg-amber-950/70 text-amber-50",
    cardColor: "bg-amber-900/40 border border-amber-800/30",
    textColor: "text-amber-100",
    accentColor: "amber",
    visualVibe: "Warm Cozy Autumn"
  },
  {
    id: "sepia-journal",
    name: "Vintage Sepia",
    price: 160,
    primaryColor: "bg-yellow-800 hover:bg-yellow-700 text-yellow-100",
    bgColor: "bg-amber-50/50 text-amber-900",
    cardColor: "bg-[#f5ebd6] border border-amber-200 shadow-sm",
    textColor: "text-amber-950",
    accentColor: "amber",
    visualVibe: "Distressed Old Book Journal"
  },
  {
    id: "royal-emperor",
    name: "Royal Velvet",
    price: 400,
    primaryColor: "bg-yellow-500 hover:bg-yellow-400 text-yellow-950 font-semibold border-yellow-300",
    bgColor: "bg-indigo-950 text-yellow-100",
    cardColor: "bg-indigo-900/60 border border-yellow-500/20 shadow-yellow-500/5",
    textColor: "text-yellow-100",
    accentColor: "yellow",
    visualVibe: "Baroque Ornate Velvet Gold"
  },
  {
    id: "sunset-dunes",
    name: "Sunset Dunes",
    price: 150,
    primaryColor: "bg-rose-600 hover:bg-rose-500 text-white",
    bgColor: "bg-[#2d1b24] text-orange-200",
    cardColor: "bg-[#3e2733] border border-rose-900/30",
    textColor: "text-orange-100",
    accentColor: "rose",
    visualVibe: "Vast Warm Desert Dusk"
  },
  {
    id: "mint-soda",
    name: "Mint Garden",
    price: 160,
    primaryColor: "bg-teal-600 hover:bg-teal-500 text-white",
    bgColor: "bg-teal-50/90 text-teal-950",
    cardColor: "bg-white border border-teal-200",
    textColor: "text-teal-900",
    accentColor: "teal",
    visualVibe: "Effervescent Lime Refresh"
  },
  {
    id: "carbon-grey",
    name: "Carbon Graphite",
    price: 80,
    primaryColor: "bg-zinc-800 hover:bg-zinc-700 text-white border-zinc-600",
    bgColor: "bg-zinc-950 text-zinc-100",
    cardColor: "bg-zinc-900 border border-zinc-800",
    textColor: "text-zinc-100",
    accentColor: "zinc",
    visualVibe: "Minimal Dark Carbon Tech"
  },
  {
    id: "editorial-cream",
    name: "Warm Editorial",
    price: 150,
    primaryColor: "bg-[#1f2937] hover:bg-[#374151] text-white",
    bgColor: "bg-[#FAF7F2] text-neutral-800",
    cardColor: "bg-white border border-[#E3DEC3] shadow-md",
    textColor: "text-neutral-900",
    accentColor: "neutral",
    visualVibe: "Aesthetic Newspaper Typography"
  },
  {
    id: "lavender-mist",
    name: "Lavender Mist",
    price: 120,
    primaryColor: "bg-violet-600 hover:bg-violet-550 text-white border-violet-400",
    bgColor: "bg-violet-50 text-violet-950",
    cardColor: "bg-white border border-violet-200/80 shadow-md",
    textColor: "text-violet-900",
    accentColor: "violet",
    visualVibe: "Dreamy Serene Lavender Days"
  }
];

// 20+ synthesized game sounds
export const CUSTOM_SOUNDS: CustomizeSound[] = [
  { id: "synth-chime", name: "Classic Chime", price: 0, iconName: "Volume2", soundType: "chime" },
  { id: "retro-coin", name: "Coin Ping", price: 0, iconName: "Coins", soundType: "sine" },
  { id: "success-ring", name: "Glory Success Bells", price: 100, iconName: "BellRing", soundType: "success" },
  { id: "laser-beam", name: "Synth Laser Sweep", price: 150, iconName: "Zap", soundType: "triangle" },
  { id: "pixel-blip", name: "Chiptune Step Beat", price: 50, iconName: "Sparkles", soundType: "square" },
  { id: "harmonic-hollow", name: "Vibe Resonance", price: 80, iconName: "Smile", soundType: "sine" },
  { id: "wood-clap", name: "Wood Block Drum", price: 60, iconName: "Hand", soundType: "triangle" },
  { id: "metallic-ring", name: "Robot Kettle C", price: 120, iconName: "Cpu", soundType: "square" },
  { id: "whistle", name: "High Whistle Wind", price: 40, iconName: "Wind", soundType: "sine" },
  { id: "cosmic-sweep", name: "Cosmic Rise Sound", price: 200, iconName: "Satellite", soundType: "chime" },
  { id: "happy-gong", name: "Traditional Temple G", price: 250, iconName: "Mic", soundType: "success" },
  { id: "chirp", name: "Digital Cricket Ch", price: 90, iconName: "Compass", soundType: "square" },
  { id: "bubbling", name: "Liquid Soda Fizz", price: 110, iconName: "Droplet", soundType: "triangle" },
  { id: "deep-echo", name: "Sub-harmonic Pounce", price: 130, iconName: "Music", soundType: "sine" },
  { id: "marimba-chord", name: "Ambient Forest M", price: 180, iconName: "Trophy", soundType: "chime" },
  { id: "elevator-bell", name: "Elevator Arrived", price: 70, iconName: "Anchor", soundType: "sine" },
  { id: "victory-synthesizer", name: "Level Up Horns", price: 300, iconName: "Flame", soundType: "success" },
  { id: "ufo-chirp", name: "Space Flying Dish", price: 140, iconName: "Heart", soundType: "square" },
  { id: "cyber-pulse", name: "Analog Bass Thump", price: 160, iconName: "Tv", soundType: "triangle" },
  { id: "drop-water", name: "Pure Water Puddle", price: 90, iconName: "Waves", soundType: "sine" }
];

// Coins items to buy
export interface ShopItem {
  id: string;
  name: string;
  description: string;
  price: number;
  icon: string;
  effect?: string;
  usesRemaining?: number;
}

export const SHOP_ITEMS: ShopItem[] = [
  { id: "coin-multiplier", name: "Coins Booster", description: "Receive 2.0x coins for the next 3 tasks you complete!", price: 250, icon: "Award" },
  { id: "virtual-coffee", name: "Hot Coffee Mug", description: "Feel energized! Plays relaxing bubbly cafe sounds and gives helpful task completion motivation.", price: 60, icon: "Coffee" },
  { id: "exam-shield", name: "Pre-Test Life Shield", description: "Saves your daily streak counter even if you don't study for a day.", price: 350, icon: "Shield" },
  { id: "brain-chocolate", name: "Organic Brain Fuel", description: "Completes current chapter 20m faster or instantly adds 20XP points to Level!", price: 90, icon: "Sparkles" },
  { id: "bubble-wrap", name: "Stress Melter Bubble Wrap", description: "Buy a sheet of stress wrap. Interactive bubble wrap popping simulator pops up!", price: 30, icon: "Hand" },
  { id: "pixel-pet", name: "Hatch pixel companion egg", description: "Hatch a cute helper pet that sits at the corner of your screen as you plan and study!", price: 500, icon: "Gamepad" }
];

// Informative study tips list
export const ROTATIVE_STUDY_TIPS = [
  "Use Active Recall: Write a short summary of a section from memory after finishing it.",
  "Spaced Repetition: Plan a quick revision session 3 days after finishing a hard topic.",
  "Pomodoro Hack: Study in 25-minute absolute focus blocks, followed by a 5-minute break.",
  "Teach Someone Else: Trying to explain 'Boi Pora' or the physics of light makes it stick 3x faster.",
  "Syllabus Hierarchy Rule: Don't dive into sub-details before you outline the main sections.",
  "Gamified Leveling: Use your custom coins to buy beautiful themes and set small milestones.",
  "Routine Cushioning: Buffer days (like your 5 buffer days) are vital to recover from unexpected delays.",
  "Difficulty Priority: Tackle 'hard' chapters in the morning when your mental capacity is fresh.",
  "PDF Import Highlight: Try uploading your Pre-Test syllabus PDF in Settings to dynamically build your system!"
];

// Default Syllabus Bangla 1st data
export const DEFAULT_BANGLA_SYLLABUS: Partial<Chapter>[] = [
  // prose
  { subject: "Bangla 1st", section: "Prose", chapterName: "Shuva", estimatedHours: 1.5, difficulty: "easy" },
  { subject: "Bangla 1st", section: "Prose", chapterName: "Boi Pora", estimatedHours: 1.5, difficulty: "easy" },
  { subject: "Bangla 1st", section: "Prose", chapterName: "Momotadi", estimatedHours: 2.0, difficulty: "medium" },
  { subject: "Bangla 1st", section: "Prose", chapterName: "Prothom Par", estimatedHours: 2.5, difficulty: "medium" },
  // poem
  { subject: "Bangla 1st", section: "Poem", chapterName: "Ranar", estimatedHours: 2.5, difficulty: "hard" },
  { subject: "Bangla 1st", section: "Poem", chapterName: "Kopotaksho Nod", estimatedHours: 1.5, difficulty: "medium" },
  { subject: "Bangla 1st", section: "Poem", chapterName: "Bondona", estimatedHours: 1.5, difficulty: "easy" },
  { subject: "Bangla 1st", section: "Poem", chapterName: "Boshe Khi", estimatedHours: 2.0, difficulty: "medium" },
  // supplementary reading
  { subject: "Bangla 1st", section: "Supplementary Reading", chapterName: "Bohirpir", estimatedHours: 3.5, difficulty: "hard" },
  { subject: "Bangla 1st", section: "Supplementary Reading", chapterName: "1971", estimatedHours: 4.0, difficulty: "hard" }
];

// Browser dynamic audio synthesizer utilizing Web Audio API
export function synthesizeGameSound(soundType: 'sine' | 'square' | 'triangle' | 'chime' | 'success') {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();

    if (soundType === 'sine') {
      // Coin tick pitch sweep
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
      osc.frequency.exponentialRampToValueAtTime(1046.50, ctx.currentTime + 0.15); // C6
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.16);
    } else if (soundType === 'square') {
      // Chiptune jump blip
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(150, ctx.currentTime); 
      osc.frequency.setValueAtTime(300, ctx.currentTime + 0.08);
      osc.frequency.setValueAtTime(600, ctx.currentTime + 0.16);
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.005, ctx.currentTime + 0.25);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.26);
    } else if (soundType === 'triangle') {
      // Smooth bubble bubble
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(120, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.2);
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.22);
    } else if (soundType === 'chime') {
      // Dual-tone high frequency sweet ring
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc1.frequency.setValueAtTime(880, ctx.currentTime);
      osc2.frequency.setValueAtTime(1109, ctx.currentTime + 0.05);

      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.005, ctx.currentTime + 0.5);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      osc1.start();
      osc2.start();
      osc1.stop(ctx.currentTime + 0.5);
      osc2.stop(ctx.currentTime + 0.5);
    } else if (soundType === 'success') {
      // Full level-up scale cascade (Arpeggio sweep)
      const pitches = [261.63, 329.63, 392.00, 523.25, 659.25, 783.99, 1046.50];
      pitches.forEach((pitch, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(pitch, ctx.currentTime + i * 0.08);
        gain.gain.setValueAtTime(0.04, ctx.currentTime + i * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.08 + 0.3);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + i * 0.08);
        osc.stop(ctx.currentTime + i * 0.08 + 0.35);
      });
    }
  } catch (ex) {
    console.warn("Unable to synthesize audio in this layout scope:", ex);
  }
}
