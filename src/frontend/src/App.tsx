import {
  ChevronDown,
  ChevronRight,
  Crown,
  Facebook,
  Globe,
  Instagram,
  Menu,
  Shield,
  Skull,
  Star,
  Sword,
  Twitter,
  Volume2,
  VolumeX,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";

const NAV_LINKS = [
  { label: "The Warrior", href: "#hero" },
  { label: "Battles", href: "#battles" },
  { label: "Achievements", href: "#achievements" },
  { label: "Lore", href: "#lore" },
  { label: "Legacy", href: "#legacy" },
];

const STATS = [
  { icon: Sword, label: "Battles Won", value: "300+", color: "#d7b26a" },
  { icon: Skull, label: "Enemies Defeated", value: "1000+", color: "#d7b26a" },
  { icon: Shield, label: "Years of Service", value: "25", color: "#d7b26a" },
  { icon: Crown, label: "Legends Earned", value: "7", color: "#d7b26a" },
];

const ACHIEVEMENTS = [
  {
    id: 1,
    bgColor: "from-yellow-900/40 to-orange-900/30",
    icon: "⚔️",
    title: "The Iron Vanguard",
    description:
      "First warrior to breach the northern citadel, single-handedly dismantling the enemy's defensive line in the Battle of Ashveld.",
    meta: "Year 12 — Battle of Ashveld",
  },
  {
    id: 2,
    bgColor: "from-amber-900/40 to-yellow-900/30",
    icon: "🛡️",
    title: "Guardian of the East",
    description:
      "Defended three frontier villages against overwhelming odds for seven days and nights without respite, earning eternal gratitude.",
    meta: "Year 17 — Eastern Front Campaign",
  },
  {
    id: 3,
    bgColor: "from-orange-900/40 to-red-900/30",
    icon: "🔥",
    title: "The Undying Flame",
    description:
      "Survived the legendary Siege of Morghad and returned to fight again — a feat no other warrior in recorded history has achieved.",
    meta: "Year 20 — Siege of Morghad",
  },
  {
    id: 4,
    bgColor: "from-yellow-800/40 to-amber-900/30",
    icon: "👑",
    title: "Champion of the Realm",
    description:
      "Honored by the High Council with the Golden Crest — the highest military distinction bestowed upon only the greatest warriors.",
    meta: "Year 23 — Grand Convocation",
  },
];

// ─── Sound Engine ────────────────────────────────────────────────────────────

function useSoundEngine() {
  const ctxRef = useRef<AudioContext | null>(null);
  const [isMuted, setIsMuted] = useState(false);

  const getCtx = useCallback(() => {
    if (!ctxRef.current) {
      ctxRef.current = new AudioContext();
    }
    if (ctxRef.current.state === "suspended") {
      ctxRef.current.resume();
    }
    return ctxRef.current;
  }, []);

  const playClash = useCallback(() => {
    if (isMuted) return;
    const ctx = getCtx();
    const now = ctx.currentTime;

    for (const freq of [800, 803]) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();

      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(freq, now);

      filter.type = "bandpass";
      filter.frequency.setValueAtTime(2000, now);
      filter.Q.setValueAtTime(2, now);

      gain.gain.setValueAtTime(0.4, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.3);
    }
  }, [isMuted, getCtx]);

  const playDrum = useCallback(() => {
    if (isMuted) return;
    const ctx = getCtx();
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(120, now);
    osc.frequency.exponentialRampToValueAtTime(40, now + 0.2);

    gain.gain.setValueAtTime(1.0, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.4);
  }, [isMuted, getCtx]);

  const playShimmer = useCallback(() => {
    if (isMuted) return;
    const ctx = getCtx();
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(3000, now);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.15, now + 0.075);
    gain.gain.linearRampToValueAtTime(0.001, now + 0.15);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.15);
  }, [isMuted, getCtx]);

  const toggleMute = useCallback(() => {
    setIsMuted((prev) => !prev);
  }, []);

  return { playClash, playDrum, playShimmer, isMuted, toggleMute };
}

