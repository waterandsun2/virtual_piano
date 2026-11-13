/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Music, Play, RotateCcw, Hand, CheckCircle2, Info, Trophy, Star, Zap } from 'lucide-react';
import confetti from 'canvas-confetti';
import CameraHandTracker from './components/CameraHandTracker';
import PianoVisualizer from './components/PianoVisualizer';
import { pianoEngine } from './lib/piano-engine';
import { SONGS, PIANO_KEYS } from './constants';
import { Timing, TIMING_RATINGS, TimingRating, PerformanceStats, PerformanceGrade } from './types';

export default function App() {
  const [currentSong, setCurrentSong] = useState(SONGS[0]);
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeNotes, setActiveNotes] = useState<Set<string>>(new Set());
  const [hitEffects, setHitEffects] = useState<{ id: number; note: string; color: string; size: number; iconIndex: number }[]>([]);
  const [message, setMessage] = useState(`Learn ${SONGS[0].title} by showing your hand!`);
  const [messageColor, setMessageColor] = useState('text-amber-400 shadow-amber-400/40');
  const messageTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const [multiplier, setMultiplier] = useState(1);
  const [timingFeedback, setTimingFeedback] = useState<TimingRating | null>(null);
  const [stats, setStats] = useState<PerformanceStats>({ perfects: 0, goods: 0, misses: 0, maxCombo: 0, totalNotes: 0 });
  
  const [displayedCombo, setDisplayedCombo] = useState(0);
  const [displayedMultiplier, setDisplayedMultiplier] = useState(1);
  
  const [showComplete, setShowComplete] = useState(false);

  // Update displayed combo with delay on hiding
  useEffect(() => {
    if (combo > 0) {
      setDisplayedCombo(combo);
      setDisplayedMultiplier(multiplier);
    } else {
      const timer = setTimeout(() => {
        setDisplayedCombo(0);
        setDisplayedMultiplier(1);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [combo, multiplier]);
  const lastSuccessTimeRef = useRef<number>(0);
  const [countdown, setCountdown] = useState(0);
  const [isNoteLockout, setIsNoteLockout] = useState(false);
  const [isSoundBlocked, setIsSoundBlocked] = useState(false);
  const lockoutTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const nextEffectId = useRef(0);
  const lastProcessedStepRef = useRef<{ songId: string; step: number } | null>(null);
  const freePlayCooldowns = useRef<Record<string, number>>({});
  const lastNoteTimeRef = useRef<number>(0);
  const stepStartTimeRef = useRef<number>(0);
  const timingFeedbackTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize audio
  useEffect(() => {
    const init = async () => {
      await pianoEngine.init();
    };
    init();
    
    return () => {
      if (lockoutTimeoutRef.current) clearTimeout(lockoutTimeoutRef.current);
      if (messageTimeoutRef.current) clearTimeout(messageTimeoutRef.current);
    };
  }, []);

  // Clear messages after a few seconds
  useEffect(() => {
    if (message && !isPlaying && !countdown && !showComplete) {
      if (messageTimeoutRef.current) clearTimeout(messageTimeoutRef.current);
      messageTimeoutRef.current = setTimeout(() => {
        setMessage('');
      }, 5000);
    } else if (message && isPlaying) {
      // Feedback messages during play should be shorter
      if (messageTimeoutRef.current) clearTimeout(messageTimeoutRef.current);
      messageTimeoutRef.current = setTimeout(() => {
        setMessage('');
      }, 2000);
    }
    return () => {
      if (messageTimeoutRef.current) clearTimeout(messageTimeoutRef.current);
    };
  }, [message, isPlaying, countdown, showComplete]);

  const addHitEffect = useCallback((note: string) => {
    const id = nextEffectId.current++;
    const colors = [
      '#EC4899', '#00f2ff', '#8B5CF6', '#10B981', '#F59E0B', 
      '#EF4444', '#3B82F6', '#F472B6', '#60A5FA', '#A78BFA',
      '#FB7185', '#34D399', '#FBBF24', '#818CF8', '#C084FC'
    ];
    const color = colors[Math.floor(Math.random() * colors.length)];
    const size = Math.random() * (16 - 10) + 10;
    const iconIndex = Math.floor(Math.random() * 4);
    
    setHitEffects(prev => [...prev, { id, note, color, size, iconIndex }]);
  }, []);

  // UseEffect to clean up hit effects after they finish animating
  useEffect(() => {
    if (hitEffects.length > 0) {
      const timer = setTimeout(() => {
        setHitEffects(prev => prev.slice(1));
      }, 2500); 
      return () => clearTimeout(timer);
    }
  }, [hitEffects]);

  // Handle Countdown
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(prev => {
          const next = prev - 1;
          if (next === 0) {
            setIsPlaying(true);
            setMessage(`Follow the highlighted notes for ${currentSong.title}!`);
            stepStartTimeRef.current = Date.now();
          }
          return next;
        });
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown, currentSong.title]);

  const handleKeyPress = useCallback((note: string) => {
    if (countdown > 0 || isSoundBlocked || isNoteLockout) return;

    const now = Date.now();
    // Strict 10ms physical lockout
    if (now - lastNoteTimeRef.current < 10) return;
    lastNoteTimeRef.current = now;

    if (isPlaying) {
      const targetNote = currentSong.notes[currentStep].note;
      
      if (note === targetNote) {
        if (lastProcessedStepRef.current?.songId === currentSong.id && lastProcessedStepRef.current?.step === currentStep) {
          return;
        }
        
        lastProcessedStepRef.current = { songId: currentSong.id, step: currentStep };
        lastSuccessTimeRef.current = Date.now();

        // Calculate Timing Precision (Difficulty Increased)
        const latency = Date.now() - stepStartTimeRef.current;
        let rating: TimingRating;
        
        if (latency < 150) { // Was 250
          rating = TIMING_RATINGS[Timing.PERFECT];
          setStats(prev => ({ ...prev, perfects: prev.perfects + 1 }));
        } else if (latency < 400) { // Was 750
          rating = TIMING_RATINGS[Timing.GOOD];
          setStats(prev => ({ ...prev, goods: prev.goods + 1 }));
        } else {
          rating = TIMING_RATINGS[Timing.MISS];
          setStats(prev => ({ ...prev, misses: prev.misses + 1 }));
        }

        // Handle Timing Feedback
        setTimingFeedback(rating);
        if (timingFeedbackTimeoutRef.current) clearTimeout(timingFeedbackTimeoutRef.current);
        timingFeedbackTimeoutRef.current = setTimeout(() => setTimingFeedback(null), 800);

        // Update Combo & Multiplier
        let newCombo = combo;
        if (rating.text !== 'MISS') {
            newCombo += 1;
            setCombo(newCombo);
            if (newCombo > maxCombo) setMaxCombo(newCombo);
        } else {
            newCombo = 0;
            setCombo(0);
            setMessage('Too slow!');
            setMessageColor('text-rose-400 shadow-rose-400/40');
        }
        
        // Normalize points: Target total 1000 for a perfect run
        const targetNotesScore = 800;
        const basePointsPerNote = targetNotesScore / currentSong.notes.length;
        
        const ratingMultiplier = rating.points / 100; // 1.0 for perfect, 0.7 for good, 0 for miss
        
        // Multiplier logic: Max 8x, increases every 8 combo (Difficulty: was every 4)
        const newMultiplier = Math.min(8, Math.floor(newCombo / 8) + 1);
        setMultiplier(newMultiplier);

        // Multiplier bonus: 20% extra per level
        const comboBonus = 1 + ((newMultiplier - 1) * 0.2); 
        const pointsAwarded = basePointsPerNote * ratingMultiplier * comboBonus;
        
        setScore(curr => Math.max(0, Math.min(800, curr + pointsAwarded)));
        
        pianoEngine.triggerAttack(note);
        setActiveNotes(prev => new Set(prev).add(note));
        addHitEffect(note);

        if (rating.text !== 'MISS') {
            const praises = ['Great job!', 'Perfect!', 'Good!', 'Well done!', 'Amazing!', 'Magnificent!', 'On fire!', 'Sweet!', 'Excellent!', 'Keep it up!'];
            const colors = [
              'text-amber-400 shadow-amber-400/40',
              'text-emerald-400 shadow-emerald-400/40',
              'text-cyan-400 shadow-cyan-400/40',
              'text-rose-400 shadow-rose-400/40',
              'text-violet-400 shadow-violet-400/40',
              'text-blue-400 shadow-blue-400/40'
            ];
            
            const randomPraise = praises[Math.floor(Math.random() * praises.length)];
            const randomColor = colors[Math.floor(Math.random() * colors.length)];
            
            setMessage(randomPraise);
            setMessageColor(randomColor);
        }
        
        // Progression with 0.6s buffer
        if (currentStep < currentSong.notes.length - 1) {
          setIsNoteLockout(true);
          if (lockoutTimeoutRef.current) clearTimeout(lockoutTimeoutRef.current);
          lockoutTimeoutRef.current = setTimeout(() => {
            setCurrentStep(s => s + 1);
            stepStartTimeRef.current = Date.now();
            setIsNoteLockout(false);
          }, 600);
        } else {
          setIsPlaying(false);
          setMessage(`You finished ${currentSong.title}! Amazing!`);
          
          pianoEngine.playVictory();

          const duration = 3 * 1000;
          const animationEnd = Date.now() + duration;
          const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 100 };
          const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

          const interval: any = setInterval(function() {
            const timeLeft = animationEnd - Date.now();
            if (timeLeft <= 0) return clearInterval(interval);
            const particleCount = 50 * (timeLeft / duration);
            confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
            confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
          }, 250);

          // Add completion bonus (percentage of total possible)
          const completionBonus = 200;
          setScore(s => Math.min(1000, Math.round(s + completionBonus)));

          setStats(prev => ({ ...prev, maxCombo, totalNotes: currentSong.notes.length }));
          setIsSoundBlocked(true);
          setTimeout(() => setIsSoundBlocked(false), 10000);
          setTimeout(() => setShowComplete(true), 3000);
        }
      } else {
        // Wrong note: Break combo and subtract points (Difficulty!)
        setCombo(0);
        setMultiplier(1);
        setStats(prev => ({ ...prev, misses: prev.misses + 1 }));
        setScore(curr => Math.max(0, curr - 5)); // 5 point penalty
        
        setMessage('Incorrect key!');
        setMessageColor('text-rose-500 shadow-rose-500/60');
        
        setTimingFeedback(TIMING_RATINGS[Timing.MISS]);
        if (timingFeedbackTimeoutRef.current) clearTimeout(timingFeedbackTimeoutRef.current);
        timingFeedbackTimeoutRef.current = setTimeout(() => setTimingFeedback(null), 800);
      }
    } else {
      const lastPlayed = freePlayCooldowns.current[note] || 0;
      if (now - lastPlayed < 100) return;
      freePlayCooldowns.current[note] = now;

      pianoEngine.triggerAttack(note);
      setActiveNotes(prev => new Set(prev).add(note));
      addHitEffect(note);
    }
  }, [isPlaying, currentStep, currentSong, countdown, isSoundBlocked, isNoteLockout, addHitEffect]);

  const handleKeyRelease = useCallback((note: string) => {
    pianoEngine.triggerRelease(note);
    setActiveNotes(prev => {
      const next = new Set(prev);
      next.delete(note);
      return next;
    });
  }, []);

  const startLesson = async () => {
    if (lockoutTimeoutRef.current) clearTimeout(lockoutTimeoutRef.current);
    await pianoEngine.init();
    setCurrentStep(0);
    setScore(0);
    setCombo(0);
    setMaxCombo(0);
    setMultiplier(1);
    setStats({ perfects: 0, goods: 0, misses: 0, maxCombo: 0, totalNotes: currentSong.notes.length });
    setIsPlaying(false);
    setShowComplete(false);
    setCountdown(3);
    setIsSoundBlocked(false);
    setIsNoteLockout(false);
    setMessage("Get ready! Starting soon...");
  };

  const selectSong = (song: typeof SONGS[0]) => {
    if (lockoutTimeoutRef.current) clearTimeout(lockoutTimeoutRef.current);
    setCurrentSong(song);
    setCurrentStep(0);
    setScore(0);
    setCombo(0);
    setMultiplier(1);
    setStats({ perfects: 0, goods: 0, misses: 0, maxCombo: 0, totalNotes: song.notes.length });
    setIsPlaying(false);
    setMessage(`Ready to learn ${song.title}? Press "Start Lesson" below.`);
  };

  const reset = () => {
    if (lockoutTimeoutRef.current) clearTimeout(lockoutTimeoutRef.current);
    setCurrentStep(0);
    setScore(0);
    setCombo(0);
    setMultiplier(1);
    setIsPlaying(false);
    setShowComplete(false);
    setIsSoundBlocked(false);
    setIsNoteLockout(false);
    setMessage('Welcome back! Ready to try again?');
  };

  const calculateGrade = (score: number): PerformanceGrade => {
    const ratio = score / 1000;
    if (ratio >= 0.95) return 'S';
    if (ratio >= 0.85) return 'A';
    if (ratio >= 0.70) return 'B';
    if (ratio >= 0.50) return 'C';
    return 'D';
  };

  return (
    <div className="min-h-screen font-sans selection:bg-cyan-500/30 overflow-x-hidden p-4 lg:p-6 flex flex-col items-center gap-4 lg:gap-6">
      <main className="w-full max-w-7xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-start z-10">
        {/* Top/Left: Progress and Camera */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          
          {/* Learning Path - Running Notes Display */}
          <div className="relative w-full overflow-hidden py-4 px-10 glass-panel rounded-3xl group">
            <div 
              className="flex items-center gap-4 transition-transform duration-700 ease-out"
              style={{
                transform: `translateX(calc(50% - ${(currentStep * 56) + 28}px))`
              }}
            >
              {currentSong.notes.map((step, idx) => {
                const isActive = idx === currentStep && isPlaying && !isNoteLockout;
                const isPlayed = idx < currentStep;
                const isNext = idx > currentStep && idx <= currentStep + 2;
                
                return (
                  <div 
                    key={idx}
                    className={`flex-shrink-0 w-12 h-16 rounded-xl flex flex-col items-center justify-center transition-all duration-500 ${
                      isActive 
                        ? 'scale-125 !bg-[#EC4899] text-white border-white shadow-[0_0_40px_rgba(236,72,153,0.6)] z-20' 
                        : isPlayed 
                          ? 'opacity-10 scale-90 grayscale' 
                          : isNext 
                            ? 'bg-white/20 border-white/40 opacity-100 scale-100'
                            : 'bg-white/5 border-white/10 opacity-40 scale-90'
                    } border`}
                  >
                    <span className={`text-xl font-black ${isActive ? 'animate-bounce' : ''}`}>
                      {step.display}
                    </span>
                    {isActive && (
                      <div className="absolute -bottom-6 flex flex-col items-center animate-pulse">
                        <div className="w-1 h-3 bg-[#EC4899] rounded-full" />
                        <span className="text-[8px] font-black text-[#EC4899] mt-1 uppercase">Next</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            
            {/* Side Masks for focus */}
            <div className="absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-[var(--bg-main)] to-transparent pointer-events-none z-10" />
            <div className="absolute inset-y-0 right-0 w-32 bg-gradient-to-l from-[var(--bg-main)] to-transparent pointer-events-none z-10" />
          </div>

          <div className="relative glass-panel rounded-[32px] overflow-hidden group">
            <CameraHandTracker 
              onKeyPress={handleKeyPress}
              onKeyRelease={handleKeyRelease}
              targetNote={isPlaying ? currentSong.notes[currentStep].note : undefined}
              currentStep={currentStep}
              isPlaying={isPlaying}
              score={score}
              progress={Math.round((currentStep / currentSong.notes.length) * 100)}
            />

            {/* Real-time HUD Overlay */}
            <div className="absolute inset-0 pointer-events-none z-30 p-6 flex flex-col items-center">
              {/* Timing Feedback Layer */}
              <div className="absolute top-[32px] right-[160px] z-[60] pointer-events-none">
                <AnimatePresence mode="wait">
                  {timingFeedback && (
                    <motion.div 
                      key={timingFeedback.text + Date.now()}
                      initial={{ opacity: 0, scale: 0.8, x: 20 }}
                      animate={{ opacity: 1, scale: 1.1, x: 0 }}
                      exit={{ opacity: 0, scale: 1.5, x: -20 }}
                    >
                      <span className={`text-2xl font-black italic tracking-widest ${timingFeedback.color} drop-shadow-2xl`}>
                        {timingFeedback.text}
                      </span>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Message Layer */}
              <div className="absolute top-[68px] right-6 z-50 pointer-events-none">
                <AnimatePresence mode="wait">
                  {message && (
                    <motion.div 
                      key={message}
                      initial={{ opacity: 0, y: -20, scale: 0.9 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -20, scale: 0.9 }}
                    >
                      <div className="glass-panel px-6 py-2.5 rounded-2xl text-center shadow-2xl border-white/20 backdrop-blur-xl">
                        <p className={`text-sm font-black ${messageColor.split(' ')[0]} tracking-[0.1em] uppercase drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]`}>
                          {message}
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* HUD: Combo & Multiplier - Positioned at the very top to avoid keyboard overlap */}
              <div className="absolute top-8 flex flex-col items-center">
                <AnimatePresence>
                  {displayedCombo > 0 && (
                    <motion.div 
                      initial={{ opacity: 0, y: -20, scale: 0.8 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.5, y: -20 }}
                      transition={{ duration: 0.3 }}
                      className="flex flex-col items-center gap-1"
                    >
                      <motion.div 
                        key={displayedCombo}
                        initial={{ scale: 1 }}
                        animate={{ scale: [1, 1.5, 1] }}
                        transition={{ duration: 0.2 }}
                        className="flex items-baseline gap-3"
                      >
                        <span className={`text-8xl font-black italic drop-shadow-[0_0_40px_rgba(34,211,238,0.8)] ${
                          displayedMultiplier > 4 ? 'text-amber-400' : 'text-cyan-400'
                        }`}>
                          {displayedCombo}
                        </span>
                        <span className="text-2xl font-black text-white/90 uppercase tracking-[0.2em] italic">Combo</span>
                      </motion.div>
                      
                      {displayedMultiplier > 1 && (
                        <motion.div 
                          initial={{ opacity: 0, scale: 0, rotate: -10 }}
                          animate={{ 
                            opacity: 1, 
                            scale: [1, 1.1, 1],
                            rotate: 0
                          }}
                          transition={{ 
                            scale: { repeat: Infinity, duration: 1, ease: "easeInOut" },
                            opacity: { duration: 0.3 }
                          }}
                          className="px-6 py-2 rounded-2xl bg-gradient-to-br from-amber-300 via-orange-500 to-rose-600 shadow-[0_0_40px_rgba(245,158,11,0.6)] flex items-center gap-3 border-2 border-white/40 backdrop-blur-md"
                        >
                          <Zap className="w-6 h-6 text-white fill-white" />
                          <span className="text-xl font-black text-white italic uppercase tracking-[0.1em] drop-shadow-md">
                            Multiplier X{displayedMultiplier}
                          </span>
                        </motion.div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            <AnimatePresence>
              {countdown > 0 && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.5 }}
                  className="absolute inset-x-0 top-0 bottom-[45%] z-40 flex items-center justify-center pointer-events-none"
                >
                  <motion.div 
                    key={countdown}
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-[160px] font-black italic text-pink-500 drop-shadow-[0_0_40px_rgba(236,72,153,0.8)]"
                  >
                    {countdown}
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence>
              {isSoundBlocked && !countdown && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-x-0 top-6 z-40 flex items-center justify-center pointer-events-none"
                >
                  <div className="glass-panel px-6 py-2 rounded-full border border-pink-500/30 flex items-center gap-2 bg-pink-500/10 backdrop-blur-md">
                    <div className="w-2 h-2 rounded-full bg-pink-500 animate-pulse" />
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-pink-500">
                      Quiet Time (10s)
                    </span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            
            <div className="absolute bottom-[10%] left-6 right-6 z-20 transition-transform group-hover:scale-[1.01]">
              <PianoVisualizer 
                currentNoteTarget={isPlaying ? currentSong.notes[Math.min(currentStep, currentSong.notes.length - 1)].note : undefined}
                activeNotes={activeNotes}
                hitEffects={hitEffects}
              />
            </div>
          </div>
        </div>

        {/* Right Aspect: Score and Actions */}
        <div className="lg:col-span-4 flex flex-col gap-4">
          <div className="glass-panel rounded-[32px] p-5 flex flex-col gap-4">
            <div className="flex flex-col gap-1 border-b border-white/10 pb-3">
              <h1 className="text-xl font-black tracking-tight">{currentSong.title}</h1>
              <p className="text-[10px] uppercase font-black tracking-widest text-[var(--accent-color)]">
                {isPlaying ? 'Active Lesson' : 'Practice Mode'}
              </p>
            </div>

            <div className="flex flex-col gap-3">
              <div className="mt-0">
                {!isPlaying ? (
                  <button 
                    onClick={startLesson}
                    className="w-full py-5 bg-[#EC4899] hover:bg-white text-white hover:text-black font-black uppercase tracking-widest text-[20px] rounded-xl shadow-[0_0_20px_rgba(236,72,153,0.3)] transition-all active:scale-95 flex items-center justify-center gap-2"
                  >
                    <Play className="w-5 h-5 fill-current" />
                    START
                  </button>
                ) : (
                  <div className="flex gap-2">
                    <button 
                      onClick={reset}
                      className="flex-1 py-3 bg-white/5 hover:bg-[#EC4899] border border-white/20 text-white font-bold rounded-xl transition-all text-[10px] uppercase tracking-widest flex items-center justify-center gap-2"
                    >
                      <RotateCcw className="w-3 h-3" />
                      Reset
                    </button>
                    <button 
                      onClick={() => setIsPlaying(false)}
                      className="flex-1 py-3 bg-white text-black font-black uppercase tracking-widest text-[10px] rounded-xl transition-all flex items-center justify-center gap-2 border border-white"
                    >
                      <Music className="w-3 h-3" />
                      Free Play
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-4 mt-2">
              <span className="text-[20px] text-[var(--accent-color)] uppercase tracking-[0.3em] font-black flex items-center gap-2">
                <Music className="w-5 h-5" />
                Select Your Song
              </span>
              <div className="flex flex-col gap-2">
                {SONGS.map(song => (
                  <button
                    key={song.id}
                    onClick={() => selectSong(song)}
                    className={`group relative overflow-hidden px-4 py-4 rounded-2xl transition-all duration-300 ${
                      currentSong.id === song.id 
                        ? 'bg-gradient-to-r from-pink-500 to-indigo-600 text-white shadow-[0_0_30px_rgba(236,72,153,0.3)] ring-1 ring-white/50 scale-[1.02]'
                        : 'bg-white/5 hover:bg-white/10 text-[var(--text-dim)] border border-white/5 hover:border-white/20'
                    }`}
                  >
                    <div className="relative z-10 flex items-center justify-between">
                      <div className="flex flex-col items-start gap-0.5">
                        <span className={`text-xs font-black tracking-tight ${currentSong.id === song.id ? 'text-white' : 'text-white/90'}`}>
                          {song.title}
                        </span>
                        <span className={`text-[8px] font-bold uppercase tracking-widest ${currentSong.id === song.id ? 'text-pink-100/70' : 'text-white/40'}`}>
                          {song.artist}
                        </span>
                        <div className="flex gap-0.5 mt-1">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star 
                              key={i} 
                              className={`w-2 h-2 ${i < song.difficulty ? (currentSong.id === song.id ? 'text-white fill-white' : 'text-pink-500 fill-pink-500') : 'text-white/10'}`} 
                            />
                          ))}
                        </div>
                      </div>
                      {currentSong.id === song.id && (
                        <div className="p-1 rounded-full bg-white/20">
                          <CheckCircle2 className="w-3 h-3 text-white" />
                        </div>
                      )}
                    </div>
                    {currentSong.id === song.id && (
                      <motion.div 
                        layoutId="active-bg"
                        className="absolute inset-0 bg-gradient-to-r from-pink-500 to-indigo-600 -z-10"
                      />
                    )}
                  </button>
                ))}
              </div>
            </div>

            <div className="h-px bg-white/5 w-full my-1" />
          </div>
        </div>
      </main>

      <AnimatePresence>
        {showComplete && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-6"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-[#111111] border border-white/10 rounded-[40px] p-12 max-w-md w-full text-center flex flex-col items-center gap-8 shadow-2xl"
            >
              <h2 className="text-4xl font-black">Well Done!</h2>
              
              <div className="w-full flex flex-col gap-8">
                <div>
                  <p className="text-[10px] text-white/40 uppercase tracking-[0.3em] font-black mb-2">Final Score</p>
                  <p className="text-6xl font-black text-indigo-500 drop-shadow-[0_0_20px_rgba(99,102,241,0.4)]">{score}</p>
                </div>

                <div className="pt-8 border-t border-white/10">
                  <p className="text-[10px] text-white/40 uppercase tracking-[0.3em] font-black mb-3">Grade</p>
                  <div className={`text-8xl font-black inline-block px-8 py-2 rounded-2xl ${
                    calculateGrade(score) === 'S' ? 'text-amber-400 drop-shadow-[0_0_40px_rgba(251,191,36,0.7)] scale-110' :
                    calculateGrade(score) === 'A' ? 'text-amber-400/90 drop-shadow-[0_0_30px_rgba(251,191,36,0.5)]' :
                    calculateGrade(score) === 'B' ? 'text-emerald-400 drop-shadow-[0_0_30px_rgba(52,211,153,0.5)]' :
                    calculateGrade(score) === 'C' ? 'text-cyan-400 drop-shadow-[0_0_30px_rgba(34,211,238,0.5)]' :
                    'text-rose-400 drop-shadow-[0_0_30px_rgba(251,113,133,0.5)]'
                  }`}>
                    {calculateGrade(score)}
                  </div>
                </div>
              </div>

              <button 
                onClick={reset}
                className="w-full mt-4 py-5 bg-[#EC4899] hover:bg-white text-white hover:text-black rounded-2xl font-black uppercase tracking-widest transition-all active:scale-95 shadow-[0_0_30px_rgba(236,72,153,0.3)]"
              >
                Continue Learning
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
