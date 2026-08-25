/**
 * Playwright compiles TS/TSX with Babel. Vite SVG asset imports are not
 * valid JS, so rewrite them to a string stub during e2e test collection.
 */
module.exports = function svgImportStub({ types: t }) {
	return {
		name: 'svg-import-stub',
		visitor: {
			ImportDeclaration(path) {
				const source = path.node.source.value
				if (
					typeof source !== 'string' ||
					!source.split('?')[0].endsWith('.svg')
				) {
					return
				}

				const defaultSpecifier = path.node.specifiers.find((specifier) =>
					t.isImportDefaultSpecifier(specifier),
				)
				if (!defaultSpecifier) {
					path.remove()
					return
				}

				path.replaceWith(
					t.variableDeclaration('const', [
						t.variableDeclarator(defaultSpecifier.local, t.stringLiteral('')),
					]),
				)
			},
		},
	}
}
