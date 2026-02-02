
import { Restaurant } from './types';

const DB_KEY = 'gastro_logger_db_v1';

const initialMockData: Restaurant[] = [
  {
    id: '1', name: 'Osteria Francescana', location: 'Módena', date: '10/12/2023',
    tags: ['Michelin', 'Italiano', 'Romántico'],
    review: { flavor: 9.5, texture: 9, creativity: 10, service: 9.5, acoustics: 8, lighting: 9, quality: 10, value: 8 },
    averageScore: 9.1,
    dishes: [
      { id: 'd1', name: 'Las Cinco Edades del Parmigiano', category: 'Principal', score: 10, notes: 'Las texturas son alucinantes. Contraste de temperatura magistral.' },
      { id: 'd2', name: '¡Ups! Se me ha caído la tarta de limón', category: 'Postre', score: 9.5, notes: 'Caos en el plato. Acidez perfectamente equilibrada.' }
    ]
  },
  {
    id: '2', name: 'Noma', location: 'Copenhague', date: '02/05/2024',
    tags: ['Nordico', 'Experimental', 'Viaje'],
    review: { flavor: 9, texture: 10, creativity: 10, service: 10, acoustics: 9, lighting: 8, quality: 10, value: 7 },
    averageScore: 9.1,
    dishes: [
      { id: 'd3', name: 'Custard de Sesos de Reno', category: 'Entrante', score: 8.5, notes: 'Desafiante pero técnicamente perfecto.' },
      { id: 'd4', name: 'Tarta de Flores', category: 'Postre', score: 9, notes: 'Visualmente hermosa, notas florales sutiles y elegantes.' }
    ]
  }
];

export const db = {
  // Obtener todos los registros
  getAll: (): Restaurant[] => {
    try {
      const stored = localStorage.getItem(DB_KEY);
      if (!stored) {
        localStorage.setItem(DB_KEY, JSON.stringify(initialMockData));
        return initialMockData;
      }
      return JSON.parse(stored);
    } catch (e) {
      console.error("Error leyendo base de datos", e);
      return [];
    }
  },

  // Añadir un nuevo registro
  add: (restaurant: Restaurant): Restaurant[] => {
    const current = db.getAll();
    const updated = [restaurant, ...current];
    localStorage.setItem(DB_KEY, JSON.stringify(updated));
    return updated;
  },

  // Actualizar un registro existente
  update: (restaurant: Restaurant): Restaurant[] => {
    const current = db.getAll();
    const updated = current.map(r => r.id === restaurant.id ? restaurant : r);
    localStorage.setItem(DB_KEY, JSON.stringify(updated));
    return updated;
  },

  // Borrar un registro
  delete: (id: string): Restaurant[] => {
    const current = db.getAll();
    const updated = current.filter(r => r.id !== id);
    localStorage.setItem(DB_KEY, JSON.stringify(updated));
    return updated;
  },

  // Importar datos (Fusionar evitando duplicados por ID)
  importData: (importedData: Restaurant[]): Restaurant[] => {
    const current = db.getAll();
    const currentIds = new Set(current.map(r => r.id));
    
    // Filtrar los que ya existen para no duplicar (o podrías decidir sobrescribir)
    // En este caso, añadimos solo los nuevos IDs
    const newEntries = importedData.filter(r => !currentIds.has(r.id));
    
    // Si queremos que la importación actualice datos existentes, usaríamos otra lógica.
    // Para simplificar "Restore", concatenamos lo nuevo.
    const updated = [...newEntries, ...current];
    
    localStorage.setItem(DB_KEY, JSON.stringify(updated));
    return updated;
  }
};
