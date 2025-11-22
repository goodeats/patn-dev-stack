import { default as defaultConfig } from '@epic-web/config/eslint'

/** @type {import("eslint").Linter.Config} */
export default [
	...defaultConfig,
	// add custom config objects here:
	{
		files: ['**/tests/**/*.ts'],
		rules: { 'react-hooks/rules-of-hooks': 'off' },
	},
	{
		files: ['**/*.ts', '**/*.tsx'],
		rules: {
			// Override Epic Web's rule to ensure unused variables are visible in editor
			'@typescript-eslint/no-unused-vars': [
				'warn',
				{
					argsIgnorePattern: '^_',
					varsIgnorePattern: '^_',
					destructuredArrayIgnorePattern: '^_',
				},
			],
		},
	},
	{
		ignores: [
			'.react-router/*',
			// .repos.example contains template files used as examples
			// These files use common ESM patterns that don't need linting
			'.repos.example/**/*',
		],
	},
]
