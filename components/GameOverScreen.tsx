import React from 'react';

interface GameOverScreenProps {
  score: number;
  highScore: number;
  onRestart: () => void;
  onMenu: () => void;
}

export const GameOverScreen: React.FC<GameOverScreenProps> = ({
  score,
  highScore,
  onRestart,
  onMenu
}) => {
  const isNewRecord = score >= highScore && score > 0;

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 backdrop-blur-md p-6 animate-fade-in">
      <div className="text-center space-y-6 bg-slate-800 border border-slate-700 p-8 rounded-3xl shadow-2xl max-w-sm w-full">
        
        <h2 className="text-3xl font-bold text-red-400 uppercase tracking-wider">
          Игра Окончена
        </h2>

        <div className="space-y-2 py-4">
          <p className="text-slate-400 text-sm uppercase tracking-widest">Ваш счёт</p>
          <p className="text-6xl font-black text-white">{score}</p>
          
          {isNewRecord && (
            <div className="inline-block bg-yellow-500/20 border border-yellow-500 text-yellow-300 text-xs font-bold px-3 py-1 rounded-full mt-2 animate-pulse">
              НОВЫЙ РЕКОРД!
            </div>
          )}
        </div>

        {!isNewRecord && (
           <p className="text-slate-500 text-sm">Лучший: {highScore}</p>
        )}

        <div className="space-y-3 pt-4">
          <button
            onClick={onRestart}
            className="w-full py-3.5 px-6 bg-green-600 hover:bg-green-500 active:scale-95 rounded-xl font-bold text-lg text-white shadow-lg shadow-green-900/50 transition-all"
          >
            ИГРАТЬ СНОВА
          </button>
          
          <button
            onClick={onMenu}
            className="w-full py-3 px-6 bg-transparent border border-slate-600 hover:bg-slate-700 text-slate-300 active:scale-95 rounded-xl font-medium transition-all"
          >
            Меню
          </button>
        </div>
      </div>
    </div>
  );
};