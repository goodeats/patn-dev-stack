import { defineConfig, devices } from '@playwright/test'
import 'dotenv/config'

const PORT = process.env.PORT || '3000'

export default defineConfig({
	testDir: './tests/e2e',
	timeout: 30 * 1000, // Increased from 15s to 30s for CI
	expect: {
		timeout: 10 * 1000, // Increased from 5s to 10s for CI
	},
	fullyParallel: true,
	forbidOnly: !!process.env.CI,
	retries: process.env.CI ? 1 : 0, // Reduced from 2 to 1 to speed up CI
	workers: process.env.CI ? 2 : undefined, // Increased to 2 for moderate parallel execution
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
		command: process.env.CI ? 'npm run start:mocks:test' : 'npm run dev',
		port: Number(PORT),
		reuseExistingServer: true,
		stdout: 'pipe',
		stderr: 'pipe',
		env: {
			PORT,
			NODE_ENV: 'test',
		},
	},
})
