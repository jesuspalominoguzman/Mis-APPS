
import { Category, TimeEntry, UserSettings } from "../types";
import { DEFAULT_CATEGORIES } from "../constants";

const KEYS = {
    CATEGORIES: 'tyt_categories',
    ENTRIES: 'tyt_entries',
    SETTINGS: 'tyt_settings',
};

const DEFAULT_SETTINGS: UserSettings = {
    notificationsEnabled: false,
    reminderIntervalHours: 4,
    soundEnabled: true,
    hapticsEnabled: true,
    theme: 'dark', 
    language: 'en', // Default language
    ballSkin: 'default',
    jarStyle: 'default',
    adminMode: false,
    physicsGravity: 1.0,
    physicsWeight: 1.0
};

export const getCategories = (): Category[] => {
    const stored = localStorage.getItem(KEYS.CATEGORIES);
    if (!stored) {
        localStorage.setItem(KEYS.CATEGORIES, JSON.stringify(DEFAULT_CATEGORIES));
        return DEFAULT_CATEGORIES;
    }
    return JSON.parse(stored);
};

export const saveCategory = (category: Category): void => {
    const categories = getCategories();
    const index = categories.findIndex(c => c.id === category.id);
    if (index >= 0) {
        categories[index] = category;
    } else {
        categories.push(category);
    }
    localStorage.setItem(KEYS.CATEGORIES, JSON.stringify(categories));
};

export const deleteCategory = (id: string): void => {
    const categories = getCategories();
    const filtered = categories.filter(c => c.id !== id);
    localStorage.setItem(KEYS.CATEGORIES, JSON.stringify(filtered));
};

export const getEntries = (): TimeEntry[] => {
    const stored = localStorage.getItem(KEYS.ENTRIES);
    return stored ? JSON.parse(stored) : [];
};

export const addEntry = (entry: TimeEntry): void => {
    const entries = getEntries();
    entries.push(entry);
    localStorage.setItem(KEYS.ENTRIES, JSON.stringify(entries));
};

export const getTodayEntries = (): TimeEntry[] => {
    const entries = getEntries();
    const todayStr = new Date().toISOString().split('T')[0];
    return entries.filter(e => e.dateStr === todayStr);
};

// History for the "Forest" view
export const getHistory = (): Record<string, TimeEntry[]> => {
    const entries = getEntries();
    // Group by date
    return entries.reduce((acc, entry) => {
        if (!acc[entry.dateStr]) acc[entry.dateStr] = [];
        acc[entry.dateStr].push(entry);
        return acc;
    }, {} as Record<string, TimeEntry[]>);
};

export const getSettings = (): UserSettings => {
    const stored = localStorage.getItem(KEYS.SETTINGS);
    // Merge with default to ensure new keys (like theme, language) exist if upgrading
    return stored ? { ...DEFAULT_SETTINGS, ...JSON.parse(stored) } : DEFAULT_SETTINGS;
};

export const saveSettings = (settings: UserSettings): void => {
    localStorage.setItem(KEYS.SETTINGS, JSON.stringify(settings));
};

export const clearData = () => {
    localStorage.removeItem(KEYS.CATEGORIES);
    localStorage.removeItem(KEYS.ENTRIES);
    localStorage.removeItem(KEYS.SETTINGS);
};

// --- DATA MIGRATION FEATURES ---

export const exportData = (): string => {
    const data = {
        categories: getCategories(),
        entries: getEntries(),
        settings: getSettings(),
        exportDate: new Date().toISOString(),
        version: "2.0"
    };
    return JSON.stringify(data, null, 2);
};

export const importData = (jsonString: string): boolean => {
    try {
        const data = JSON.parse(jsonString);
        if (data.categories && Array.isArray(data.categories)) {
            localStorage.setItem(KEYS.CATEGORIES, JSON.stringify(data.categories));
        }
        if (data.entries && Array.isArray(data.entries)) {
            localStorage.setItem(KEYS.ENTRIES, JSON.stringify(data.entries));
        }
        if (data.settings) {
            localStorage.setItem(KEYS.SETTINGS, JSON.stringify(data.settings));
        }
        return true;
    } catch (e) {
        console.error("Import failed", e);
        return false;
    }
};
