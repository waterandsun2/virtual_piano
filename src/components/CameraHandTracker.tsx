import { useEffect, useRef, useState, useCallback } from 'react';
import Webcam from 'react-webcam';
import { Hands, Results, HAND_CONNECTIONS } from '@mediapipe/hands';
import { drawConnectors, drawLandmarks } from '@mediapipe/drawing_utils';
import { Hand } from 'lucide-react';
import { PIANO_KEYS } from '../constants';

interface CameraHandTrackerProps {
  onKeyPress: (note: string) => void;
  onKeyRelease: (note: string) => void;
  targetNote?: string;
  currentStep?: number;
  isPlaying?: boolean;
  score?: number;
  progress?: number;
}

export default function CameraHandTracker({ 
  onKeyPress, 
  onKeyRelease, 
  targetNote, 
  currentStep, 
  isPlaying,
  score = 0,
  progress = 0
}: CameraHandTrackerProps) {
  const webcamRef = useRef<Webcam>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const handsRef = useRef<Hands | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [handDetected, setHandDetected] = useState(false);
  const activeNotesRef = useRef<Set<string>>(new Set());
  const lastDetectionRef = useRef(Date.now());

  const onKeyPressRef = useRef(onKeyPress);
  const onKeyReleaseRef = useRef(onKeyRelease);
  const targetNoteRef = useRef(targetNote);
  const currentStepRef = useRef(currentStep);
  const isPlayingRef = useRef(isPlaying);

  useEffect(() => {
    onKeyPressRef.current = onKeyPress;
    onKeyReleaseRef.current = onKeyRelease;
    targetNoteRef.current = targetNote;
    currentStepRef.current = currentStep;
    isPlayingRef.current = isPlaying;
  }, [onKeyPress, onKeyRelease, targetNote, currentStep, isPlaying]);

  const onResults = useCallback((results: Results) => {
    if (!canvasRef.current || !webcamRef.current?.video) return;

    const canvasCtx = canvasRef.current.getContext('2d');
    if (!canvasCtx) return;

    const width = canvasRef.current.width;
    const height = canvasRef.current.height;

    canvasCtx.save();
    canvasCtx.clearRect(0, 0, width, height);

    if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
      setHandDetected(true);
      lastDetectionRef.current = Date.now();
    } else if (Date.now() - lastDetectionRef.current > 500) {
      setHandDetected(false);
    }
    
    // Draw the key zones for debug/visualization
    // 1. Calculate precise hit zones that match our visual PianoVisualizer
    const numWhiteKeys = PIANO_KEYS.filter(k => !k.isBlack).length;
    const whiteKeyWidth = width / numWhiteKeys;
    const pianoHeight = 240; 
    const pianoBottom = height * 0.9;
    const pianoTop = pianoBottom - pianoHeight;

    const currentNotes = new Set<string>();

    if (results.multiHandLandmarks) {
      setHandDetected(results.multiHandLandmarks.length > 0);
      for (const landmarks of results.multiHandLandmarks) {
        // Landmarks for drawing - MUST mirror these because the webcam feed is mirrored
        const mirroredLandmarks = landmarks.map(point => ({
          ...point,
          x: 1 - point.x 
        }));

        // Draw landmarks ON TOP - EXTRA BOLD
        drawConnectors(canvasCtx, mirroredLandmarks, HAND_CONNECTIONS, { color: '#00f2ff', lineWidth: 5 });
        drawLandmarks(canvasCtx, mirroredLandmarks, { color: '#FFFFFF', lineWidth: 2, radius: 5 });

        // Find the bounding box of the hand for extra sensitivity on target notes
        let handMinX = 1, handMaxX = 0, handMinY = 1, handMaxY = 0;
        for (const p of landmarks) {
          handMinX = Math.min(handMinX, 1 - p.x);
          handMaxX = Math.max(handMaxX, 1 - p.x);
          handMinY = Math.min(handMinY, p.y);
          handMaxY = Math.max(handMaxY, p.y);
        }
        
        const hMinX = handMinX * width;
        const hMaxX = handMaxX * width;
        const hMinY = handMinY * height;
        const hMaxY = handMaxY * height;

        // Check if the hand as a whole overlaps with the target note's vertical band
        const isHandInPianoBand = (hMaxY > pianoTop && hMinY < pianoBottom);

        // Use only fingertips for more precise note triggering
        const tipIndices = [4, 8, 12, 16, 20];
        
        for (const tipIdx of tipIndices) {
          const point = landmarks[tipIdx];
          const tx = (1 - point.x) * width;
          const ty = point.y * height;

          if (ty > pianoTop && ty < pianoBottom) {
            // Precise hit testing mapping screen X to our actual Note list
            const whiteKeyIndex = Math.floor(tx / whiteKeyWidth);
            if (whiteKeyIndex >= 0 && whiteKeyIndex < numWhiteKeys) {
              const whiteKeys = PIANO_KEYS.filter(k => !k.isBlack);
              const baseWhiteKey = whiteKeys[whiteKeyIndex];
              
              let detectedNote = baseWhiteKey.note;
              
              // Check for black keys with a narrower hit box for precision
              const distFromRight = (whiteKeyWidth * (whiteKeyIndex + 1)) - tx;
              const distFromLeft = tx - (whiteKeyWidth * whiteKeyIndex);
              const blackKeyHitZone = whiteKeyWidth * 0.25; // Narrower zone for black keys
              
              if (distFromRight < blackKeyHitZone) {
                const blackKey = PIANO_KEYS.find((k, idx) => 
                  k.isBlack && idx > 0 && PIANO_KEYS[idx-1].note === baseWhiteKey.note
                );
                if (blackKey) detectedNote = blackKey.note;
              } 
              else if (distFromLeft < blackKeyHitZone) {
                const blackKey = PIANO_KEYS.find((k, idx) => 
                  k.isBlack && idx < PIANO_KEYS.length - 1 && PIANO_KEYS[idx+1].note === baseWhiteKey.note
                );
                if (blackKey) detectedNote = blackKey.note;
              }

              currentNotes.add(detectedNote);
            }
          }
        }

        // SPECIAL CASE: Target Note Sensitivity
        // If the hand's "any part" (bounding box) intersects the target note's zone, 
        // we explicitly add it to currentNotes to ensure it's easy to hit.
        if (targetNoteRef.current && isPlayingRef.current && isHandInPianoBand) {
          const tNote = targetNoteRef.current;
          const tKeyIndex = PIANO_KEYS.findIndex(k => k.note === tNote);
          const tKey = PIANO_KEYS[tKeyIndex];
          
          if (tKey) {
            let tStart, tEnd;
            if (tKey.isBlack) {
              // Find the white key it sits on
              const prevWhite = PIANO_KEYS[tKeyIndex - 1];
              const whiteKeys = PIANO_KEYS.filter(k => !k.isBlack);
              const wIdx = whiteKeys.findIndex(k => k.note === prevWhite.note);
              const wStart = wIdx * whiteKeyWidth;
              tStart = wStart + (whiteKeyWidth * 0.7); // Center-ish
              tEnd = tStart + (whiteKeyWidth * 0.6);
            } else {
              const whiteKeys = PIANO_KEYS.filter(k => !k.isBlack);
              const wIdx = whiteKeys.findIndex(k => k.note === tKey.note);
              tStart = wIdx * whiteKeyWidth;
              tEnd = tStart + whiteKeyWidth;
            }

            // If the hand bounding box overlaps the target note's X range
            if (hMaxX > tStart && hMinX < tEnd) {
              currentNotes.add(tNote);
            }
          }
        }

        // Draw tips with extra visibility
        const mirroredTipsIndices = [4, 8, 12, 16, 20];
        for (const tipIdx of mirroredTipsIndices) {
          const tip = landmarks[tipIdx];
          const tx = (1 - tip.x) * width;
          const ty = tip.y * height;

          canvasCtx.beginPath();
          canvasCtx.arc(tx, ty, 8, 0, 2 * Math.PI);
          canvasCtx.fillStyle = '#00f2ff';
          canvasCtx.fill();
          canvasCtx.strokeStyle = 'white';
          canvasCtx.lineWidth = 3;
          canvasCtx.stroke();
        }
      }
    }

    // Handle note transitions
    PIANO_KEYS.forEach(k => {
      const note = k.note;
      const isCurrentlyPressed = currentNotes.has(note);
      const wasPressed = activeNotesRef.current.has(note);
      const isTarget = isPlayingRef.current && note === targetNoteRef.current;
      
      // Smoothness improvement:
      // If we are currently pressing the target, and it either:
      // 1. Just became pressed (wasn't pressed last frame)
      // 2. Was already pressed, BUT the step just changed (so it's a "new" target for us)
      // We rely on App.tsx's lastProcessedStepRef to prevent double-triggering the SAME step.
      
      let shouldTrigger = false;
      if (isCurrentlyPressed) {
        if (!wasPressed) {
          shouldTrigger = true;
        } else if (isTarget) {
          // If it's the current target and we are holding it, we want to try triggering
          // This allows "sliding" or "holding" into the next note.
          shouldTrigger = true;
        }
      }

      if (shouldTrigger) {
        onKeyPressRef.current(note);
      } else if (!isCurrentlyPressed && wasPressed) {
        onKeyReleaseRef.current(note);
      }
    });

    activeNotesRef.current = currentNotes;
    canvasCtx.restore();
  }, [onKeyPress, onKeyRelease]);

  useEffect(() => {
    const hands = new Hands({
      locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
    });

    hands.setOptions({
      maxNumHands: 2,
      modelComplexity: 1,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5,
    });

    hands.onResults(onResults);
    handsRef.current = hands;

    let animationFrameId: number;

    const run = async () => {
      if (webcamRef.current?.video?.readyState === 4) {
        await hands.send({ image: webcamRef.current.video });
      }
      animationFrameId = requestAnimationFrame(run);
    };

    run().then(() => setIsLoaded(true));

    return () => {
      cancelAnimationFrame(animationFrameId);
      hands.close();
    };
  }, []); // Empty dependency array - Hand detection loop is stable now

  return (
    <div 
      className="relative w-full max-w-4xl mx-auto rounded-[32px] overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.5)] bg-black border-2 border-[var(--accent-color)]"
      style={{ aspectRatio: '16 / 8.5' }}
    >
      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-[#0f172a] z-10 text-white font-medium">
          <div className="flex flex-col items-center gap-4">
            <div className="w-8 h-8 border-4 border-[var(--accent-color)] border-t-transparent rounded-full animate-spin"></div>
            <p className="uppercase tracking-[0.2em] text-xs font-black text-[var(--accent-color)]">Scanning Hand...</p>
          </div>
        </div>
      )}
      <Webcam
        ref={webcamRef}
        audio={false}
        mirrored={true}
        className="absolute inset-0 w-full h-full object-cover opacity-80"
        videoConstraints={{
          width: 1280,
          height: 720,
          facingMode: 'user',
        }}
        {...({} as any)}
      />
      
      <div className="absolute top-6 left-6 flex flex-col gap-3 z-10 min-w-[140px]">
        <div className="glass-panel p-4 rounded-3xl border-[var(--glass-border)] flex flex-col gap-2">
          <div className="flex flex-col">
            <span className="text-[10px] text-[var(--text-dim)] uppercase font-black tracking-[0.2em]">Score</span>
            <span className="text-4xl font-black text-[var(--accent-color)] leading-none">{Math.floor(score)}</span>
          </div>
          
          <div className="flex flex-col gap-1.5 mt-1">
            <div className="flex justify-between items-center text-[10px] uppercase font-black tracking-widest">
              <span className="text-[var(--text-dim)]">Progress</span>
              <span className="text-white">{progress}%</span>
            </div>
            <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
              <div 
                className="h-full bg-[var(--accent-color)] accent-glow transition-all duration-500 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="absolute top-6 right-6 z-10">
        <div className={`glass-panel px-5 py-2.5 rounded-full text-[10px] font-black tracking-[0.2em] uppercase border-[var(--glass-border)] flex items-center gap-3 transition-colors ${handDetected ? 'text-emerald-400' : 'text-amber-400'}`}>
          <div className={`w-1.5 h-1.5 rounded-full accent-glow ${handDetected ? 'bg-emerald-400 shadow-[0_0_10px_#10b981]' : 'bg-amber-400 shadow-[0_0_10px_#f59e0b]'}`} />
          {handDetected ? 'Hand Detected' : 'No Hand Visible'}
        </div>
      </div>

      {/* Landmarks MUST be on top layer */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none z-30"
        width={1280}
        height={720}
      />
    </div>
  );
}
