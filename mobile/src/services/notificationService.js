// TEMPORARY STUB — expo-notifications disabled for Expo Go testing.
// Real push/local notifications require a development build, not Expo Go.
// Restore the real implementation once we're testing via `eas build --profile development`.

export const registerForPushNotifications = async () => {
  console.log('Notifications disabled in this build.');
  return null;
};

export const sendLocalNotification = async () => {
  return null;
};

export const scheduleBillReminder = async () => {
  return null;
};

export const cancelAllNotifications = async () => {
  return null;
};
