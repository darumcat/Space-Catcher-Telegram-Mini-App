
import React, { useState, useEffect, useCallback } from 'react';
import { TelegramUser, GameState, GameStats } from './types';
import { WelcomeScreen } from './components/WelcomeScreen';
import { GameCanvas } from './components/GameCanvas';
import { GameOverScreen } from './components/GameOverScreen';
import { ProfileScreen } from './components/ProfileScreen';
import { AchievementToast } from './components/AchievementToast';
import { ADMIN_ID, HIGH_SCORE_KEY, ACHIEVEMENTS_KEY, STREAK_KEY, ACHIEVEMENTS, PLATINUM_ID } from './constants';
import { audioManager } from './audio';
import { useTelegram } from './hooks/useTelegram';

export default function App() {
  const [gameState, setGameState] = useState<GameState>(GameState.MENU);
  const [user, setUser] = useState<TelegramUser | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [lastScore, setLastScore] = useState<number>(0);
  const [highScore, setHighScore] = useState<number>(0);
  const [unlockedAchievements, setUnlockedAchievements] = useState<string[]>([]);
  const [streakDays, setStreakDays] = useState<number>(0);
  
  // Notification queue
  const [currentAchievementToast, setCurrentAchievementToast] = useState<string | null>(null);

  useEffect(() => {
    const tg = window.Telegram?.WebApp;
    if (tg) {
      tg.ready();
      tg.expand();
      tg.headerColor = '#1e1b4b';
      tg.backgroundColor = '#0f172a';
      
      const tgUser = tg.initDataUnsafe?.user;
      if (tgUser) {
        setUser(tgUser);
        setIsAdmin(tgUser.id === ADMIN_ID);
      }
    }

    // Load data
    setHighScore(parseInt(localStorage.getItem(HIGH_SCORE_KEY) || '0', 10));
    try {
        setUnlockedAchievements(JSON.parse(localStorage.getItem(ACHIEVEMENTS_KEY) || '[]'));
    } catch (e) { setUnlockedAchievements([]); }

    // Load Streak logic
    try {
        const streakData = JSON.parse(localStorage.getItem(STREAK_KEY) || '{}');
        setStreakDays(streakData.count || 0);
    } catch(e) { setStreakDays(0); }
    
  }, []);

  // Handle Back Button
  useEffect(() => {
    const tg = window.Telegram?.WebApp;
    if (!tg) return;

    const handleBack = () => {
      if (gameState === GameState.PLAYING) {
        // При нажатии "Назад" в игре тоже сохраняем прогресс, но здесь сложно получить статы.
        // Обычно кнопка "Назад" в WebApp закрывает приложение, если мы в корне.
        // Оставим просто выход в меню для безопасности, статы не сохранятся (системная кнопка)
        setGameState(GameState.MENU);
        audioManager.stopBgm();
      } else if (gameState === GameState.GAME_OVER || gameState === GameState.PROFILE) {
        setGameState(GameState.MENU);
      } else {
        tg.close();
      }
    };

    if (gameState !== GameState.MENU) {
      tg.BackButton.show();
      tg.BackButton.onClick(handleBack);
    } else {
      tg.BackButton.hide();
    }
    return () => { tg.BackButton.offClick(handleBack); };
  }, [gameState]);

  const startGame = () => {
    setLastScore(0);
    setGameState(GameState.PLAYING);
    audioManager.startBgm();
  };

  const updateStreak = (score: number) => {
      if (score < 500) return; 

      const today = new Date().toDateString();
      let data = { date: '', count: 0 };
      
      try { data = JSON.parse(localStorage.getItem(STREAK_KEY) || '{}'); } catch(e){}

      if (data.date === today) return; 

      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      
      if (data.date === yesterday.toDateString()) {
          data.count += 1;
      } else {
          data.count = 1; 
      }
      
      data.date = today;
      localStorage.setItem(STREAK_KEY, JSON.stringify(data));
      setStreakDays(data.count);
      return data.count;
  };

  // Using functional update to prevent stale closures in GameCanvas
  const unlockAchievement = useCallback((id: string) => {
      setUnlockedAchievements(prev => {
          if (prev.includes(id)) return prev;
          
          const newUnlocked = [...prev, id];
          // Save immediately
          localStorage.setItem(ACHIEVEMENTS_KEY, JSON.stringify(newUnlocked));
          
          // Show toast
          setCurrentAchievementToast(id);
          if (window.Telegram?.WebApp?.HapticFeedback) {
            window.Telegram.WebApp.HapticFeedback.notificationOccurred('success');
          }

          // Check for Platinum (Recursive check)
          // We want to check if ALL achievements EXCEPT platinum are now unlocked
          if (id !== PLATINUM_ID) {
              const allNonPlatinumIds = ACHIEVEMENTS
                  .filter(a => a.id !== PLATINUM_ID)
                  .map(a => a.id);
              
              const hasAll = allNonPlatinumIds.every(reqId => newUnlocked.includes(reqId));
              
              if (hasAll && !newUnlocked.includes(PLATINUM_ID)) {
                  // Unlock Platinum with a slight delay for dramatic effect
                  setTimeout(() => {
                      unlockAchievement(PLATINUM_ID);
                  }, 2000);
              }
          }
          
          return newUnlocked;
      });
  }, []);

  // Централизованная логика сохранения статистики
  const processGameStats = useCallback((stats: GameStats) => {
    setLastScore(stats.score);
    
    if (stats.score > highScore) {
      setHighScore(stats.score);
      localStorage.setItem(HIGH_SCORE_KEY, stats.score.toString());
    }

    // Update Streak
    const newStreak = updateStreak(stats.score);
    const finalStats = { ...stats, streakDays: newStreak || streakDays };

    // Check All Achievements
    ACHIEVEMENTS.forEach(ach => {
        if (ach.id !== PLATINUM_ID && ach.condition(finalStats)) {
            unlockAchievement(ach.id);
        }
    });

    return finalStats;
  }, [highScore, streakDays, unlockAchievement]);

  const handleGameOver = useCallback((stats: GameStats) => {
    processGameStats(stats);
    audioManager.stopBgm();
    if (window.Telegram?.WebApp?.HapticFeedback) {
      window.Telegram.WebApp.HapticFeedback.notificationOccurred('error');
    }
    setGameState(GameState.GAME_OVER);
  }, [processGameStats]);

  const handleManualExit = useCallback((stats: GameStats) => {
    processGameStats(stats);
    audioManager.stopBgm();
    setGameState(GameState.MENU);
  }, [processGameStats]);

  return (
    <div className="w-full h-full relative font-sans bg-slate-900 text-white overflow-hidden select-none">
      <AchievementToast 
        id={currentAchievementToast} 
        onClose={() => setCurrentAchievementToast(null)} 
      />

      {gameState === GameState.MENU && (
        <WelcomeScreen 
          user={user} 
          isAdmin={isAdmin} 
          highScore={highScore} 
          onStart={startGame} 
          onProfile={() => setGameState(GameState.PROFILE)}
        />
      )}

      {gameState === GameState.PROFILE && (
          <ProfileScreen 
            user={user}
            highScore={highScore}
            unlockedAchievements={unlockedAchievements}
            onBack={() => setGameState(GameState.MENU)}
          />
      )}

      {gameState === GameState.PLAYING && (
        <GameCanvas 
          isAdmin={isAdmin} 
          streakDays={streakDays}
          onGameOver={handleGameOver}
          onAchievement={unlockAchievement}
          onExit={handleManualExit}
          audio={audioManager}
        />
      )}

      {gameState === GameState.GAME_OVER && (
        <GameOverScreen 
          score={lastScore} 
          highScore={highScore} 
          onRestart={startGame}
          onMenu={() => setGameState(GameState.MENU)}
        />
      )}
    </div>
  );
}
