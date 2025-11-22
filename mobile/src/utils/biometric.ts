import * as LocalAuthentication from 'expo-local-authentication';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BIOMETRIC_CREDENTIALS_KEY = 'appz_budget_biometric_credentials';
const BIOMETRIC_ENABLED_KEY = 'appz_budget_biometric_enabled';

export interface BiometricCredentials {
  email: string;
  password: string;
}

/**
 * Check if biometric authentication is available on the device
 */
export const isBiometricAvailable = async (): Promise<boolean> => {
  try {
    const compatible = await LocalAuthentication.hasHardwareAsync();
    if (!compatible) return false;

    const enrolled = await LocalAuthentication.isEnrolledAsync();
    return enrolled;
  } catch (error) {
    console.error('Error checking biometric availability:', error);
    return false;
  }
};

/**
 * Get the type of biometric authentication available
 */
export const getBiometricType = async (): Promise<string> => {
  try {
    const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
    if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
      return 'Face ID';
    }
    if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
      return 'Touch ID';
    }
    if (types.includes(LocalAuthentication.AuthenticationType.IRIS)) {
      return 'Iris';
    }
    return 'Biometric';
  } catch (error) {
    console.error('Error getting biometric type:', error);
    return 'Biometric';
  }
};

/**
 * Authenticate using biometrics
 */
export const authenticateWithBiometrics = async (): Promise<boolean> => {
  try {
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: 'Authenticate to login',
      cancelLabel: 'Cancel',
      disableDeviceFallback: false,
    });

    return result.success;
  } catch (error) {
    console.error('Biometric authentication error:', error);
    return false;
  }
};

/**
 * Save credentials for biometric authentication
 */
export const saveBiometricCredentials = async (
  credentials: BiometricCredentials
): Promise<void> => {
  try {
    await AsyncStorage.setItem(
      BIOMETRIC_CREDENTIALS_KEY,
      JSON.stringify(credentials)
    );
  } catch (error) {
    console.error('Error saving biometric credentials:', error);
    throw error;
  }
};

/**
 * Get saved credentials for biometric authentication
 */
export const getBiometricCredentials = async (): Promise<BiometricCredentials | null> => {
  try {
    const stored = await AsyncStorage.getItem(BIOMETRIC_CREDENTIALS_KEY);
    if (!stored) return null;
    return JSON.parse(stored) as BiometricCredentials;
  } catch (error) {
    console.error('Error getting biometric credentials:', error);
    return null;
  }
};

/**
 * Remove saved biometric credentials
 */
export const removeBiometricCredentials = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(BIOMETRIC_CREDENTIALS_KEY);
    await AsyncStorage.removeItem(BIOMETRIC_ENABLED_KEY);
  } catch (error) {
    console.error('Error removing biometric credentials:', error);
  }
};

/**
 * Check if biometric authentication is enabled by user
 */
export const isBiometricEnabled = async (): Promise<boolean> => {
  try {
    const enabled = await AsyncStorage.getItem(BIOMETRIC_ENABLED_KEY);
    return enabled === 'true';
  } catch (error) {
    console.error('Error checking biometric enabled status:', error);
    return false;
  }
};

/**
 * Set biometric authentication enabled status
 */
export const setBiometricEnabled = async (enabled: boolean): Promise<void> => {
  try {
    await AsyncStorage.setItem(BIOMETRIC_ENABLED_KEY, enabled.toString());
  } catch (error) {
    console.error('Error setting biometric enabled status:', error);
    throw error;
  }
};

