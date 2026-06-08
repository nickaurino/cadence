import AsyncStorage from '@react-native-async-storage/async-storage';
import * as CadenceMusicKit from '../../modules/cadence-music-kit';

const STORAGE_KEY = 'music_authorized';

export async function authorize(): Promise<void> {
  const granted: boolean = await CadenceMusicKit.authorize();
  if (!granted) throw new Error('Apple Music authorization denied');
  await AsyncStorage.setItem(STORAGE_KEY, 'true');
}

export async function isAvailable(): Promise<boolean> {
  try {
    return await CadenceMusicKit.isAvailable();
  } catch {
    return false;
  }
}

export async function isAuthorized(): Promise<boolean> {
  const val = await AsyncStorage.getItem(STORAGE_KEY);
  return val === 'true';
}
