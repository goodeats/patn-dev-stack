import { expect, test } from '#tests/playwright-utils.ts'

/**
 * Tests the root error boundary functionality for handling 404 errors.
 * Verifies that when navigating to a non-existent page:
 * 1. The correct 404 status code is returned
 * 2. The error boundary displays the appropriate "page not found" message
 */

test('Test root error boundary caught', async ({ page }) => {
	const pageUrl = '/does-not-exist'
	const res = await page.goto(pageUrl)

	expect(res?.status()).toBe(404)
	await expect(page.getByText(/We can't find this page/i)).toBeVisible()
})
