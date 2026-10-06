// ─── Layout scales ────────────────────────────────────────────────────────────
// Use these instead of literal numbers. If a value you want isn't on a scale,
// pick the nearest one — that's the point of having a scale.
// ─────────────────────────────────────────────────────────────────────────────

export const space = {
  xs:   4,
  sm:   8,
  md:   12,
  lg:   16,
  xl:   20,
  xxl:  24,
  xxxl: 32,
  huge: 40,
};

// Crisp, institutional corners — matched to the school website's square
// buttons and lightly-rounded cards.
export const radii = {
  xs:   3,    // status / date tags
  sm:   4,    // buttons, inputs, chips
  md:   4,    // small buttons, inline controls
  lg:   6,    // cards, list panels
  xl:   8,    // modals, large panels
  xxl:  10,   // bottom sheets
  pill: 999,  // avatars and round dots only
};

export const border = {
  hairline: 1,     // dividers, subtle outlines
  control:  1,     // inputs, chips, outlined buttons
  focus:    2,     // focused input
  rule:     3,     // gold accent rule / active tab marker
};

// The short gold rule that sits above section titles (like the site's
// "Take the Next Steps" heading).
export const rule = { width: 48, height: 3 };

// One press feedback value for every touchable in the app.
export const press = { opacity: 0.8 };

// Expands the touch target of small icon-only controls to meet the 44pt minimum.
export const hit = {
  slop: { top: 10, bottom: 10, left: 10, right: 10 },
};

// Minimum tappable height for controls.
export const control = {
  height:      48,
  heightSmall: 38,
};
