import Constants from 'expo-constants';
import { Platform } from 'react-native';

/** Porta padrao do script `npm run server` (json-server). */
export const JSON_SERVER_PORT = 3001;

function devPackagerHost(): string | undefined {
  const uri = Constants.expoConfig?.hostUri;
  if (!uri || typeof uri !== 'string') return undefined;
  return uri.split(':')[0];
}

/**
 * URL base do json-server.
 * Defina `EXPO_PUBLIC_JSON_SERVER_URL` (ex.: http://192.168.0.10:3001) para aparelho fisico ou outro host.
 */
export function getJsonServerBaseUrl(): string {
  const fromEnv = process.env.EXPO_PUBLIC_JSON_SERVER_URL?.trim();
  if (fromEnv) return fromEnv.replace(/\/$/, '');

  if (__DEV__) {
    const host = devPackagerHost();
    if (Platform.OS === 'android') {
      if (host && host !== 'localhost' && host !== '127.0.0.1') {
        return `http://${host}:${JSON_SERVER_PORT}`;
      }
      return `http://10.0.2.2:${JSON_SERVER_PORT}`;
    }
    return `http://localhost:${JSON_SERVER_PORT}`;
  }

  return `http://localhost:${JSON_SERVER_PORT}`;
}

export const API_BASE_URL = getJsonServerBaseUrl();

export const API_ENDPOINTS = {
  users: `${API_BASE_URL}/users`,
  reminders: `${API_BASE_URL}/reminders`,
} as const;

