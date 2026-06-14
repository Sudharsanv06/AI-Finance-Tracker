import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export const registerForPushNotifications = async () => {
  if (!Device.isDevice) return null;
  const { status: existingStatus } =
    await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  if (finalStatus !== 'granted') return null;
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'EventFi Alerts',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#004643',
    });
  }
  return true;
};

export const sendLocalNotification = async (title, body, data = {}) => {
  try {
    await Notifications.scheduleNotificationAsync({
      content: { title, body, data, sound: true },
      trigger: null,
    });
  } catch (e) {
    console.log('Notification error:', e);
  }
};

export const scheduleBillReminder = async (
  billTitle, amount, daysUntilDue
) => {
  if (daysUntilDue <= 0) return;
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: `💳 Bill Due Soon: ${billTitle}`,
        body: `₹${amount} is due in ${daysUntilDue} day${
          daysUntilDue !== 1 ? 's' : ''
        }`,
        sound: true,
      },
      trigger: { seconds: Math.max(daysUntilDue * 24 * 60 * 60, 60) },
    });
  } catch (e) {
    console.log('Schedule error:', e);
  }
};

export const cancelAllNotifications = async () => {
  await Notifications.cancelAllScheduledNotificationsAsync();
};
