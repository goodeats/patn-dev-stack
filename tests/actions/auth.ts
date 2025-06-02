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

export async function logout(
	page: Page,
	onboardingData: { name: string; username: string },
) {
	// Click on the user's name link to go to their profile page
	await page.getByRole('link', { name: onboardingData.name }).click()
	// Expect the URL to be the user's profile page
	await expect(page).toHaveURL(`/users/${onboardingData.username}`)

	// Click the logout button
	await page.getByRole('button', { name: /logout/i }).click()
	// Expect the URL to be the home page after logging out
	await expect(page).toHaveURL(`/`)
}

export {} // To make the file a module and allow top-level await in tests that import this function
