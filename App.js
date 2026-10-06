import 'react-native-gesture-handler';
import React, { useEffect } from 'react';
import { Platform } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { registerRootComponent } from 'expo';
import { useFonts } from 'expo-font';
import { Ionicons } from '@expo/vector-icons';
import {
  Montserrat_400Regular, Montserrat_500Medium, Montserrat_600SemiBold,
  Montserrat_700Bold, Montserrat_800ExtraBold,
} from '@expo-google-fonts/montserrat';
import { applyFontFamily } from './src/theme/fonts';
import useAuthStore       from './src/store/useAuthStore';
import AuthNavigator      from './src/navigation/AuthNavigator';
import AppNavigator       from './src/navigation/AppNavigator';
import SplashScreen       from './src/screens/auth/SplashScreen';
import ProfileSetupScreen from './src/screens/auth/ProfileSetupScreen';

// ─── Resolve the real Ionicons TTF URL ────────────────────────────────────────
//
// Problem: Ionicons.font.ionicons is an asset-registry NUMBER (e.g. 4), not a URL.
// expo-asset's Asset.fromModule(number).uri returns '' in production web builds
// because selectAssetSource() has no dev-server URL and no Expo Go context —
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
    // 1. <link rel="preload"> — kicks off the 443 KB font download immediately,
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

  // 3. Montserrat from Google Fonts — the exported page doesn't use
  //    web/index.html, so the stylesheet is added here at load time.
  if (!document.getElementById('montserrat-font')) {
    const fontLink = document.createElement('link');
    fontLink.id   = 'montserrat-font';
    fontLink.rel  = 'stylesheet';
    fontLink.href = 'https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;800&display=swap';
    document.head.appendChild(fontLink);
  }

  // 4. iOS Safari keyboard fixes + layout reset
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
  `;
  const expoReset = document.getElementById('expo-reset');
  if (expoReset && expoReset.nextSibling) {
    document.head.insertBefore(kbStyle, expoReset.nextSibling);
  } else {
    document.head.appendChild(kbStyle);
  }
}

// Montserrat everywhere. Web gets it from Google Fonts (web/index.html); native
// registers one family per weight below.
applyFontFamily();

const MONTSERRAT = {
  Montserrat_400Regular, Montserrat_500Medium, Montserrat_600SemiBold,
  Montserrat_700Bold, Montserrat_800ExtraBold,
};

// ─── App ──────────────────────────────────────────────────────────────────────

function App() {
  const { session, setupComplete, loading, init } = useAuthStore();

  // On web, pass the resolved string URL instead of Ionicons.font (which contains
  // a raw asset-registry number).  Passing the string bypasses the broken
  // Asset.fromModule() path and lets expo-font find the @font-face we already
  // injected above, so isLoaded() is true immediately and no re-render is needed.
  // On native, expo-asset resolves numbers correctly so we use Ionicons.font as-is.
  const fontMap = (Platform.OS === 'web' && _ioniconsUrl)
    ? { ionicons: _ioniconsUrl }
    : { ...Ionicons.font, ...MONTSERRAT };
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
        {!session
          ? <AuthNavigator />
          : !setupComplete
            ? <ProfileSetupScreen />
            : <AppNavigator />
        }
      </NavigationContainer>
    </GestureHandlerRootView>
  );
}

registerRootComponent(App);

export default App;
