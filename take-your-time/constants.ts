
import { Category } from "./types";

export const DEFAULT_CATEGORIES: Category[] = [
    { id: '1', name: 'Work', dailyGoalMinutes: 480, colorHex: '#E2CBF7', icon: 'laptop_chromebook' }, // Pastel Purple
    { id: '2', name: 'Wellness', dailyGoalMinutes: 90, colorHex: '#B5EAD7', icon: 'spa' }, // Pastel Green
    { id: '3', name: 'Leisure', dailyGoalMinutes: 120, colorHex: '#FFB7B2', icon: 'local_cafe' }, // Pastel Pink
    { id: '4', name: 'Study', dailyGoalMinutes: 180, colorHex: '#AEC6CF', icon: 'menu_book' }, // Pastel Blue
];

export const THEME_COLORS = {
    primary: '#13ec80',
    background: '#2C2C2C',
    card: '#3D3D3D',
};

export const MOCK_INITIAL_DATA = false; 

export const TRANSLATIONS = {
    en: {
        statsTitle: "Your Insights",
        statsSubtitle: "Analyze your flow",
        today: "Today",
        week: "Week",
        all: "All Time",
        total: "Total",
        aiCoach: "AI Coach",
        aiPrompt: "Analyze My Day",
        aiLoading: "Analyzing habits...",
        aiDesc: "Get personalized, data-driven advice based on your actual goals.",
        journey: "Your Journey",
        chronicle: "Chronicle",
        noData: "No data yet. Start tracking!",
        manualEntry: "Manual Entry",
        focusTimer: "Focus Timer",
        startSession: "Start Session",
        logActivity: "Log Activity",
        giveUp: "Give Up",
        forging: "Forging Golden Ball",
        focusActive: "Focus mode active.",
        settings: "Settings",
        appearance: "Appearance",
        language: "Language",
        physics: "Physics Playground",
        gravity: "Gravity",
        weight: "Ball Weight",
        haptics: "Haptic Feedback",
        reminders: "Reminders",
        admin: "Admin Mode",
        newCat: "New Category",
        lifetimeStats: "Lifetime Stats",
        totalHours: "Total Hours",
        totalSessions: "Total Sessions",
        totalPomodoros: "Golden Balls",
        totalBalls: "Total Balls",
        dangerZone: "Danger Zone",
        resetData: "Reset All Data",
        resetConfirm: "Are you sure? This will wipe all your history and settings."
    },
    es: {
        statsTitle: "Resumen",
        statsSubtitle: "Analiza tu flujo",
        today: "Hoy",
        week: "Semana",
        all: "Todo",
        total: "Total",
        aiCoach: "Entrenador IA",
        aiPrompt: "Analizar mi día",
        aiLoading: "Analizando hábitos...",
        aiDesc: "Obtén consejos reales basados en tus objetivos y datos.",
        journey: "Tu Viaje",
        chronicle: "Crónica",
        noData: "Sin datos. ¡Empieza a trackear!",
        manualEntry: "Manual",
        focusTimer: "Pomodoro",
        startSession: "Iniciar Sesión",
        logActivity: "Registrar",
        giveUp: "Rendirse",
        forging: "Forjando Bola Dorada",
        focusActive: "Modo concentración activo.",
        settings: "Ajustes",
        appearance: "Apariencia",
        language: "Idioma",
        physics: "Físicas",
        gravity: "Gravedad",
        weight: "Peso Bola",
        haptics: "Vibración",
        reminders: "Recordatorios",
        admin: "Modo Admin",
        newCat: "Nueva Categoría",
        lifetimeStats: "Estadísticas Globales",
        totalHours: "Horas Totales",
        totalSessions: "Sesiones",
        totalPomodoros: "Bolas Doradas",
        totalBalls: "Bolas Totales",
        dangerZone: "Zona de Peligro",
        resetData: "Borrar Datos",
        resetConfirm: "¿Estás seguro? Esto borrará todo tu historial y configuración."
    }
};
