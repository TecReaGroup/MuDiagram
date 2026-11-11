// NOTE: draw.io runs in its own iframe document, so it cannot read our CSS variables.
// These values mirror the tokens in src/styles.css and must be kept in sync by hand.
const DESIGN_TOKEN = {
  canvas: '#f6f6f7',
  surface: '#ffffff',
  sunken: '#f1f1f3',
  hover: '#ececef',
  line: '#e6e6ea',
  lineStrong: '#d4d4da',
  ink: '#17171c',
  inkMuted: '#5f5f6b',
  inkFaint: '#8e8e99',
  brand: '#5b5bd6',
  brandSoft: '#efeffc',
  brandInk: '#3e3fb0',
  danger: '#cf3a35',
  dangerSoft: '#fcebea',
} as const;

const FONT_STACK = '"Geist", "Noto Sans SC", "PingFang SC", "Microsoft YaHei UI", system-ui, sans-serif';
const FONT_STYLESHEET_URL =
  'https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600&family=Noto+Sans+SC:wght@400;500;600&display=swap';

const BRAND_SOFT_HOVER = `color-mix(in srgb, ${DESIGN_TOKEN.brand} 14%, ${DESIGN_TOKEN.surface})`;

// NOTE: draw.io toolbar icons are black SVG background images, so `color` cannot tint them.
// These filter chains map any black pixel to the token colour exactly (solved offline with
// Barrett Sonntag's black-to-hex filter solver); re-solve them if the tokens change.
const ICON_FILTER = {
  inkMuted: 'brightness(0) saturate(100%) invert(31%) sepia(2%) saturate(3085%) hue-rotate(202deg) brightness(111%) contrast(83%)',
  ink: 'brightness(0) saturate(100%) invert(4%) sepia(6%) saturate(2829%) hue-rotate(201deg) brightness(91%) contrast(88%)',
} as const;

// Overrides draw.io's own palette variables (see its grapheditor.css) rather than
// individual selectors, so every panel, menu and dialog follows the design system.
const EDITOR_CSS = `
@import url("${FONT_STYLESHEET_URL}");

:root {
  --ge-panel-color: ${DESIGN_TOKEN.surface};
  --toolbar-color: ${DESIGN_TOKEN.surface};
  --workspace-color: ${DESIGN_TOKEN.canvas};
  --dialog-color: ${DESIGN_TOKEN.surface};
  --card-color: ${DESIGN_TOKEN.surface};
  --field-color: ${DESIGN_TOKEN.surface};

  --inactive-color: ${DESIGN_TOKEN.sunken};
  --soft-color: ${DESIGN_TOKEN.sunken};
  --highlight-color: ${DESIGN_TOKEN.hover};
  --soft-hover-color: ${DESIGN_TOKEN.hover};
  --active-item-color: ${DESIGN_TOKEN.hover};
  --active-color: ${DESIGN_TOKEN.lineStrong};

  --border-color: ${DESIGN_TOKEN.line};
  --scrollbar-color: ${DESIGN_TOKEN.line};
  --field-border-color: ${DESIGN_TOKEN.lineStrong};
  --strong-border-color: ${DESIGN_TOKEN.lineStrong};
  --scrollbar-hover-color: ${DESIGN_TOKEN.inkFaint};

  --strong-text-color: ${DESIGN_TOKEN.ink};
  --text-color: ${DESIGN_TOKEN.inkMuted};
  --secondary-text-color: ${DESIGN_TOKEN.inkMuted};
  --faint-text-color: ${DESIGN_TOKEN.inkFaint};

  --primary-color: ${DESIGN_TOKEN.brandSoft};
  --primary-hover-color: ${BRAND_SOFT_HOVER};
  --accent-color: ${DESIGN_TOKEN.brandSoft};
  --accent-hover-color: ${BRAND_SOFT_HOVER};
  --accent-text-color: ${DESIGN_TOKEN.brandInk};
  --selected-color: ${DESIGN_TOKEN.brandSoft};
  --selected-hover-color: ${BRAND_SOFT_HOVER};
  --focus-color: ${DESIGN_TOKEN.brand};

  --error-color: ${DESIGN_TOKEN.danger};
  --error-background-color: ${DESIGN_TOKEN.dangerSoft};
}

.geEditor,
.geDialog,
.mxPopupMenu {
  font-family: ${FONT_STACK};
  -webkit-font-smoothing: antialiased;
}

/* NOTE: No URL parameter hides the page tab bar (only a per-browser setting does). It sits in an
   auto-height grid row of .geEditor, so hiding it gives its space back to the canvas. */
.geEditor > .geTabContainer {
  display: none !important;
}

/* draw.io dims enabled toolbar buttons to 0.65 and only shows them fully on hover, which reads
   as disabled. Its 0.3 for disabled ones fades the ~1px thin icons into hairlines that look like
   a lighter icon set, so disabled stays at 0.45 of the muted tint. */
.geSimple .geToolbarContainer .geButton {
  filter: ${ICON_FILTER.inkMuted};
}
.geSimple .geToolbarContainer .geButton:is(.mxDisabled, .mxDisabled *, [disabled]) {
  opacity: 0.45;
}
.geSimple .geToolbarContainer .geButton:not(.mxDisabled, .mxDisabled *, [disabled]) {
  opacity: 1;
}
.geSimple .geToolbarContainer .geButton:hover:not(.mxDisabled, .mxDisabled *, [disabled]) {
  filter: ${ICON_FILTER.ink};
}

/* The filter repaints the zoom box's hard-coded black border too; 30% alpha of ink-muted lands
   on the line-strong token over the white toolbar. */
.geSimple .geToolbarContainer .geButton.geZoomInput {
  border-color: rgb(0 0 0 / 0.3);
}

::selection {
  background: ${DESIGN_TOKEN.brandSoft};
}
`;

export const DRAWIO_CONFIGURATION = {
  // NOTE: The AI assistant reads and edits <mxGraphModel> directly, so the XML must never be deflated.
  compressXml: false,
  css: EDITOR_CSS,
  defaultGridColor: DESIGN_TOKEN.line,
  defaultPageBackgroundColor: DESIGN_TOKEN.surface,
};
