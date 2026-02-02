
import React, { useState, useMemo } from 'react';
import { Category, TimeEntry, UserSettings } from '../types';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, Tooltip } from 'recharts';
import { generateDailyInsight } from '../services/geminiService';
import { getHistory } from '../services/storageService';
import { TRANSLATIONS } from '../constants';

interface StatsProps {
    entries: TimeEntry[];
    categories: Category[];
    settings: UserSettings;
}

const Stats: React.FC<StatsProps> = ({ entries, categories, settings }) => {
    const [insight, setInsight] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const t = TRANSLATIONS[settings.language] || TRANSLATIONS.en;

    // --- 1. DATA FILTERING FOR PIE CHART (ALWAYS TODAY) ---
    const filteredEntries = useMemo(() => {
        const now = new Date();
        const todayStr = now.toISOString().split('T')[0];
        return entries.filter(e => e.dateStr === todayStr);
    }, [entries]);

    // Pie Chart Data
    const pieData = useMemo(() => {
        return categories.map(cat => {
            const minutes = filteredEntries
                .filter(e => e.categoryId === cat.id)
                .reduce((acc, curr) => acc + curr.durationMinutes, 0);
            return {
                name: cat.name,
                value: minutes,
                color: cat.colorHex
            };
        }).filter(d => d.value > 0);
    }, [categories, filteredEntries]);

    const rangeTotalMinutes = filteredEntries.reduce((acc, e) => acc + e.durationMinutes, 0);

    // --- 2. HISTORICAL DATA FOR BAR CHART (Last 7 Days) ---
    const historyDataRaw = useMemo(() => getHistory(), [entries]);
    
    const weeklyBarData = useMemo(() => {
        const days = [];
        const today = new Date();
        const lang = settings.language === 'es' ? 'es-ES' : 'en-US';
        
        for (let i = 6; i >= 0; i--) {
            const d = new Date(today);
            d.setDate(d.getDate() - i);
            const dateStr = d.toISOString().split('T')[0];
            const dayEntries = historyDataRaw[dateStr] || [];
            const totalMinutes = dayEntries.reduce((acc, e) => acc + e.durationMinutes, 0);
            
            days.push({
                day: d.toLocaleDateString(lang, { weekday: 'short' }),
                minutes: totalMinutes,
            });
        }
        return days;
    }, [historyDataRaw, settings.language]);

    // --- 3. GRID HISTORY DATA ---
    const gridItems = useMemo(() => {
        const lang = settings.language === 'es' ? 'es-ES' : 'en-US';
        return Object.entries(historyDataRaw)
            .sort((a, b) => b[0].localeCompare(a[0])) // Newest first
            .map(([dateStr, dayEntries]: [string, TimeEntry[]]) => {
                const totalMinutes = dayEntries.reduce((acc, e) => acc + e.durationMinutes, 0);
                
                // Dominant Category
                const catCounts = dayEntries.reduce((acc, e) => {
                    acc[e.categoryId] = (acc[e.categoryId] || 0) + e.durationMinutes;
                    return acc;
                }, {} as Record<string, number>);
                
                const topCatId = Object.keys(catCounts).reduce((a, b) => catCounts[a] > catCounts[b] ? a : b, '');
                const topCat = categories.find(c => c.id === topCatId);

                return {
                    dateStr,
                    totalMinutes,
                    topCat,
                    dayDisplay: new Date(dateStr).toLocaleDateString(lang, { day: 'numeric', month: 'short' })
                };
            });
    }, [historyDataRaw, categories, settings.language]);

    // --- ACTIONS ---
    const handleGetInsight = async () => {
        if (!process.env.API_KEY) {
            setInsight("API Key not configured.");
            return;
        }
        setLoading(true);
        // We use the filtered entries so the coach talks about Today
        const text = await generateDailyInsight(filteredEntries, categories);
        setInsight(text);
        setLoading(false);
    };

    return (
        <div className="flex flex-col h-full overflow-y-auto px-6 pb-40 no-scrollbar">
            <header className="pt-10 pb-6 shrink-0">
                <h2 className="text-3xl font-light text-white">{t.statsTitle}</h2>
                <p className="text-white/40 text-sm font-medium mt-1">{t.statsSubtitle}</p>
            </header>

            {/* --- SECTION 1: VISUAL BREAKDOWN (PIE - TODAY) --- */}
            <div className="mb-8">
                <div className="relative h-64 w-full">
                    {pieData.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={pieData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={65}
                                    outerRadius={85}
                                    paddingAngle={5}
                                    dataKey="value"
                                    stroke="none"
                                    cornerRadius={8}
                                >
                                    {pieData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                            </PieChart>
                        </ResponsiveContainer>
                    ) : (
                         <div className="flex items-center justify-center h-full text-gray-500 border-4 border-white/5 rounded-full w-64 h-64 mx-auto border-dashed">
                            {t.noData}
                        </div>
                    )}
                    
                    {/* Center Total */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                         <span className="text-gray-400 text-[10px] uppercase tracking-widest font-black">{t.today}</span>
                         <span className="text-4xl font-light text-white tracking-tight">
                            {Math.floor(rangeTotalMinutes / 60)}<span className="text-lg text-gray-500 ml-0.5">h</span>
                         </span>
                         {rangeTotalMinutes > 0 && (
                            <span className="text-sm text-gray-500 font-medium">{rangeTotalMinutes % 60}m</span>
                         )}
                    </div>
                </div>
            </div>

            {/* --- SECTION 2: AI COACH --- */}
            <div className="bg-gradient-to-br from-indigo-500/10 to-purple-500/10 p-6 rounded-[32px] border border-white/10 mb-8 shrink-0 relative overflow-hidden">
                <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center shadow-lg shadow-indigo-500/30">
                            <span className="material-symbols-outlined text-white text-sm">auto_awesome</span>
                        </div>
                        <h3 className="text-lg font-bold text-white">{t.aiCoach}</h3>
                    </div>
                    
                    {insight ? (
                        <p className="text-gray-200 leading-relaxed text-sm animate-[fadeIn_0.5s] italic">"{insight}"</p>
                    ) : (
                        <div className="py-2">
                            <p className="text-gray-400 text-sm mb-4">{t.aiDesc}</p>
                            <button 
                                onClick={handleGetInsight}
                                disabled={loading || rangeTotalMinutes === 0}
                                className="bg-white text-black px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest disabled:opacity-50 flex items-center gap-2 hover:scale-105 transition-all shadow-xl"
                            >
                                {loading ? (
                                    <span className="material-symbols-outlined animate-spin text-sm">refresh</span>
                                ) : (
                                    t.aiPrompt
                                )}
                            </button>
                        </div>
                    )}
                </div>
                {/* Background Decor */}
                <div className="absolute -top-10 -right-10 w-32 h-32 bg-indigo-500/20 blur-3xl rounded-full pointer-events-none"></div>
            </div>

            {/* --- SECTION 3: WEEKLY TREND (BAR CHART) --- */}
            <div className="mb-10">
                <h3 className="text-sm font-bold text-white mb-4 uppercase tracking-wider pl-2 border-l-2 border-primary">{t.journey}</h3>
                <div className="bg-gunmetal/40 rounded-3xl p-6 border border-white/5 h-48">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={weeklyBarData}>
                            <XAxis 
                                dataKey="day" 
                                axisLine={false} 
                                tickLine={false} 
                                tick={{ fill: '#666', fontSize: 10, fontWeight: 700 }} 
                                dy={10}
                            />
                            <Tooltip 
                                cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                                contentStyle={{ backgroundColor: '#1C1C1E', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}
                                itemStyle={{ color: '#fff', fontSize: '12px', fontWeight: 'bold' }}
                                formatter={(value: number) => [`${Math.floor(value/60)}h ${value%60}m`, 'Time']}
                                labelStyle={{ color: '#888', marginBottom: '5px', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '1px' }}
                            />
                            <Bar dataKey="minutes" radius={[4, 4, 4, 4]}>
                                {weeklyBarData.map((entry, index) => (
                                    <Cell 
                                        key={`cell-${index}`} 
                                        fill={entry.minutes > 0 ? '#13ec80' : '#333'} 
                                        fillOpacity={entry.minutes > 0 ? 1 : 0.5}
                                    />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* --- SECTION 4: CHRONICLE (HISTORY GRID) --- */}
            <div className="mb-6">
                <h3 className="text-sm font-bold text-white mb-4 uppercase tracking-wider pl-2 border-l-2 border-primary">{t.chronicle}</h3>
                
                {gridItems.length === 0 ? (
                    <div className="text-center py-6 text-gray-500 text-sm">
                        {t.noData}
                    </div>
                ) : (
                    <div className="grid grid-cols-3 gap-3">
                        {gridItems.map((item) => (
                            <div 
                                key={item.dateStr}
                                className="aspect-[3/4] bg-white/5 rounded-2xl border border-white/5 flex flex-col items-center justify-center p-3 relative group overflow-hidden active:scale-95 transition-all"
                            >
                                <div className="relative mb-2">
                                    <span 
                                        className="material-symbols-outlined text-3xl opacity-80 drop-shadow-lg"
                                        style={{ color: item.topCat?.colorHex || '#fff' }}
                                    >
                                        hourglass_full
                                    </span>
                                </div>
                                
                                <span className="text-lg font-black text-white">
                                    {Math.floor(item.totalMinutes / 60)}<span className="text-[10px] text-gray-500 font-normal ml-0.5">h</span>
                                </span>
                                <span className="text-[9px] text-gray-500 font-black uppercase mt-1 tracking-wider">
                                    {item.dayDisplay}
                                </span>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Stats;
