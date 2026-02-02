
import React, { useEffect, useState, useMemo, useRef } from 'react';
import { getSettings, saveSettings, getEntries, clearData, exportData, importData } from '../services/storageService';
import { requestNotificationPermission } from '../services/notificationService';
import { UserSettings } from '../types';
import { TRANSLATIONS } from '../constants';

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    onUpdate?: (settings: UserSettings) => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, onUpdate }) => {
    const [settings, setSettings] = useState<UserSettings>(getSettings());
    const [permissionStatus, setPermissionStatus] = useState<NotificationPermission>('default');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const t = TRANSLATIONS[settings.language] || TRANSLATIONS.en;

    useEffect(() => {
        if (isOpen) {
            setSettings(getSettings());
            if ("Notification" in window) {
                setPermissionStatus(Notification.permission);
            }
        }
    }, [isOpen]);

    // Calculate Lifetime Stats
    const stats = useMemo(() => {
        if (!isOpen) return { hours: 0, sessions: 0, goldenBalls: 0, visualBalls: 0 };
        const entries = getEntries();
        const totalMinutes = entries.reduce((acc, e) => acc + e.durationMinutes, 0);
        const totalHours = Math.floor(totalMinutes / 60);
        const goldenBalls = entries.filter(e => e.isPomodoro).length;
        
        // Calculate visual balls
        let visualBalls = 0;
        entries.forEach(e => {
             let remaining = e.durationMinutes;
             while(remaining > 0) {
                 visualBalls++;
                 if (remaining >= 60) remaining -= 60;
                 else if (remaining >= 30) remaining -= 30;
                 else remaining = 0;
             }
        });

        return {
            hours: totalHours,
            sessions: entries.length,
            goldenBalls,
            visualBalls
        };
    }, [isOpen]);

    if (!isOpen) return null;

    const updateAndSave = (newSettings: UserSettings) => {
        setSettings(newSettings);
        saveSettings(newSettings);
        if (onUpdate) onUpdate(newSettings);
    };

    const handleToggleNotifications = async () => {
        const newState = !settings.notificationsEnabled;
        
        if (newState && permissionStatus !== 'granted') {
            const granted = await requestNotificationPermission();
            if (!granted) {
                alert("Permission denied. Enable notifications in your browser settings.");
                return;
            }
            setPermissionStatus('granted');
        }

        updateAndSave({ ...settings, notificationsEnabled: newState });
    };

    const handleToggleHaptics = () => {
        updateAndSave({ ...settings, hapticsEnabled: !settings.hapticsEnabled });
    };
    
    const handleToggleTheme = () => {
        const newTheme = settings.theme === 'dark' ? 'light' : 'dark';
        updateAndSave({ ...settings, theme: newTheme });
    };

    const handleToggleLanguage = () => {
        const newLang = settings.language === 'en' ? 'es' : 'en';
        updateAndSave({ ...settings, language: newLang });
    };

    const handleToggleAdmin = () => {
        updateAndSave({ ...settings, adminMode: !settings.adminMode });
    };

    const handleIntervalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = parseInt(e.target.value);
        updateAndSave({ ...settings, reminderIntervalHours: val });
    };

    const handlePhysicsChange = (key: 'physicsGravity' | 'physicsWeight', val: number) => {
        updateAndSave({ ...settings, [key]: val });
    };

    // Reset Functionality
    const handleResetData = () => {
        if (window.confirm(t.resetConfirm)) {
            clearData();
            window.location.reload();
        }
    };

    // Export Data
    const handleExport = () => {
        const json = exportData();
        const blob = new Blob([json], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `take-your-time-backup-${new Date().toISOString().slice(0,10)}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    };

    // Import Data
    const triggerImport = () => {
        fileInputRef.current?.click();
    };

    const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const result = event.target?.result as string;
            if (importData(result)) {
                alert(t.importSuccess);
                window.location.reload();
            } else {
                alert(t.importError);
            }
        };
        reader.readAsText(file);
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 text-white">
            <div className="bg-[#1C1C1E] dark:bg-gunmetal w-full max-w-sm max-h-[90vh] overflow-y-auto no-scrollbar rounded-3xl p-6 shadow-2xl border border-white/5 animate-[scaleIn_0.2s_ease-out]">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold text-white">{t.settings}</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-white">
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>

                {/* --- LIFETIME STATS SECTION (2x2 Grid) --- */}
                <div className="bg-white/5 rounded-3xl p-5 mb-6 border border-white/5">
                    <h4 className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] mb-4 text-center border-b border-white/5 pb-2">{t.lifetimeStats}</h4>
                    <div className="grid grid-cols-2 gap-y-6 gap-x-4">
                        <div className="text-center">
                            <span className="block text-2xl font-black text-white">{stats.hours}</span>
                            <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wide">{t.totalHours}</span>
                        </div>
                        <div className="text-center relative">
                            <div className="absolute left-0 top-2 bottom-2 w-[1px] bg-white/5"></div>
                            <span className="block text-2xl font-black text-white">{stats.sessions}</span>
                            <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wide">{t.totalSessions}</span>
                        </div>
                        <div className="text-center border-t border-white/5 pt-4">
                            <span className="block text-2xl font-black text-white">{stats.visualBalls}</span>
                            <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wide">{t.totalBalls}</span>
                        </div>
                        <div className="text-center border-t border-white/5 pt-4 relative">
                            <div className="absolute left-0 top-4 bottom-0 w-[1px] bg-white/5"></div>
                            <span className="block text-2xl font-black text-[#FFD700] drop-shadow-sm">{stats.goldenBalls}</span>
                            <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wide">{t.totalPomodoros}</span>
                        </div>
                    </div>
                </div>

                <div className="space-y-6">
                    {/* Language Toggle */}
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-white font-medium">{t.language}</p>
                            <p className="text-xs text-gray-400">
                                {settings.language === 'en' ? 'English' : 'Español'}
                            </p>
                        </div>
                        <button 
                            onClick={handleToggleLanguage}
                            className="h-8 px-3 rounded-full bg-white/10 hover:bg-white/20 transition-colors flex items-center justify-center font-bold text-xs uppercase tracking-wider"
                        >
                            {settings.language.toUpperCase()}
                        </button>
                    </div>

                     {/* Theme Toggle */}
                     <div className="flex items-center justify-between">
                        <div>
                            <p className="text-white font-medium">{t.appearance}</p>
                            <p className="text-xs text-gray-400">
                                {settings.theme === 'dark' ? 'Dark Mode' : 'Light Mode'}
                            </p>
                        </div>
                        <button 
                            onClick={handleToggleTheme}
                            className={`w-14 h-8 rounded-full transition-colors relative flex items-center px-1 ${settings.theme === 'dark' ? 'bg-gray-700' : 'bg-primary'}`}
                        >
                            <div className={`absolute w-6 h-6 rounded-full bg-white shadow-sm flex items-center justify-center transition-all ${settings.theme === 'dark' ? 'translate-x-6' : 'translate-x-0'}`}>
                                <span className={`material-symbols-outlined text-[14px] ${settings.theme === 'dark' ? 'text-gray-800' : 'text-orange-500'}`}>
                                    {settings.theme === 'dark' ? 'dark_mode' : 'light_mode'}
                                </span>
                            </div>
                        </button>
                    </div>

                    {/* Physics Section */}
                    <div className="border-t border-white/5 pt-4">
                        <p className="text-white font-medium mb-3">{t.physics}</p>
                        <div className="mb-4">
                            <div className="flex justify-between text-xs text-gray-400 mb-1">
                                <span>{t.gravity}</span>
                                <span>{settings.physicsGravity.toFixed(1)}x</span>
                            </div>
                            <input type="range" min="0.1" max="2.0" step="0.1" value={settings.physicsGravity} onChange={(e) => handlePhysicsChange('physicsGravity', parseFloat(e.target.value))} className="w-full accent-primary h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer" />
                        </div>
                        <div>
                            <div className="flex justify-between text-xs text-gray-400 mb-1">
                                <span>{t.weight}</span>
                                <span>{settings.physicsWeight.toFixed(1)}x</span>
                            </div>
                            <input type="range" min="0.5" max="3.0" step="0.1" value={settings.physicsWeight} onChange={(e) => handlePhysicsChange('physicsWeight', parseFloat(e.target.value))} className="w-full accent-primary h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer" />
                        </div>
                    </div>

                    {/* Notification Toggle */}
                    <div className="flex items-center justify-between border-t border-white/5 pt-4">
                        <div>
                            <p className="text-white font-medium">{t.reminders}</p>
                            <p className="text-xs text-gray-400">{permissionStatus === 'denied' ? 'Blocked by Browser' : 'Notifications'}</p>
                        </div>
                        <button 
                            onClick={handleToggleNotifications}
                            disabled={permissionStatus === 'denied'}
                            className={`w-12 h-7 rounded-full transition-colors relative ${settings.notificationsEnabled ? 'bg-primary' : 'bg-gray-600'} ${permissionStatus === 'denied' ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            <div className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full transition-transform ${settings.notificationsEnabled ? 'translate-x-5' : ''}`} />
                        </button>
                    </div>

                    {/* Data Management Section */}
                    <div className="border-t border-white/5 pt-4">
                        <p className="text-white font-medium mb-3">{t.dataManagement}</p>
                        <div className="grid grid-cols-2 gap-3">
                            <button onClick={handleExport} className="py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-colors">
                                <span className="material-symbols-outlined text-sm">download</span> {t.exportData}
                            </button>
                            <button onClick={triggerImport} className="py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-colors">
                                <span className="material-symbols-outlined text-sm">upload</span> {t.importData}
                            </button>
                            <input 
                                type="file" 
                                ref={fileInputRef} 
                                onChange={handleImportFile} 
                                accept=".json" 
                                className="hidden" 
                            />
                        </div>
                    </div>

                     {/* Admin Mode Toggle */}
                     <div className="flex items-center justify-between border-t border-white/5 pt-4">
                        <div>
                            <p className="text-white font-medium">{t.admin}</p>
                            <p className="text-xs text-gray-400">Unlock all cosmetics</p>
                        </div>
                        <button 
                            onClick={handleToggleAdmin}
                            className={`w-12 h-7 rounded-full transition-colors relative ${settings.adminMode ? 'bg-red-500' : 'bg-gray-600'}`}
                        >
                            <div className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full transition-transform ${settings.adminMode ? 'translate-x-5' : ''}`} />
                        </button>
                    </div>

                    {/* DANGER ZONE */}
                    <div className="mt-8 border-t border-red-500/20 pt-6">
                        <p className="text-[10px] font-black text-red-500/50 uppercase tracking-[0.2em] mb-3">{t.dangerZone}</p>
                        <button 
                            onClick={handleResetData}
                            className="w-full py-3 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-500 font-bold hover:bg-red-500/20 active:scale-95 transition-all text-sm flex items-center justify-center gap-2"
                        >
                            <span className="material-symbols-outlined text-lg">delete_forever</span>
                            {t.resetData}
                        </button>
                    </div>
                </div>

                <div className="mt-6 text-center">
                    <p className="text-xs text-gray-500">Take Your Time v2.1</p>
                </div>
            </div>
        </div>
    );
};

export default SettingsModal;
