
import React from 'react';
import { Restaurant } from '../types';
import RadarChart from './RadarChart';

interface RestaurantCardProps {
  restaurant: Restaurant;
  onClick: (restaurant: Restaurant) => void;
  onDelete: (id: string) => void;
  onEdit: (restaurant: Restaurant) => void;
}

const RestaurantCard: React.FC<RestaurantCardProps> = ({ restaurant, onClick, onDelete, onEdit }) => {
  const formattedScore = restaurant.averageScore.toFixed(1);

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm(`¿Estás seguro de que quieres eliminar el registro de "${restaurant.name}"?`)) {
      onDelete(restaurant.id);
    }
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit(restaurant);
  };

  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    const text = `🍽️ *${restaurant.name}* (${restaurant.location})
⭐ Puntuación: ${formattedScore}/10
${restaurant.tags.length > 0 ? `🏷️ ${restaurant.tags.join(', ')}` : ''}

Platos destacados:
${restaurant.dishes.map(d => `- ${d.name} (${d.score})`).join('\n')}

GastroLogger App`;
    
    navigator.clipboard.writeText(text);
    alert('Resumen copiado al portapapeles');
  };

  return (
    <div 
      onClick={() => onClick(restaurant)}
      className="group bg-surface border border-border rounded-lg hover:shadow-card hover:border-primary/40 transition-all duration-300 cursor-pointer relative overflow-hidden flex flex-col"
    >
      {/* Actions - Absolute Position */}
      <div className="absolute top-4 right-4 flex gap-1 z-20 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-all">
        <button 
            onClick={handleShare}
            className="p-2 rounded-full transition-colors text-gray-300 hover:text-primary hover:bg-primary-light"
            title="Copiar resumen"
        >
            <span className="material-symbols-outlined text-[18px]">share</span>
        </button>
        <button 
            onClick={handleEdit}
            className="p-2 rounded-full transition-colors text-gray-300 hover:text-primary hover:bg-primary-light"
            title="Editar registro"
        >
            <span className="material-symbols-outlined text-[18px]">edit</span>
        </button>
        <button 
            onClick={handleDelete}
            className="p-2 rounded-full transition-colors text-gray-300 hover:text-red-600 hover:bg-red-50"
            title="Eliminar registro"
        >
            <span className="material-symbols-outlined text-[18px]">delete</span>
        </button>
      </div>

      <div className="p-5 md:p-8 flex-1">
        <div className="flex flex-col md:flex-row justify-between items-start gap-4 pr-0 md:pr-12">
            <div className="space-y-1.5 md:space-y-2 flex-1 min-w-0">
            <h3 className="font-serif font-bold text-text text-2xl md:text-3xl leading-none group-hover:text-primary transition-colors truncate">
                {restaurant.name}
            </h3>
            <div className="flex flex-wrap items-center gap-2 md:gap-3 text-xs md:text-sm text-text-light font-medium tracking-wide">
                <div className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px] md:text-[16px]">location_on</span>
                    <span className="uppercase tracking-wider">{restaurant.location}</span>
                </div>
                <span className="hidden md:inline w-px h-3 bg-gray-300"></span>
                <span className="font-mono text-xs">{restaurant.date}</span>
            </div>
            
            {/* Tags Display */}
            {restaurant.tags && restaurant.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                    {restaurant.tags.map(tag => (
                        <span key={tag} className="text-[10px] uppercase font-bold text-text-light bg-gray-100 px-2 py-0.5 rounded-full">
                            {tag}
                        </span>
                    ))}
                </div>
            )}
            </div>
            
            <div className={`flex-shrink-0 flex items-center justify-center w-12 h-12 md:w-14 md:h-14 rounded-lg border font-serif text-lg md:text-xl font-bold shadow-sm transition-colors ${
            restaurant.averageScore >= 9 
                ? 'bg-primary text-white border-primary shadow-primary/20' 
                : 'bg-white text-text border-border'
            }`}>
            {formattedScore}
            </div>
        </div>

        <div className="mt-6 md:mt-8 flex items-center justify-between">
            <div className="hidden md:flex gap-8">
            <div className="space-y-1">
                <span className="text-[9px] text-text-light font-bold uppercase tracking-widest block">Sabor</span>
                <div className="h-1.5 w-24 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-primary" style={{ width: `${restaurant.review.flavor * 10}%` }}></div>
                </div>
            </div>
            <div className="space-y-1">
                <span className="text-[9px] text-text-light font-bold uppercase tracking-widest block">Servicio</span>
                <div className="h-1.5 w-24 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-primary" style={{ width: `${restaurant.review.service * 10}%` }}></div>
                </div>
            </div>
            </div>
            
            <div className="md:hidden text-xs text-text-light font-serif italic">
                Ver detalles
            </div>

            <div className="opacity-70 group-hover:opacity-100 transition-opacity duration-500 scale-90 group-hover:scale-100">
            <RadarChart scores={restaurant.review} size={64} />
            </div>
        </div>
      </div>
      
      <div className="px-5 md:px-8 py-3 md:py-4 border-t border-gray-100 flex items-center justify-between text-xs text-text-light bg-gray-50/50">
        <div className="flex items-center gap-2 group-hover:text-primary transition-colors">
            <span className="material-symbols-outlined text-[16px] md:text-[18px]">restaurant_menu</span>
            <span className="font-medium tracking-wide">{restaurant.dishes.length} PLATO(S)</span>
        </div>
        <span className="material-symbols-outlined text-[18px] md:text-[20px] text-primary opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all duration-300">arrow_forward</span>
      </div>
    </div>
  );
};

export default RestaurantCard;