// ─── Ambient Track ────────────────────────────────────────────────────────────

function useAmbientTrack(isMuted: boolean) {
  const ctxRef = useRef<AudioContext | null>(null);
  const masterGainRef = useRef<GainNode | null>(null);
  const nodesRef = useRef<AudioNode[]>([]);
  const drumIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const hasStartedRef = useRef(false);
  const [isPlaying, setIsPlaying] = useState(false);

  const MASTER_GAIN = 0.15;

  const startAmbient = useCallback(() => {
    if (hasStartedRef.current) return;
    hasStartedRef.current = true;

    const ctx = new AudioContext();
    ctxRef.current = ctx;

    const master = ctx.createGain();
    master.gain.setValueAtTime(MASTER_GAIN, ctx.currentTime);
    master.connect(ctx.destination);
    masterGainRef.current = master;

    // ── 1. Deep bass drone: ~55Hz sine with LFO tremolo ──
    const bassOsc = ctx.createOscillator();
    bassOsc.type = "sine";
    bassOsc.frequency.value = 55;

    const bassGain = ctx.createGain();
    bassGain.gain.value = 0.6;

    const lfo = ctx.createOscillator();
    lfo.type = "sine";
    lfo.frequency.value = 0.15; // very slow tremolo

    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 0.2;

    lfo.connect(lfoGain);
    lfoGain.connect(bassGain.gain);
    bassOsc.connect(bassGain);
    bassGain.connect(master);

    bassOsc.start();
    lfo.start();
    nodesRef.current.push(bassOsc, lfo, bassGain, lfoGain);

    // ── 2. Atmospheric mid pad: 110Hz + 220Hz + 330Hz ──
    const padFreqs = [110, 220, 330];
    const padCycleSeconds = 8;

    for (const freq of padFreqs) {
      const padOsc = ctx.createOscillator();
      padOsc.type = freq === 110 ? "triangle" : "sine";
      padOsc.frequency.value = freq;

      const padGain = ctx.createGain();
      // slowly cycling volume envelope
      const now = ctx.currentTime;
      padGain.gain.setValueAtTime(0.001, now);
      padGain.gain.linearRampToValueAtTime(
        0.25 / padFreqs.indexOf(freq) + 0.15,
        now + padCycleSeconds / 2,
      );
      padGain.gain.linearRampToValueAtTime(0.05, now + padCycleSeconds);

      // schedule repeating fade-in/out
      let t = now + padCycleSeconds;
      for (let i = 0; i < 100; i++) {
        padGain.gain.linearRampToValueAtTime(
          0.25 / (padFreqs.indexOf(freq) + 1) + 0.05,
          t + padCycleSeconds / 2,
        );
        padGain.gain.linearRampToValueAtTime(0.03, t + padCycleSeconds);
        t += padCycleSeconds;
      }

      padOsc.connect(padGain);
      padGain.connect(master);
      padOsc.start();
      nodesRef.current.push(padOsc, padGain);
    }

    // ── 3. Subtle high shimmer: 880Hz + 1320Hz ──
    const shimmerFreqs = [880, 1320];
    const shimmerCycle = 12;
    for (const freq of shimmerFreqs) {
      const shimOsc = ctx.createOscillator();
      shimOsc.type = "sine";
      shimOsc.frequency.value = freq;

      const shimGain = ctx.createGain();
      const nowS = ctx.currentTime;
      shimGain.gain.setValueAtTime(0.001, nowS);

      let ts = nowS;
      for (let i = 0; i < 60; i++) {
        shimGain.gain.linearRampToValueAtTime(0.04, ts + shimmerCycle / 2);
        shimGain.gain.linearRampToValueAtTime(0.001, ts + shimmerCycle);
        ts += shimmerCycle;
      }

      shimOsc.connect(shimGain);
      shimGain.connect(master);
      shimOsc.start();
      nodesRef.current.push(shimOsc, shimGain);
    }

    // ── 4. Slow war drum pulse every ~4 seconds ──
    const fireWarDrum = () => {
      if (!ctxRef.current || !masterGainRef.current) return;
      const c = ctxRef.current;
      const t = c.currentTime;

      const kickOsc = c.createOscillator();
      kickOsc.type = "sine";
      kickOsc.frequency.setValueAtTime(80, t);
      kickOsc.frequency.exponentialRampToValueAtTime(30, t + 0.3);

      const kickGain = c.createGain();
      kickGain.gain.setValueAtTime(0.4, t);
      kickGain.gain.exponentialRampToValueAtTime(0.001, t + 0.4);

      kickOsc.connect(kickGain);
      kickGain.connect(masterGainRef.current);
      kickOsc.start(t);
      kickOsc.stop(t + 0.45);
    };

    fireWarDrum();
    drumIntervalRef.current = setInterval(fireWarDrum, 4000);

    setIsPlaying(true);
  }, []);

  // Handle mute/unmute
  useEffect(() => {
    if (!masterGainRef.current || !ctxRef.current) return;
    const ctx = ctxRef.current;
    const master = masterGainRef.current;
    const now = ctx.currentTime;
    if (isMuted) {
      master.gain.linearRampToValueAtTime(0, now + 0.3);
    } else {
      master.gain.linearRampToValueAtTime(MASTER_GAIN, now + 0.3);
    }
  }, [isMuted]);

  // Register first-interaction listeners
  useEffect(() => {
    const handler = () => startAmbient();
    window.addEventListener("click", handler, { once: true });
    window.addEventListener("scroll", handler, { once: true, passive: true });
    return () => {
      window.removeEventListener("click", handler);
      window.removeEventListener("scroll", handler);
    };
  }, [startAmbient]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (drumIntervalRef.current) clearInterval(drumIntervalRef.current);
      for (const node of nodesRef.current) {
        try {
          (node as OscillatorNode).stop?.();
        } catch (_) {
          // already stopped
        }
        node.disconnect();
      }
      nodesRef.current = [];
      ctxRef.current?.close();
    };
  }, []);

  return { isPlaying };
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function useScrolled(threshold = 80) {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > threshold);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, [threshold]);
  return scrolled;
}

