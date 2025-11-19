/**
 * Utility functions for PWA installation and iOS detection
 */

export const isIOS = (): boolean => {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
};

export const isPWAInstalled = (): boolean => {
  // Check if running in standalone mode (installed as PWA)
  return window.matchMedia('(display-mode: standalone)').matches || 
         (window.navigator as any).standalone === true;
};

export const needsPWAInstall = (): boolean => {
  return isIOS() && !isPWAInstalled();
};

export const canRequestNotifications = (): boolean => {
  // On iOS, notifications only work if PWA is installed
  if (isIOS()) {
    return isPWAInstalled();
  }
  // On other platforms, check if notifications are supported
  return 'Notification' in window;
};
