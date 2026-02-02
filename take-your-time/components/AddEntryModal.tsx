
import React, { useState } from 'react';
import { Category, TimeEntry, UserSettings } from '../types';
import { TRANSLATIONS } from '../constants';

interface AddEntryModalProps {
    isOpen: boolean;
    onClose: () => void;
    categories: Category[];
    onSave: (entry: TimeEntry, isTimerMode: boolean) => void;
    settings?: UserSettings; // Optional for backward compat if needed, but App.tsx passes it
}

const AddEntryModal: React.FC<AddEntryModalProps> = ({ isOpen, onClose, categories, onSave, settings }) => {
    const [selectedCat, setSelectedCat] = useState<string>(categories[0]?.id || '');
    const [duration, setDuration] = useState<number>(25); // Default 25m for Pomodoro
    const [mode, setMode] = useState<'manual' | 'timer'>('manual');

    const t = (settings && TRANSLATIONS[settings.language]) || TRANSLATIONS.en;

    if (!isOpen) return null;

    const handleSubmit = () => {
        const entry: TimeEntry = {
            id: Date.now().toString(),
            categoryId: selectedCat,
            durationMinutes: duration,
            timestamp: Date.now(),
            dateStr: new Date().toISOString().split('T')[0],
            isPomodoro: mode === 'timer'
        };
        onSave(entry, mode === 'timer');
        onClose();
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-md p-4">
            <div className="bg-[#1C1C1E] w-full max-w-md rounded-[40px] p-8 shadow-2xl border border-white/10 animate-[slideUp_0.4s_cubic-bezier(0.2,0.8,0.2,1)]">
                
                {/* Mode Toggle */}
                <div className="flex bg-white/5 p-1 rounded-2xl mb-8">
                    <button 
                        onClick={() => { setMode('manual'); setDuration(60); }}
                        className={`flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${mode === 'manual' ? 'bg-white text-black shadow-lg' : 'text-white/40 hover:text-white'}`}
                    >
                        {t.manualEntry}
                    </button>
                    <button 
                        onClick={() => { setMode('timer'); setDuration(25); }}
                        className={`flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${mode === 'timer' ? 'bg-primary text-black shadow-lg shadow-primary/20' : 'text-white/40 hover:text-white'}`}
                    >
                        {t.focusTimer}
                    </button>
                </div>

                <div className="flex items-center justify-between mb-8">
                    <h3 className="text-2xl font-black text-white tracking-tight">
                        {mode === 'timer' ? t.startSession : t.logActivity}
                    </h3>
                    {mode === 'timer' && (
                        <div className="bg-yellow-500/20 text-yellow-400 border border-yellow-500/50 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1">
                            <span className="material-symbols-outlined text-sm">stars</span>
                            Golden Ball
                        </div>
                    )}
                </div>
                
                <div className="mb-6">
                    <label className="text-white/30 text-[10px] font-black uppercase tracking-[0.2em] mb-4 block">Select Activity</label>
                    <div className="grid grid-cols-2 gap-3">
                        {categories.map(cat => (
                            <button
                                key={cat.id}
                                onClick={() => setSelectedCat(cat.id)}
                                className={`
                                    p-4 rounded-3xl flex items-center gap-3 border-2 transition-all duration-300
                                    ${selectedCat === cat.id 
                                        ? 'bg-white/5 border-primary shadow-[0_0_20px_rgba(19,236,128,0.1)] scale-[1.02]' 
                                        : 'bg-white/2 border-transparent hover:bg-white/5'}
                                `}
                            >
                                <div 
                                    className="w-10 h-10 rounded-2xl flex items-center justify-center text-background-dark font-bold transition-transform group-active:scale-90"
                                    style={{ backgroundColor: cat.colorHex }}
                                >
                                    <span className="material-symbols-outlined text-xl">{cat.icon}</span>
                                </div>
                                <span className="text-white text-sm font-bold truncate">{cat.name}</span>
                            </button>
                        ))}
                    </div>
                </div>

                <div className="mb-10 text-center">
                    <div className="mb-4">
                        <span className="text-5xl font-black text-white tracking-tighter">
                            {Math.floor(duration/60)}<span className="text-xl text-white/30 ml-1">h</span> {duration%60}<span className="text-xl text-white/30 ml-1">m</span>
                        </span>
                    </div>
                    <input 
                        type="range" 
                        min={mode === 'timer' ? "5" : "15"} 
                        max={mode === 'timer' ? "120" : "480"}
                        step={mode === 'timer' ? "5" : "15"}
                        value={duration}
                        onChange={(e) => setDuration(Number(e.target.value))}
                        className="w-full accent-primary h-2 bg-white/5 rounded-full appearance-none cursor-pointer"
                    />
                    <div className="flex justify-between text-[10px] text-white/20 font-black mt-3 uppercase tracking-widest">
                        <span>{mode === 'timer' ? '5m' : '15m'}</span>
                        <span>{mode === 'timer' ? '2h Limit' : '8h Max'}</span>
                    </div>
                </div>

                <div className="flex flex-col gap-3">
                    <button 
                        onClick={handleSubmit}
                        className={`w-full py-5 rounded-[24px] font-black text-lg text-background-dark hover:scale-[1.02] active:scale-95 transition-all duration-300 shadow-xl
                            ${mode === 'timer' ? 'bg-[#FFD700] shadow-[#FFD700]/30' : 'bg-primary shadow-primary/20'}
                        `}
                    >
                        {mode === 'timer' ? 'Start Focus & Forge' : 'Drop into Jar'}
                    </button>
                    <button 
                        onClick={onClose}
                        className="w-full py-4 rounded-[24px] bg-transparent text-white/40 font-bold hover:text-white transition-colors"
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AddEntryModal;
