// ─── Layout scales ────────────────────────────────────────────────────────────
// Use these instead of literal numbers. If a value you want isn't on a scale,
// pick the nearest one - that's the point of having a scale.
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

export const radii = {
  sm:   8,    // small inner elements (grade pills, tiny tags)
  md:   12,   // inputs, small buttons
  lg:   16,   // cards, primary buttons
  xl:   20,   // modals, large panels
  xxl:  28,   // bottom sheets
  pill: 999,  // chips, badges, avatars
};

export const border = {
  hairline: 1,     // dividers, subtle outlines
  control:  1.5,   // inputs, chips, outlined buttons
};

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
