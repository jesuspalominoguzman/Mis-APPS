
import React, { useState, useEffect, useRef } from 'react';
import { Restaurant, ReviewDimensions, Dish, DishCategory } from '../types';
import RadarChart from './RadarChart';

interface QuickEntryProps {
  initialData?: Restaurant;
  onSave: (restaurant: Restaurant) => void;
  onCancel: () => void;
}

const initialScores: ReviewDimensions = {
  flavor: 5, texture: 5, creativity: 5, service: 5,
  acoustics: 5, lighting: 5, quality: 5, value: 5
};

const dimensionLabels: Record<keyof ReviewDimensions, string> = {
  flavor: 'Sabor',
  texture: 'Texturas',
  creativity: 'Creatividad',
  service: 'Servicio',
  acoustics: 'Acústica',
  lighting: 'Iluminación',
  quality: 'Calidad',
  value: 'Valor/Precio'
};

const QuickEntry: React.FC<QuickEntryProps> = ({ initialData, onSave, onCancel }) => {
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [date, setDate] = useState(new Date().toLocaleDateString('es-ES'));
  const [scores, setScores] = useState<ReviewDimensions>(initialScores);
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  
  // Ref para guardar el estado inicial y comparar al cerrar
  const originalStateRef = useRef<string>('');

  // Dish Input State
  const [dishName, setDishName] = useState('');
  const [dishCategory, setDishCategory] = useState<DishCategory>('Principal');
  const [dishScore, setDishScore] = useState(5);
  const [dishNotes, setDishNotes] = useState('');

  // Tag Input State
  const [tagInput, setTagInput] = useState('');

  // Cargar datos y guardar snapshot inicial
  useEffect(() => {
    if (initialData) {
      setName(initialData.name);
      setLocation(initialData.location);
      setDate(initialData.date);
      setScores(initialData.review);
      setDishes(initialData.dishes);
      setTags(initialData.tags || []);
      
      originalStateRef.current = JSON.stringify({
        name: initialData.name,
        location: initialData.location,
        date: initialData.date,
        review: initialData.review,
        dishes: initialData.dishes,
        tags: initialData.tags || []
      });
    } else {
      // Estado por defecto
      originalStateRef.current = JSON.stringify({
        name: '',
        location: '',
        date: new Date().toLocaleDateString('es-ES'),
        review: initialScores,
        dishes: [],
        tags: []
      });
    }
  }, [initialData]);

  const handleSafeCancel = () => {
    // Construir estado actual
    const currentState = {
        name,
        location,
        date,
        review: scores,
        dishes,
        tags
    };

    // Comprobar si hay cambios
    if (JSON.stringify(currentState) !== originalStateRef.current) {
        if (window.confirm('¿Tienes cambios sin guardar. ¿Seguro que quieres descartarlos y cerrar?')) {
            onCancel();
        }
    } else {
        onCancel();
    }
  };

  const handleScoreChange = (key: keyof ReviewDimensions, val: number) => {
    setScores(prev => ({ ...prev, [key]: val }));
  };

  const addDish = () => {
    if (!dishName) return;
    const newDish: Dish = {
      id: Math.random().toString(36).substr(2, 9),
      name: dishName,
      category: dishCategory,
      score: dishScore,
      notes: dishNotes
    };
    setDishes([...dishes, newDish]);
    setDishName('');
    setDishNotes('');
    setDishScore(5);
  };

  const addTag = () => {
    if (!tagInput.trim()) return;
    if (!tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
    }
    setTagInput('');
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(t => t !== tagToRemove));
  };

  const handleSave = () => {
    if (!name) return;
    const totalScore = (Object.values(scores) as number[]).reduce((a, b) => a + b, 0);
    const avg = totalScore / 8;
    
    const restaurantToSave: Restaurant = {
      id: initialData ? initialData.id : Math.random().toString(36).substr(2, 9),
      name,
      location,
      date,
      tags,
      review: scores,
      dishes,
      averageScore: avg
    };
    onSave(restaurantToSave);
  };

  return (
    <div className="fixed inset-0 bg-bg z-50 flex flex-col animate-in slide-in-from-bottom-4 duration-300">
      
      {/* 1. Fixed Header */}
      <div className="flex-none bg-surface border-b border-border px-4 md:px-6 py-3 md:py-4 flex justify-between items-center shadow-sm z-10">
         <h2 className="font-serif text-lg md:text-xl font-bold text-text truncate pr-4">
            {initialData ? 'Editar Experiencia' : 'Nueva Experiencia'}
         </h2>
         <button 
            onClick={handleSafeCancel}
            className="w-8 h-8 flex-shrink-0 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors text-text-light"
         >
            <span className="material-symbols-outlined">close</span>
         </button>
      </div>

      {/* 2. Scrollable Content */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden">
        <div className="max-w-5xl mx-auto p-4 md:p-10 pb-32">
          
          <div className="grid lg:grid-cols-12 gap-8 md:gap-16">
            
            {/* Left Column: Details & Dishes */}
            <div className="lg:col-span-7 space-y-8 md:space-y-10">
              
              {/* Restaurant Info */}
              <div className="space-y-6">
                <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-text-light mb-1">Restaurante</label>
                    <input 
                      placeholder="Nombre del lugar..."
                      value={name}
                      onChange={e => setName(e.target.value)}
                      className="w-full text-2xl md:text-3xl font-serif font-bold bg-transparent border-b border-gray-200 py-2 placeholder:text-gray-300 focus:border-primary transition-colors rounded-none leading-tight"
                    />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-[10px] font-bold uppercase tracking-widest text-text-light mb-1">Ubicación</label>
                        <input 
                        placeholder="Ciudad o zona"
                        value={location}
                        onChange={e => setLocation(e.target.value)}
                        className="w-full text-lg font-sans bg-transparent border-b border-gray-200 py-2 placeholder:text-gray-300 focus:border-primary transition-colors rounded-none"
                        />
                    </div>
                    <div>
                        <label className="block text-[10px] font-bold uppercase tracking-widest text-text-light mb-1">Fecha</label>
                        <input 
                        placeholder="DD/MM/AAAA"
                        value={date}
                        onChange={e => setDate(e.target.value)}
                        className="w-full text-lg font-sans bg-transparent border-b border-gray-200 py-2 placeholder:text-gray-300 focus:border-primary transition-colors rounded-none"
                        />
                    </div>
                </div>

                {/* Tags Input */}
                <div>
                   <label className="block text-[10px] font-bold uppercase tracking-widest text-text-light mb-2">Etiquetas</label>
                   <div className="flex flex-wrap items-center gap-2 mb-2">
                      {tags.map(tag => (
                        <span key={tag} className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-text">
                            {tag}
                            <button onClick={() => removeTag(tag)} className="ml-1.5 text-gray-400 hover:text-red-500">
                                <span className="material-symbols-outlined text-[14px]">close</span>
                            </button>
                        </span>
                      ))}
                      <div className="flex items-center gap-2">
                        <input 
                            placeholder="+ Etiqueta..."
                            value={tagInput}
                            onChange={e => setTagInput(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && addTag()}
                            className="bg-transparent text-sm min-w-[100px] outline-none placeholder:text-gray-300"
                        />
                        {tagInput && (
                            <button onClick={addTag} className="text-primary hover:text-primary-dark">
                                <span className="material-symbols-outlined text-[18px]">check</span>
                            </button>
                        )}
                      </div>
                   </div>
                   <p className="text-[10px] text-gray-400">Ej: Romántico, Michelin, Barato, Negocios (Enter para añadir)</p>
                </div>
              </div>

              {/* Dishes Section */}
              <div>
                <div className="flex items-center justify-between border-b border-border pb-3 mb-6">
                    <h3 className="font-serif text-xl font-bold text-text">Platos & Notas</h3>
                    <span className="text-xs font-mono text-text-light">{dishes.length} ITEMS</span>
                </div>

                {/* List of added dishes */}
                <div className="space-y-3 mb-8">
                  {dishes.map(dish => (
                    <div key={dish.id} className="relative p-4 bg-white border border-gray-200 shadow-sm hover:border-primary/30 transition-all group rounded-lg">
                      <div className="flex justify-between items-start pr-10 md:pr-8">
                         <div>
                           <div className="flex items-center gap-2 mb-1.5">
                             <span className="text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 bg-gray-100 text-text-light rounded-sm">{dish.category}</span>
                           </div>
                           <span className="font-serif font-bold text-lg text-text leading-snug">{dish.name}</span>
                           {dish.notes && <p className="text-sm text-text-light mt-1.5 font-serif italic leading-relaxed opacity-80">"{dish.notes}"</p>}
                         </div>
                         <div className="flex flex-col items-end">
                           <span className="font-mono text-xl font-bold text-primary">{dish.score}</span>
                         </div>
                      </div>
                      <button 
                           onClick={() => setDishes(dishes.filter(d => d.id !== dish.id))}
                           className="absolute top-3 right-3 p-1 text-gray-300 hover:text-red-500 transition-colors"
                         >
                           <span className="material-symbols-outlined text-[20px]">delete</span>
                      </button>
                    </div>
                  ))}
                  {dishes.length === 0 && (
                    <div className="py-6 text-center border-2 border-dashed border-gray-200 rounded-lg">
                        <p className="text-gray-400 font-serif italic text-sm">Añada los platos destacados aquí</p>
                    </div>
                  )}
                </div>

                {/* Add Dish Form */}
                <div className="bg-gray-50 p-4 md:p-6 rounded-xl border border-gray-200">
                   <h4 className="text-xs font-bold uppercase tracking-widest text-text-light mb-4 flex items-center gap-2">
                      <span className="material-symbols-outlined text-[16px]">add_circle</span> Añadir Plato
                   </h4>
                   
                   <div className="grid grid-cols-1 md:grid-cols-4 gap-3 md:gap-4 mb-3 md:mb-4">
                      <div className="md:col-span-3">
                        <input 
                            placeholder="Nombre del plato..."
                            value={dishName}
                            onChange={e => setDishName(e.target.value)}
                            className="w-full bg-white border border-gray-200 px-3 py-3 text-base font-medium rounded focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                        />
                      </div>
                      <div className="md:col-span-1">
                        <select 
                            value={dishCategory}
                            onChange={e => setDishCategory(e.target.value as DishCategory)}
                            className="w-full bg-white border border-gray-200 px-3 py-3 text-xs font-bold uppercase text-text cursor-pointer rounded focus:border-primary"
                        >
                            <option value="Entrante">Entrante</option>
                            <option value="Principal">Principal</option>
                            <option value="Postre">Postre</option>
                            <option value="Vino">Vino</option>
                        </select>
                      </div>
                   </div>
                   
                   <textarea 
                        placeholder="Notas de sabor, texturas..."
                        value={dishNotes}
                        onChange={e => setDishNotes(e.target.value)}
                        className="w-full bg-white border border-gray-200 px-3 py-3 text-sm h-20 resize-none font-serif placeholder:text-gray-300 rounded mb-4 focus:border-primary focus:ring-1 focus:ring-primary"
                   />
                   
                   <div className="bg-white p-4 border border-gray-200 rounded-lg">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div className="flex items-center gap-4 w-full md:w-auto">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-text-light shrink-0">Puntuación</label>
                                <div className="flex items-center gap-3 flex-1 md:flex-initial">
                                    <input 
                                        type="range" min="0" max="10" step="0.5"
                                        value={dishScore}
                                        onChange={e => setDishScore(Number(e.target.value))}
                                        className="w-full md:w-24 h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary"
                                    />
                                    <span className="font-mono text-xl font-bold text-primary min-w-[32px] text-right">{dishScore}</span>
                                </div>
                            </div>
                            <button 
                                onClick={addDish}
                                disabled={!dishName}
                                className="w-full md:w-auto px-6 py-2.5 bg-text text-white text-xs uppercase font-bold tracking-widest hover:bg-primary transition-all disabled:opacity-50 disabled:cursor-not-allowed rounded shadow-sm flex justify-center"
                            >
                                Añadir
                            </button>
                        </div>
                   </div>
                </div>
              </div>
            </div>

            {/* Right Column: Scoring */}
            <div className="lg:col-span-5">
              <div className="lg:sticky lg:top-8 bg-white lg:bg-transparent p-5 md:p-6 lg:p-0 rounded-xl border border-gray-200 lg:border-0 shadow-sm lg:shadow-none">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-text-light mb-6 border-b border-border pb-2">Evaluación Sensorial</h3>
                  
                  <div className="space-y-6 md:space-y-5 mb-8">
                      {(Object.keys(scores) as Array<keyof ReviewDimensions>).map(key => (
                      <div key={key} className="group">
                          <div className="flex justify-between items-center mb-2">
                              <label className="text-sm font-medium text-text font-serif">{dimensionLabels[key]}</label>
                              <span className="font-mono text-xs font-bold text-primary bg-primary/5 px-2 py-0.5 rounded">{scores[key]}</span>
                          </div>
                          <input 
                            type="range" 
                            min="0" max="10" step="0.5"
                            value={scores[key]}
                            onChange={e => handleScoreChange(key, parseFloat(e.target.value))}
                            className="w-full h-2 md:h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary group-hover:accent-primary-dark transition-all"
                          />
                      </div>
                      ))}
                  </div>
                  
                  <div className="flex justify-center items-center py-6 bg-white rounded-xl border border-gray-100 shadow-sm">
                      <RadarChart scores={scores} size={200} />
                  </div>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* 3. Sticky Action Footer */}
      <div className="flex-none bg-surface border-t border-border p-4 md:px-8 z-20 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
        <div className="max-w-5xl mx-auto flex flex-col-reverse md:flex-row justify-end gap-3 md:gap-4">
            <button 
                onClick={handleSafeCancel} 
                className="w-full md:w-auto px-6 py-3 text-sm font-bold text-text-light hover:text-text transition-colors text-center"
            >
                CANCELAR
            </button>
            <button 
                onClick={handleSave} 
                className="w-full md:w-auto px-8 py-3 bg-primary text-white text-sm font-bold tracking-widest hover:bg-primary-dark hover:shadow-lg transition-all rounded shadow-md text-center"
            >
                {initialData ? 'ACTUALIZAR' : 'GUARDAR REGISTRO'}
            </button>
        </div>
      </div>
    </div>
  );
};

export default QuickEntry;
