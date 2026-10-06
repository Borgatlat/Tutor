import 'react-native-gesture-handler';
import React, { useEffect } from 'react';
import { Platform } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { registerRootComponent } from 'expo';
import { useFonts } from 'expo-font';
import { Ionicons } from '@expo/vector-icons';
import useAuthStore       from './src/store/useAuthStore';
import AuthNavigator      from './src/navigation/AuthNavigator';
import AppNavigator       from './src/navigation/AppNavigator';
import SplashScreen       from './src/screens/auth/SplashScreen';
import ProfileSetupScreen from './src/screens/auth/ProfileSetupScreen';
import ResetPasswordScreen from './src/screens/auth/ResetPasswordScreen';
import { Toast }          from './src/components/ui';

// ─── Resolve the real Ionicons TTF URL ────────────────────────────────────────
//
// Problem: Ionicons.font.ionicons is an asset-registry NUMBER (e.g. 4), not a URL.
// expo-asset's Asset.fromModule(number).uri returns '' in production web builds
// because selectAssetSource() has no dev-server URL and no Expo Go context -
// it falls through every condition and returns { uri: '' }.
// expo-font then creates:  @font-face { src: url() }
// The browser fetches the page itself as a font, fails, uses a system fallback
// that has no Ionicons glyphs → rectangles / missing icons forever.
//
// Fix: read the raw PackagerAsset descriptor from the registry directly and
// build the URL as  httpServerLocation + '/' + name + '.' + type.
// This is exactly the path that Expo's asset pipeline writes to disk and that
// Vercel serves.  No Asset.fromModule() involved at all.
//
let _ioniconsUrl = null;
try {
  const assetId = Ionicons?.font?.ionicons;
  if (typeof assetId === 'number') {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { getAssetByID } = require('@react-native/assets-registry/registry');
    const meta = getAssetByID(assetId);
    if (meta?.httpServerLocation && meta?.name && meta?.type) {
      _ioniconsUrl = `${meta.httpServerLocation}/${meta.name}.${meta.type}`;
    }
  } else if (typeof assetId === 'string' && assetId) {
    _ioniconsUrl = assetId;   // native / dev already gives a real path
  }
} catch (_) {}

