
import React, { useState, useEffect } from 'react';
import { ViewState, TimeEntry, Category, UserSettings } from './types';
import * as Storage from './services/storageService';
import { checkAndNotify } from './services/notificationService';
import PhysicsHourglass from './components/PhysicsHourglass';
import BottomNav from './components/BottomNav';
import Stats from './components/Stats';
import Goals from './components/Goals';
import Customize from './components/Customize';
import AddEntryModal from './components/AddEntryModal';
import SettingsModal from './components/SettingsModal';
import PomodoroTimer from './components/PomodoroTimer';
import { TRANSLATIONS } from './constants';

const App: React.FC = () => {
    const [view, setView] = useState<ViewState>('home');
    const [categories, setCategories] = useState<Category[]>([]);
    const [entries, setEntries] = useState<TimeEntry[]>([]);
    const [settings, setSettings] = useState<UserSettings>(Storage.getSettings());
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
    
    // Pomodoro State
    const [activePomodoro, setActivePomodoro] = useState<{entry: TimeEntry, category: Category} | null>(null);

    // Translation helper
    const t = TRANSLATIONS[settings.language] || TRANSLATIONS.en;

    const refreshData = () => {
        setCategories(Storage.getCategories());
        setEntries(Storage.getTodayEntries());
    };

    const updateSettings = (newSettings: UserSettings) => {
        setSettings(newSettings);
        Storage.saveSettings(newSettings);
        document.documentElement.classList.toggle('dark', newSettings.theme === 'dark');
    };

    useEffect(() => {
        refreshData();
        checkAndNotify();
        document.documentElement.classList.toggle('dark', settings.theme === 'dark');
        const interval = setInterval(checkAndNotify, 60 * 1000); 
        return () => clearInterval(interval);
    }, []);

    const handleSaveEntryRequest = (entry: TimeEntry, isTimerMode: boolean) => {
        if (isTimerMode) {
            const cat = categories.find(c => c.id === entry.categoryId);
            if (cat) {
                setActivePomodoro({ entry, category: cat });
                setView('pomodoro');
            }
        } else {
            Storage.addEntry(entry);
            setEntries(Storage.getTodayEntries()); 
        }
    };

    const handlePomodoroComplete = () => {
        if (activePomodoro) {
            Storage.addEntry(activePomodoro.entry);
            setEntries(Storage.getTodayEntries());
            setActivePomodoro(null);
            setView('home');
        }
    };

    const handlePomodoroCancel = () => {
        setActivePomodoro(null);
        setView('home');
    };

    const lastEntry = entries[entries.length - 1];
    const lastCategory = lastEntry 
        ? categories.find(c => c.id === lastEntry.categoryId) 
        : null;

    const history = Storage.getHistory();
    const streak = Object.keys(history).length;

    // --- RENDER POMODORO MODE ---
    if (view === 'pomodoro' && activePomodoro) {
        return (
            <PomodoroTimer 
                durationMinutes={activePomodoro.entry.durationMinutes}
                category={activePomodoro.category}
                onComplete={handlePomodoroComplete}
                onCancel={handlePomodoroCancel}
                settings={settings}
            />
        );
    }

    return (
        <div className="flex flex-col h-full relative bg-gray-100 dark:bg-background-dark text-gray-900 dark:text-white overflow-hidden font-sans select-none transition-colors duration-500">
            
            <main className="flex-1 relative w-full h-full flex flex-col">
                
                {/* --- HOME VIEW (PERSISTENT) --- */}
                <div 
                    className="absolute inset-0 flex flex-col transition-opacity duration-300"
                    style={{ 
                        visibility: view === 'home' ? 'visible' : 'hidden',
                        opacity: view === 'home' ? 1 : 0,
                        zIndex: view === 'home' ? 10 : 0
                    }}
                > 
                    {/* Header with Actions */}
                    <div className="h-16 w-full flex justify-between items-center px-6 mt-4 z-50 shrink-0">
                        {/* Streak Badge */}
                        <div className="flex items-center gap-2 bg-white dark:bg-[#1C1C1E] px-4 py-2 rounded-full border border-black/5 dark:border-white/5 shadow-lg">
                            <span className="material-symbols-outlined text-primary text-sm font-black">local_fire_department</span>
                            <span className="text-[10px] font-black tracking-[0.1em] uppercase text-gray-700 dark:text-gray-200">{streak} Day Streak</span>
                        </div>

                        {/* Top Actions: Add & Settings */}
                        <div className="flex items-center gap-3">
                            <button 
                                onClick={() => setIsAddModalOpen(true)}
                                className="w-10 h-10 flex items-center justify-center rounded-full bg-primary text-background-dark shadow-[0_0_15px_rgba(19,236,128,0.3)] hover:scale-105 active:scale-90 transition-all"
                            >
                                <span className="material-symbols-outlined text-xl font-black">add</span>
                            </button>
                            <button 
                                onClick={() => setIsSettingsModalOpen(true)}
                                className="w-10 h-10 flex items-center justify-center rounded-full bg-white dark:bg-[#1C1C1E] border border-black/5 dark:border-white/5 text-gray-400 hover:text-gray-900 dark:hover:text-white transition-all active:scale-90"
                            >
                                <span className="material-symbols-outlined text-xl">settings</span>
                            </button>
                        </div>
                    </div>
                    
                    <header className="px-6 text-center z-10 pointer-events-none mt-2 shrink-0">
                        <h1 className="text-3xl font-extralight tracking-tight text-gray-800 dark:text-white/90">Time is yours</h1>
                        <p className="text-gray-400 dark:text-white/20 text-[10px] mt-1 font-black tracking-[0.3em] uppercase">
                            {new Date().toLocaleDateString(settings.language === 'es' ? 'es-ES' : 'en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                        </p>
                    </header>

                    <div className="w-full flex justify-center px-6 mt-6 z-10 pointer-events-none shrink-0">
                        <div className="bg-white/80 dark:bg-[#1C1C1E]/90 backdrop-blur-2xl border border-black/5 dark:border-white/5 rounded-[32px] p-3 pr-8 flex items-center gap-4 shadow-2xl max-w-sm w-full pointer-events-auto transform transition-all hover:scale-[1.02] active:scale-98">
                            <div className={`h-12 w-12 rounded-2xl flex items-center justify-center shrink-0 transition-all ${lastCategory ? 'animate-pulse' : 'bg-gray-200 dark:bg-white/5'}`}
                                    style={lastCategory ? { backgroundColor: lastCategory.colorHex, boxShadow: `0 0 25px ${lastCategory.colorHex}44` } : {}}>
                                <span className="material-symbols-outlined text-background-dark text-2xl font-black">
                                    {lastCategory ? lastCategory.icon : 'hourglass_empty'}
                                </span>
                            </div>
                            <div className="flex flex-col flex-1">
                                <span className="text-[9px] text-gray-400 dark:text-white/30 uppercase tracking-[0.2em] font-black">Latest Pulse</span>
                                <span className="text-base font-bold text-gray-800 dark:text-white leading-tight truncate">
                                    {lastCategory ? lastCategory.name : 'Waiting for track...'}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Responsive Hourglass Container */}
                    <div className="flex-1 w-full relative z-0 flex items-center justify-center pb-32 overflow-hidden">
                        <PhysicsHourglass 
                            entries={entries} 
                            categories={categories} 
                            settings={settings}
                        />
                    </div>
                </div>

                {/* --- OTHER VIEWS --- */}
                {view === 'stats' && (
                    <div className="absolute inset-0 bg-gray-100 dark:bg-background-dark z-20 animate-[fadeIn_0.3s]">
                        <Stats entries={entries} categories={categories} settings={settings} />
                    </div>
                )}

                {view === 'customize' && (
                    <div className="absolute inset-0 bg-gray-100 dark:bg-background-dark z-20 animate-[fadeIn_0.3s]">
                        <Customize settings={settings} entries={Storage.getEntries()} categories={categories} streak={streak} onUpdateSettings={updateSettings} />
                    </div>
                )}

                {view === 'goals' && (
                    <div className="absolute inset-0 bg-gray-100 dark:bg-background-dark z-20 animate-[fadeIn_0.3s]">
                        <Goals entries={entries} categories={categories} onCategoriesUpdate={refreshData} />
                    </div>
                )}
            </main>

            {/* Bottom Controls Wrapper (Navigation Only) */}
            <div className="fixed bottom-6 left-0 right-0 px-6 flex justify-center items-end z-50 pointer-events-none">
                <div className="pointer-events-auto">
                    <BottomNav currentView={view} onChange={setView} />
                </div>
            </div>
            
            <AddEntryModal 
                isOpen={isAddModalOpen} 
                onClose={() => setIsAddModalOpen(false)} 
                categories={categories}
                onSave={handleSaveEntryRequest}
                settings={settings}
            />

            <SettingsModal 
                isOpen={isSettingsModalOpen}
                onClose={() => setIsSettingsModalOpen(false)}
                onUpdate={updateSettings}
            />
        </div>
    );
};

export default App;
