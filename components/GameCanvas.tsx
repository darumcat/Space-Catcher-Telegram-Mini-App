
import React, { useRef, useEffect, useState } from 'react';
import { GAME_CONFIG, ITEM_COLORS } from '../constants';
import { ItemType, GameStats } from '../types';

interface GameCanvasProps {
  isAdmin: boolean;
  streakDays: number;
  onGameOver: (stats: GameStats) => void;
  onExit: (stats: GameStats) => void; // Changed to accept stats
  onAchievement: (id: string) => void; // Callback для мгновенной проверки
  audio: {
    playGood: () => void;
    playBad: () => void;
    playBonus: (t: 'gold' | 'blue' | 'yellow' | 'purple') => void;
    startBgm: () => void;
    stopBgm: () => void;
  };
}

interface GameObject {
  id: number;
  x: number;
  y: number;
  type: ItemType;
  size: number;
}

interface ActiveBuff {
    type: 'x2' | 'shield';
    endTime: number;
}

export const GameCanvas: React.FC<GameCanvasProps> = ({ 
    isAdmin, onGameOver, onExit, onAchievement, audio, streakDays 
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isPaused, setIsPaused] = useState(false);
  
  // Game State Refs (Mutable for perf)
  const state = useRef({
      score: 0,
      lives: GAME_CONFIG.LIVES_START,
      collected: 0,
      consecutiveSafe: 0,
      startTime: 0,
      hitRed: false,
      bonusesCollected: new Set<ItemType>(),
      lastTime: 0,
      difficulty: 1,
      pauseStartTime: 0, // Чтобы вычитать время паузы из общего времени
      totalPausedTime: 0
  });

  const objects = useRef<GameObject[]>([]);
  const buffs = useRef<ActiveBuff[]>([]);
  
  // Timers
  const nextGoldSpawn = useRef(0);
  const nextYellowSpawn = useRef(0);
  const nextPurpleSpawn = useRef(0);

  // Touch
  const isTouching = useRef(false);
  const playerX = useRef(0);
  const targetX = useRef(0);
  const animationFrameId = useRef(0);

  const initGame = (width: number) => {
    const now = performance.now();
    state.current = {
        score: 0,
        lives: GAME_CONFIG.LIVES_START,
        collected: 0,
        consecutiveSafe: 0,
        startTime: Date.now(),
        hitRed: false,
        bonusesCollected: new Set(),
        lastTime: now,
        difficulty: 1,
        pauseStartTime: 0,
        totalPausedTime: 0
    };
    playerX.current = width / 2;
    targetX.current = width / 2;
    objects.current = [];
    buffs.current = [];
    
    // Init special spawn timers
    nextGoldSpawn.current = now + GAME_CONFIG.SPAWN_GOLD;
    nextYellowSpawn.current = now + GAME_CONFIG.SPAWN_YELLOW;
    nextPurpleSpawn.current = now + GAME_CONFIG.SPAWN_PURPLE;
  };

  // Helper to generate final stats object
  const getFinalStats = (): GameStats => {
    const now = Date.now();
    // Корректируем время игры, вычитая время паузы (если нужно точнее, можно усложнить, но пока просто общее время сессии)
    const timePlayed = (now - state.current.startTime) / 1000;
    
    return {
        score: state.current.score,
        itemsCollected: state.current.collected,
        consecutiveSafe: state.current.consecutiveSafe,
        timePlayed,
        hitRed: state.current.hitRed,
        streakDays: streakDays,
        bonusesCollected: Array.from(state.current.bonusesCollected)
    };
  };

  // Loop
  const update = (time: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Рассчитываем дельту времени
    const deltaTime = time - state.current.lastTime;
    state.current.lastTime = time;
    
    const width = canvas.width;
    const height = canvas.height;

    // --- Logic ---
    
    // 1. Check Buffs
    const now = Date.now();
    buffs.current = buffs.current.filter(b => b.endTime > now);
    const isShielded = buffs.current.some(b => b.type === 'shield');
    const isX2 = buffs.current.some(b => b.type === 'x2');

    // 2. Difficulty scaling
    const timePlayedSec = (now - state.current.startTime) / 1000;
    state.current.difficulty = 1 + (timePlayedSec * 0.002) + (state.current.score * 0.001);

    // 3. Spawning
    // Regular spawn (Blue or Red)
    if (Math.random() < (1 / (GAME_CONFIG.SPAWN_RATE / state.current.difficulty))) {
        const type = Math.random() < GAME_CONFIG.CHANCE_RED ? 'red' : 'blue';
        spawnObject(width, type);
    }
    // Special spawns
    if (time > nextGoldSpawn.current) {
        spawnObject(width, 'gold');
        nextGoldSpawn.current = time + GAME_CONFIG.SPAWN_GOLD;
    }
    if (time > nextYellowSpawn.current) {
        spawnObject(width, 'yellow');
        nextYellowSpawn.current = time + GAME_CONFIG.SPAWN_YELLOW;
    }
    if (time > nextPurpleSpawn.current) {
        spawnObject(width, 'purple');
        nextPurpleSpawn.current = time + GAME_CONFIG.SPAWN_PURPLE;
    }

    // 4. Player Movement
    if (isTouching.current) {
        playerX.current += (targetX.current - playerX.current) * 0.2;
    }
    // Clamp
    const pSize = GAME_CONFIG.PLAYER_SIZE;
    playerX.current = Math.max(pSize/2, Math.min(width - pSize/2, playerX.current));


    // --- Drawing ---
    
    // Background
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, '#0f172a');
    gradient.addColorStop(1, '#1e1b4b');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    // Dynamic Grid
    ctx.strokeStyle = 'rgba(99, 102, 241, 0.1)';
    ctx.lineWidth = 1;
    const offset = (time * 0.1) % 40;
    for(let y=offset; y<height; y+=40) { ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(width,y); ctx.stroke(); }

    // Draw Player
    ctx.save();
    ctx.translate(playerX.current, height - 80);
    const tilt = (targetX.current - playerX.current) * 0.01;
    ctx.rotate(Math.max(-0.4, Math.min(0.4, tilt)));
    
    // Player Shield Effect
    if (isShielded || isAdmin) {
        ctx.beginPath();
        ctx.arc(0, 0, 40, 0, Math.PI*2);
        ctx.fillStyle = 'rgba(168, 85, 247, 0.2)';
        ctx.fill();
        ctx.strokeStyle = '#a855f7';
        ctx.lineWidth = 2;
        ctx.stroke();
    }

    // Player Ship
    ctx.fillStyle = isAdmin ? '#fbbf24' : '#38bdf8';
    ctx.shadowColor = ctx.fillStyle;
    ctx.shadowBlur = 20;
    ctx.beginPath();
    ctx.moveTo(0, -25);
    ctx.lineTo(-20, 20);
    ctx.lineTo(0, 10);
    ctx.lineTo(20, 20);
    ctx.fill();
    ctx.restore();

    // Draw Objects & Collision
    const playerY = height - 60;
    
    for (let i = objects.current.length - 1; i >= 0; i--) {
        const obj = objects.current[i];
        obj.y += GAME_CONFIG.GRAVITY * state.current.difficulty;

        // Draw
        ctx.save();
        ctx.translate(obj.x, obj.y);
        ctx.fillStyle = ITEM_COLORS[obj.type];
        ctx.shadowColor = ctx.fillStyle;
        ctx.shadowBlur = 15;

        if (obj.type === 'red') {
            // Red Cube
            ctx.rotate(time * 0.003);
            ctx.fillRect(-obj.size/2, -obj.size/2, obj.size, obj.size);
        } else if (obj.type === 'blue') {
            // Blue Sphere
            ctx.beginPath();
            ctx.arc(0, 0, obj.size/2, 0, Math.PI*2);
            ctx.fill();
            // Inner glow
            ctx.fillStyle = 'rgba(255,255,255,0.5)';
            ctx.beginPath();
            ctx.arc(-5, -5, 4, 0, Math.PI*2);
            ctx.fill();
        } else {
            // Special shapes
            ctx.rotate(time * 0.005);
            ctx.beginPath();
            const sides = obj.type === 'gold' ? 5 : (obj.type === 'yellow' ? 3 : 6);
            for(let k=0; k<sides; k++) {
                const angle = (k * 2 * Math.PI) / sides;
                ctx.lineTo(Math.cos(angle)*obj.size/2, Math.sin(angle)*obj.size/2);
            }
            ctx.closePath();
            ctx.fill();
        }
        ctx.restore();

        // Collision Logic
        const dist = Math.hypot(obj.x - playerX.current, obj.y - playerY);
        const hitDist = (obj.size/2) + (GAME_CONFIG.PLAYER_SIZE/2);

        if (dist < hitDist) {
            handleCollision(obj.type);
            objects.current.splice(i, 1);
            continue;
        }

        if (obj.y > height + 50) {
            objects.current.splice(i, 1);
        }
    }

    // HUD
    drawHUD(ctx, width, isX2, isShielded);

    // Check Death
    if (state.current.lives <= 0) {
        endGame();
        return;
    }
    
    // Check Realtime Achievements
    checkRealtimeAchievements(timePlayedSec);

    animationFrameId.current = requestAnimationFrame(update);
  };

  const spawnObject = (width: number, type: ItemType) => {
      const margin = 40;
      objects.current.push({
          id: Math.random(),
          x: margin + Math.random() * (width - margin*2),
          y: -50,
          type,
          size: GAME_CONFIG.OBJECT_SIZE
      });
  };

  const handleCollision = (type: ItemType) => {
      state.current.bonusesCollected.add(type);
      const isX2 = buffs.current.some(b => b.type === 'x2');
      const isShielded = buffs.current.some(b => b.type === 'shield');

      if (type === 'red') {
          if (!isAdmin && !isShielded) {
              state.current.lives--;
              state.current.hitRed = true;
              state.current.consecutiveSafe = 0; // Reset combo on damage
              audio.playBad();
              window.Telegram?.WebApp.HapticFeedback.impactOccurred('heavy');
          } else {
              // Shield hit effect
              audio.playBad(); 
          }
      } else {
          // Good interactions
          if (window.Telegram?.WebApp.HapticFeedback) {
               window.Telegram.WebApp.HapticFeedback.impactOccurred('light');
          }
          
          if (type === 'blue') {
              state.current.score += (isX2 ? 2 : 1);
              state.current.collected++;
              state.current.consecutiveSafe++; // Increase streak
              audio.playGood();
          } else if (type === 'gold') {
              state.current.score += (isX2 ? 20 : 10);
              audio.playBonus('gold');
          } else if (type === 'yellow') {
              buffs.current.push({ type: 'x2', endTime: Date.now() + GAME_CONFIG.BONUS_DURATION_X2 });
              audio.playBonus('yellow');
          } else if (type === 'purple') {
              buffs.current.push({ type: 'shield', endTime: Date.now() + GAME_CONFIG.BONUS_DURATION_SHIELD });
              audio.playBonus('purple');
          }
      }
  };

  const drawHUD = (ctx: CanvasRenderingContext2D, width: number, x2: boolean, shield: boolean) => {
      // Score
      ctx.fillStyle = 'white';
      ctx.font = '900 32px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(state.current.score.toString(), 40, 60);
      
      // Lives
      const hearts = '❤️'.repeat(Math.max(0, state.current.lives));
      ctx.textAlign = 'right';
      ctx.font = '24px sans-serif';
      // Сдвигаем сердечки ниже (90px), чтобы не перекрывались кнопкой меню
      ctx.fillText(isAdmin ? 'GOD' : hearts, width - 20, 90);

      // Active Buffs indicators
      let buffY = 120; // Сдвигаем баффы еще ниже
      if (x2) {
          ctx.fillStyle = '#facc15';
          ctx.font = 'bold 16px sans-serif';
          ctx.fillText("2X SCORE", 40, buffY);
          // Timer bar
          ctx.fillRect(40, buffY+5, 60, 4);
          buffY += 30;
      }
      if (shield) {
          ctx.fillStyle = '#a855f7';
          ctx.font = 'bold 16px sans-serif';
          ctx.fillText("SHIELD", 40, buffY);
          ctx.fillRect(40, buffY+5, 60, 4);
      }
  };

  const checkRealtimeAchievements = (timePlayed: number) => {
      const s = state.current;

      // Basic Score
      if (s.score >= 50) onAchievement('score_50');
      if (s.score >= 200) onAchievement('score_200');
      if (s.score >= 500) onAchievement('score_500');
      if (s.score >= 1000) onAchievement('score_1000');
      if (s.score >= 2000) onAchievement('score_2000');

      // Combo / Survival
      if (s.consecutiveSafe >= 50) onAchievement('safe_streak_50'); 
      if (s.consecutiveSafe >= 500) onAchievement('super_safe_streak_500'); 
      
      if (s.score >= 200 && !s.hitRed) onAchievement('ninja_200');
      if (s.score >= 500 && !s.hitRed) onAchievement('invincible_500');

      // Time & Speed
      if (timePlayed >= 600) onAchievement('iron_nerves_10');
      if (s.score >= 50 && timePlayed <= 20) onAchievement('speed_run_50');

      // Collector check
      if (s.bonusesCollected.has('gold') && s.bonusesCollected.has('yellow') && s.bonusesCollected.has('purple')) {
          onAchievement('collector_v2');
      }
  };

  const endGame = () => {
      cancelAnimationFrame(animationFrameId.current);
      onGameOver(getFinalStats());
  };
  
  const togglePause = () => {
    if (isPaused) {
        // Resume
        setIsPaused(false);
        // Важно: сбрасываем lastTime на текущее время, чтобы deltaTime не скакнул
        state.current.lastTime = performance.now(); 
        
        // Корректируем таймеры спавна на время, которое прошло в паузе
        const pauseDuration = performance.now() - state.current.pauseStartTime;
        nextGoldSpawn.current += pauseDuration;
        nextYellowSpawn.current += pauseDuration;
        nextPurpleSpawn.current += pauseDuration;
        
        // Продлеваем баффы
        buffs.current.forEach(b => b.endTime += pauseDuration);

        audio.startBgm();
        animationFrameId.current = requestAnimationFrame(update);
    } else {
        // Pause
        setIsPaused(true);
        state.current.pauseStartTime = performance.now();
        cancelAnimationFrame(animationFrameId.current);
        audio.stopBgm();
    }
  };

  const handleManualExit = () => {
      cancelAnimationFrame(animationFrameId.current);
      onExit(getFinalStats());
  };

  useEffect(() => {
      const canvas = canvasRef.current;
      if(canvas) {
          canvas.width = window.innerWidth;
          canvas.height = window.innerHeight;
          initGame(canvas.width);
          animationFrameId.current = requestAnimationFrame(update);
      }
      return () => cancelAnimationFrame(animationFrameId.current);
  }, []);

  // Input Handlers
  const handleTouch = (e: React.TouchEvent) => { 
      if (isPaused) return;
      isTouching.current = true; 
      targetX.current = e.touches[0].clientX; 
  };

  return (
    <div className="relative w-full h-full bg-slate-900">
        {/* HUD Buttons */}
        {!isPaused && (
            <>
                {/* Pause Button - Top Center */}
                <button 
                    onClick={togglePause}
                    className="absolute top-4 left-1/2 -translate-x-1/2 z-10 w-10 h-10 bg-slate-800/80 rounded-full border border-slate-600 flex items-center justify-center text-slate-300 shadow-lg active:scale-95 backdrop-blur-sm"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25v13.5m-7.5-13.5v13.5" />
                    </svg>
                </button>

                {/* Menu/Home Button - Top Right */}
                <button 
                    onClick={handleManualExit}
                    className="absolute top-4 right-4 z-10 w-10 h-10 bg-red-900/80 rounded-full border border-red-700 flex items-center justify-center text-red-200 shadow-lg active:scale-95 backdrop-blur-sm hover:bg-red-800 transition-colors"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
                    </svg>
                </button>
            </>
        )}

        {/* Pause Menu Overlay */}
        {isPaused && (
            <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
                <div className="bg-slate-800 p-8 rounded-2xl border border-slate-600 shadow-2xl flex flex-col gap-4 min-w-[200px]">
                    <h2 className="text-2xl font-bold text-white text-center mb-2">ПАУЗА</h2>
                    
                    <button 
                        onClick={togglePause}
                        className="w-full py-3 px-6 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl shadow-lg transition-all active:scale-95"
                    >
                        ПРОДОЛЖИТЬ
                    </button>
                    
                    <button 
                        onClick={handleManualExit}
                        className="w-full py-3 px-6 bg-slate-700 hover:bg-slate-600 text-slate-200 font-semibold rounded-xl border border-slate-500 transition-all active:scale-95"
                    >
                        В МЕНЮ
                    </button>
                </div>
            </div>
        )}

        <canvas 
            ref={canvasRef} 
            className="block w-full h-full touch-none"
            onTouchStart={handleTouch} 
            onTouchMove={handleTouch} 
            onTouchEnd={() => isTouching.current = false}
            onMouseDown={(e) => { if(!isPaused){ isTouching.current=true; targetX.current=e.clientX; }}}
            onMouseMove={(e) => { if(isTouching.current && !isPaused) targetX.current=e.clientX; }}
            onMouseUp={() => isTouching.current=false}
        />
    </div>
  );
};
