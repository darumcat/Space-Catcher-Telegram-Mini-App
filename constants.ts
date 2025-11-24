
import { Achievement, ItemType, Ship, ShipShape } from './types';

export const ADMIN_ID = 441555440;
export const BOT_USERNAME = 'Space_CatcherBot'; 

// Настройки игры
export const GAME_CONFIG = {
  PLAYER_SPEED: 7,
  SPAWN_RATE: 45, 
  GRAVITY: 1.0, 
  PLAYER_SIZE: 40,
  OBJECT_SIZE: 30,
  LIVES_START: 3,
  SPEED_INCREMENT: 0.2,
  
  // Бонусы
  BONUS_DURATION_X2: 5000, 
  BONUS_DURATION_SHIELD: 7000, 
  
  // Интервалы появления (мс)
  SPAWN_GOLD: 45000, 
  SPAWN_YELLOW: 30000, 
  SPAWN_PURPLE: 60000,
  CHANCE_RED: 0.25, 

  // Суперспособности
  ABILITY_COOLDOWN: 30000, // 30 секунд
  ABILITY_DURATION: 5000, // 5 секунд
};

export const HIGH_SCORE_KEY = 'sc_highscore_v3'; 
export const ACHIEVEMENTS_KEY = 'sc_achievements_v3'; 
export const STREAK_KEY = 'sc_streak_data_v3';
export const SHARES_KEY = 'sc_shares_count_v1';
export const SELECTED_SHIP_KEY = 'sc_selected_ship_v1';

// Цвета объектов
export const ITEM_COLORS: Record<ItemType, string> = {
  blue: '#3b82f6',   
  red: '#3e2723', // Dark Meteorite Brown  
  gold: '#fbbf24',   
  yellow: '#facc15', 
  purple: '#a855f7', 
};

export const PLATINUM_ID = 'platinum_completionist';
export const SHARE_UNLOCK_ID = 'SHARE_3';

// --- COMPLEX SHIP DESIGNS (SVG PATH DATA) ---
// Viewbox 0 0 100 100
export const SHIP_DESIGNS: Record<ShipShape, { body: string; details: string; cockpit: string; engineColor: string }> = {
  'default': {
    // Classic Rocket
    body: 'M50 10 L85 85 L50 75 L15 85 Z',
    details: 'M50 10 L50 75 M15 85 L25 65 M85 85 L75 65',
    cockpit: 'M50 40 L55 55 L45 55 Z',
    engineColor: '#38bdf8'
  },
  'fighter': {
    // X-Wing style aggressor
    body: 'M50 5 L60 25 L95 40 L95 80 L60 60 L50 85 L40 60 L5 80 L5 40 L40 25 Z',
    details: 'M50 5 L50 85 M5 40 L40 25 M95 40 L60 25',
    cockpit: 'M45 35 L55 35 L55 50 L45 50 Z',
    engineColor: '#f97316'
  },
  'tank': {
    // Heavy Freighter
    body: 'M30 10 L70 10 L90 30 L90 80 L70 95 L30 95 L10 80 L10 30 Z',
    details: 'M30 10 L30 95 M70 10 L70 95 M10 50 L90 50',
    cockpit: 'M40 20 L60 20 L60 35 L40 35 Z',
    engineColor: '#34d399'
  },
  'ufo': {
    // Saucer
    body: 'M10 50 C10 30 90 30 90 50 C90 70 10 70 10 50 Z M20 50 L80 50',
    details: 'M30 55 L35 65 M45 55 L50 65 M65 55 L70 65',
    cockpit: 'M35 40 C35 25 65 25 65 40 Z',
    engineColor: '#a855f7'
  },
  'needle': {
    // Speed racer
    body: 'M48 2 L52 2 L55 85 L80 95 L50 90 L20 95 L45 85 Z',
    details: 'M50 2 L50 90 M45 60 L25 60 M55 60 L75 60',
    cockpit: 'M48 30 L52 30 L52 55 L48 55 Z',
    engineColor: '#0ea5e9'
  },
  'shuriken': {
    // Alien bio-ship
    body: 'M50 5 L65 35 L95 50 L65 65 L50 95 L35 65 L5 50 L35 35 Z',
    details: 'M50 5 L50 95 M5 50 L95 50',
    cockpit: 'M45 45 L55 45 L55 55 L45 55 Z',
    engineColor: '#ec4899'
  },
  'stealth': {
    // Sharp, angular stealth bomber (The Shadow)
    body: 'M50 5 L95 85 L50 70 L5 85 Z',
    details: 'M50 5 L50 70 M20 75 L35 50 M80 75 L65 50',
    cockpit: 'M50 30 L60 45 L40 45 Z',
    engineColor: '#64748b'
  },
  'ghost': {
    // Hollow/Ethereal shape (The Phantom)
    body: 'M50 5 L85 30 L85 80 L65 95 L50 80 L35 95 L15 80 L15 30 Z',
    details: 'M50 20 L50 60 M15 30 L50 50 L85 30',
    cockpit: 'M45 25 L55 25 L55 40 L45 40 Z',
    engineColor: '#e2e8f0'
  },
  'aegis': {
    // Shield-like, bulky fortress (Aegis)
    body: 'M20 20 L80 20 L95 40 L85 95 L50 85 L15 95 L5 40 Z',
    details: 'M20 20 L50 50 L80 20 M50 50 L50 85 M5 40 L95 40',
    cockpit: 'M40 10 L60 10 L60 25 L40 25 Z',
    engineColor: '#10b981'
  }
};

