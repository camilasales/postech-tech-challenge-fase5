import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import type { Reminder } from '@/types/reminder';
import { parseActivityDescription } from '@/utils/activityDescription';

const STORAGE_PREFIX = '@postech/reminder-notifications';
const CHANNEL_ID = 'reminders';

type StoredNotificationMap = Record<
  string,
  {
    notificationId: string;
    scheduledAtIso: string;
    description: string;
  }
>;

let notificationsModulePromise: Promise<typeof import('expo-notifications') | null> | null = null;
let notificationsConfigured = false;

function storageKey(userId: string) {
  return `${STORAGE_PREFIX}:${userId}`;
}

async function loadNotificationsModule() {
  if (Platform.OS === 'web') return null;
  if (!notificationsModulePromise) {
    notificationsModulePromise = import('expo-notifications');
  }
  return notificationsModulePromise;
}

async function ensureNotificationsConfigured() {
  const Notifications = await loadNotificationsModule();
  if (!Notifications) return null;

  if (!notificationsConfigured) {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldPlaySound: true,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
        name: 'Lembretes',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#2563EB',
      });
    }

    notificationsConfigured = true;
  }

  return Notifications;
}

async function readStoredMap(userId: string): Promise<StoredNotificationMap> {
  const raw = await AsyncStorage.getItem(storageKey(userId));
  if (!raw) return {};

  try {
    return JSON.parse(raw) as StoredNotificationMap;
  } catch {
    return {};
  }
}

async function writeStoredMap(userId: string, value: StoredNotificationMap) {
  if (Object.keys(value).length === 0) {
    await AsyncStorage.removeItem(storageKey(userId));
    return;
  }

  await AsyncStorage.setItem(storageKey(userId), JSON.stringify(value));
}

async function ensurePermissionGranted() {
  const Notifications = await ensureNotificationsConfigured();
  if (!Notifications) return false;

  const current = await Notifications.getPermissionsAsync();
  if (current.granted || current.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL) {
    return true;
  }

  const requested = await Notifications.requestPermissionsAsync();
  return (
    requested.granted ||
    requested.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL
  );
}

function isReminderEligible(reminder: Reminder) {
  return !reminder.completed && reminder.scheduledAt.getTime() > Date.now();
}

function buildNotificationBody(reminder: Reminder) {
  const details = parseActivityDescription(reminder.description);
  return {
    title: details.title || 'Lembrete',
    body: details.subtitle || 'Voce tem uma atividade agendada.',
  };
}

async function scheduleReminderNotification(reminder: Reminder) {
  const Notifications = await ensureNotificationsConfigured();
  if (!Notifications) return null;

  const content = buildNotificationBody(reminder);
  const trigger = new Date(reminder.scheduledAt);

  const notificationId = await Notifications.scheduleNotificationAsync({
    content: {
      title: content.title,
      body: content.body,
      sound: true,
    },
    trigger,
  });

  return {
    notificationId,
    scheduledAtIso: trigger.toISOString(),
    description: reminder.description,
  };
}

async function cancelNotificationById(notificationId: string) {
  const Notifications = await ensureNotificationsConfigured();
  if (!Notifications) return;

  try {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
  } catch {
    // Ignore stale ids already removed by the OS or previous syncs.
  }
}

function hasReminderChanged(
  reminder: Reminder | undefined,
  storedEntry: StoredNotificationMap[string] | undefined
) {
  if (!reminder || !storedEntry) return true;
  return (
    storedEntry.scheduledAtIso !== reminder.scheduledAt.toISOString() ||
    storedEntry.description !== reminder.description
  );
}

export async function clearReminderNotificationsForUser(userId: string) {
  if (Platform.OS === 'web') return;

  const stored = await readStoredMap(userId);
  await Promise.all(Object.values(stored).map((entry) => cancelNotificationById(entry.notificationId)));
  await writeStoredMap(userId, {});
}

export async function syncReminderNotificationsForUser(args: {
  userId: string;
  reminders: Reminder[];
  enabled: boolean;
}) {
  const { userId, reminders, enabled } = args;
  if (Platform.OS === 'web') return;

  const stored = await readStoredMap(userId);

  if (!enabled) {
    await clearReminderNotificationsForUser(userId);
    return;
  }

  const hasPermission = await ensurePermissionGranted();
  if (!hasPermission) return;

  const eligibleReminders = reminders.filter(isReminderEligible);
  const eligibleIds = new Set(eligibleReminders.map((reminder) => reminder.id));
  const nextStored: StoredNotificationMap = { ...stored };

  for (const [reminderId, entry] of Object.entries(stored)) {
    const reminder = eligibleReminders.find((item) => item.id === reminderId);
    if (!eligibleIds.has(reminderId) || hasReminderChanged(reminder, entry)) {
      await cancelNotificationById(entry.notificationId);
      delete nextStored[reminderId];
    }
  }

  for (const reminder of eligibleReminders) {
    const currentEntry = nextStored[reminder.id];
    if (currentEntry && !hasReminderChanged(reminder, currentEntry)) {
      continue;
    }

    if (currentEntry) {
      await cancelNotificationById(currentEntry.notificationId);
    }

    const created = await scheduleReminderNotification(reminder);
    if (created) {
      nextStored[reminder.id] = created;
    }
  }

  await writeStoredMap(userId, nextStored);
}
