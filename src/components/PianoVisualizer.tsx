import { motion, AnimatePresence } from 'motion/react';
import { Music, Music2, Music3, Music4 } from 'lucide-react';
import { PIANO_KEYS } from '../constants';

interface PianoVisualizerProps {
  currentNoteTarget?: string;
  activeNotes?: Set<string>;
  hitEffects?: { id: number; note: string; color: string; size: number; iconIndex: number }[];
}

export default function PianoVisualizer({ currentNoteTarget, activeNotes, hitEffects = [] }: PianoVisualizerProps) {
  const whiteKeys = PIANO_KEYS.filter(k => !k.isBlack);
  const NoteIcons = [Music, Music2, Music3, Music4];
  
  return (
    <div className="flex gap-1 p-2 rounded-[32px] glass-panel bg-white/5 backdrop-blur-xl relative h-64 shadow-2xl">
      <div className="absolute inset-x-0 top-0 bottom-0 pointer-events-none overflow-visible">
        <AnimatePresence>
          {hitEffects.map((effect) => {
            // Find key index/position for the hit note
            const key = PIANO_KEYS.find(k => k.note === effect.note);
            if (!key) return null;

            // Calculate horizontal offset
            let leftPos = '0%';
            if (key.isBlack) {
              // Find the white key before it
              const whiteKeyIdx = whiteKeys.findIndex(wk => 
                (key.note.startsWith('C#') && wk.note.startsWith('C')) ||
                (key.note.startsWith('D#') && wk.note.startsWith('D')) ||
                (key.note.startsWith('F#') && wk.note.startsWith('F')) ||
                (key.note.startsWith('G#') && wk.note.startsWith('G')) ||
                (key.note.startsWith('A#') && wk.note.startsWith('A'))
              );
              leftPos = `calc(${(whiteKeyIdx / whiteKeys.length) * 100}% + ${(1 / whiteKeys.length) * 100 * 0.5}% + 8px)`;
            } else {
              const whiteKeyIdx = whiteKeys.findIndex(wk => wk.note === key.note);
              leftPos = `${(whiteKeyIdx / whiteKeys.length) * 100 + (1 / whiteKeys.length) * 100 * 0.5}%`;
            }

            const Icon = NoteIcons[effect.iconIndex] || Music;

            return (
              <motion.div
                key={effect.id}
                initial={{ opacity: 0, y: 70, scale: 0.4, x: '-50%' }}
                animate={{ 
                  opacity: [0, 1, 1, 0.4, 0], 
                  y: -600, 
                  scale: [0.5, 1.4, 1.1, 1.2, 0.7],
                  rotate: [0, -45, 45, -30, 0]
                }}
                exit={{ opacity: 0 }}
                transition={{ duration: 2.0, ease: "easeOut" }}
                className="absolute bottom-[-20px] z-50 pointer-events-none"
                style={{ 
                  left: leftPos,
                  color: effect.color,
                  filter: `drop-shadow(0 0 15px ${effect.color}ff)`
                }}
              >
                <Icon width={effect.size * 5} height={effect.size * 5} strokeWidth={3} />
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {whiteKeys.map((key) => {
        const isTarget = currentNoteTarget === key.note;
        const isPressed = activeNotes?.has(key.note);
        const isCorrectPressed = isPressed && isTarget;
        
        // Find if there's a black key after this white key
        const blackKeyAfter = PIANO_KEYS.find(k => 
          k.isBlack && 
          (key.note.startsWith('C') && k.note.startsWith('C#') && key.note.slice(-1) === k.note.slice(-1) ||
           key.note.startsWith('D') && k.note.startsWith('D#') && key.note.slice(-1) === k.note.slice(-1) ||
           key.note.startsWith('F') && k.note.startsWith('F#') && key.note.slice(-1) === k.note.slice(-1) ||
           key.note.startsWith('G') && k.note.startsWith('G#') && key.note.slice(-1) === k.note.slice(-1) ||
           key.note.startsWith('A') && k.note.startsWith('A#') && key.note.slice(-1) === k.note.slice(-1))
        );

        return (
          <div key={key.note} className="flex-1 relative h-full">
            {/* White Key */}
            <div
              className={`w-full h-full rounded-xl flex flex-col items-center justify-end pb-4 transition-all duration-100 relative overflow-hidden group ${
                isTarget ? 'scale-[1.02] -translate-y-2' : ''
              } ${isPressed ? 'brightness-110' : ''}`}
              style={{ 
                background: isCorrectPressed
                  ? 'linear-gradient(to bottom, #EC4899, #D946EF)'
                  : isPressed
                    ? 'linear-gradient(to bottom, #00f2ff, #06b6d4)'
                    : isTarget 
                      ? 'linear-gradient(to bottom, #fff, rgba(236, 72, 153, 0.4))'
                      : 'linear-gradient(to bottom, rgba(255,255,255,0.9), rgba(255,255,255,0.6))',
                boxShadow: isCorrectPressed 
                  ? '0 0 30px rgba(236, 72, 153, 0.6)' 
                  : isPressed
                    ? '0 0 20px rgba(0, 242, 255, 0.5)'
                    : isTarget ? 'inset 0 0 15px rgba(255,192,203,0.3), 0 8px 25px rgba(236, 72, 153, 0.15)' : 'none'
              }}
            >
              <span className={`text-lg font-black transition-colors ${isPressed || isTarget ? 'text-[#0f172a]' : 'text-[#1e293b]'}`}>
                {key.label}
              </span>
              {isTarget && (
                <div className="absolute top-4 flex flex-col items-center gap-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-black/40 animate-bounce" />
                  <span className="text-[8px] font-black text-black/60 uppercase tracking-tighter">
                    TAP
                  </span>
                </div>
              )}
            </div>

            {/* Black Key */}
            {blackKeyAfter && (() => {
              const isBlackTarget = currentNoteTarget === blackKeyAfter.note;
              const isBlackPressed = activeNotes?.has(blackKeyAfter.note);
              const isBlackCorrectPressed = isBlackPressed && isBlackTarget;
              
              return (
                <div 
                  className={`absolute top-0 right-0 w-[60%] h-[60%] rounded-b-lg border-x border-b border-white/10 z-20 translate-x-[50%] transition-all duration-100 flex flex-col items-center justify-end pb-2 ${
                    isBlackTarget ? 'translate-y-1' : ''
                  }`}
                  style={{
                    background: isBlackCorrectPressed
                      ? 'linear-gradient(to bottom, #EC4899, #D946EF)'
                      : isBlackPressed
                        ? 'linear-gradient(to bottom, #00f2ff, #06b6d4)'
                        : isBlackTarget
                          ? 'linear-gradient(to bottom, #334155, rgba(236, 72, 153, 0.4))'
                          : 'linear-gradient(to bottom, #0f172a, #1e293b)',
                    boxShadow: isBlackCorrectPressed 
                      ? '0 0 20px rgba(236, 72, 153, 0.5)' 
                      : isBlackPressed
                        ? '0 0 15px rgba(0, 242, 255, 0.4)'
                        : isBlackTarget ? '0 5px 15px rgba(236, 72, 153, 0.2)' : '0 4px 10px rgba(0,0,0,0.5)'
                  }}
                >
                  <span className={`text-[8px] font-black pointer-events-none transition-colors ${isBlackPressed || isBlackTarget ? 'text-white' : 'text-white/40'}`}>
                    {blackKeyAfter.label}
                  </span>
                  {isBlackTarget && (
                    <div className="w-1 h-1 rounded-full bg-pink-400 absolute top-2 animate-pulse" />
                  )}
                </div>
              );
            })()}
          </div>
        );
      })}
    </div>
  );
}
