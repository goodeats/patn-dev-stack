/**
 * Playwright collection imports app modules that Vite-resolve `.svg` assets.
 * Node cannot load those files as ESM (`Unknown file extension ".svg"`), so
 * stub them as an empty default export.
 */
const svgUrlPattern = /\.svg(\?.*)?$/

export const resolve = (specifier, context, nextResolve) => {
	if (!svgUrlPattern.test(specifier)) {
		return nextResolve(specifier, context)
	}

	const url = specifier.startsWith('file:')
		? specifier
		: new URL(specifier, context.parentURL).href

	return {
		shortCircuit: true,
		url,
		format: 'module',
	}
}

export const load = (url, context, nextLoad) => {
	if (!svgUrlPattern.test(url)) {
		return nextLoad(url, context)
	}

	return {
		format: 'module',
		shortCircuit: true,
		source: 'export default ""',
	}
}
