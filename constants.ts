
import { Achievement, ItemType } from './types';

export const ADMIN_ID = 441555440;

// Настройки игры
export const GAME_CONFIG = {
  PLAYER_SPEED: 7,
  SPAWN_RATE: 15, // Еще чаще, так как очков мало
  GRAVITY: 4.0, 
  PLAYER_SIZE: 40,
  OBJECT_SIZE: 30,
  LIVES_START: 3,
  SPEED_INCREMENT: 0.2,
  
  // Бонусы
  BONUS_DURATION_X2: 5000, // 5 сек (по запросу)
  BONUS_DURATION_SHIELD: 7000, // 7 сек
  
  // Интервалы появления (мс)
  SPAWN_GOLD: 45000, 
  SPAWN_YELLOW: 30000, 
  SPAWN_PURPLE: 60000,
  CHANCE_RED: 0.25, // 25% врагов
};

export const HIGH_SCORE_KEY = 'sc_highscore_v3'; 
export const ACHIEVEMENTS_KEY = 'sc_achievements_v3'; 
export const STREAK_KEY = 'sc_streak_data_v3';

// Цвета объектов
export const ITEM_COLORS: Record<ItemType, string> = {
  blue: '#3b82f6',   // Обычный (+1)
  red: '#ef4444',    // Враг
  gold: '#fbbf24',   // +10
  yellow: '#facc15', // x2 очков
  purple: '#a855f7', // Щит
};

export const PLATINUM_ID = 'platinum_completionist';

export const ACHIEVEMENTS: Achievement[] = [
  // --- Базовые ---
  {
    id: 'score_50',
    title: 'Новичок',
    description: 'Набрать 50 очков',
    icon: '🐣',
    category: 'basic',
    condition: (s) => s.score >= 50,
  },
  {
    id: 'score_200',
    title: 'Опытный',
    description: 'Набрать 200 очков',
    icon: '🎓',
    category: 'basic',
    condition: (s) => s.score >= 200,
  },
  {
    id: 'score_500',
    title: 'Ловец',
    description: 'Набрать 500 очков',
    icon: '🎯',
    category: 'basic',
    condition: (s) => s.score >= 500,
  },
  {
    id: 'score_1000',
    title: 'Мастер',
    description: 'Набрать 1000 очков',
    icon: '👑',
    category: 'basic',
    condition: (s) => s.score >= 1000,
  },
  {
    id: 'score_2000',
    title: 'Легенда',
    description: 'Набрать 2000 очков',
    icon: '🏆',
    category: 'basic',
    condition: (s) => s.score >= 2000,
  },

  // --- Комбо (Исправлена логика серий) ---
  {
    id: 'safe_streak_50',
    title: 'Безопасная серия',
    description: 'Собрать 50 шаров подряд без урона',
    icon: '🛡️',
    category: 'combo',
    // Убрали !s.hitRed, теперь зависит только от текущей серии
    condition: (s) => s.consecutiveSafe >= 50,
  },
  {
    id: 'super_safe_streak_500',
    title: 'Супер серия',
    description: 'Собрать 500 шаров подряд без урона',
    icon: '💎',
    category: 'combo',
    condition: (s) => s.consecutiveSafe >= 500,
  },
  {
    id: 'ninja_200',
    title: 'Ниндзя',
    description: '200 очков за игру, ни разу не ударившись',
    icon: '🥷',
    category: 'combo',
    condition: (s) => s.score >= 200 && !s.hitRed,
  },
  {
    id: 'invincible_500',
    title: 'Неуязвимый',
    description: '500 очков за игру, ни разу не ударившись',
    icon: '🔥',
    category: 'combo',
    condition: (s) => s.score >= 500 && !s.hitRed,
  },

  // --- Специальные ---
  {
    id: 'iron_nerves_10',
    title: 'Железные нервы',
    description: 'Продержаться 10 минут',
    icon: '⌛',
    category: 'special',
    condition: (s) => s.timePlayed >= 600,
  },
  {
    id: 'speed_run_50',
    title: 'Скоростной',
    description: '50 очков за 20 секунд',
    icon: '⚡',
    category: 'special',
    condition: (s) => s.score >= 50 && s.timePlayed <= 20,
  },
  {
    id: 'collector_v2',
    title: 'Коллекционер',
    description: 'Собрать Золотой, Желтый и Фиолетовый бонусы',
    icon: '📦',
    category: 'special',
    condition: (s) => {
        const required: ItemType[] = ['gold', 'yellow', 'purple'];
        return required.every(type => s.bonusesCollected.includes(type));
    },
  },

  // --- Сезонные ---
  {
    id: 'streak_3',
    title: 'Разминка',
    description: '3 дня подряд заходить в игру',
    icon: '🥉',
    category: 'seasonal',
    condition: (s) => s.streakDays >= 3,
  },
  {
    id: 'streak_7',
    title: 'Недельный марафон',
    description: '7 дней подряд заходить в игру',
    icon: '🥈',
    category: 'seasonal',
    condition: (s) => s.streakDays >= 7,
  },
  {
    id: 'streak_30',
    title: 'Месячный марафон',
    description: '30 дней подряд заходить в игру',
    icon: '🥇',
    category: 'seasonal',
    condition: (s) => s.streakDays >= 30,
  },

  // --- PLATINUM ---
  {
    id: PLATINUM_ID,
    title: 'ПЛАТИНА',
    description: 'Открыть абсолютно все достижения',
    icon: '💠',
    category: 'special',
    condition: () => false, // Логика обрабатывается отдельно в App.tsx
  },
];
