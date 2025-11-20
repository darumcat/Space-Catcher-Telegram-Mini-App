
import React from 'react';
import { TelegramUser } from '../types';

interface WelcomeScreenProps {
  user: TelegramUser | null;
  isAdmin: boolean;
  highScore: number;
  onStart: () => void;
  onProfile: () => void;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ 
  user, 
  isAdmin, 
  highScore, 
  onStart,
  onProfile
}) => {
  return (
    <div className="flex flex-col items-center justify-center h-full w-full p-6 space-y-8 bg-gradient-to-b from-indigo-900 to-slate-900">
      <div className="text-center space-y-2 animate-pulse">
        <h1 className="text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400 tracking-tighter drop-shadow-2xl">
          SPACE<br/>CATCHER
        </h1>
        <p className="text-slate-400 text-xs tracking-widest uppercase">Telegram Arcade</p>
      </div>

      <div className="bg-slate-800/50 border border-slate-700 p-6 rounded-2xl w-full max-w-xs shadow-xl backdrop-blur-sm relative overflow-hidden">
        {/* Decoration */}
        <div className="absolute -top-10 -right-10 w-20 h-20 bg-purple-500/20 rounded-full blur-xl"></div>
        
        <div className="text-center mb-6">
          {user ? (
            <>
              <p className="text-lg font-medium text-indigo-200">Привет, {user.first_name}!</p>
              {isAdmin && (
                <span className="inline-block mt-1 px-2 py-0.5 rounded text-xs font-bold bg-yellow-500/20 text-yellow-300 border border-yellow-500/50">
                  GOD MODE
                </span>
              )}
            </>
          ) : (
            <p className="text-slate-400">Добро пожаловать!</p>
          )}
        </div>

        <div className="space-y-3">
          <button
            onClick={onStart}
            className="w-full py-4 px-6 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 active:scale-95 transition-all transform rounded-xl font-bold text-xl shadow-lg shadow-indigo-500/40 text-white flex items-center justify-center gap-2"
          >
            <span>🚀</span> ИГРАТЬ
          </button>

          <button
            onClick={onProfile}
            className="w-full py-3 px-6 bg-slate-700/50 hover:bg-slate-700 active:scale-95 transition-all rounded-xl font-semibold text-indigo-200 border border-slate-600 flex items-center justify-center gap-2"
          >
            <span>🏆</span> ПРОФИЛЬ
          </button>
        </div>

        <div className="mt-6 flex justify-between items-center border-t border-slate-700 pt-4">
           <span className="text-xs text-slate-500">Рекорд:</span>
           <span className="font-mono text-green-400 font-bold text-lg">{highScore}</span>
        </div>
      </div>
    </div>
  );
};
