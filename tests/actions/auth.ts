import { type Page, expect } from '@playwright/test'

export async function login(
	page: Page,
	credentials: { username: string; password: string; name: string },
) {
	await page.goto('/login')
	await page
		.getByRole('textbox', { name: /username/i })
		.fill(credentials.username)
	await page.getByLabel(/^password$/i).fill(credentials.password)
	await page.getByRole('button', { name: /log in/i }).click()
	await expect(page).toHaveURL(`/`)
}

export async function logout(page: Page) {
	await page.goto('/dashboard')
	// Click the user menu button first
	await page.locator('#sidebar-user-button').click()
	// Then click the logout button
	await page.getByRole('menuitem', { name: /logout/i }).click()
	// Expect the URL to be the home page after logging out
	await expect(page).toHaveURL(`/`)
	await expect(page.locator('#header-user-button')).not.toBeVisible()
}

export function getLoginRedirectUrl(redirectTo: string): string {
	return `/login?redirectTo=${encodeURIComponent(redirectTo)}`
}

export {} // To make the file a module and allow top-level await in tests that import this function
