import { faker } from '@faker-js/faker'
import { getLoginRedirectUrl } from '#tests/actions/auth.ts'
import { expect, test } from '#tests/playwright-utils.ts'

test('redirects to /login if not logged in', async ({ page }) => {
	await page.goto('/dashboard')
	await expect(page).toHaveURL(getLoginRedirectUrl('/dashboard'))
})

test('displays sidebar links for authenticated user', async ({
	page,
	login,
}) => {
	const userName = faker.person.firstName()
	await login({ name: userName })

	await page.goto('/')

	// Navigate to dashboard
	await page.locator('#header-user-button').click()
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
