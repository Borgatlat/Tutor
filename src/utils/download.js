/**
 * download.js: hand a generated text file (CSV, .ics) to the user.
 *
 *  - Web:    triggers a browser download.
 *  - Native: opens the share sheet, so it can be emailed, saved to Files or
 *            sent to a moderator.
 */
import { Platform, Share } from 'react-native';

export async function saveTextFile(filename, text, mime = 'text/plain') {
  if (Platform.OS === 'web') {
    try {
      const blob = new Blob([text], { type: `${mime};charset=utf-8` });
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href     = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      return { success: true };
    } catch (e) {
      return { success: false, error: e?.message ?? 'Could not download the file.' };
    }
  }

  try {
    await Share.share({ title: filename, message: text });
    return { success: true };
  } catch (e) {
    return { success: false, error: e?.message ?? 'Could not share the file.' };
  }
}
