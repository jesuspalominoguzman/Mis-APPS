
import React, { useMemo } from 'react';
import { UserSettings, BallSkin, JarStyle, TimeEntry, Category } from '../types';

interface CustomizeProps {
    settings: UserSettings;
    entries: TimeEntry[];
    categories: Category[];
    streak: number;
    onUpdateSettings: (s: UserSettings) => void;
}

const Customize: React.FC<CustomizeProps> = ({ settings, entries, categories, streak, onUpdateSettings }) => {
    
    // -- CALCULATE STATS FOR ACHIEVEMENTS --
    const stats = useMemo(() => {
        const totalMinutes = entries.reduce((acc, e) => acc + e.durationMinutes, 0);
        const totalHours = Math.floor(totalMinutes / 60);
        
        let maxSession = 0;
        entries.forEach(e => {
            if (e.durationMinutes > maxSession) maxSession = e.durationMinutes;
        });

        // Unique categories used
        const usedCats = new Set(entries.map(e => e.categoryId));
        
        // Count entries
        const totalBalls = entries.length;

        return { totalHours, maxSession, uniqueCats: usedCats.size, totalBalls };
    }, [entries]);

    // -- CONFIGURATION --
    // We define the requirement as a function or a description string
    
    const BALL_SKINS: { 
        id: BallSkin; 
        name: string; 
        desc: string;
        isLocked: boolean; 
        condition: string;
    }[] = [
        { 
            id: 'default', 
            name: 'Classic Plastic', 
            desc: 'Reliable and smooth.', 
            isLocked: false, 
            condition: 'Default' 
        },
        { 
            id: 'wood', 
            name: 'Oak Wood', 
            desc: 'Heavy and organic.', 
            isLocked: stats.totalHours < 10, 
            condition: 'Track 10 total hours' 
        },
        { 
            id: 'jelly', 
            name: 'Soft Jelly', 
            desc: 'Bouncy and translucent.', 
            isLocked: stats.uniqueCats < 3, 
            condition: 'Use 3 different categories' 
        },
        { 
            id: 'metal', 
            name: 'Polished Steel', 
            desc: 'Shiny and heavy.', 
            isLocked: streak < 7, 
            condition: '7 Day Streak' 
        },
        { 
            id: 'fire', 
            name: 'Eternal Flame', 
            desc: 'Glowing with energy.', 
            isLocked: streak < 30, 
            condition: '30 Day Streak' 
        },
    ];

    const JAR_STYLES: { 
        id: JarStyle; 
        name: string; 
        desc: string; 
        isLocked: boolean; 
        condition: string; 
    }[] = [
        { 
            id: 'default', 
            name: 'Standard Glass', 
            desc: 'Clean and minimal.', 
            isLocked: false, 
            condition: 'Default' 
        },
        { 
            id: 'vintage', 
            name: 'The Antique', 
            desc: 'Brass rim and aged glass.', 
            isLocked: stats.totalBalls < 20, 
            condition: 'Drop 20 balls into the jar' 
        },
        { 
            id: 'obsidian', 
            name: 'Obsidian', 
            desc: 'Dark smoked glass.', 
            isLocked: stats.maxSession < 240, // 4 hours 
            condition: 'Log a single session > 4h' 
        },
        { 
            id: 'golden', 
            name: 'Royal Gold', 
            desc: 'Gold plated luxury.', 
            isLocked: stats.totalHours < 100, 
            condition: 'Track 100 total hours' 
        },
        { 
            id: 'cyber', 
            name: 'Cyberpunk', 
            desc: 'Neon rim and digital glass.', 
            isLocked: stats.totalHours < 50 && stats.uniqueCats < 4, 
            condition: '50 hours + 4 Categories' 
        },
    ];

    return (
        <div className="flex flex-col h-full overflow-y-auto px-6 pb-40 no-scrollbar animate-[fadeIn_0.3s]">
            <header className="pt-12 pb-6 shrink-0">
                <div className="flex items-center justify-between mb-2">
                    <h2 className="text-3xl font-light text-white">Customize</h2>
                    {settings.adminMode ? (
                         <div className="flex items-center gap-2 bg-red-500/20 px-3 py-1 rounded-full border border-red-500/50">
                            <span className="material-symbols-outlined text-red-500 text-sm">lock_open</span>
                            <span className="text-xs font-bold text-red-400">Admin Unlocked</span>
                        </div>
                    ) : (
                        <div className="flex items-center gap-2 bg-white/5 px-3 py-1 rounded-full border border-white/10">
                            <span className="material-symbols-outlined text-primary text-sm">trophy</span>
                            <span className="text-xs font-bold text-white">Achievements</span>
                        </div>
                    )}
                </div>
                <p className="text-white/40 text-sm font-medium">Complete productivity milestones to unlock new styles.</p>
            </header>

            {/* JAR STYLES SECTION (Renamed from Shapes) */}
            <section className="mb-10">
                <h3 className="text-sm font-bold text-white mb-4 uppercase tracking-wider sticky top-0 bg-background-dark/95 backdrop-blur-md py-2 z-10">Jar Style</h3>
                <div className="grid grid-cols-2 gap-4">
                    {JAR_STYLES.map((style) => {
                        const locked = settings.adminMode ? false : style.isLocked;
                        const isSelected = settings.jarStyle === style.id;

                        return (
                            <button
                                key={style.id}
                                onClick={() => !locked && onUpdateSettings({ ...settings, jarStyle: style.id })}
                                disabled={locked}
                                className={`
                                    flex flex-col items-start p-5 rounded-[2rem] border transition-all duration-300 relative overflow-hidden group
                                    ${isSelected 
                                        ? 'bg-white/10 border-primary shadow-[0_0_20px_rgba(19,236,128,0.1)]' 
                                        : 'bg-[#2A2A2C] border-white/5 hover:bg-[#323234]'}
                                    ${locked ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer active:scale-95'}
                                `}
                            >
                                {/* Visual Preview of Jar Style */}
                                <div className={`w-full h-24 mb-4 rounded-xl relative overflow-hidden flex items-center justify-center
                                    ${style.id === 'default' ? 'bg-gradient-to-b from-white/10 to-transparent' : ''}
                                    ${style.id === 'vintage' ? 'bg-gradient-to-b from-[#8B4513]/40 to-[#3E2723]/60 border border-[#D2691E]/30' : ''}
                                    ${style.id === 'obsidian' ? 'bg-black/60 border border-white/10' : ''}
                                    ${style.id === 'golden' ? 'bg-gradient-to-br from-[#FFD700]/20 to-[#FFA000]/10 border border-[#FFD700]/40' : ''}
                                    ${style.id === 'cyber' ? 'bg-[#000]/80 border border-cyan-500/50 shadow-[inset_0_0_10px_rgba(0,255,255,0.2)]' : ''}
                                `}>
                                     {locked && (
                                         <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center z-10">
                                            <span className="material-symbols-outlined text-white/50 text-3xl">lock</span>
                                         </div>
                                     )}
                                     {/* Simple representation of jar */}
                                     <div className={`w-12 h-16 border-2 rounded-2xl ${style.id === 'cyber' ? 'border-cyan-400' : (style.id === 'golden' ? 'border-yellow-400' : 'border-white/30')}`}></div>
                                </div>
                                
                                <h4 className={`text-base font-bold ${isSelected ? 'text-primary' : 'text-white'}`}>{style.name}</h4>
                                <p className="text-[10px] text-gray-400 mb-2 leading-tight">{style.desc}</p>
                                
                                <div className={`mt-auto w-full pt-3 border-t ${isSelected ? 'border-primary/20' : 'border-white/5'}`}>
                                    {locked ? (
                                        <div className="flex items-center gap-1 text-red-400">
                                            <span className="material-symbols-outlined text-[10px]">lock</span>
                                            <span className="text-[9px] font-bold uppercase tracking-wide">{style.condition}</span>
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-1 text-primary">
                                            <span className="material-symbols-outlined text-[10px]">{isSelected ? 'check_circle' : 'lock_open'}</span>
                                            <span className="text-[9px] font-bold uppercase tracking-wide">{isSelected ? 'Equipped' : 'Unlocked'}</span>
                                        </div>
                                    )}
                                </div>
                            </button>
                        );
                    })}
                </div>
            </section>

            {/* BALL SKINS SECTION */}
            <section className="mb-4">
                <h3 className="text-sm font-bold text-white mb-4 uppercase tracking-wider sticky top-0 bg-background-dark/95 backdrop-blur-md py-2 z-10">Ball Material</h3>
                <div className="space-y-3">
                    {BALL_SKINS.map((skin) => {
                        const locked = settings.adminMode ? false : skin.isLocked;
                        const isSelected = settings.ballSkin === skin.id;

                        return (
                            <button
                                key={skin.id}
                                onClick={() => !locked && onUpdateSettings({ ...settings, ballSkin: skin.id })}
                                disabled={locked}
                                className={`
                                    w-full relative flex items-center gap-4 p-4 rounded-3xl border transition-all duration-300
                                    ${isSelected 
                                        ? 'bg-white/10 border-primary' 
                                        : 'bg-[#2A2A2C] border-white/5 hover:bg-[#323234]'}
                                    ${locked ? 'opacity-60 grayscale cursor-not-allowed' : 'cursor-pointer active:scale-98'}
                                `}
                            >
                                {/* Preview Circle */}
                                <div className={`w-12 h-12 rounded-full shadow-lg shrink-0 flex items-center justify-center relative
                                    ${skin.id === 'default' ? 'bg-gradient-to-br from-white to-gray-400' : ''}
                                    ${skin.id === 'jelly' ? 'bg-pink-400/50 backdrop-blur-sm border border-white/30' : ''}
                                    ${skin.id === 'wood' ? 'bg-[#8B5A2B] border border-[#5C3A1E]' : ''}
                                    ${skin.id === 'metal' ? 'bg-gradient-to-br from-gray-300 via-white to-gray-500' : ''}
                                    ${skin.id === 'fire' ? 'bg-orange-500 shadow-[0_0_15px_orange]' : ''}
                                `}>
                                    {locked && <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center"><span className="material-symbols-outlined text-white text-sm">lock</span></div>}
                                </div>

                                <div className="flex-1 text-left">
                                    <div className="flex justify-between items-center mb-0.5">
                                        <h4 className={`text-base font-bold ${isSelected ? 'text-primary' : 'text-white'}`}>{skin.name}</h4>
                                        {isSelected && <span className="material-symbols-outlined text-primary text-lg">check_circle</span>}
                                    </div>
                                    <p className="text-xs text-gray-400 mb-1">{skin.desc}</p>
                                    
                                    {locked ? (
                                        <p className="text-[10px] text-red-400 font-bold uppercase tracking-wider mt-1">{skin.condition}</p>
                                    ) : (
                                        !isSelected && <p className="text-[10px] text-green-400 font-bold uppercase tracking-wider mt-1">Unlocked</p>
                                    )}
                                </div>
                            </button>
                        );
                    })}
                </div>
            </section>
        </div>
    );
};

export default Customize;
