type HapticsModule = {
  selectionAsync: () => Promise<void>;
  notificationAsync: (type: unknown) => Promise<void>;
  NotificationFeedbackType: { Success: unknown };
};

async function loadHaptics() {
  try {
    return (await import(/* @vite-ignore */ 'expo-haptics')) as HapticsModule;
  } catch {
    return null;
  }
}

export function triggerSelectionFeedback() {
  loadHaptics().then((haptics) => haptics?.selectionAsync().catch(() => undefined));

  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    navigator.vibrate?.(12);
  }
}

export function triggerSuccessFeedback() {
  loadHaptics().then((haptics) =>
    haptics?.notificationAsync(haptics.NotificationFeedbackType.Success).catch(() => undefined)
  );

  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    navigator.vibrate?.([10, 30, 10]);
  }
}
