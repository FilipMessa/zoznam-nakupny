import {
  defineConfig,
  minimal2023Preset,
} from '@vite-pwa/assets-generator/config'

// Generates the PWA/favicon PNGs into public/ from public/logo.svg:
// `npx pwa-assets-generator`. The outputs are committed, so this only needs
// re-running when the logo changes. Maskable and Apple icons are full-bleed:
// no extra padding (the logo's glyph already sits inside the maskable safe
// zone) and the logo's rounded corners are filled with the brand terracotta
// (theme token terracotta.500), since the OS applies its own mask.
export default defineConfig({
  preset: {
    ...minimal2023Preset,
    maskable: {
      ...minimal2023Preset.maskable,
      padding: 0,
      resizeOptions: { background: '#c8622b' },
    },
    apple: {
      ...minimal2023Preset.apple,
      padding: 0,
      resizeOptions: { background: '#c8622b' },
    },
  },
  images: ['public/logo.svg'],
})
