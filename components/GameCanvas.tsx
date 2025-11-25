
import React, { useRef, useEffect, useState } from 'react';
import { GAME_CONFIG, ITEM_COLORS, SHIPS, SHIP_DESIGNS } from '../constants';
import { ItemType, GameStats, ShipShape, ShipAbility } from '../types';

interface GameCanvasProps {
  isAdmin: boolean;
  streakDays: number;
  selectedShipId: string;
  onGameOver: (stats: GameStats) => void;
  onExit: (stats: GameStats) => void;
  onAchievement: (id: string) => void;
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

interface Projectile {
  id: number;
  x: number;
  y: number;
}

interface ActiveBuff {
    type: 'x2' | 'shield';
    endTime: number;
}

export const GameCanvas: React.FC<GameCanvasProps> = ({ 
    isAdmin, onGameOver, onExit, onAchievement, audio, streakDays, selectedShipId 
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isPaused, setIsPaused] = useState(false);
  const isPausedRef = useRef(false); 
  
  // Update ref immediately in render phase
  isPausedRef.current = isPaused;

  // Find ship config
  const currentShip = SHIPS.find(s => s.id === selectedShipId) || SHIPS[0];
  
  // Ability State
  // We use REF for logic inside the loop to avoid stale closures, and STATE for UI updates.
  const abilityReadyRef = useRef(true);
  const [abilityReady, setAbilityReady] = useState(true);
  
  const [, setTick] = useState(0); // Tick to force update for cooldown animation

  const lastAbilityUsage = useRef<number>(0);
  const abilityEndTime = useRef<number>(0);
  const heartUsed = useRef(false); // For Heart ability (once per game)
  const lastShotTime = useRef<number>(0);

  // Game State Refs
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
      pauseStartTime: 0, 
      totalPausedTime: 0
  });

  const objects = useRef<GameObject[]>([]);
  const projectiles = useRef<Projectile[]>([]);
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

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const resize = () => {
        canvas.width = container.clientWidth;
        canvas.height = container.clientHeight;
        if (state.current.score === 0) {
           playerX.current = canvas.width / 2;
           targetX.current = canvas.width / 2;
        }
    };
    window.addEventListener('resize', resize);
    resize();

    initGame(canvas.width);
    
    return () => {
        window.removeEventListener('resize', resize);
        if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
    };
  }, []);

  // Force re-render for cooldown animation logic
  useEffect(() => {
      if (abilityReady) return;
      const interval = setInterval(() => {
          setTick(t => t + 1);
      }, 100);
      return () => clearInterval(interval);
  }, [abilityReady]);

  // Pause logic
  useEffect(() => {
    if (isPaused) {
        if (animationFrameId.current) {
            cancelAnimationFrame(animationFrameId.current);
            animationFrameId.current = 0;
        }
        audio.stopBgm();
        if (state.current.pauseStartTime === 0) {
            state.current.pauseStartTime = Date.now();
        }
    } else {
        if (state.current.pauseStartTime > 0) {
            const pausedDuration = Date.now() - state.current.pauseStartTime;
            state.current.totalPausedTime += pausedDuration;
            
            nextGoldSpawn.current += pausedDuration;
            nextYellowSpawn.current += pausedDuration;
            nextPurpleSpawn.current += pausedDuration;
            
            // Ability cooldown adjust
            if (lastAbilityUsage.current > 0) lastAbilityUsage.current += pausedDuration;
            if (abilityEndTime.current > 0) abilityEndTime.current += pausedDuration;

            state.current.lastTime = performance.now();
            state.current.pauseStartTime = 0;
        } else {
             state.current.lastTime = performance.now();
        }

        audio.startBgm();
        if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
        animationFrameId.current = requestAnimationFrame(update);
    }

    return () => {
        if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
        audio.stopBgm();
    };
  }, [isPaused]);

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
    projectiles.current = [];
    lastAbilityUsage.current = 0;
    abilityEndTime.current = 0;
    heartUsed.current = false;
    
    const hasAbility = currentShip.ability !== 'none';
    setAbilityReady(hasAbility);
    abilityReadyRef.current = hasAbility;
    
    const timestamp = performance.now();
    nextGoldSpawn.current = timestamp + GAME_CONFIG.SPAWN_GOLD;
    nextYellowSpawn.current = timestamp + GAME_CONFIG.SPAWN_YELLOW;
    nextPurpleSpawn.current = timestamp + GAME_CONFIG.SPAWN_PURPLE;
  };

  const getFinalStats = (): GameStats => {
    const now = Date.now();
    const timePlayed = (now - state.current.startTime - state.current.totalPausedTime) / 1000;
    
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

  const activateAbility = () => {
      if (currentShip.ability === 'none' || isPaused) return;
      const now = Date.now();
      
      // Cooldown check
      if (currentShip.ability === 'heart') {
          if (heartUsed.current) return;
      } else {
          if (now - lastAbilityUsage.current < GAME_CONFIG.ABILITY_COOLDOWN && lastAbilityUsage.current !== 0) return;
      }

      // Activate
      if (currentShip.ability === 'shockwave') {
          // Instant effect
          objects.current = objects.current.filter(o => o.type !== 'red');
          if (window.Telegram?.WebApp.HapticFeedback) {
             window.Telegram.WebApp.HapticFeedback.impactOccurred('heavy');
          }
          audio.playBonus('yellow'); // Reuse sound
          lastAbilityUsage.current = now;
          abilityReadyRef.current = false;
          setAbilityReady(false);
      } else if (currentShip.ability === 'heart') {
          state.current.lives += 1;
          heartUsed.current = true;
          audio.playBonus('purple');
          abilityReadyRef.current = false;
          setAbilityReady(false); // Used once
      } else {
          // Duration effect
          abilityEndTime.current = now + GAME_CONFIG.ABILITY_DURATION;
          lastAbilityUsage.current = now;
          abilityReadyRef.current = false;
          setAbilityReady(false);
          audio.playBonus('blue');
      }
  };

  const drawShip = (ctx: CanvasRenderingContext2D, shape: ShipShape, color: string, time: number, x: number, y: number, scale: number = 0.8, alpha: number = 1) => {
      const design = SHIP_DESIGNS[shape];
      ctx.save();
      ctx.translate(x, y);
      // Center the drawing
      ctx.translate(-50 * scale, -50 * scale);
      ctx.scale(scale, scale);
      ctx.globalAlpha = alpha;

      // 1. Engine Glow
      ctx.save();
      ctx.globalCompositeOperation = 'screen';
      const glow = 5 + Math.sin(time * 0.02) * 2;
      ctx.shadowBlur = 15;
      ctx.shadowColor = design.engineColor;
      ctx.fillStyle = design.engineColor;
      ctx.beginPath();
      ctx.ellipse(50, 85, 10 + glow, 20 + glow, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // 2. Main Body
      const bodyPath = new Path2D(design.body);
      ctx.fillStyle = color;
      ctx.fill(bodyPath);
      ctx.strokeStyle = 'rgba(255,255,255,0.2)';
      ctx.lineWidth = 2;
      ctx.stroke(bodyPath);

      // 3. Details
      const detailsPath = new Path2D(design.details);
      ctx.strokeStyle = 'rgba(0,0,0,0.3)';
      ctx.lineWidth = 2;
      ctx.stroke(detailsPath);

      // 4. Cockpit
      const cockpitPath = new Path2D(design.cockpit);
      ctx.fillStyle = 'rgba(200, 240, 255, 0.9)';
      ctx.fill(cockpitPath);

      ctx.restore();
  };

  const update = (time: number) => {
    if (isPausedRef.current) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const deltaTime = time - state.current.lastTime;
    if (deltaTime > 1000) {
        state.current.lastTime = time;
        if (!isPausedRef.current) animationFrameId.current = requestAnimationFrame(update);
        return;
    }
    state.current.lastTime = time;
    
    const width = canvas.width;
    const height = canvas.height;
    const now = performance.now();
    const wallTime = Date.now();

    // Ability Active Status Check
    const isAbilityActive = wallTime < abilityEndTime.current;
    
    // Update Ability Cooldown Logic
    // Use Ref to avoid stale closure issues in the game loop
    if (!abilityReadyRef.current && currentShip.ability !== 'none' && currentShip.ability !== 'heart') {
         if (wallTime - lastAbilityUsage.current >= GAME_CONFIG.ABILITY_COOLDOWN) {
             abilityReadyRef.current = true;
             setAbilityReady(true);
         }
    }

    // Active Buffs
    buffs.current = buffs.current.filter(b => b.endTime > wallTime);
    const isShielded = buffs.current.some(b => b.type === 'shield');
    const isX2 = buffs.current.some(b => b.type === 'x2');

    // Difficulty logic (FASTER RAMP)
    const timePlayedSec = (wallTime - state.current.startTime - state.current.totalPausedTime) / 1000;
    state.current.difficulty = 1 + (timePlayedSec * 0.015) + (state.current.score * 0.0015);

    // Time Scale (Slow ability)
    const timeScale = (isAbilityActive && currentShip.ability === 'slow') ? 0.5 : 1.0;

    // Spawning
    if (Math.random() < (1 / (GAME_CONFIG.SPAWN_RATE / state.current.difficulty)) * timeScale) {
        const type = Math.random() < GAME_CONFIG.CHANCE_RED ? 'red' : 'blue';
        spawnObject(width, type);
    }
    if (now > nextGoldSpawn.current) {
        spawnObject(width, 'gold');
        nextGoldSpawn.current = now + GAME_CONFIG.SPAWN_GOLD;
    }
    if (now > nextYellowSpawn.current) {
        spawnObject(width, 'yellow');
        nextYellowSpawn.current = now + GAME_CONFIG.SPAWN_YELLOW;
    }
    if (now > nextPurpleSpawn.current) {
        spawnObject(width, 'purple');
        nextPurpleSpawn.current = now + GAME_CONFIG.SPAWN_PURPLE;
    }

    // Projectiles Spawn (Shoot ability)
    if (isAbilityActive && currentShip.ability === 'shoot') {
        if (now - lastShotTime.current > 200) { // Approx 5 shots per second
             projectiles.current.push({ id: Math.random(), x: playerX.current, y: height - 90 });
             lastShotTime.current = now;
        }
    }

    // Movement with Dynamic Speed (EVEN FASTER)
    if (isTouching.current) {
        // Base: 0.20
        // Ramp: +0.025 per second
        // Score: +0.0005 per point
        let dynamicSpeed = 0.20 + (timePlayedSec * 0.25) + (state.current.score * 0.005);
        if (isAbilityActive && currentShip.ability === 'speed') dynamicSpeed *= 2;
        
        const speedLerp = Math.min(isAbilityActive && currentShip.ability === 'speed' ? 0.95 : 0.9, dynamicSpeed);
        playerX.current += (targetX.current - playerX.current) * speedLerp;
    }
    
    const pSize = GAME_CONFIG.PLAYER_SIZE;
    playerX.current = Math.max(pSize/2, Math.min(width - pSize/2, playerX.current));

    // --- Drawing ---
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, '#0f172a');
    gradient.addColorStop(1, '#1e1b4b');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    // Grid
    ctx.strokeStyle = 'rgba(99, 102, 241, 0.1)';
    ctx.lineWidth = 1;
    const offset = (time * 0.1) % 40;
    for(let y=offset; y<height; y+=40) { ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(width,y); ctx.stroke(); }

    // Draw Player
    const shipY = height - 80;
    ctx.save();
    ctx.translate(playerX.current, shipY);
    const tilt = (targetX.current - playerX.current) * 0.01;
    ctx.rotate(Math.max(-0.4, Math.min(0.4, tilt)));
    
    // Shield visual
    if (isShielded || isAdmin) {
        ctx.beginPath();
        ctx.arc(0, 0, 45, 0, Math.PI*2);
        ctx.fillStyle = 'rgba(168, 85, 247, 0.2)';
        ctx.fill();
        ctx.strokeStyle = '#a855f7';
        ctx.lineWidth = 2;
        ctx.stroke();
    }

    // Ability Visuals (Speed Flame)
    if (isAbilityActive && currentShip.ability === 'speed') {
        ctx.save();
        ctx.translate(0, 40);
        ctx.fillStyle = '#f97316';
        ctx.shadowBlur = 20;
        ctx.shadowColor = 'orange';
        ctx.beginPath();
        ctx.moveTo(-10, 0);
        ctx.lineTo(10, 0);
        ctx.lineTo(0, 60 + Math.random() * 20);
        ctx.fill();
        ctx.restore();
    }

    // Phasing alpha
    const shipAlpha = (isAbilityActive && currentShip.ability === 'phase') ? 0.4 : 1;
    
    // Draw MAIN SHIP
    drawShip(ctx, currentShip.shape, isAdmin ? '#fbbf24' : currentShip.color, time, 0, 0, 0.8, shipAlpha);
    ctx.restore();

    // Draw CLONES
    if (isAbilityActive && currentShip.ability === 'clones') {
        drawShip(ctx, currentShip.shape, currentShip.color, time, playerX.current - 60, shipY, 0.6, 0.5);
        drawShip(ctx, currentShip.shape, currentShip.color, time, playerX.current + 60, shipY, 0.6, 0.5);
    }

    // Draw Projectiles
    ctx.fillStyle = '#38bdf8';
    ctx.shadowColor = '#38bdf8';
    ctx.shadowBlur = 10;
    for (let i = projectiles.current.length - 1; i >= 0; i--) {
        const p = projectiles.current[i];
        p.y -= 15 * timeScale; // Fast up
        ctx.beginPath();
        ctx.arc(p.x, p.y, 4, 0, Math.PI*2);
        ctx.fill();
        if (p.y < -10) projectiles.current.splice(i, 1);
    }

    // Draw Objects
    for (let i = objects.current.length - 1; i >= 0; i--) {
        const obj = objects.current[i];
        
        // Magnet Effect
        if (isAbilityActive && currentShip.ability === 'magnet' && obj.type !== 'red') {
            const dx = playerX.current - obj.x;
            const dy = shipY - obj.y;
            const dist = Math.hypot(dx, dy);
            if (dist < 400) {
                obj.x += (dx / dist) * 10;
                obj.y += (dy / dist) * 10;
            }
        }

        obj.y += GAME_CONFIG.GRAVITY * state.current.difficulty * timeScale;

        ctx.save();
        ctx.translate(obj.x, obj.y);
        ctx.fillStyle = ITEM_COLORS[obj.type];
        ctx.shadowColor = ctx.fillStyle;
        ctx.shadowBlur = 15;

        if (obj.type === 'red') {
            // Meteorite Drawing - Enhanced
            ctx.rotate(time * 0.002 + obj.id); // Add random rotation based on ID
            ctx.beginPath();
            const spikes = 6; // Fewer spikes for rock look
            const outerRadius = obj.size / 2;
            const innerRadius = obj.size / 2.5;

            // Jagged rock shape
            for (let k = 0; k < spikes * 2; k++) {
                const r = (k % 2 === 0) ? outerRadius : innerRadius + (Math.sin(k * 123 + obj.id) * 4); 
                const a = (Math.PI * k) / spikes;
                ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
            }
            ctx.closePath();
            ctx.fill();
            
            // Texture/Cracks
            ctx.strokeStyle = '#5d4037';
            ctx.lineWidth = 1;
            ctx.stroke();

            // Pits/Craters detail
            ctx.fillStyle = 'rgba(0,0,0,0.4)';
            ctx.beginPath();
            ctx.arc(obj.size/6, -obj.size/6, obj.size/5, 0, Math.PI*2);
            ctx.fill();

        } else if (obj.type === 'blue') {
            ctx.beginPath();
            ctx.arc(0, 0, obj.size/2, 0, Math.PI*2);
            ctx.fill();
            ctx.fillStyle = 'rgba(255,255,255,0.5)';
            ctx.beginPath();
            ctx.arc(-5, -5, 4, 0, Math.PI*2);
            ctx.fill();
        } else {
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

        // Projectile Collision (Shoot)
        if (obj.type === 'red') {
            const hitByProj = projectiles.current.findIndex(p => Math.hypot(p.x - obj.x, p.y - obj.y) < obj.size);
            if (hitByProj !== -1) {
                projectiles.current.splice(hitByProj, 1);
                objects.current.splice(i, 1);
                // Visual explosion could go here
                continue;
            }
        }

        const hitDist = (obj.size/2) + 30;

        // Main Ship Collision
        const dist = Math.hypot(obj.x - playerX.current, obj.y - shipY);
        
        // Phasing check
        const isPhasing = isAbilityActive && currentShip.ability === 'phase';

        if (dist < hitDist) {
            if (obj.type === 'red' && isPhasing) {
                // Ignore collision
            } else {
                handleCollision(obj.type);
                objects.current.splice(i, 1);
                continue;
            }
        }

        // Clone Collision
        if (isAbilityActive && currentShip.ability === 'clones') {
             const distLeft = Math.hypot(obj.x - (playerX.current - 60), obj.y - shipY);
             const distRight = Math.hypot(obj.x - (playerX.current + 60), obj.y - shipY);
             if (distLeft < hitDist || distRight < hitDist) {
                 if (obj.type === 'red') {
                     // Clone destroys red, no damage
                     objects.current.splice(i, 1);
                     continue;
                 } else {
                     handleCollision(obj.type);
                     objects.current.splice(i, 1);
                     continue;
                 }
             }
        }

        if (obj.y > height + 50) {
            objects.current.splice(i, 1);
        }
    }

    drawHUD(ctx, width, isX2, isShielded);

    if (state.current.lives <= 0) {
        endGame();
        return;
    }
    
    checkRealtimeAchievements(timePlayedSec);

    if (!isPausedRef.current) {
        animationFrameId.current = requestAnimationFrame(update);
    }
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
      const isShielded = buffs.current.some(b => b.type === 'shield');

      if (type === 'red') {
          if (!isAdmin && !isShielded) {
              state.current.lives--;
              state.current.hitRed = true;
              state.current.consecutiveSafe = 0; 
              audio.playBad();
              window.Telegram?.WebApp.HapticFeedback.impactOccurred('heavy');
          } else {
              audio.playBad(); 
          }
      } else {
          if (window.Telegram?.WebApp.HapticFeedback) {
               window.Telegram.WebApp.HapticFeedback.impactOccurred('light');
          }
          const isX2 = buffs.current.some(b => b.type === 'x2');
          
          if (type === 'blue') {
              state.current.score += (isX2 ? 2 : 1);
              state.current.collected++;
              state.current.consecutiveSafe++; 
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
      ctx.fillStyle = 'white';
      ctx.font = '900 32px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(state.current.score.toString(), 40, 60);
      
      const hearts = '❤️'.repeat(Math.max(0, state.current.lives));
      ctx.textAlign = 'right';
      ctx.font = '24px sans-serif';
      ctx.fillText(isAdmin ? 'GOD' : hearts, width - 20, 120);

      let buffY = 150; 
      if (x2) {
          ctx.fillStyle = '#facc15';
          ctx.font = 'bold 16px sans-serif';
          ctx.fillText("2X SCORE", width - 20, buffY);
          ctx.fillRect(width - 80, buffY+5, 60, 4);
          buffY += 30;
      }
      if (shield) {
          ctx.fillStyle = '#a855f7';
          ctx.font = 'bold 16px sans-serif';
          ctx.fillText("SHIELD", width - 20, buffY);
          ctx.fillRect(width - 80, buffY+5, 60, 4);
      }
  };

  const checkRealtimeAchievements = (timePlayed: number) => {
      const s = state.current;
      if (s.score >= 50) onAchievement('score_50');
      if (s.score >= 200) onAchievement('score_200');
      if (s.score >= 500) onAchievement('score_500');
      if (s.score >= 1000) onAchievement('score_1000');
      if (s.score >= 2000) onAchievement('score_2000');

      if (s.consecutiveSafe >= 50) onAchievement('safe_streak_50'); 
      if (s.consecutiveSafe >= 500) onAchievement('super_safe_streak_500'); 
      
      if (s.score >= 200 && !s.hitRed) onAchievement('ninja_200');
      // Updated condition for Invincible: 1000 points
      if (s.score >= 1000 && !s.hitRed) onAchievement('invincible_500');

      if (timePlayed >= 600) onAchievement('iron_nerves_10');
      if (s.score >= 50 && timePlayed <= 20) onAchievement('speed_run_50');

      if (s.bonusesCollected.has('gold') && s.bonusesCollected.has('yellow') && s.bonusesCollected.has('purple')) {
          onAchievement('collector_v2');
      }
  };

  const endGame = () => {
      if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
      onGameOver(getFinalStats());
  };

  const handleTouchMove = (e: React.TouchEvent | React.MouseEvent) => {
      if (isPaused) return;
      const container = containerRef.current;
      if (!container) return;
      const rect = container.getBoundingClientRect();
      let clientX = 0;
      if ('touches' in e) {
          clientX = e.touches[0].clientX;
      } else {
          clientX = (e as React.MouseEvent).clientX;
      }
      targetX.current = clientX - rect.left;
      isTouching.current = true;
  };

  const handleTouchEnd = () => {
      isTouching.current = false;
  };

  // Cooldown visualization percentage
  const getCooldownPct = () => {
      if (currentShip.ability === 'heart') return heartUsed.current ? 0 : 100;
      if (abilityReady) return 100;
      const now = Date.now();
      const elapsed = now - lastAbilityUsage.current;
      return Math.min(100, (elapsed / GAME_CONFIG.ABILITY_COOLDOWN) * 100);
  };

  return (
      <div className="relative w-full h-full bg-slate-900 overflow-hidden select-none">
          <div ref={containerRef} className="absolute inset-0 w-full h-full">
              <canvas 
                  ref={canvasRef}
                  className="block w-full h-full touch-none"
                  onTouchStart={handleTouchMove}
                  onTouchMove={handleTouchMove}
                  onTouchEnd={handleTouchEnd}
                  onMouseDown={handleTouchMove}
                  onMouseMove={(e) => { if (e.buttons === 1) handleTouchMove(e); }}
                  onMouseUp={handleTouchEnd}
                  onMouseLeave={handleTouchEnd}
              />
          </div>
          
          {/* TOP RIGHT BUTTONS */}
          <div className="absolute top-4 right-4 flex gap-2 z-20">
               <button 
                 onClick={() => setIsPaused(true)} 
                 className="w-10 h-10 bg-slate-800/80 border border-slate-600 rounded-full flex items-center justify-center text-white shadow-lg active:scale-95 transition-transform backdrop-blur"
               >
                   <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25v13.5m-7.5-13.5v13.5" />
                   </svg>
               </button>
               <button 
                 onClick={() => onExit(getFinalStats())}
                 className="w-10 h-10 bg-slate-800/80 border border-slate-600 rounded-full flex items-center justify-center text-white shadow-lg active:scale-95 transition-transform backdrop-blur"
               >
                   <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
                   </svg>
               </button>
          </div>

          {/* ABILITY BUTTON (Bottom Left) - Transparent */}
          {currentShip.ability !== 'none' && (
              <div className="absolute bottom-32 left-6 z-30">
                  <button
                      onClick={activateAbility}
                      disabled={!abilityReady}
                      className={`relative w-20 h-20 rounded-full flex items-center justify-center border-2 transition-all active:scale-95 backdrop-blur-sm ${
                          abilityReady 
                          ? 'bg-indigo-500/30 border-indigo-400/50 text-white shadow-[0_0_15px_rgba(99,102,241,0.3)]' 
                          : 'bg-slate-800/20 border-slate-600/20 text-slate-500/30'
                      }`}
                  >
                      {/* Circular Progress for Cooldown */}
                      {!abilityReady && (
                          <svg className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none">
                              <circle 
                                cx="40" cy="40" r="36" 
                                stroke="rgba(255,255,255,0.1)" 
                                strokeWidth="4" 
                                fill="none" 
                              />
                              <circle 
                                cx="40" cy="40" r="36" 
                                stroke={currentShip.ability === 'heart' ? '#ef4444' : '#a855f7'} 
                                strokeWidth="4" 
                                fill="none" 
                                strokeDasharray="226" // 2 * PI * 36
                                strokeDashoffset={226 - (226 * getCooldownPct() / 100)}
                                className="transition-all duration-100 linear"
                              />
                          </svg>
                      )}
                      
                      {/* Icon based on ability */}
                      <div className="text-2xl">
                          {currentShip.ability === 'shoot' && '🔫'}
                          {currentShip.ability === 'magnet' && '🧲'}
                          {currentShip.ability === 'slow' && '⏳'}
                          {currentShip.ability === 'clones' && '👥'}
                          {currentShip.ability === 'shockwave' && '💥'}
                          {currentShip.ability === 'speed' && '⚡'}
                          {currentShip.ability === 'heart' && '❤️'}
                          {currentShip.ability === 'phase' && '👻'}
                      </div>
                  </button>
              </div>
          )}

          {/* Pause Overlay */}
          {isPaused && (
              <div className="absolute inset-0 bg-slate-900/90 backdrop-blur-sm flex flex-col items-center justify-center z-50 animate-fade-in">
                  <div className="bg-slate-800 p-8 rounded-2xl border border-slate-700 shadow-2xl w-64 space-y-4">
                      <h2 className="text-2xl font-bold text-center text-white mb-6 tracking-widest">ПАУЗА</h2>
                      <button 
                        onClick={() => setIsPaused(false)}
                        className="w-full py-3 bg-green-600 hover:bg-green-500 rounded-xl font-bold text-white shadow-lg"
                      >
                          ПРОДОЛЖИТЬ
                      </button>
                      <button 
                        onClick={() => onExit(getFinalStats())}
                        className="w-full py-3 bg-red-500/20 hover:bg-red-500/30 border border-red-500/50 rounded-xl font-bold text-red-300"
                      >
                          ВЫЙТИ В МЕНЮ
                      </button>
                  </div>
              </div>
          )}
      </div>
  );
};
