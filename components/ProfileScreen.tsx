
import React from 'react';
import { TelegramUser } from '../types';
import { ACHIEVEMENTS, PLATINUM_ID } from '../constants';

interface ProfileScreenProps {
  user: TelegramUser | null;
  highScore: number;
  unlockedAchievements: string[];
  onBack: () => void;
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({
  user,
  highScore,
  unlockedAchievements,
  onBack
}) => {
  const totalAchievements = ACHIEVEMENTS.length;
  const unlockedCount = unlockedAchievements.length;
  const progress = (unlockedCount / totalAchievements) * 100;

  const categories = {
      basic: 'Базовые',
      combo: 'Комбо',
      special: 'Специальные',
      seasonal: 'Сезонные'
  };

  return (
    <div className="flex flex-col h-full w-full bg-slate-900 overflow-y-auto animate-fade-in pb-10">
      {/* Header */}
      <div className="bg-indigo-950 p-6 sticky top-0 z-20 shadow-xl border-b border-indigo-800/50">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-white">Профиль Игрока</h2>
          <button onClick={onBack} className="text-sm bg-slate-800 px-3 py-1 rounded-lg">✕</button>
        </div>
        
        <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center text-2xl font-bold shadow-lg">
              {user?.first_name?.charAt(0) || 'U'}
            </div>
            <div>
                <h3 className="text-lg font-bold text-white leading-none mb-1">{user ? `${user.first_name}` : 'Гость'}</h3>
                <div className="text-indigo-300 text-sm bg-indigo-900/50 px-2 py-0.5 rounded inline-block">
                    🏆 Рекорд: {highScore}
                </div>
            </div>
        </div>
      </div>

      {/* Progress */}
      <div className="px-6 py-6">
        <div className="flex justify-between text-sm text-slate-400 mb-2 font-medium">
          <span>Достижения</span>
          <span className="text-white">{unlockedCount} / {totalAchievements}</span>
        </div>
        <div className="w-full bg-slate-800 rounded-full h-4 overflow-hidden border border-slate-700">
          <div 
            className="bg-gradient-to-r from-green-400 to-emerald-600 h-full rounded-full shadow-[0_0_10px_rgba(52,211,153,0.5)] transition-all duration-1000" 
            style={{ width: `${progress}%` }}
          ></div>
        </div>
      </div>

      {/* Achievements List */}
      <div className="px-4 space-y-6">
        {(Object.keys(categories) as Array<keyof typeof categories>).map(cat => {
            const catAchievements = ACHIEVEMENTS.filter(a => a.category === cat);
            if (catAchievements.length === 0) return null;

            return (
                <div key={cat}>
                    <h4 className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-3 px-2">{categories[cat]}</h4>
                    <div className="space-y-2">
                        {catAchievements.map(ach => {
                            const isUnlocked = unlockedAchievements.includes(ach.id);
                            const isPlatinum = ach.id === PLATINUM_ID;

                            // Special Platinum Styles
                            const containerClass = isUnlocked 
                                ? isPlatinum
                                    ? 'bg-gradient-to-r from-slate-800 to-blue-900 border-cyan-400/50 shadow-[0_0_20px_rgba(34,211,238,0.3)] z-20 transform scale-[1.02]'
                                    : 'bg-gradient-to-r from-slate-800 to-slate-700 border-yellow-500/50 shadow-[0_0_15px_rgba(234,179,8,0.15)] z-10 transform scale-[1.01]' 
                                : 'bg-slate-900 border-slate-800 opacity-50 grayscale';

                            const iconBg = isUnlocked 
                                ? isPlatinum ? 'bg-cyan-900/50' : 'bg-slate-600/50' 
                                : 'bg-slate-800';

                            const textClass = isUnlocked 
                                ? isPlatinum ? 'text-cyan-200 drop-shadow-md' : 'text-yellow-100 drop-shadow-sm'
                                : 'text-slate-500';

                            const accentColor = isPlatinum 
                                ? 'bg-gradient-to-b from-cyan-300 to-blue-500'
                                : 'bg-gradient-to-b from-yellow-400 to-orange-500';

                            return (
                                <div 
                                  key={ach.id}
                                  className={`relative flex items-center p-3 rounded-xl border transition-all overflow-hidden ${containerClass}`}
                                >
                                  {isUnlocked && <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${accentColor}`}></div>}
                                  
                                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-xl mr-3 ${iconBg}`}>
                                    {ach.icon}
                                  </div>
                                  
                                  <div className="flex-1 min-w-0">
                                    <h5 className={`font-bold text-sm truncate ${textClass}`}>{ach.title}</h5>
                                    <p className="text-xs text-slate-500 truncate">{ach.description}</p>
                                  </div>

                                  {isUnlocked && (
                                    <div className={isPlatinum ? 'text-cyan-400 animate-pulse' : 'text-yellow-500'}>
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                        </svg>
                                    </div>
                                  )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            );
        })}
      </div>
    </div>
  );
};
