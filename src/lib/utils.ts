import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import i18n from '../i18n/config';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getFirestoreErrorMessage(error: any): string {
  if (!error) return i18n.t('errors.unknown');
  
  const code = error.code || error.message;
  
  if (code === 'resource-exhausted' || (typeof code === 'string' && code.includes('quota'))) {
    return i18n.t('errors.quotaExceeded');
  }
  
  if (code === 'permission-denied') {
    return i18n.t('errors.permissionDenied');
  }
  
  if (code === 'unavailable') {
    return i18n.t('errors.networkError');
  }

  if (code === 'auth/invalid-credential' || code === 'auth/wrong-password' || code === 'auth/user-not-found') {
    return i18n.t('errors.invalidCredentials');
  }

  if (code === 'auth/too-many-requests') {
    return i18n.t('errors.accountLocked');
  }

  return error.message || i18n.t('errors.unknown');
}