// --- КОРАБЛИ ---
export const SHIPS: Ship[] = [
  {
    id: 'default',
    name: 'Первопроходец',
    color: '#38bdf8',
    shape: 'default',
    ability: 'none',
    requiredAchievementId: null,
    description: 'Стандартный корабль',
  },
  {
    id: 'social_flyer',
    name: 'Инфлюенсер',
    color: '#ec4899', // Pink
    shape: 'ufo',
    ability: 'magnet',
    requiredAchievementId: SHARE_UNLOCK_ID,
    description: 'Поделиться игрой с 3 друзьями. Способность: Магнит',
  },
  {
    id: 'recruit_scout',
    name: 'Скаут',
    color: '#fdba74', // Orange-300
    shape: 'fighter',
    ability: 'none',
    requiredAchievementId: 'streak_3',
    description: 'Заходить 3 дня подряд',
  },
  {
    id: 'novice_wing',
    name: 'Курсант',
    color: '#4ade80', // Green
    shape: 'fighter',
    ability: 'none',
    requiredAchievementId: 'score_200',
    description: 'Набрать 200 очков',
  },
  {
    id: 'guardian_shield',
    name: 'Хранитель',
    color: '#6ee7b7', // Emerald-300
    shape: 'tank',
    ability: 'none',
    requiredAchievementId: 'safe_streak_50',
    description: '50 шаров без урона',
  },
  {
    id: 'speed_demon',
    name: 'Молния',
    color: '#f97316', // Orange
    shape: 'needle',
    ability: 'speed',
    requiredAchievementId: 'speed_run_50',
    description: '50 очков за 20 сек. Способность: Ускорение',
  },
  {
    id: 'master_striker',
    name: 'Мастер',
    color: '#facc15', // Yellow
    shape: 'fighter',
    ability: 'clones',
    requiredAchievementId: 'score_1000',
    description: 'Набрать 1000 очков. Способность: Клоны',
  },
  {
    id: 'treasure_seeker',
    name: 'Искатель',
    color: '#fbbf24', // Amber-400
    shape: 'ufo',
    ability: 'none',
    requiredAchievementId: 'collector_v2',
    description: 'Собрать все бонусы',
  },
  {
    id: 'ninja_shadow',
    name: 'Тень',
    color: '#94a3b8', // Slate/Grey
    shape: 'stealth',
    ability: 'none',
    requiredAchievementId: 'ninja_200',
    description: '200 очков без урона',
  },
  {
    id: 'veteran_pilot',
    name: 'Ветеран',
    color: '#db2777', // Pink-600
    shape: 'fighter',
    ability: 'shoot',
    requiredAchievementId: 'streak_7',
    description: '7 дней подряд. Способность: Выстрел',
  },
  {
    id: 'chronos_keeper',
    name: 'Хронос',
    color: '#a5b4fc', // Indigo-300
    shape: 'ufo',
    ability: 'slow',
    requiredAchievementId: 'iron_nerves_10',
    description: 'Продержаться 10 минут. Способность: Замедление',
  },
  {
    id: 'phantom_spectre',
    name: 'Призрак',
    color: '#cbd5e1', // Slate-300
    shape: 'ghost',
    ability: 'phase',
    requiredAchievementId: 'invincible_500',
    description: '1000 очков без урона. Способность: Призрачность',
  },
  {
    id: 'legend_destroyer',
    name: 'Легенда',
    color: '#6366f1', // Indigo
    shape: 'shuriken',
    ability: 'shockwave',
    requiredAchievementId: 'score_2000',
    description: 'Набрать 2000 очков. Способность: Взрыв',
  },
  {
    id: 'aegis_prime',
    name: 'Эгида',
    color: '#34d399', // Emerald-400
    shape: 'aegis',
    ability: 'heart',
    requiredAchievementId: 'super_safe_streak_500',
    description: '500 шаров без урона. Способность: +1 Сердце',
  },
  {
    id: 'commander_ace',
    name: 'Командор',
    color: '#0ea5e9', // Sky-500
    shape: 'needle',
    ability: 'shoot',
    requiredAchievementId: 'streak_30',
    description: '30 дней подряд. Способность: Выстрел',
  },
  {
    id: 'platinum_star',
    name: 'Звезда Галактики',
    color: '#ffffff', // White glowing
    shape: 'ufo',
    ability: 'shockwave',
    requiredAchievementId: PLATINUM_ID,
    description: 'ПЛАТИНА. Способность: Взрыв',
  }
];

export const ACHIEVEMENTS: Achievement[] = [
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
  {
    id: 'safe_streak_50',
    title: 'Безопасная серия',
    description: 'Собрать 50 шаров подряд без урона',
    icon: '🛡️',
    category: 'combo',
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
    description: '1000 очков за игру, ни разу не ударившись',
    icon: '🔥',
    category: 'combo',
    condition: (s) => s.score >= 1000 && !s.hitRed,
  },
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
  {
    id: PLATINUM_ID,
    title: 'ПЛАТИНА',
    description: 'Открыть абсолютно все достижения',
    icon: '💠',
    category: 'special',
    condition: () => false, 
  },
];
