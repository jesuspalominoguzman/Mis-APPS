
import React, { useState, useEffect, useRef } from 'react';
import { Restaurant } from './types';
import RestaurantCard from './components/RestaurantCard';
import QuickEntry from './components/RestaurantDetail';
import { db } from './db';

type ViewState = 'HISTORY' | 'RANKING';

const App: React.FC = () => {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [view, setView] = useState<ViewState>('HISTORY');
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRestaurant, setEditingRestaurant] = useState<Restaurant | undefined>(undefined);

  // Search State
  const [searchTerm, setSearchTerm] = useState('');
  
  // File Input Ref
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Cargar datos
  useEffect(() => {
    const data = db.getAll();
    setRestaurants(data);
  }, []);

  // Filter Logic
  const filteredRestaurants = restaurants.filter(r => {
    const term = searchTerm.toLowerCase();
    return (
        r.name.toLowerCase().includes(term) ||
        r.location.toLowerCase().includes(term) ||
        (r.tags && r.tags.some(tag => tag.toLowerCase().includes(term))) ||
        r.dishes.some(d => d.name.toLowerCase().includes(term))
    );
  });

  const allDishes = filteredRestaurants.flatMap(r => r.dishes.map(d => ({ ...d, restaurantName: r.name })))
    .sort((a, b) => b.score - a.score);

  // --- CRUD Handlers ---

  const handleOpenAdd = () => {
    setEditingRestaurant(undefined);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (restaurant: Restaurant) => {
    setEditingRestaurant(restaurant);
    setIsModalOpen(true);
  };

  const handleSaveRestaurant = (entry: Restaurant) => {
    if (editingRestaurant) {
        // Update existing
        const updatedData = db.update(entry);
        setRestaurants(updatedData);
    } else {
        // Create new
        const updatedData = db.add(entry);
        setRestaurants(updatedData);
    }
    setIsModalOpen(false);
    setEditingRestaurant(undefined);
  };

  const handleDeleteRestaurant = (id: string) => {
    const updatedData = db.delete(id);
    setRestaurants(updatedData);
  };

  // --- Import/Export Handlers ---

  const handleExportData = () => {
    const dataStr = JSON.stringify(restaurants, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `gastro-logger-backup-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const triggerImport = () => {
    if (fileInputRef.current) fileInputRef.current.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const json = JSON.parse(e.target?.result as string);
        if (Array.isArray(json)) {
            const updated = db.importData(json);
            setRestaurants(updated);
            alert('Datos importados correctamente. Se han fusionado con los existentes.');
        } else {
            alert('El archivo no tiene el formato correcto.');
        }
      } catch (error) {
        console.error(error);
        alert('Error al leer el archivo JSON.');
      }
    };
    reader.readAsText(file);
    // Reset input
    event.target.value = '';
  };

  return (
    <div className="min-h-screen bg-bg text-text pb-24 font-sans selection:bg-primary-light selection:text-primary">
      {/* Hidden File Input */}
      <input 
        type="file" 
        accept=".json" 
        ref={fileInputRef} 
        onChange={handleFileChange} 
        className="hidden" 
      />

      {/* Top Bar */}
      <header className="bg-surface/80 backdrop-blur-md border-b border-border sticky top-0 z-30 transition-all">
        <div className="max-w-5xl mx-auto px-4 md:px-6 py-3">
            {/* Row 1: Logo & Actions */}
            <div className="flex items-center justify-between h-12 md:h-14">
                <div className="flex items-center gap-3 md:gap-4">
                    <div className="w-8 h-8 md:w-10 md:h-10 bg-primary text-white flex items-center justify-center font-serif font-bold text-lg md:text-xl rounded-sm shadow-md">
                        G
                    </div>
                    <h1 className="font-serif font-bold text-xl md:text-2xl tracking-tight text-text hidden xs:block">Gastro<span className="font-light italic text-primary">Logger</span></h1>
                </div>
                
                <div className="flex items-center gap-2 md:gap-4">
                    <div className="flex gap-2 md:gap-6 text-xs md:text-sm font-medium tracking-wide mr-2">
                        <button 
                        onClick={() => setView('HISTORY')}
                        className={`relative py-1 transition-colors ${view === 'HISTORY' ? 'text-primary font-bold' : 'text-text-light hover:text-text'}`}
                        >
                        HISTORIAL
                        {view === 'HISTORY' && <span className="absolute -bottom-1 left-0 w-full h-0.5 bg-primary"></span>}
                        </button>
                        <button 
                        onClick={() => setView('RANKING')}
                        className={`relative py-1 transition-colors ${view === 'RANKING' ? 'text-primary font-bold' : 'text-text-light hover:text-text'}`}
                        >
                        TOP PLATOS
                        {view === 'RANKING' && <span className="absolute -bottom-1 left-0 w-full h-0.5 bg-primary"></span>}
                        </button>
                    </div>
                    
                    <div className="h-6 w-px bg-gray-200 mx-1"></div>

                    {/* Import/Export Buttons */}
                    <button 
                        onClick={triggerImport}
                        className="text-text-light hover:text-primary transition-colors p-2 rounded-full hover:bg-gray-100"
                        title="Importar (Restaurar copia)"
                    >
                        <span className="material-symbols-outlined text-[20px]">upload</span>
                    </button>
                    <button 
                        onClick={handleExportData}
                        className="text-text-light hover:text-primary transition-colors p-2 rounded-full hover:bg-gray-100"
                        title="Exportar copia de seguridad"
                    >
                        <span className="material-symbols-outlined text-[20px]">download</span>
                    </button>
                </div>
            </div>

            {/* Row 2: Search Bar (Integrated) */}
            <div className="mt-2 pb-2">
                <div className="relative max-w-md mx-auto md:mx-0 w-full">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 material-symbols-outlined text-[18px]">search</span>
                    <input 
                        type="text"
                        placeholder="Buscar por nombre, plato, etiqueta..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-gray-100 border-none rounded-md py-2 pl-10 pr-4 text-sm focus:ring-1 focus:ring-primary placeholder:text-gray-400"
                    />
                </div>
            </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-4 md:px-6 py-8">
        
        {view === 'HISTORY' && (
          <div className="space-y-6 md:space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-700">
            <div className="flex justify-between items-end border-b border-border pb-3 md:pb-4 mb-6 md:mb-8">
              <h2 className="font-serif text-2xl md:text-3xl font-bold text-text">Diario</h2>
              <span className="text-[10px] md:text-xs font-mono text-text-light bg-white px-2 md:px-3 py-1 border border-border">
                  {filteredRestaurants.length} {filteredRestaurants.length === 1 ? 'REGISTRO' : 'REGISTROS'}
              </span>
            </div>
            
            <div className="grid gap-4 md:gap-6">
              {filteredRestaurants.map(r => (
                <RestaurantCard 
                  key={r.id} 
                  restaurant={r} 
                  onClick={(rest) => handleOpenEdit(rest)} 
                  onDelete={handleDeleteRestaurant}
                  onEdit={handleOpenEdit}
                />
              ))}
              {filteredRestaurants.length === 0 && (
                <div className="py-20 text-center text-text-light font-serif italic border border-dashed border-border rounded-lg">
                  {searchTerm ? 'No se encontraron resultados para tu búsqueda.' : 'Su diario está vacío. Comience a registrar sus experiencias.'}
                </div>
              )}
            </div>
          </div>
        )}

        {view === 'RANKING' && (
          <div className="space-y-6 md:space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-700">
             <div className="flex justify-between items-end border-b border-border pb-3 md:pb-4 mb-6 md:mb-8">
              <h2 className="font-serif text-2xl md:text-3xl font-bold text-text">Fama</h2>
              <span className="text-[10px] md:text-xs font-mono text-text-light bg-white px-2 md:px-3 py-1 border border-border">{allDishes.length} PLATOS</span>
            </div>

            <div className="bg-surface border border-border shadow-sm">
              {allDishes.map((dish, i) => (
                <div key={dish.id} className="flex items-center p-4 md:p-6 border-b border-border last:border-0 hover:bg-gray-50 transition-colors group">
                  <div className="w-8 md:w-16 font-serif text-2xl md:text-3xl font-bold text-gray-200 group-hover:text-primary/40 transition-colors">#{i+1}</div>
                  <div className="flex-1 px-3 md:px-4 border-l border-border">
                    <div className="font-serif text-lg md:text-xl font-bold text-text group-hover:text-primary transition-colors">{dish.name}</div>
                    <div className="text-[10px] md:text-xs text-text-light mt-1 flex flex-wrap items-center gap-2 md:gap-3">
                      <span className="uppercase tracking-widest font-bold">{dish.category}</span>
                      <span className="text-gray-300">|</span>
                      {/* @ts-ignore dynamic prop */}
                      <span className="italic font-serif truncate max-w-[120px] md:max-w-none">{dish.restaurantName}</span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end pl-2">
                     <span className={`font-mono text-xl md:text-2xl font-bold ${dish.score === 10 ? 'text-primary' : 'text-text'}`}>{dish.score}</span>
                     {dish.score >= 9.5 && <span className="text-[8px] md:text-[10px] uppercase font-bold tracking-widest text-primary mt-1 border-t border-primary pt-0.5 hidden sm:block">Excepcional</span>}
                  </div>
                </div>
              ))}
              {allDishes.length === 0 && (
                 <div className="p-8 text-center text-text-light italic">No hay platos que coincidan con la búsqueda.</div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Floating Action Button */}
      <div className="fixed bottom-8 right-8 md:bottom-12 md:right-12 z-40">
        <button 
          onClick={handleOpenAdd}
          className="group h-14 w-14 md:h-16 md:w-16 bg-primary text-white shadow-floating flex items-center justify-center hover:bg-primary-dark transition-all duration-300 rounded-sm"
        >
          <span className="material-symbols-outlined text-2xl md:text-3xl font-light">add</span>
        </button>
      </div>

      {/* Entry Modal */}
      {isModalOpen && (
        <QuickEntry 
          initialData={editingRestaurant}
          onSave={handleSaveRestaurant}
          onCancel={() => { setIsModalOpen(false); setEditingRestaurant(undefined); }}
        />
      )}
    </div>
  );
};

export default App;
