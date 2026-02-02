import { getSettings, getEntries } from './storageService';

export const requestNotificationPermission = async (): Promise<boolean> => {
    if (!("Notification" in window)) {
        console.warn("This browser does not support desktop notification");
        return false;
    }

    if (Notification.permission === "granted") {
        return true;
    }

    if (Notification.permission !== "denied") {
        const permission = await Notification.requestPermission();
        return permission === "granted";
    }

    return false;
};

export const checkAndNotify = () => {
    const settings = getSettings();
    if (!settings.notificationsEnabled) return;

    if (Notification.permission !== "granted") return;

    const entries = getEntries();
    const lastEntry = entries.length > 0 ? entries[entries.length - 1] : null;

    if (!lastEntry) return; // Don't notify if new

    const now = Date.now();
    const lastTime = lastEntry.timestamp;
    const diffHours = (now - lastTime) / (1000 * 60 * 60);

    if (diffHours >= settings.reminderIntervalHours) {
        // Simple throttling: In a real app we'd store "lastNotificationSentAt"
        // Here we rely on the user reacting or the app session.
        // To prevent spam in this demo, we won't persist "sent" state, 
        // but typically you would save `lastNotificationTime` in localStorage.
        
        const lastNotifKey = 'tyt_last_notif';
        const lastNotifTime = parseInt(localStorage.getItem(lastNotifKey) || '0');
        
        // Only notify once per hour max to avoid spamming on refresh
        if (Date.now() - lastNotifTime > 60 * 60 * 1000) {
             new Notification("Time to fill your hourglass!", {
                body: `You haven't logged any activity in ${Math.floor(diffHours)} hours.`,
                icon: '/icon.png' // Placeholder
            });
            localStorage.setItem(lastNotifKey, Date.now().toString());
        }
    }
};