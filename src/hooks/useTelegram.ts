import { useEffect, useState } from 'react';
import { TelegramUser } from '../types';

export const useTelegram = () => {
  const [user, setUser] = useState<TelegramUser | null>(null);
  const [isTelegram, setIsTelegram] = useState(false);

  useEffect(() => {
    const tg = window.Telegram?.WebApp;
    
    if (tg) {
      setIsTelegram(true);
      
      // Инициализация Telegram Web App
      tg.ready();
      tg.expand(); // Раскрыть на весь экран
      
      // Настройка цветов под твою тему
      tg.setHeaderColor('#1e1b4b');
      tg.setBackgroundColor('#0f172a');
      
      // Получаем данные пользователя
      const tgUser = tg.initDataUnsafe?.user;
      if (tgUser) {
        setUser({
          id: tgUser.id,
          first_name: tgUser.first_name,
          last_name: tgUser.last_name,
          username: tgUser.username,
          language_code: tgUser.language_code
        });
      }
    }
  }, []);

  const closeApp = () => {
    window.Telegram?.WebApp?.close();
  };

  const sendData = (data: any) => {
    window.Telegram?.WebApp?.sendData(JSON.stringify(data));
  };

  const showAlert = (message: string) => {
    window.Telegram?.WebApp?.showAlert(message);
  };

  const vibrate = (type: 'light' | 'medium' | 'heavy' = 'medium') => {
    window.Telegram?.WebApp?.HapticFeedback.impactOccurred(type);
  };

  return {
    user,
    isTelegram,
    closeApp,
    sendData,
    showAlert,
    vibrate
  };
};