import path from 'node:path'
import { defineConfig, devices } from '@playwright/test'
import 'dotenv/config'

const svgImportStubPath = path.join(process.cwd(), 'tests/svg-import-stub.cjs')

process.env.PW_TEST_SOURCE_TRANSFORM ??= svgImportStubPath
process.env.PW_TEST_SOURCE_TRANSFORM_SCOPE ??= process.cwd()

const PORT = process.env.PORT || '3000'

export default defineConfig({
	testDir: './tests/e2e',
	timeout: 15 * 1000,
	expect: {
		timeout: 5 * 1000,
	},
	fullyParallel: true,
	forbidOnly: !!process.env.CI,
	retries: process.env.CI ? 2 : 0,
	workers: process.env.CI ? 1 : undefined,
	reporter: 'html',
	use: {
		baseURL: `http://localhost:${PORT}/`,
		trace: 'on-first-retry',
	},

	projects: [
		{
			name: 'chromium',
			use: {
				...devices['Desktop Chrome'],
			},
		},
	],

	webServer: {
		command: process.env.CI ? 'npm run start:mocks' : 'npm run dev',
		port: Number(PORT),
		timeout: 60 * 1000,
		reuseExistingServer: true,
		stdout: 'pipe',
		stderr: 'pipe',
		env: {
			PORT,
			NODE_ENV: 'test',
		},
	},
})
