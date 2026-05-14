export const spacing = {
  0: '0',
  1: '4px',
  2: '8px',
  3: '12px',
  4: '16px',
  5: '20px',
  6: '24px',
  8: '32px',
  10: '40px',
  12: '48px',
  16: '64px',
} as const

export const typography = {
  family:
    'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  size: {
    micro: '11px',
    caption: '12px',
    body: '14px',
    bodyLarge: '15px',
    title: '18px',
    display: '24px',
  },
  weight: {
    regular: 450,
    medium: 650,
    strong: 780,
    heavy: 880,
  },
} as const

export const radius = {
  xs: '5px',
  sm: '7px',
  md: '9px',
  lg: '12px',
  xl: '16px',
  pill: '999px',
} as const

export const shadows = {
  panel: '0 14px 40px rgba(15, 23, 42, 0.07)',
  floating: '0 18px 60px rgba(15, 23, 42, 0.12)',
  focus: '0 0 0 3px rgba(37, 99, 235, 0.18)',
} as const

export const motion = {
  fast: '120ms',
  base: '180ms',
  slow: '260ms',
  easing: 'cubic-bezier(0.2, 0, 0, 1)',
} as const

export const semanticColors = {
  replay: '#7c3aed',
  collaboration: '#0891b2',
  recovery: '#16a34a',
  validation: '#d97706',
  simulation: '#2563eb',
  error: '#dc2626',
  warning: '#f59e0b',
} as const
