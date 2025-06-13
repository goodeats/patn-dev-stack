import { type Theme } from './theme.server.ts'

// Shared manifest properties that don't change between themes
export const BASE_MANIFEST = {
	name: 'patn.dev',
	short_name: 'patn.dev',
	description: 'Full-stack web developer portfolio and blog',
	start_url: '/',
	scope: '/',
	id: '/',
	icons: [
		{
			src: '/favicons/android-chrome-192x192.png',
			sizes: '192x192',
			type: 'image/png',
		},
		{
			src: '/favicons/android-chrome-512x512.png',
			sizes: '512x512',
			type: 'image/png',
		},
	],
	display: 'standalone',
} as const

// Theme-specific colors (same as before)
export const THEME_COLORS = {
	light: {
		theme_color: '#22c55e',
		background_color: '#ffffff',
	},
	dark: {
		theme_color: '#eab308',
		background_color: '#1f2028',
	},
} as const

export const getManifestPath = (theme: Theme) => {
	return theme === 'dark' ? '/site-dark.webmanifest' : '/site.webmanifest'
}

export const getThemeColor = (theme: Theme) => {
	return THEME_COLORS[theme]?.theme_color || THEME_COLORS.light.theme_color
}
