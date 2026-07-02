import { createSystem, defaultConfig, defineConfig } from '@chakra-ui/react'

const config = defineConfig({
  preflight: true,
  globalCss: {
    'html, body': {
      margin: 0,
      fontFamily: 'body',
      color: 'fg',
      colorScheme: 'light',
      textRendering: 'optimizeLegibility',
    },
    body: {
      background: 'bg.page',
    },
    'input, button, textarea': {
      fontFamily: 'body',
    },
    p: {
      margin: 0,
    },
    // Centered phone-width frame mirroring the design prototype's 430px
    // device shell; `position: relative` anchors non-portalled dialogs.
    '#root': {
      width: '100%',
      maxWidth: '430px',
      margin: '0 auto',
      minHeight: '100dvh',
      display: 'flex',
      flexDirection: 'column',
      background: 'bg',
      boxShadow: '0 0 0 0.5px rgba(0, 0, 0, 0.05), 0 24px 72px rgba(0, 0, 0, 0.2)',
      overflow: 'hidden',
      position: 'relative',
    },
  },
  theme: {
    tokens: {
      colors: {
        terracotta: {
          50: { value: '#fceee7' },
          500: { value: '#c8622b' },
          600: { value: '#a75222' },
        },
        tan: {
          100: { value: '#f0e9df' },
          200: { value: '#e4d9cc' },
        },
      },
      fonts: {
        body: { value: "'Nunito', system-ui, 'Segoe UI', Roboto, sans-serif" },
        heading: { value: "'Nunito', system-ui, 'Segoe UI', Roboto, sans-serif" },
      },
      sizes: {
        touchTarget: { value: '44px' },
      },
      shadows: {
        sm: { value: '0 2px 10px rgba(28, 21, 16, 0.08)' },
        md: { value: '0 4px 16px rgba(28, 21, 16, 0.12)' },
        accent: { value: '0 4px 16px rgba(200, 98, 43, 0.32)' },
      },
    },
    semanticTokens: {
      colors: {
        bg: {
          DEFAULT: { value: '#fdfaf6' },
          page: { value: '#eae2d5' },
          muted: { value: '{colors.tan.100}' },
          panel: { value: '#ffffff' },
        },
        border: {
          DEFAULT: { value: '#e2d7ca' },
        },
        fg: {
          DEFAULT: { value: '#1c1510' },
          muted: { value: '#8a7a6e' },
          subtle: { value: '#c2af9f' },
        },
        terracotta: {
          solid: { value: '{colors.terracotta.500}' },
          emphasized: { value: '{colors.terracotta.600}' },
          subtle: { value: '{colors.terracotta.50}' },
          contrast: { value: 'white' },
          fg: { value: '{colors.terracotta.500}' },
        },
        green: {
          solid: { value: '#4e7d57' },
          subtle: { value: '#ebf3ec' },
          contrast: { value: 'white' },
        },
        red: {
          solid: { value: '#b83030' },
          subtle: { value: '#fdeaea' },
          contrast: { value: 'white' },
        },
      },
    },
    keyframes: {
      drawerIn: {
        from: { transform: 'translateY(44px)', opacity: 0 },
        to: { transform: 'translateY(0)', opacity: 1 },
      },
      livePulse: {
        '0%, 100%': { opacity: 1, transform: 'scale(1)' },
        '50%': { opacity: 0.35, transform: 'scale(0.7)' },
      },
      itemIn: {
        from: { transform: 'translateY(-7px)', opacity: 0 },
        to: { transform: 'translateY(0)', opacity: 1 },
      },
    },
  },
})

export const system = createSystem(defaultConfig, config)
