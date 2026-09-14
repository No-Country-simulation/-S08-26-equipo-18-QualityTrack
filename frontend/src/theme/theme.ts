import { createSystem, defaultConfig, defineConfig } from '@chakra-ui/react'

/**
 * Paleta "industrial" de QualityTrack.
 * - `brand`: azul corporativo (acciones primarias, enlaces, foco).
 * - `gray`: se sobreescribe con la escala slate para que TODOS los
 *   componentes de Chakra que usan `gray` por defecto (bordes, texto
 *   secundario, fondos) hereden el mismo tono que el resto del diseño,
 *   sin tener que pasar `colorPalette="gray"` en cada uno.
 */
const config = defineConfig({
    theme: {
        tokens: {
            fonts: {
                heading: {
                    value: `'Helvetica Neue', Helvetica, Inter, Arial, sans-serif`,
                },
                body: {
                    value: `'Helvetica Neue', Helvetica, Inter, Arial, sans-serif`,
                },
            },
            colors: {
                brand: {
                    50: { value: '#eff6ff' },
                    100: { value: '#dbeafe' },
                    200: { value: '#bfdbfe' },
                    300: { value: '#93c5fd' },
                    400: { value: '#60a5fa' },
                    500: { value: '#3b82f6' },
                    600: { value: '#2563eb' },
                    700: { value: '#1d4ed8' },
                    800: { value: '#1e40af' },
                    900: { value: '#1e3a8a' },
                    950: { value: '#172554' },
                },
                accent: {
                    50: { value: '#f0f9ff' },
                    100: { value: '#e0f2fe' },
                    200: { value: '#bae6fd' },
                    300: { value: '#7dd3fc' },
                    400: { value: '#38bdf8' },
                    500: { value: '#0ea5e9' },
                    600: { value: '#0284c7' },
                    700: { value: '#0369a1' },
                    800: { value: '#075985' },
                    900: { value: '#0c4a6e' },
                    950: { value: '#082f49' },
                },
                gray: {
                    50: { value: '#f8fafc' },
                    100: { value: '#f1f5f9' },
                    200: { value: '#e2e8f0' },
                    300: { value: '#cbd5e1' },
                    400: { value: '#94a3b8' },
                    500: { value: '#64748b' },
                    600: { value: '#475569' },
                    700: { value: '#334155' },
                    800: { value: '#1e293b' },
                    900: { value: '#0f172a' },
                    950: { value: '#020617' },
                },
            },
        },
        semanticTokens: {
            colors: {
                'bg.canvas': {
                    value: { _light: '{colors.gray.50}', _dark: '{colors.gray.950}' },
                },
                'border.subtle': {
                    value: { _light: '{colors.gray.200}', _dark: '{colors.gray.800}' },
                },
                // Habilita `colorPalette="brand"` / `"accent"` en los componentes de
                // Chakra (Button, Badge, Checkbox, etc.): cada paleta debe declarar
                // su propio set contrast/fg/subtle/muted/emphasized/solid/focusRing/
                // border, siguiendo el mismo patrón que usan las paletas nativas
                // (ver theme/semantic-tokens/colors.js de @chakra-ui/react).
                brand: {
                    contrast: { value: { _light: 'white', _dark: 'white' } },
                    fg: { value: { _light: '{colors.brand.700}', _dark: '{colors.brand.300}' } },
                    subtle: { value: { _light: '{colors.brand.100}', _dark: '{colors.brand.900}' } },
                    muted: { value: { _light: '{colors.brand.200}', _dark: '{colors.brand.800}' } },
                    emphasized: { value: { _light: '{colors.brand.300}', _dark: '{colors.brand.700}' } },
                    solid: { value: { _light: '{colors.brand.600}', _dark: '{colors.brand.600}' } },
                    focusRing: { value: { _light: '{colors.brand.600}', _dark: '{colors.brand.500}' } },
                    border: { value: { _light: '{colors.brand.500}', _dark: '{colors.brand.400}' } },
                },
                accent: {
                    contrast: { value: { _light: 'white', _dark: 'white' } },
                    fg: { value: { _light: '{colors.accent.700}', _dark: '{colors.accent.300}' } },
                    subtle: { value: { _light: '{colors.accent.100}', _dark: '{colors.accent.900}' } },
                    muted: { value: { _light: '{colors.accent.200}', _dark: '{colors.accent.800}' } },
                    emphasized: { value: { _light: '{colors.accent.300}', _dark: '{colors.accent.700}' } },
                    solid: { value: { _light: '{colors.accent.500}', _dark: '{colors.accent.500}' } },
                    focusRing: { value: { _light: '{colors.accent.500}', _dark: '{colors.accent.400}' } },
                    border: { value: { _light: '{colors.accent.400}', _dark: '{colors.accent.400}' } },
                },
            },
        },
    },
    globalCss: {
        'html, body': {
            backgroundColor: 'bg.canvas',
        },
    },
})

export const system = createSystem(defaultConfig, config)
