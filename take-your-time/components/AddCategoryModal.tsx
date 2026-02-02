
import React, { useState } from 'react';
import { Category } from '../types';

interface AddCategoryModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (category: Category) => void;
}

// Removed duplicate #FDFD96
const COLORS = [
    '#E2CBF7', '#B5EAD7', '#FFB7B2', '#AEC6CF', '#FDFD96', '#FFD1DC', 
    '#B2CEFE', '#13ec80', '#FF9AA2', '#C7CEEA', '#97C1A9', '#FCB9AA',
    '#B19CD9', '#77DD77', '#FF6961', '#779ECB', '#84B6F4'
];

// 48 Icons (Divisible by 4 for 4-column grid)
const ICONS = [
    'laptop_chromebook', 'spa', 'local_cafe', 'menu_book', 
    'fitness_center', 'palette', 'code', 'self_improvement', 
    'sports_esports', 'restaurant', 'shopping_bag', 'payments', 
    'commute', 'pets', 'bed', 'theater_comedy', 
    'piano', 'camera_enhance', 'flight', 'cleaning_services', 
    'eco', 'celebration', 'shopping_cart', 'fastfood', 
    'local_pizza', 'icecream', 'directions_run', 'directions_bike', 
    'hiking', 'sailing', 'auto_stories', 'school', 
    'work', 'terminal', 'brush', 'music_note', 
    'movie', 'videogame_asset', 'sports_baseball', 'sports_tennis', 
    'home', 'sunny', 'nightlight', 'psychology', 
    'group', 'family_restroom', 'rocket_launch', 'diamond'
];

const AddCategoryModal: React.FC<AddCategoryModalProps> = ({ isOpen, onClose, onSave }) => {
    const [name, setName] = useState('');
    const [selectedColor, setSelectedColor] = useState(COLORS[0]);
    const [selectedIcon, setSelectedIcon] = useState(ICONS[0]);
    const [goalHours, setGoalHours] = useState(2);

    if (!isOpen) return null;

    const handleSave = () => {
        if (!name.trim()) return;
        
        // Use a more robust ID generation than just Date.now() if called rapidly
        const newCat: Category = {
            id: `${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            name: name.trim(),
            dailyGoalMinutes: goalHours * 60,
            colorHex: selectedColor,
            icon: selectedIcon
        };
        
        onSave(newCat);
        onClose();
        setName(''); // Reset form
        setGoalHours(2);
        setSelectedColor(COLORS[0]);
        setSelectedIcon(ICONS[0]);
    };

    return (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/90 backdrop-blur-xl p-4 animate-[fadeIn_0.2s]">
            {/* Widened to max-w-lg for better spacing */}
            <div className="bg-[#1C1C1E] w-full max-w-lg rounded-[40px] p-8 border border-white/10 shadow-2xl animate-[scaleIn_0.3s_ease-out] flex flex-col max-h-[85vh] mb-12 relative">
                
                <button 
                    onClick={onClose}
                    className="absolute top-6 right-6 text-white/30 hover:text-white transition-colors"
                >
                    <span className="material-symbols-outlined">close</span>
                </button>

                <h3 className="text-2xl font-black text-white mb-6 tracking-tight shrink-0">New Category</h3>
                
                <div className="space-y-6 overflow-y-auto no-scrollbar pb-4 flex-1 px-1">
                    <div>
                        <label className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] mb-3 block">Name</label>
                        <input 
                            type="text" 
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g. Gaming Room"
                            className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white focus:border-primary focus:bg-white/10 outline-none transition-all placeholder:text-white/10"
                        />
                    </div>

                    <div>
                        <label className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] mb-3 block">Icon</label>
                        <div className="grid grid-cols-6 gap-2 border border-white/5 rounded-3xl p-3 bg-black/20">
                            {ICONS.map(icon => (
                                <button
                                    key={icon}
                                    onClick={() => setSelectedIcon(icon)}
                                    className={`aspect-square rounded-2xl flex items-center justify-center transition-all ${selectedIcon === icon ? 'bg-primary text-black scale-105 font-bold shadow-lg shadow-primary/30' : 'bg-white/5 text-white/40 hover:bg-white/10'}`}
                                >
                                    <span className="material-symbols-outlined text-xl">{icon}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] mb-3 block">Color</label>
                        {/* Added padding (p-2) and increased gap to prevent edge clipping when scaled */}
                        <div className="flex flex-wrap gap-3 p-2">
                            {COLORS.map(color => (
                                <button
                                    key={color}
                                    onClick={() => setSelectedColor(color)}
                                    className={`w-8 h-8 rounded-full border-2 transition-all duration-300 ${selectedColor === color ? 'border-white scale-125 shadow-[0_0_15px_rgba(255,255,255,0.3)]' : 'border-transparent hover:scale-110'}`}
                                    style={{ backgroundColor: color }}
                                />
                            ))}
                        </div>
                    </div>

                    <div>
                        <div className="flex justify-between items-center mb-3">
                            <label className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">Goal</label>
                            <span className="text-primary font-black text-sm">{goalHours}h / day</span>
                        </div>
                        <input 
                            type="range" min="1" max="12" step="1" 
                            value={goalHours} 
                            onChange={(e) => setGoalHours(parseInt(e.target.value))}
                            className="w-full accent-primary bg-white/5 rounded-lg h-2 appearance-none cursor-pointer"
                        />
                    </div>
                </div>

                <div className="flex gap-4 mt-6 shrink-0 pt-4 border-t border-white/5">
                    <button onClick={onClose} className="flex-1 py-4 text-white/40 font-bold hover:text-white transition-colors">Cancel</button>
                    <button onClick={handleSave} className="flex-1 py-4 bg-primary text-black rounded-2xl font-black shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all">Create</button>
                </div>
            </div>
        </div>
    );
};

export default AddCategoryModal;