function useInView(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          obs.disconnect();
        }
      },
      { threshold },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, visible };
}

// ─── Sound Toggle Button ──────────────────────────────────────────────────────

function SoundToggle({
  isMuted,
  toggleMute,
}: {
  isMuted: boolean;
  toggleMute: () => void;
}) {
  return (
    <button
      type="button"
      onClick={toggleMute}
      aria-label="Sound On/Off"
      title="Sound On/Off"
      className="fixed bottom-6 right-6 z-50 flex items-center justify-center w-11 h-11 rounded-full transition-all duration-200 hover:scale-110"
      style={{
        background: "rgba(11,11,11,0.85)",
        border: "1px solid rgba(215,178,106,0.5)",
        color: "#d7b26a",
        backdropFilter: "blur(8px)",
        boxShadow: "0 0 16px rgba(215,178,106,0.15)",
      }}
      data-ocid="sound.toggle"
    >
      {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
    </button>
  );
}

// ─── Sections ────────────────────────────────────────────────────────────────

function Navbar() {
  const scrolled = useScrolled();
  const [mobileOpen, setMobileOpen] = useState(false);

  const scrollToTribute = () => {
    setMobileOpen(false);
    document.getElementById("tribute")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled
          ? "bg-[#0b0b0b]/95 backdrop-blur-md shadow-lg"
          : "bg-transparent"
      }`}
    >
      <nav className="max-w-7xl mx-auto px-6 flex items-center justify-between h-16 lg:h-20">
        {/* Brand */}
        <a
          href="#hero"
          className="flex items-center gap-2 group"
          data-ocid="nav.link"
        >
          <span className="text-2xl">⚔️</span>
          <span
            className="font-cinzel font-bold text-sm tracking-widest uppercase"
            style={{
              background: "linear-gradient(135deg, #f0d9a2, #d7b26a, #b88a3f)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            TANTU DEY
          </span>
        </a>

        {/* Desktop nav */}
        <ul className="hidden lg:flex items-center gap-8">
          {NAV_LINKS.map((link) => (
            <li key={link.href}>
              <a href={link.href} className="nav-link" data-ocid="nav.link">
                {link.label}
              </a>
            </li>
          ))}
        </ul>

        {/* CTA */}
        <div className="hidden lg:block">
          <a
            href="#tribute"
            className="gold-btn px-5 py-2 text-xs rounded-sm"
            data-ocid="nav.primary_button"
          >
            Tribute
          </a>
        </div>

        {/* Mobile toggle */}
        <button
          type="button"
          className="lg:hidden text-foreground p-1"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle menu"
          data-ocid="nav.toggle"
        >
          {mobileOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </nav>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden bg-[#0b0b0b]/98 border-t border-border px-6 pb-4"
          >
            <ul className="flex flex-col gap-4 pt-4">
              {NAV_LINKS.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    className="nav-link block"
                    onClick={() => setMobileOpen(false)}
                    data-ocid="nav.link"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
              <li>
                <button
                  type="button"
                  onClick={scrollToTribute}
                  className="gold-btn px-5 py-2 text-xs rounded-sm mt-2"
                  data-ocid="nav.primary_button"
                >
                  Tribute
                </button>
              </li>
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}

function HeroSection({ playClash }: { playClash: () => void }) {
  const scrollToBattles = () => {
    document.getElementById("battles")?.scrollIntoView({ behavior: "smooth" });
  };

  const handleCTA = () => {
    playClash();
    scrollToBattles();
  };

  return (
    <section
      id="hero"
      className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden"
      style={{
        backgroundImage:
          "url('/assets/generated/warrior-hero.dim_1400x700.jpg')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundAttachment: "fixed",
      }}
    >
      {/* Cinematic layered overlay */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(to bottom, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0.3) 40%, rgba(11,11,11,0.85) 100%)",
        }}
      />

      {/* Vignette sides */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 100% 100% at 50% 50%, transparent 40%, rgba(0,0,0,0.6) 100%)",
        }}
      />

      {/* Content */}
      <div className="relative z-10 text-center px-6 max-w-5xl mx-auto flex-1 flex flex-col items-center justify-center py-24">
        {/* Eyebrow */}
        <div className="hero-anim hero-anim-1">
          <p
            className="font-cinzel text-xs md:text-sm tracking-[0.5em] uppercase mb-8"
            style={{ color: "#d7b26a" }}
          >
            — &nbsp; A Tribute To The Legend &nbsp; —
          </p>
        </div>

        {/* Main title */}
        <div className="hero-anim hero-anim-2">
          <h1
            className="font-cinzel font-black text-6xl sm:text-7xl md:text-8xl lg:text-[7rem] xl:text-[8rem] uppercase leading-none tracking-wider mb-4"
            style={{
              background:
                "linear-gradient(180deg, #f0d9a2 0%, #d7b26a 55%, #b88a3f 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
              filter:
                "drop-shadow(0 2px 4px rgba(0,0,0,0.8)) drop-shadow(0 0 40px rgba(215,178,106,0.2))",
            }}
          >
            TANTU DEY
          </h1>
        </div>

        {/* Ornamental divider */}
        <div className="hero-anim hero-anim-3 flex items-center gap-4 mb-5">
          <div
            className="h-px w-16 md:w-24"
            style={{
              background: "linear-gradient(90deg, transparent, #d7b26a)",
            }}
          />
          <span className="text-lg" style={{ color: "#d7b26a" }}>
            ⚔
          </span>
          <div
            className="h-px w-16 md:w-24"
            style={{
              background: "linear-gradient(90deg, #d7b26a, transparent)",
            }}
          />
        </div>

        {/* Subtitle */}
        <div className="hero-anim hero-anim-3">
          <p
            className="font-cinzel text-xl sm:text-2xl md:text-3xl tracking-[0.4em] uppercase mb-8"
            style={{ color: "#d7b26a", opacity: 0.9 }}
          >
            THE WARRIOR
          </p>
        </div>

        {/* Tagline */}
        <div className="hero-anim hero-anim-4">
          <p
            className="text-base md:text-lg lg:text-xl max-w-xl mx-auto mb-10 leading-relaxed tracking-wide"
            style={{
              color: "#e7e0d2",
              textShadow: "0 1px 8px rgba(0,0,0,0.8)",
              fontStyle: "italic",
            }}
          >
            Born in battle. Forged in fire. Remembered forever.
          </p>
        </div>

        {/* CTA button */}
        <div className="hero-anim hero-anim-5">
          <button
            type="button"
            onClick={handleCTA}
            className="gold-btn inline-flex items-center gap-3 px-9 py-4 rounded-full text-sm"
            data-ocid="hero.primary_button"
          >
            <span className="text-base">⚔️</span>
            HONOR HIS LEGACY
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* Animated scroll indicator */}
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 z-10 hero-anim hero-anim-6">
        <span
          className="font-cinzel text-[10px] tracking-[0.3em] uppercase"
          style={{ color: "#d7b26a" }}
        >
          Scroll
        </span>
        <button
          type="button"
          aria-label="Scroll down"
          onClick={scrollToBattles}
          className="bounce-chevron p-0 border-0 bg-transparent cursor-pointer"
          data-ocid="hero.button"
        >
          <ChevronDown size={26} style={{ color: "#d7b26a" }} />
        </button>
      </div>
    </section>
  );
}

function BattleStats({ playDrum }: { playDrum: () => void }) {
  const { ref, visible } = useInView();
  const drumPlayedRef = useRef(false);

  useEffect(() => {
    if (visible && !drumPlayedRef.current) {
      drumPlayedRef.current = true;
      playDrum();
    }
  }, [visible, playDrum]);

  return (
    <section id="battles" className="py-24 bg-[#0b0b0b]" ref={ref}>
      <div className="max-w-6xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={visible ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <p
            className="font-cinzel text-xs tracking-[0.4em] uppercase mb-4"
            style={{ color: "#d7b26a" }}
          >
            In Numbers
          </p>
          <h2
            className="font-cinzel font-bold text-4xl md:text-5xl uppercase tracking-widest mb-4"
            style={{
              background: "linear-gradient(135deg, #f0d9a2, #d7b26a)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            Battle Statistics
          </h2>
          <div className="section-divider" />
        </motion.div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {STATS.map((stat, i) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 40 }}
                animate={visible ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.7, delay: i * 0.1 + 0.2 }}
                className="warrior-card rounded-sm p-8 flex flex-col items-center text-center"
                data-ocid={`battles.card.${i + 1}`}
              >
                <div
                  className="mb-5 p-3 rounded-sm"
                  style={{
                    background: "rgba(215,178,106,0.08)",
                    border: "1px solid rgba(215,178,106,0.25)",
                  }}
                >
                  <Icon size={28} style={{ color: "#d7b26a" }} />
                </div>
                <div
                  className="font-cinzel font-black text-4xl md:text-5xl mb-2"
                  style={{
                    background: "linear-gradient(180deg, #f0d9a2, #d7b26a)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundClip: "text",
                  }}
                >
                  {stat.value}
                </div>
                <p
                  className="font-cinzel text-xs tracking-widest uppercase"
                  style={{ color: "#b9b0a0" }}
                >
                  {stat.label}
                </p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function Achievements({ playShimmer }: { playShimmer: () => void }) {
  const { ref, visible } = useInView();

  return (
    <section
      id="achievements"
      className="py-24"
      style={{ background: "#1a1f1f" }}
      ref={ref}
    >
      <div className="max-w-6xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={visible ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <p
            className="font-cinzel text-xs tracking-[0.4em] uppercase mb-4"
            style={{ color: "#d7b26a" }}
          >
            Trophies &amp; Honors
          </p>
          <h2
            className="font-cinzel font-bold text-4xl md:text-5xl uppercase tracking-widest mb-4"
            style={{
              background: "linear-gradient(135deg, #f0d9a2, #d7b26a)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            Achievements
          </h2>
          <div className="section-divider" />
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {ACHIEVEMENTS.map((ach, i) => (
            <motion.div
              key={ach.id}
              initial={{ opacity: 0, y: 40 }}
              animate={visible ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.7, delay: i * 0.12 + 0.2 }}
              className="warrior-card rounded-sm overflow-hidden"
              onMouseEnter={playShimmer}
              data-ocid={`achievements.card.${i + 1}`}
            >
              <div
                className={`achievement-icon-placeholder bg-gradient-to-br ${ach.bgColor}`}
              >
                <span className="text-6xl filter drop-shadow-lg">
                  {ach.icon}
                </span>
              </div>

              <div className="p-5">
                <h3
                  className="font-cinzel font-bold text-sm uppercase tracking-wide mb-2"
                  style={{ color: "#d7b26a" }}
                >
                  {ach.title}
                </h3>
                <p
                  className="text-sm leading-relaxed mb-4"
                  style={{ color: "#b9b0a0" }}
                >
                  {ach.description}
                </p>
                <p
                  className="font-cinzel text-[10px] tracking-widest uppercase"
                  style={{ color: "rgba(215,178,106,0.5)" }}
                >
                  {ach.meta}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function JourneySection() {
  const { ref, visible } = useInView();

  return (
    <section id="lore" className="py-24 bg-[#0b0b0b]" ref={ref}>
      <div className="max-w-6xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={visible ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <p
            className="font-cinzel text-xs tracking-[0.4em] uppercase mb-4"
            style={{ color: "#d7b26a" }}
          >
            The Path He Walked
          </p>
          <h2
            className="font-cinzel font-bold text-4xl md:text-5xl uppercase tracking-widest mb-4"
            style={{
              background: "linear-gradient(135deg, #f0d9a2, #d7b26a)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            His Journey
          </h2>
          <div className="section-divider" />
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={visible ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.9, delay: 0.2 }}
            className="flex flex-col gap-6"
          >
            <div className="overflow-hidden rounded-sm gold-border">
              <img
                src="/assets/generated/warrior-battle.dim_600x400.jpg"
                alt="Tantu Dey in battle"
                className="w-full h-72 object-cover transition-transform duration-700 hover:scale-105"
              />
            </div>
            <div>
              <h3
                className="font-cinzel font-bold text-xl uppercase tracking-widest mb-4"
                style={{ color: "#d7b26a" }}
              >
                The Battles
              </h3>
              <p
                className="text-base leading-relaxed mb-4"
                style={{ color: "#b9b0a0" }}
              >
                Tantu Dey did not choose war — war chose him. From the
                smoldering ruins of his first village defense to the grand
                campaigns of the northern conquest, every battle was fought with
                purpose: to protect the innocent, to honor his ancestors, and to
                leave the world safer than he found it.
              </p>
              <p
                className="text-base leading-relaxed"
                style={{ color: "#b9b0a0" }}
              >
                Three hundred engagements. Each one a testament to his
                unbreakable will. His tactics were studied by generals; his
                courage became the standard by which all warriors were measured.
              </p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={visible ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.9, delay: 0.35 }}
            className="flex flex-col gap-6"
          >
            <div className="overflow-hidden rounded-sm gold-border">
              <img
                src="/assets/generated/warrior-journey.dim_600x400.jpg"
                alt="Tantu Dey's spiritual journey"
                className="w-full h-72 object-cover transition-transform duration-700 hover:scale-105"
              />
            </div>
            <div>
              <h3
                className="font-cinzel font-bold text-xl uppercase tracking-widest mb-4"
                style={{ color: "#d7b26a" }}
              >
                The Spirit
              </h3>
              <p
                className="text-base leading-relaxed mb-4"
                style={{ color: "#b9b0a0" }}
              >
                Beyond the battlefield lay an equally profound journey — one of
                the soul. Between campaigns, Tantu Dey sought wisdom from
                mountain sages and river scholars, forging an inner peace that
                no enemy could shatter and no loss could extinguish.
              </p>
              <p
                className="text-base leading-relaxed"
                style={{ color: "#b9b0a0" }}
              >
                He taught his soldiers to meditate at dawn, to bow before a
                fallen enemy, and to carry compassion alongside their swords.
                For Tantu believed: a warrior without heart is merely a weapon.
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

function LegacySection() {
  const { ref, visible } = useInView();

  return (
    <section
      id="legacy"
      className="py-28 relative overflow-hidden"
      style={{ background: "#1a1f1f" }}
      ref={ref}
    >
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 80% 60% at 50% 50%, rgba(215,178,106,0.06) 0%, transparent 70%)",
        }}
      />

      <div className="relative z-10 max-w-3xl mx-auto px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={visible ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 1 }}
        >
          <div className="mb-8">
            <Star
              className="mx-auto mb-4"
              size={36}
              style={{ color: "#d7b26a" }}
            />
            <p
              className="font-cinzel text-xs tracking-[0.4em] uppercase mb-4"
              style={{ color: "#d7b26a" }}
            >
              The Undying Legend
            </p>
            <h2
              className="font-cinzel font-bold text-4xl md:text-5xl uppercase tracking-widest mb-6"
              style={{
                background: "linear-gradient(135deg, #f0d9a2, #d7b26a)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              His Legacy
            </h2>
            <div className="section-divider mb-8" />
          </div>

          <blockquote
            className="font-cinzel text-lg md:text-xl italic leading-relaxed mb-8"
            style={{ color: "#e7e0d2" }}
          >
            &ldquo; A warrior&apos;s glory fades with the setting sun, but a
            hero&apos;s deeds echo through eternity. Tantu Dey did not fight for
            glory — he fought for tomorrow. And tomorrow still remembers.
            &rdquo;
          </blockquote>

          <p
            className="text-base leading-relaxed mb-10"
            style={{ color: "#b9b0a0" }}
          >
            Tantu Dey&apos;s legacy is not written only in the annals of war —
            it lives in the communities he protected, the warriors he mentored,
            and the ideals he embodied. Long after the last battle cry faded
            into the wind, his name remains a beacon: a reminder that true
            strength is not the power to destroy, but the will to endure, to
            protect, and to rise again.
          </p>

          <div
            className="inline-block"
            style={{
              borderTop: "1px solid rgba(215,178,106,0.4)",
              borderBottom: "1px solid rgba(215,178,106,0.4)",
              padding: "12px 32px",
            }}
          >
            <p
              className="font-cinzel font-bold text-sm tracking-[0.3em] uppercase"
              style={{ color: "#d7b26a" }}
            >
              Tantu Dey — Warrior. Protector. Legend.
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function Footer() {
  const year = new Date().getFullYear();
  const hostname =
    typeof window !== "undefined" ? window.location.hostname : "";

  return (
    <footer
      id="tribute"
      className="bg-[#0b0b0b] border-t border-[#3a4242]"
      data-ocid="tribute.section"
    >
      <div className="max-w-6xl mx-auto px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-12">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <span className="text-2xl">⚔️</span>
              <span
                className="font-cinzel font-bold text-sm tracking-widest uppercase"
                style={{
                  background:
                    "linear-gradient(135deg, #f0d9a2, #d7b26a, #b88a3f)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                TANTU DEY
              </span>
            </div>
            <p
              className="font-cinzel text-xs tracking-widest uppercase mb-4"
              style={{ color: "#d7b26a" }}
            >
              — THE LEGEND
            </p>
            <p className="text-sm leading-relaxed" style={{ color: "#b9b0a0" }}>
              A tribute to an extraordinary warrior whose courage, sacrifice,
              and spirit continue to inspire generations.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4
              className="font-cinzel font-bold text-xs tracking-widest uppercase mb-6"
              style={{ color: "#d7b26a" }}
            >
              Quick Links
            </h4>
            <ul className="flex flex-col gap-3">
              {NAV_LINKS.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    className="text-sm transition-colors duration-200 hover:text-gold flex items-center gap-2"
                    style={{ color: "#b9b0a0" }}
                    data-ocid="nav.link"
                  >
                    <ChevronRight size={12} style={{ color: "#d7b26a" }} />
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Social */}
          <div>
            <h4
              className="font-cinzel font-bold text-xs tracking-widest uppercase mb-6"
              style={{ color: "#d7b26a" }}
            >
              Follow The Legend
            </h4>
            <div className="flex gap-4 mb-6">
              {[
                { Icon: Twitter, label: "Twitter" },
                { Icon: Instagram, label: "Instagram" },
                { Icon: Facebook, label: "Facebook" },
                { Icon: Globe, label: "Website" },
              ].map(({ Icon, label }) => (
                <button
                  type="button"
                  key={label}
                  aria-label={label}
                  className="p-2 rounded-sm border transition-all duration-200 hover:scale-110"
                  style={{
                    background: "rgba(215,178,106,0.05)",
                    borderColor: "rgba(215,178,106,0.25)",
                    color: "#b9b0a0",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.color =
                      "#d7b26a";
                    (e.currentTarget as HTMLButtonElement).style.borderColor =
                      "rgba(215,178,106,0.6)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.color =
                      "#b9b0a0";
                    (e.currentTarget as HTMLButtonElement).style.borderColor =
                      "rgba(215,178,106,0.25)";
                  }}
                  data-ocid="tribute.button"
                >
                  <Icon size={18} />
                </button>
              ))}
            </div>
            <div
              className="p-4 rounded-sm"
              style={{
                background: "rgba(215,178,106,0.05)",
                border: "1px solid rgba(215,178,106,0.2)",
              }}
            >
              <p
                className="font-cinzel text-xs tracking-wide uppercase mb-1"
                style={{ color: "#d7b26a" }}
              >
                Pay Your Tribute
              </p>
              <p className="text-xs" style={{ color: "#b9b0a0" }}>
                Share this page to spread the legend of Tantu Dey.
              </p>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div
          className="w-full h-px mb-8"
          style={{
            background:
              "linear-gradient(90deg, transparent, rgba(215,178,106,0.4), transparent)",
          }}
        />

        {/* Copyright */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <p
            className="font-cinzel text-xs tracking-widest uppercase"
            style={{ color: "rgba(185,176,160,0.5)" }}
          >
            © {year} &nbsp;·&nbsp; Tantu Dey — The Warrior
          </p>
          <p className="text-xs" style={{ color: "rgba(185,176,160,0.4)" }}>
            Built with ❤️ using{" "}
            <a
              href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(hostname)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:underline transition-opacity hover:opacity-80"
              style={{ color: "#d7b26a" }}
            >
              caffeine.ai
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}

export default function App() {
  const { playClash, playDrum, playShimmer, isMuted, toggleMute } =
    useSoundEngine();

  useAmbientTrack(isMuted);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main>
        <HeroSection playClash={playClash} />
        <BattleStats playDrum={playDrum} />
        <Achievements playShimmer={playShimmer} />
        <JourneySection />
        <LegacySection />
      </main>
      <Footer />
      <SoundToggle isMuted={isMuted} toggleMute={toggleMute} />
    </div>
  );
}
