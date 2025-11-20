
import React, { useEffect, useState } from 'react';
import { ACHIEVEMENTS } from '../constants';

interface AchievementToastProps {
  id: string | null;
  onClose: () => void;
}

export const AchievementToast: React.FC<AchievementToastProps> = ({ id, onClose }) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (id) {
      setVisible(true);
      const timer = setTimeout(() => {
        setVisible(false);
        setTimeout(onClose, 300); // Wait for animation
      }, 5000); // Increased to 5 seconds
      return () => clearTimeout(timer);
    }
  }, [id, onClose]);

  if (!id) return null;

  const achievement = ACHIEVEMENTS.find(a => a.id === id);
  if (!achievement) return null;

  return (
    <div className={`fixed top-16 left-1/2 transform -translate-x-1/2 z-50 transition-all duration-300 ${
      visible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'
    }`}>
      <div className="bg-slate-800/95 border border-yellow-500/50 rounded-xl shadow-2xl p-3 flex items-center gap-3 backdrop-blur min-w-[250px]">
        <div className="bg-yellow-500/20 p-2 rounded-lg text-2xl">
          {achievement.icon}
        </div>
        <div>
          <p className="text-yellow-400 text-xs font-bold uppercase tracking-wider">Достижение!</p>
          <p className="text-white font-bold text-sm">{achievement.title}</p>
        </div>
      </div>
    </div>
  );
};
