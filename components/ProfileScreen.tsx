
import React, { useState } from 'react';
import { TelegramUser, Ship } from '../types';
import { ACHIEVEMENTS, SHIPS, SHARE_UNLOCK_ID, BOT_USERNAME, SHIP_DESIGNS } from '../constants';

interface ProfileScreenProps {
  user: TelegramUser | null;
  highScore: number;
  unlockedAchievements: string[];
  sharesCount: number;
  selectedShipId: string;
  onSelectShip: (id: string) => void;
  onBack: () => void;
  onShare: (text: string) => void;
}

type Tab = 'stats' | 'hangar' | 'rules';

export const ProfileScreen: React.FC<ProfileScreenProps> = ({
  user,
  highScore,
  unlockedAchievements,
  sharesCount,
  selectedShipId,
  onSelectShip,
  onBack,
  onShare
}) => {
  const [activeTab, setActiveTab] = useState<Tab>('stats');
  const [showShareModal, setShowShareModal] = useState(false);
  const [copyFeedback, setCopyFeedback] = useState(false);

  const totalAchievements = ACHIEVEMENTS.length;
  const unlockedCount = unlockedAchievements.length;
  const progress = (unlockedCount / totalAchievements) * 100;
  
  const botLink = `https://t.me/${BOT_USERNAME}`;

  const isShipUnlocked = (ship: Ship) => {
      if (ship.id === 'default') return true;
      if (ship.requiredAchievementId === SHARE_UNLOCK_ID) {
          return sharesCount >= 3;
      }
      return ship.requiredAchievementId ? unlockedAchievements.includes(ship.requiredAchievementId) : true;
  };

  const handleCopyLink = () => {
      navigator.clipboard.writeText(botLink);
      setCopyFeedback(true);
      setTimeout(() => setCopyFeedback(false), 2000);
  };

  const handleShareProfile = () => {
      const text = `Я бросил тебе вызов на ${highScore} очков в Space Catcher! Принимаешь? https://t.me/${BOT_USERNAME}`;
      onShare(text);
  };

  const renderShipIcon = (ship: Ship) => {
      const design = SHIP_DESIGNS[ship.shape];
      return (
          <svg viewBox="0 0 100 100" className="w-16 h-16 drop-shadow-lg" style={{color: ship.color}}>
             <defs>
                <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="2" result="blur"/>
                    <feComposite in="SourceGraphic" in2="blur" operator="over"/>
                </filter>
             </defs>
             {/* Engine Glow */}
             <ellipse cx="50" cy="85" rx="10" ry="20" fill={design.engineColor} opacity="0.6" filter="url(#glow)" />
             
             {/* Body */}
             <path fill="currentColor" d={design.body} stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
             
             {/* Details */}
             <path fill="none" stroke="rgba(0,0,0,0.3)" strokeWidth="2" d={design.details} />
             
             {/* Cockpit */}
             <path fill="rgba(200, 240, 255, 0.8)" d={design.cockpit} />
          </svg>
      );
  };

  return (
    <div className="flex flex-col h-full w-full bg-slate-900 overflow-hidden animate-fade-in relative">
      {/* Header */}
      <div className="bg-indigo-950 pt-6 pb-2 px-6 shadow-xl border-b border-indigo-800/50 shrink-0">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-white">Профиль</h2>
          <button onClick={onBack} className="text-sm bg-slate-800 px-3 py-1 rounded-lg hover:bg-slate-700">✕</button>
        </div>
        
        <div className="flex items-center gap-4 mb-4">
            <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center text-2xl font-bold shadow-lg shrink-0">
              {user?.first_name?.charAt(0) || 'U'}
            </div>
            <div className="flex-1 min-w-0">
                <h3 className="text-lg font-bold text-white leading-none mb-1 truncate">{user ? `${user.first_name}` : 'Гость'}</h3>
                <div className="text-indigo-300 text-xs font-mono">
                    ID: {user?.id || 'Unknown'}
                </div>
            </div>
            
            {/* Share Button Header */}
            <button 
              onClick={() => setShowShareModal(true)}
              className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl shadow-lg active:scale-95 transition-all flex items-center gap-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" x2="15.42" y1="13.51" y2="17.49"/><line x1="15.41" x2="8.59" y1="6.51" y2="10.49"/></svg>
            </button>
        </div>

        {/* Tabs */}
        <div className="flex space-x-2 mt-2">
            {(['stats', 'hangar', 'rules'] as Tab[]).map(tab => (
                <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-colors ${
                        activeTab === tab 
                        ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/30' 
                        : 'bg-indigo-900/30 text-indigo-300 hover:bg-indigo-900/50'
                    }`}
                >
                    {tab === 'stats' ? 'Ачивки' : tab === 'hangar' ? 'Ангар' : 'Правила'}
                </button>
            ))}
        </div>
      </div>

      {/* SCROLLABLE CONTENT */}
      <div className="flex-1 overflow-y-auto pb-6">
        {activeTab === 'stats' && (
            <div className="space-y-6 p-6">
                <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700">
                    <div className="flex justify-between text-sm text-slate-400 mb-2 font-medium">
                        <span>Прогресс</span>
                        <span className="text-white">{unlockedCount} / {totalAchievements}</span>
                    </div>
                    <div className="w-full bg-slate-700 rounded-full h-3 overflow-hidden">
                        <div className="bg-gradient-to-r from-green-400 to-emerald-600 h-full rounded-full" style={{ width: `${progress}%` }}></div>
                    </div>
                </div>
                
                <div className="space-y-3">
                    {ACHIEVEMENTS.map(ach => {
                        const isUnlocked = unlockedAchievements.includes(ach.id);
                        return (
                            <div key={ach.id} className={`p-3 rounded-xl border flex items-center gap-3 ${isUnlocked ? 'bg-slate-800 border-yellow-500/30' : 'bg-slate-900 border-slate-800 opacity-60'}`}>
                                <div className="text-2xl">{ach.icon}</div>
                                <div className="flex-1">
                                    <h4 className={`text-sm font-bold ${isUnlocked ? 'text-white' : 'text-slate-500'}`}>{ach.title}</h4>
                                    <p className="text-xs text-slate-500">{ach.description}</p>
                                </div>
                                {isUnlocked && <span className="text-green-400 text-xs">✓</span>}
                            </div>
                        );
                    })}
                </div>
            </div>
        )}

        {activeTab === 'hangar' && (
            <div className="p-6 grid grid-cols-2 gap-4">
                {SHIPS.map(ship => {
                    const unlocked = isShipUnlocked(ship);
                    const selected = selectedShipId === ship.id;

                    return (
                        <div key={ship.id} className={`relative p-4 rounded-2xl border-2 flex flex-col items-center gap-3 transition-all ${
                            selected 
                            ? 'bg-indigo-900/40 border-green-400 shadow-[0_0_15px_rgba(74,222,128,0.2)]' 
                            : unlocked 
                                ? 'bg-slate-800 border-slate-600 hover:border-slate-500' 
                                : 'bg-slate-900 border-slate-800 opacity-70'
                        }`}>
                            <div className={`transform transition-transform ${selected ? 'scale-110' : ''}`}>
                                {renderShipIcon(ship)}
                            </div>
                            
                            <div className="text-center">
                                <h4 className="font-bold text-sm text-white">{ship.name}</h4>
                                {!unlocked && (
                                    <p className="text-[10px] text-red-400 mt-1 leading-tight">
                                        {ship.requiredAchievementId === SHARE_UNLOCK_ID 
                                            ? `Поделись еще ${Math.max(0, 3 - sharesCount)} раз`
                                            : `Требует: ${ship.description}`
                                        }
                                    </p>
                                )}
                            </div>

                            {unlocked ? (
                                <button
                                    onClick={() => onSelectShip(ship.id)}
                                    disabled={selected}
                                    className={`w-full py-2 rounded-lg text-xs font-bold ${
                                        selected 
                                        ? 'bg-green-500 text-white' 
                                        : 'bg-indigo-600 hover:bg-indigo-500 text-white'
                                    }`}
                                >
                                    {selected ? 'ВЫБРАН' : 'ВЫБРАТЬ'}
                                </button>
                            ) : (
                                <div className="absolute top-2 right-2 text-slate-600">🔒</div>
                            )}
                        </div>
                    );
                })}
            </div>
        )}

        {activeTab === 'rules' && (
            <div className="p-6 space-y-8 text-slate-300 text-sm">
                <section>
                    <h3 className="text-lg font-bold text-white mb-3 border-b border-slate-700 pb-2">🎮 Управление</h3>
                    <p>Водите пальцем влево и вправо, чтобы управлять кораблем. Ваша задача — ловить синие сферы и бонусы, избегая метеоритов.</p>
                </section>

                <section>
                    <h3 className="text-lg font-bold text-white mb-3 border-b border-slate-700 pb-2">⚡ Суперспособности</h3>
                    <p className="mb-2">Некоторые корабли обладают уникальными навыками. Активируются кнопкой на экране (внизу слева).</p>
                    <ul className="space-y-1 list-disc list-inside text-slate-400 text-xs mb-4">
                        <li><span className="text-white font-bold">Перезарядка:</span> 30 секунд.</li>
                        <li><span className="text-white font-bold">Длительность:</span> 5 секунд.</li>
                        <li><span className="text-white font-bold">Исключение:</span> Сердце (1 раз за игру).</li>
                    </ul>
                    <div className="grid grid-cols-1 gap-3">
                        <div className="bg-slate-800/40 p-3 rounded-lg border border-slate-700/50">
                            <div className="text-pink-400 font-bold mb-1">🧲 Магнит (Инфлюенсер)</div>
                            <div className="text-xs text-slate-400">Притягивает все бонусы к кораблю.</div>
                        </div>
                        <div className="bg-slate-800/40 p-3 rounded-lg border border-slate-700/50">
                            <div className="text-orange-400 font-bold mb-1">⚡ Ускорение (Молния)</div>
                            <div className="text-xs text-slate-400">Увеличивает скорость перемещения в 2 раза.</div>
                        </div>
                         <div className="bg-slate-800/40 p-3 rounded-lg border border-slate-700/50">
                            <div className="text-yellow-400 font-bold mb-1">👥 Клоны (Мастер)</div>
                            <div className="text-xs text-slate-400">Создаёт 2 фантома, которые собирают бонусы и уничтожают метеориты.</div>
                        </div>
                        <div className="bg-slate-800/40 p-3 rounded-lg border border-slate-700/50">
                            <div className="text-red-400 font-bold mb-1">🔫 Выстрел (Ветеран, Командор)</div>
                            <div className="text-xs text-slate-400">Корабль стреляет вперед, уничтожая метеориты.</div>
                        </div>
                         <div className="bg-slate-800/40 p-3 rounded-lg border border-slate-700/50">
                            <div className="text-indigo-400 font-bold mb-1">⏳ Замедление (Хронос)</div>
                            <div className="text-xs text-slate-400">Замедляет время на 50%.</div>
                        </div>
                        <div className="bg-slate-800/40 p-3 rounded-lg border border-slate-700/50">
                            <div className="text-slate-300 font-bold mb-1">👻 Призрак (Призрак)</div>
                            <div className="text-xs text-slate-400">Корабль становится полупрозрачным и проходит сквозь метеориты без урона.</div>
                        </div>
                        <div className="bg-slate-800/40 p-3 rounded-lg border border-slate-700/50">
                            <div className="text-purple-400 font-bold mb-1">💥 Взрыв (Легенда, Звезда)</div>
                            <div className="text-xs text-slate-400">Мощная волна уничтожает все метеориты на экране.</div>
                        </div>
                        <div className="bg-slate-800/40 p-3 rounded-lg border border-slate-700/50">
                            <div className="text-green-400 font-bold mb-1">❤️ Сердце (Эгида)</div>
                            <div className="text-xs text-slate-400">Добавляет 1 жизнь. Можно использовать только 1 раз за игру.</div>
                        </div>
                    </div>
                </section>

                <section>
                    <h3 className="text-lg font-bold text-white mb-3 border-b border-slate-700 pb-2">💎 Объекты</h3>
                    <div className="space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="w-6 h-6 rounded-full bg-blue-500 border-2 border-white"></div>
                            <div><span className="text-blue-400 font-bold">Сфера</span>: +1 очко. Основной ресурс.</div>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="w-6 h-6 bg-[#3e2723] border border-red-500/50 rounded-sm"></div>
                            <div><span className="text-red-400 font-bold">Метеорит</span>: -1 жизнь. Прерывает комбо.</div>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="w-6 h-6 bg-yellow-400 transform rotate-45"></div>
                            <div><span className="text-yellow-400 font-bold">Золото</span>: +10 очков. Редкая награда.</div>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="w-6 h-6 bg-yellow-300 rounded-full border-2 border-yellow-500"></div>
                            <div><span className="text-yellow-200 font-bold">Умножитель</span>: x2 очки на 5 секунд.</div>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="w-6 h-6 bg-purple-500 rounded-lg border border-purple-300"></div>
                            <div><span className="text-purple-400 font-bold">Щит</span>: Неуязвимость на 7 секунд.</div>
                        </div>
                    </div>
                </section>
            </div>
        )}
      </div>

      {/* SHARE MODAL */}
      {showShareModal && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm animate-fade-in p-6">
              <div className="bg-slate-800 border border-slate-700 w-full max-w-sm rounded-2xl shadow-2xl p-6 relative">
                  {/* Close Button */}
                  <button 
                      onClick={() => setShowShareModal(false)} 
                      className="absolute top-4 right-4 text-slate-400 hover:text-white bg-slate-700/50 p-1 rounded-full"
                  >
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" x2="6" y1="6" y2="18"/><line x1="6" x2="18" y1="6" y2="18"/></svg>
                  </button>

                  <h3 className="text-xl font-bold text-white mb-6 pr-8">Пригласить друзей</h3>

                  <p className="text-slate-300 text-sm mb-8 leading-relaxed bg-slate-900/50 p-3 rounded-lg border border-slate-700">
                      Я бросил тебе вызов на <span className="text-yellow-400 font-bold">{highScore}</span> очков в Space Catcher! Принимаешь? <br/>
                      <span className="text-[10px] text-slate-500 mt-2 block">Необходимо активировать кнопку "Поделиться" 3 раза для получения скина.</span>
                  </p>

                  <div className="flex gap-4">
                      {/* COPY BUTTON */}
                      <button 
                        onClick={handleCopyLink}
                        className={`flex-1 py-4 rounded-xl font-bold flex flex-col items-center justify-center gap-2 transition-all active:scale-95 border border-slate-600 ${copyFeedback ? 'bg-green-600 text-white' : 'bg-slate-700 hover:bg-slate-600 text-white'}`}
                      >
                          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-copy-icon lucide-copy"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
                          <span className="text-xs">{copyFeedback ? 'СКОПИРОВАНО' : 'КОПИРОВАТЬ'}</span>
                      </button>

                      {/* SHARE BUTTON */}
                      <button 
                        onClick={handleShareProfile}
                        className="flex-1 bg-blue-600 hover:bg-blue-500 text-white py-4 rounded-xl font-bold flex flex-col items-center justify-center gap-2 transition-all active:scale-95 shadow-lg shadow-blue-900/30"
                      >
                          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-share2-icon lucide-share-2"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" x2="15.42" y1="13.51" y2="17.49"/><line x1="15.41" x2="8.59" y1="6.51" y2="10.49"/></svg>
                          <span className="text-xs">ПОДЕЛИТЬСЯ</span>
                      </button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};
