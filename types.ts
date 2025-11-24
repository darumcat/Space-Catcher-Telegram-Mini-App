
// Типы для Telegram Web App API

export interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
  is_premium?: boolean;
}

export interface TelegramWebAppInitData {
  user?: TelegramUser;
  [key: string]: any;
}

export interface TelegramWebAppObject {
  initData: string;
  initDataUnsafe: TelegramWebAppInitData;
  version: string;
  platform: string;
  colorScheme: 'light' | 'dark';
  themeParams: any;
  isExpanded: boolean;
  viewportHeight: number;
  viewportStableHeight: number;
  headerColor: string;
  backgroundColor: string;
  isClosingConfirmationEnabled: boolean;
  BackButton: {
    isVisible: boolean;
    onClick: (callback: () => void) => void;
    offClick: (callback: () => void) => void;
    show: () => void;
    hide: () => void;
  };
  MainButton: {
    text: string;
    color: string;
    textColor: string;
    isVisible: boolean;
    isActive: boolean;
    show: () => void;
    hide: () => void;
    enable: () => void;
    disable: () => void;
    onClick: (callback: () => void) => void;
    offClick: (callback: () => void) => void;
  };
  HapticFeedback: {
    impactOccurred: (style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft') => void;
    notificationOccurred: (type: 'error' | 'success' | 'warning') => void;
  };
  openTelegramLink: (url: string) => void;
  ready: () => void;
  expand: () => void;
  close: () => void;
  sendData: (data: string) => void;
}

declare global {
  interface Window {
    Telegram?: {
      WebApp: TelegramWebAppObject;
    };
  }
}

export enum GameState {
  MENU = 'MENU',
  PLAYING = 'PLAYING',
  GAME_OVER = 'GAME_OVER',
  PROFILE = 'PROFILE'
}

// Updated item types based on user request
export type ItemType = 'blue' | 'red' | 'gold' | 'yellow' | 'purple';

// Данные для проверки ачивок
export interface GameStats {
  score: number;
  itemsCollected: number;
  consecutiveSafe: number; // Бывший consecutiveGreen
  timePlayed: number; // в секундах
  hitRed: boolean; // был ли удар об красный
  streakDays: number; // сколько дней подряд (внешний параметр)
  bonusesCollected: ItemType[]; // какие типы собраны
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: 'basic' | 'combo' | 'special' | 'seasonal';
  // Возвращает true, если ачивка выполнена
  condition: (stats: GameStats) => boolean;
}

// --- Новые типы для Кораблей ---

export type ShipShape = 'default' | 'fighter' | 'tank' | 'ufo' | 'needle' | 'shuriken' | 'stealth' | 'ghost' | 'aegis';

export type ShipAbility = 
  | 'none' 
  | 'shoot'      // Стреляет вперед (3 сек)
  | 'magnet'     // Притягивает бонусы (3 сек)
  | 'slow'       // Замедляет время (3 сек)
  | 'clones'     // 2 клона (3 сек)
  | 'shockwave'  // Взрывная волна (раз в 5 мин)
  | 'speed'      // Ускорение x2 (3 сек)
  | 'heart'      // +1 Жизнь (раз в игру)
  | 'phase';     // Проходит сквозь красные (3 сек)

export interface Ship {
  id: string;
  name: string;
  color: string;
  shape: ShipShape;
  ability: ShipAbility;
  // Если requiredAchievementId === 'SHARE_3', то проверяем sharesCount
  requiredAchievementId: string | null; 
  description: string; // Как открыть
}