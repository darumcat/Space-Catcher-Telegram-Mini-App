
import React from 'react';

interface GameOverScreenProps {
  score: number;
  highScore: number;
  onRestart: () => void;
  onMenu: () => void;
  onShare: (text: string) => void;
}

export const GameOverScreen: React.FC<GameOverScreenProps> = ({
  score,
  highScore,
  onRestart,
  onMenu,
  onShare
}) => {
  const isNewRecord = score >= highScore && score > 0;

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/85 backdrop-blur-md p-6 animate-fade-in z-40">
      <div className="text-center space-y-6 bg-slate-900 border border-slate-700 p-8 rounded-3xl shadow-2xl max-w-sm w-full relative overflow-hidden">
        {/* Background Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-20 bg-red-500/10 blur-xl pointer-events-none"></div>

        <h2 className="text-3xl font-black text-red-500 uppercase tracking-widest drop-shadow-md">
          ПОТРАЧЕНО
        </h2>

        <div className="py-2">
          <p className="text-slate-400 text-xs uppercase tracking-widest mb-1">Ваш счёт</p>
          <p className="text-7xl font-black text-white tracking-tighter">{score}</p>
          
          {isNewRecord && (
            <div className="inline-block bg-yellow-500/20 border border-yellow-500 text-yellow-300 text-[10px] font-bold px-3 py-1 rounded-full mt-2 animate-pulse">
              НОВЫЙ РЕКОРД!
            </div>
          )}
           {!isNewRecord && (
           <p className="text-slate-600 text-xs mt-2 font-mono">Лучший: {highScore}</p>
        )}
        </div>

        {/* Share Buttons Removed as per request */}

        <div className="space-y-3 pt-2 border-t border-slate-800 mt-4">
          <button
            onClick={onRestart}
            className="w-full py-4 px-6 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 active:scale-95 rounded-xl font-bold text-lg text-white shadow-lg shadow-green-900/50 transition-all"
          >
            ИГРАТЬ СНОВА
          </button>
          
          <button
            onClick={onMenu}
            className="w-full py-3 px-6 bg-transparent border border-slate-600 hover:bg-slate-800 text-slate-400 active:scale-95 rounded-xl font-medium transition-all"
          >
            В главное меню
          </button>
        </div>
      </div>
    </div>
  );
};
