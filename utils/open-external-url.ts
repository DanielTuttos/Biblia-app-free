import * as WebBrowser from 'expo-web-browser';
import { Platform } from 'react-native';

export async function openExternalUrl(url: string): Promise<void> {
  if (Platform.OS === 'web') {
    window.open(url, '_blank', 'noopener,noreferrer');
    return;
  }

  await WebBrowser.openBrowserAsync(url, {
    presentationStyle: WebBrowser.WebBrowserPresentationStyle.AUTOMATIC,
    enableBarCollapsing: true,
  });
}
