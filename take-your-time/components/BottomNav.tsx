
import React from 'react';
import { ViewState } from '../types';

interface BottomNavProps {
    currentView: ViewState;
    onChange: (view: ViewState) => void;
}

const BottomNav: React.FC<BottomNavProps> = ({ currentView, onChange }) => {
    // Removed 'history' tab as it's merged into 'stats'
    const navItems: { id: ViewState, icon: string, filled: boolean }[] = [
        { id: 'home', icon: 'hourglass_bottom', filled: true },
        { id: 'stats', icon: 'donut_large', filled: false }, // Changed icon to donut to represent Insights
        { id: 'customize', icon: 'palette', filled: true },
        { id: 'goals', icon: 'flag', filled: true },
    ];

    return (
        <div className="fixed bottom-6 left-0 right-0 flex justify-center px-6 pointer-events-none z-50">
            <div className="pointer-events-auto bg-white/90 dark:bg-[#1E1E1E]/95 backdrop-blur-xl border border-black/5 dark:border-white/10 rounded-full px-2 py-2 flex items-center gap-1 shadow-[0_10px_40px_rgba(0,0,0,0.15)] dark:shadow-[0_10px_40px_rgba(0,0,0,0.5)] transition-colors duration-500">
                {navItems.map((item) => {
                    const isActive = currentView === item.id;
                    return (
                        <button
                            key={item.id}
                            onClick={() => onChange(item.id)}
                            className={`
                                flex items-center justify-center w-12 h-12 rounded-full transition-all duration-300 relative
                                ${isActive 
                                    ? 'bg-primary text-background-dark shadow-[0_0_20px_rgba(19,236,128,0.3)] -translate-y-2 scale-110' 
                                    : 'text-gray-400 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5'}
                            `}
                        >
                            <span className={`material-symbols-outlined text-[20px] ${item.filled ? 'filled' : ''}`}>
                                {item.icon}
                            </span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
};

export default BottomNav;
