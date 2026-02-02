
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

    if (Notification.permission !== "granted") {
        console.log("Notifications enabled in settings but permission not granted.");
        return;
    }

    const entries = getEntries();
    const lastEntry = entries.length > 0 ? entries[entries.length - 1] : null;

    // If no entries ever, maybe remind them to start? For now, we wait for the first one.
    if (!lastEntry) return; 

    const now = Date.now();
    const lastTime = lastEntry.timestamp;
    const diffHours = (now - lastTime) / (1000 * 60 * 60);

    if (diffHours >= settings.reminderIntervalHours) {
        const lastNotifKey = 'tyt_last_notif';
        const lastNotifTime = parseInt(localStorage.getItem(lastNotifKey) || '0');
        
        // Notify if we haven't notified in the last hour
        if (Date.now() - lastNotifTime > 60 * 60 * 1000) {
             try {
                new Notification("Time to fill your hourglass!", {
                    body: `You haven't logged any activity in ${Math.floor(diffHours)} hours.`,
                    icon: '/icon.svg' // Browser might fallback if 404, but visual intent is there
                });
                localStorage.setItem(lastNotifKey, Date.now().toString());
             } catch (e) {
                 console.error("Notification failed:", e);
             }
        }
    }
};
