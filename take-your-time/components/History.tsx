
import React, { useMemo } from 'react';
import { TimeEntry, Category } from '../types';
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { getHistory } from '../services/storageService';

interface HistoryProps {
    entries: TimeEntry[]; // Active entries (not used much here, we use full history)
    categories: Category[];
}

const History: React.FC<HistoryProps> = ({ categories }) => {
    // 1. Fetch Full History
    // Explicitly define the type for historyData to ensure TypeScript understands the structure.
    const historyData: Record<string, TimeEntry[]> = useMemo(() => getHistory(), []);

    // 2. Prepare Data for Weekly Chart (Last 7 days)
    const weeklyData = useMemo(() => {
        const days = [];
        const today = new Date();
        
        for (let i = 6; i >= 0; i--) {
            const d = new Date(today);
            d.setDate(d.getDate() - i);
            const dateStr = d.toISOString().split('T')[0];
            const entries = historyData[dateStr] || [];
            const totalMinutes = entries.reduce((acc, e) => acc + e.durationMinutes, 0);
            
            days.push({
                day: d.toLocaleDateString('en-US', { weekday: 'short' }),
                fullDate: dateStr,
                minutes: totalMinutes,
            });
        }
        return days;
    }, [historyData]);

    // 3. Prepare Grid Data (All Days)
    const gridItems = useMemo(() => {
        // Casting Object.entries(historyData) to help TypeScript correctly infer the type of dayEntries as TimeEntry[].
        return (Object.entries(historyData) as [string, TimeEntry[]][])
            .sort((a, b) => b[0].localeCompare(a[0])) // Newest first
            .map(([dateStr, dayEntries]) => {
                // Now dayEntries is correctly inferred as TimeEntry[], so .reduce is available.
                const totalMinutes = dayEntries.reduce((acc, e) => acc + e.durationMinutes, 0);
                
                // Find dominant category
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
                    dayDisplay: new Date(dateStr).toLocaleDateString('en-US', { day: 'numeric', month: 'short' })
                };
            });
    }, [historyData, categories]);

    return (
        <div className="flex flex-col h-full overflow-y-auto px-6 pb-32 no-scrollbar">
            <header className="pt-10 pb-6">
                <h2 className="text-3xl font-light text-white">Your Journey</h2>
                <p className="text-white/40 text-sm font-medium mt-1">Track your consistency over time</p>
            </header>

            {/* Weekly Bar Chart */}
            <div className="bg-gunmetal/40 rounded-3xl p-6 mb-8 border border-white/5">
                <h3 className="text-sm font-bold text-white mb-4 uppercase tracking-wider">This Week</h3>
                <div className="h-40 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={weeklyData}>
                            <XAxis 
                                dataKey="day" 
                                axisLine={false} 
                                tickLine={false} 
                                tick={{ fill: '#888', fontSize: 10 }} 
                                dy={10}
                            />
                            <Tooltip 
                                cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                                contentStyle={{ backgroundColor: '#3D3D3D', borderRadius: '8px', border: 'none' }}
                                itemStyle={{ color: '#fff' }}
                                formatter={(value: number) => [`${Math.round(value/60)}h ${value%60}m`, 'Time']}
                            />
                            <Bar dataKey="minutes" radius={[4, 4, 4, 4]}>
                                {weeklyData.map((entry, index) => (
                                    <Cell 
                                        key={`cell-${index}`} 
                                        fill={entry.minutes > 0 ? '#13ec80' : '#444'} 
                                        fillOpacity={entry.minutes > 0 ? 0.8 : 0.3}
                                    />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* The "Forest" Grid */}
            <div className="mb-4">
                <h3 className="text-sm font-bold text-white mb-4 uppercase tracking-wider">Chronicle</h3>
                
                {gridItems.length === 0 ? (
                    <div className="text-center py-10 text-gray-500">
                        <span className="material-symbols-outlined text-4xl mb-2">history_toggle_off</span>
                        <p>No history yet. Fill your first hourglass today!</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-3 gap-4">
                        {gridItems.map((item) => (
                            <div 
                                key={item.dateStr}
                                className="aspect-[3/4] bg-white/5 rounded-2xl border border-white/5 flex flex-col items-center justify-center p-3 relative group overflow-hidden hover:bg-white/10 transition-colors"
                            >
                                {/* Visual representation of a filled jar */}
                                <div className="relative mb-2">
                                    <span 
                                        className="material-symbols-outlined text-4xl opacity-80"
                                        style={{ color: item.topCat?.colorHex || '#fff' }}
                                    >
                                        hourglass_full
                                    </span>
                                    {/* Glow effect */}
                                    <div 
                                        className="absolute inset-0 blur-xl opacity-20"
                                        style={{ backgroundColor: item.topCat?.colorHex || '#fff' }}
                                    />
                                </div>
                                
                                <span className="text-xl font-bold text-white">
                                    {Math.floor(item.totalMinutes / 60)}<span className="text-xs text-gray-400">h</span>
                                </span>
                                <span className="text-[10px] text-gray-500 uppercase font-bold mt-1 tracking-wide">
                                    {item.dayDisplay}
                                </span>

                                {/* Detail Overlay on Hover/Tap */}
                                <div className="absolute inset-0 bg-background-dark/90 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                    <span className="text-xs text-primary font-bold">{item.topCat?.name}</span>
                                    <span className="text-xs text-white">{item.totalMinutes}m total</span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default History;
