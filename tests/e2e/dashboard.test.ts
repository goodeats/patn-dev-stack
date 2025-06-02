import { faker } from '@faker-js/faker'
import { expect, test } from '#tests/playwright-utils.ts'

test('redirects to /login if not logged in', async ({ page }) => {
	await page.goto('/dashboard')
	await expect(page).toHaveURL('/login')
})

test('displays sidebar links for authenticated user', async ({
	page,
	login,
}) => {
	const userName = faker.person.firstName()
	await login({ name: userName })

	// Navigate to dashboard
	await page.getByRole('link', { name: userName }).click()
	await expect(page).toHaveURL('/dashboard')

	// Check for main navigation links
	await expect(page.getByRole('link', { name: 'Dashboard' })).toBeVisible()
	await expect(page.getByRole('link', { name: 'About' })).toBeVisible()
	await expect(page.getByRole('link', { name: 'Projects' })).toBeVisible()
	await expect(page.getByRole('link', { name: 'Contact' })).toBeVisible()

	// Check for secondary navigation links
	await expect(page.getByRole('link', { name: 'Settings' })).toBeVisible()
	await expect(page.getByRole('link', { name: 'Get Help' })).toBeVisible()
	await expect(page.getByRole('link', { name: 'Search' })).toBeVisible()
})
