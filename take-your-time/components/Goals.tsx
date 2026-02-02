import React, { useState } from 'react';
import { Category, TimeEntry } from '../types';
import AddCategoryModal from './AddCategoryModal';
import { saveCategory } from '../services/storageService';

interface GoalsProps {
    entries: TimeEntry[];
    categories: Category[];
    onCategoriesUpdate: () => void;
}

const Goals: React.FC<GoalsProps> = ({ entries, categories, onCategoriesUpdate }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);

    const handleNewCategory = (newCat: Category) => {
        saveCategory(newCat);
        onCategoriesUpdate();
    };

    return (
        <div className="flex flex-col h-full overflow-y-auto px-6 pb-40 no-scrollbar">
             <header className="flex items-center justify-between pt-12 pb-4 shrink-0">
                <h2 className="text-2xl font-bold tracking-tight text-white">Your Balance</h2>
                <div className="flex items-center justify-center size-10 rounded-full bg-gunmetal">
                    <span className="material-symbols-outlined text-primary">hourglass_top</span>
                </div>
            </header>
            
            <p className="text-gray-400 text-sm font-medium mb-6">Manage your focus areas and track your daily progress.</p>

            <div className="space-y-4">
                {categories.map(cat => {
                    const minutesSpent = entries
                        .filter(e => e.categoryId === cat.id)
                        .reduce((acc, curr) => acc + curr.durationMinutes, 0);
                    
                    const progress = Math.min(100, Math.round((minutesSpent / cat.dailyGoalMinutes) * 100));

                    return (
                        <div key={cat.id} className="group relative flex flex-col gap-4 bg-gunmetal/60 p-5 rounded-3xl border border-white/5 shadow-sm">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div 
                                        className="flex items-center justify-center size-12 rounded-2xl text-background-dark shadow-inner"
                                        style={{ backgroundColor: `${cat.colorHex}dd` }}
                                    >
                                        <span className="material-symbols-outlined text-xl">{cat.icon}</span>
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold leading-tight text-white">{cat.name}</h3>
                                        <p className="text-xs text-gray-400 mt-1 uppercase tracking-wider font-bold opacity-50">Goal: {cat.dailyGoalMinutes / 60} hrs</p>
                                    </div>
                                </div>
                                <div className="flex flex-col items-end">
                                    <span className="text-2xl font-black text-white">{progress}<span className="text-sm text-gray-400 font-medium">%</span></span>
                                </div>
                            </div>
                            
                            <div className="relative h-3 w-full rounded-full bg-black/40 overflow-hidden">
                                <div 
                                    className="absolute top-0 left-0 h-full rounded-full transition-all duration-1000 ease-out" 
                                    style={{ width: `${progress}%`, backgroundColor: cat.colorHex }}
                                ></div>
                            </div>
                        </div>
                    );
                })}
            </div>

            <button 
                onClick={() => setIsModalOpen(true)}
                className="w-full mt-8 flex items-center justify-center gap-2 h-16 rounded-3xl bg-white/5 border border-white/10 hover:bg-white/10 text-white text-base font-bold transition-all active:scale-95 group"
            >
                <span className="material-symbols-outlined group-hover:rotate-90 transition-transform">add</span>
                New Category
            </button>

            <AddCategoryModal 
                isOpen={isModalOpen} 
                onClose={() => setIsModalOpen(false)} 
                onSave={handleNewCategory} 
            />
        </div>
    );
};

export default Goals;