// ─── Web: preload + @font-face + iOS Safari keyboard fix ──────────────────────
//
// Everything here runs synchronously at module-load time, before React renders.
//
if (Platform.OS === 'web' && typeof document !== 'undefined') {

  if (_ioniconsUrl) {
    // 1. <link rel="preload"> - kicks off the 443 KB font download immediately,
    //    before any CSS is evaluated, so the font is usually cached by the time
    //    the @font-face rule is applied.
    const preload = document.createElement('link');
    preload.rel         = 'preload';
    preload.href        = _ioniconsUrl;
    preload.as          = 'font';
    preload.type        = 'font/ttf';
    preload.crossOrigin = 'anonymous';
    document.head.insertBefore(preload, document.head.firstChild);

    // 2. Inject @font-face into the exact <style> element that expo-font's
    //    Font.isLoaded() / ExpoFontLoader.isLoaded() reads ('expo-generated-fonts').
    //    Using font-display:auto matches what Font.loadAsync() would write, so the
    //    dedup check (display === rule.style.fontDisplay) passes and it won't add
    //    a second broken rule when useFonts fires.
    const FONT_STYLE_ID = 'expo-generated-fonts';
    let fontStyleEl = document.getElementById(FONT_STYLE_ID);
    if (!fontStyleEl) {
      fontStyleEl      = document.createElement('style');
      fontStyleEl.id   = FONT_STYLE_ID;
      fontStyleEl.type = 'text/css';
      document.head.appendChild(fontStyleEl);
    }
    fontStyleEl.appendChild(document.createTextNode(
      `@font-face{font-family:ionicons;src:url(${_ioniconsUrl}) format("truetype");font-display:auto}`,
    ));
  }

  // 2b. Body font.
  //
  // react-native-web gives every <Text> its own font-family from one base class
  // (.css-*), so nothing inherits and a plain stylesheet rule either loses to
  // that class or, if appended to <head>, also clobbers the serif headings,
  // which win through an extra atomic .r-* class in the same sheet.
  //
  // Equal specificity means document order decides, so insert our rule INTO
  // react-native-web's own stylesheet immediately after the base rule:
  //   base  <  ours  <  atomic (explicit fontFamily)
  // Body text picks up IBM Plex Sans; anything that names its own font, such as
  // the Source Serif 4 headings, still wins.
  try {
    const BODY_STACK =
      '"IBM Plex Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif';

    outer: for (const sheet of document.styleSheets) {
      let rules;
      try { rules = sheet.cssRules; } catch (_) { continue; }   // cross-origin
      for (let i = 0; i < rules.length; i++) {
        const r = rules[i];
        if (
          r.style &&
          r.style.fontFamily &&
          /apple-system/.test(r.style.fontFamily) &&
          /^\.css-/.test(r.selectorText || '')
        ) {
          sheet.insertRule(`${r.selectorText}{font-family:${BODY_STACK}}`, i + 1);
          break outer;
        }
      }
    }
  } catch (_) {
    // Cosmetic only - the system sans fallback is perfectly readable.
  }

  // 3. iOS Safari keyboard fixes + layout reset
  const kbStyle = document.createElement('style');
  kbStyle.id = 'rn-web-ios-keyboard-fix';
  kbStyle.textContent = `
    html, body {
      height: 100%;
      overflow: hidden !important;
    }
    #root {
      height: 100%;
      overflow: hidden;
    }
    input, textarea, [contenteditable] {
      -webkit-user-select: text !important;
      user-select: text !important;
      touch-action: manipulation !important;
      -webkit-tap-highlight-color: transparent;
      font-size: max(16px, 1em) !important;
      -webkit-appearance: none;
      appearance: none;
      pointer-events: auto !important;
      position: relative;
      z-index: 1;
    }

    /* Escape hatch from the overflow lock above.
     *
     * The lock exists only for the iOS Safari keyboard bug, but it applies to
     * every platform, which forces every screen to scroll through a nested
     * ScrollView instead of the document. On a long form (the onboarding
     * subject picker) that nested scroller does not respond to a mouse wheel,
     * so the content below the fold is unreachable on desktop.
     *
     * AuthShell adds .page-scroll to <html> while an auth screen is mounted on
     * a non-iOS browser, handing scrolling back to the document, which always
     * responds to wheel, trackpad and keyboard. App screens keep the lock, so
     * the bottom tab bar stays pinned.
     */
    html.page-scroll,
    html.page-scroll body,
    html.page-scroll #root {
      /* vh, not %: a percentage min-height resolves against the parent's own
       * height, and html is height:auto here, so 100% collapses to 0 and the
       * body ends up 0px tall with the content spilling out of it. */
      height: auto !important;
      min-height: 100vh !important;
      /* visible, not auto: let the viewport scroller do the work rather than
       * creating a second scroll container on body. */
      overflow: visible !important;
    }
  `;
  const expoReset = document.getElementById('expo-reset');
  if (expoReset && expoReset.nextSibling) {
    document.head.insertBefore(kbStyle, expoReset.nextSibling);
  } else {
    document.head.appendChild(kbStyle);
  }
}

// ─── App ──────────────────────────────────────────────────────────────────────

function App() {
  const { session, setupComplete, loading, init, onboarding, recovery } = useAuthStore();

  // On web, pass the resolved string URL instead of Ionicons.font (which contains
  // a raw asset-registry number).  Passing the string bypasses the broken
  // Asset.fromModule() path and lets expo-font find the @font-face we already
  // injected above, so isLoaded() is true immediately and no re-render is needed.
  // On native, expo-asset resolves numbers correctly so we use Ionicons.font as-is.
  const fontMap = (Platform.OS === 'web' && _ioniconsUrl)
    ? { ionicons: _ioniconsUrl }
    : Ionicons.font;
  const [fontsLoaded] = useFonts(fontMap);

  useEffect(() => {
    const unsub = init();
    return unsub;
  }, []);

  // On web fontsLoaded is true from the first render (isLoaded() finds the
  // @font-face we injected above).  The check still guards native cold-start.
  if (loading || !fontsLoaded) return <SplashScreen />;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <StatusBar style="light" />
      <NavigationContainer>
        {/* `recovery` wins over everything: a reset link produces a real
            session, so without this the user would be dropped into the app
            without ever choosing a new password. */}
        {recovery
          ? <ResetPasswordScreen />
          /* `onboarding` keeps the wizard mounted after signUp creates a session,
             so it can finish writing subjects/availability before we switch. */
          : !session || onboarding
          ? <AuthNavigator />
          : !setupComplete
            ? <ProfileSetupScreen />
            : <AppNavigator />
        }
      </NavigationContainer>

      {/* Outside NavigationContainer: survives the auth → app navigator swap,
          so the "signed in" confirmation is still on screen after the switch. */}
      <Toast />
    </GestureHandlerRootView>
  );
}

registerRootComponent(App);

export default App;
