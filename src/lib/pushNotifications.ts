import { Platform } from 'react-native';

type NotificationsModule = {
  getPermissionsAsync: () => Promise<{ status: string }>;
  requestPermissionsAsync: () => Promise<{ status: string }>;
  getExpoPushTokenAsync: (options?: { projectId?: string }) => Promise<{ data: string }>;
};

async function loadNotifications() {
  try {
    return (await import(/* @vite-ignore */ 'expo-notifications')) as NotificationsModule;
  } catch {
    return null;
  }
}

export async function requestExpoPushToken() {
  if (Platform.OS === 'web') return null;

  const notifications = await loadNotifications();
  if (!notifications) return null;

  const existingPermission = await notifications.getPermissionsAsync();
  const finalPermission =
    existingPermission.status === 'granted'
      ? existingPermission
      : await notifications.requestPermissionsAsync();

  if (finalPermission.status !== 'granted') return null;

  const projectId = import.meta.env.VITE_EXPO_PROJECT_ID as string | undefined;
  const token = await notifications.getExpoPushTokenAsync(projectId ? { projectId } : undefined);
  return token.data;
}
