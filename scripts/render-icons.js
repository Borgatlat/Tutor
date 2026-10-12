// Renders assets/icon.png, adaptive-icon.png, splash.png and favicon.png from
// the logo (same paths as src/components/ui/Logo.js). Needs Playwright:
//   npx playwright install chromium && node scripts/render-icons.js
const { chromium } = require('playwright');
const G = '#004B30', GOLD = '#C49A2C', PAGE = 'rgba(255,255,255,0.92)', W = '#FFFFFF';
const P = {
  leftBody:  'M58.5 48 C52 40 44 38 37 40 C27 43 22 52 24 62 C27 74 42 84 58.5 94 Z',
  rightBody: 'M61.5 48 C68 40 76 38 83 40 C93 43 98 52 96 62 C93 74 78 84 61.5 94 Z',
  leftPage:  'M57 110 C45 102 31 100 16 103 L16 93 C31 90 45 92 57 101 Z',
  rightPage: 'M63 110 C75 102 89 100 104 103 L104 93 C89 90 75 92 63 101 Z',
};
const mark = `<path d="${P.leftPage}" fill="${PAGE}"/><path d="${P.rightPage}" fill="${PAGE}"/>
 <circle cx="40" cy="24" r="10.5" fill="${W}"/><path d="${P.leftBody}" fill="${W}"/>
 <circle cx="80" cy="24" r="10.5" fill="${GOLD}"/><path d="${P.rightBody}" fill="${GOLD}"/>`;
const page = (w, h, bg, size) => `<!doctype html><html><body style="margin:0;background:${bg}">
<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg">
 ${bg !== 'transparent' ? `<rect width="${w}" height="${h}" fill="${bg}"/>` : ''}
 <g transform="translate(${(w - size) / 2} ${(h - size) / 2}) scale(${size / 120})">${mark}</g>
</svg></body></html>`;
(async () => {
  const b = await chromium.launch();
  const out = process.argv[2] || '/home/user/Tutor/assets';
  for (const [name, w, h, bg, size, transparent] of [
    ['icon.png', 1024, 1024, G, 660, false],
    ['adaptive-icon.png', 1024, 1024, 'transparent', 560, true],
    ['splash.png', 1242, 2436, 'transparent', 440, true],
    ['favicon.png', 196, 196, G, 150, false],
  ]) {
    const p = await b.newPage({ viewport: { width: w, height: h } });
    await p.setContent(page(w, h, bg, size));
    await p.screenshot({ path: `${out}/${name}`, omitBackground: transparent });
    await p.close();
  }
  await b.close();
})();
