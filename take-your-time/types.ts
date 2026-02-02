
export interface Category {
    id: string;
    name: string;
    dailyGoalMinutes: number; // in minutes
    colorHex: string;
    icon: string;
}

export interface TimeEntry {
    id: string;
    categoryId: string;
    durationMinutes: number;
    timestamp: number; // epoch
    dateStr: string; // YYYY-MM-DD for easy grouping
    isPomodoro?: boolean; // New flag for golden balls
}

export type BallSkin = 'default' | 'wood' | 'metal' | 'jelly' | 'fire';
export type JarStyle = 'default' | 'vintage' | 'obsidian' | 'golden' | 'cyber';

export interface UserSettings {
    notificationsEnabled: boolean;
    reminderIntervalHours: number; // Notify every X hours
    soundEnabled: boolean;
    hapticsEnabled: boolean;
    theme: 'light' | 'dark';
    language: 'en' | 'es'; // New language setting
    ballSkin: BallSkin;
    jarStyle: JarStyle;
    adminMode: boolean; // Unlocks everything for testing
    physicsGravity: number; // 0.5 to 2.0 (Multiplier)
    physicsWeight: number; // 0.5 to 2.0 (Multiplier)
}

export type ViewState = 'home' | 'stats' | 'history' | 'goals' | 'customize' | 'pomodoro';

export interface DailyStats {
    totalMinutes: number;
    categoryBreakdown: { [categoryId: string]: number }; // minutes per category
}
