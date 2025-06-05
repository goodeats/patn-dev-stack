import { test as base, type Locator } from '@playwright/test'
import * as setCookieParser from 'set-cookie-parser'
import { getSessionExpirationDate, sessionKey } from '#app/utils/auth.server.ts'
import { prisma } from '#app/utils/db.server.ts'
import { MOCK_CODE_GITHUB_HEADER } from '#app/utils/providers/constants.js'
import { normalizeEmail } from '#app/utils/providers/provider.js'
import { authSessionStorage } from '#app/utils/session.server.ts'
import {
	type GitHubUser,
	deleteGitHubUser,
	insertGitHubUser,
} from './mocks/github.ts'
import {
	type CreateAboutMeCategoryOptions,
	type AboutMeCategoryPlaywright,
	getOrInsertAboutMeCategory,
	type CreateAboutMeOptions,
	type AboutMePlaywright,
	getOrInsertAboutMe,
} from './models/about-test-setup.ts'
import {
	getOrInsertUser,
	type GetOrInsertUserOptions,
	type UserPlaywright,
} from './models/user-test-setup.ts'

export * from './db-utils.ts'
export * from './models/user-test-setup.ts'
export * from './models/about-test-setup.ts'

export const test = base.extend<{
	insertNewUser(options?: GetOrInsertUserOptions): Promise<UserPlaywright>
	login(options?: GetOrInsertUserOptions): Promise<UserPlaywright>
	prepareGitHubUser(): Promise<GitHubUser>
	insertNewAboutMeCategory(
		options?: CreateAboutMeCategoryOptions,
	): Promise<AboutMeCategoryPlaywright>
	insertNewAboutMe(options: CreateAboutMeOptions): Promise<AboutMePlaywright>
}>({
	insertNewUser: async ({}, use) => {
		let userId: string | undefined = undefined
		await use(async (options) => {
			const user = await getOrInsertUser(options)
			userId = user.id
			return user
		})
		await prisma.user.delete({ where: { id: userId } }).catch(() => {})
	},
	login: async ({ page }, use) => {
		let userId: string | undefined = undefined
		await use(async (options) => {
			const user = await getOrInsertUser(options)
			userId = user.id
			const session = await prisma.session.create({
				data: {
					expirationDate: getSessionExpirationDate(),
					userId: user.id,
				},
				select: { id: true },
			})

			const authSession = await authSessionStorage.getSession()
			authSession.set(sessionKey, session.id)
			const cookieConfig = setCookieParser.parseString(
				await authSessionStorage.commitSession(authSession),
			)
			const newConfig = {
				...cookieConfig,
				domain: 'localhost',
				expires: cookieConfig.expires?.getTime(),
				sameSite: cookieConfig.sameSite as 'Strict' | 'Lax' | 'None',
			}
			await page.context().addCookies([newConfig])
			return user
		})
		await prisma.user.deleteMany({ where: { id: userId } })
	},
	prepareGitHubUser: async ({ page }, use, testInfo) => {
		await page.route(/\/auth\/github(?!\/callback)/, async (route, request) => {
			const headers = {
				...request.headers(),
				[MOCK_CODE_GITHUB_HEADER]: testInfo.testId,
			}
			await route.continue({ headers })
		})

		let ghUser: GitHubUser | null = null
		await use(async () => {
			const newGitHubUser = await insertGitHubUser(testInfo.testId)!
			ghUser = newGitHubUser
			return newGitHubUser
		})

		const user = await prisma.user.findUnique({
			select: { id: true, name: true },
			where: { email: normalizeEmail(ghUser!.primaryEmail) },
		})
		if (user) {
			await prisma.user.delete({ where: { id: user.id } })
			await prisma.session.deleteMany({ where: { userId: user.id } })
		}
		await deleteGitHubUser(ghUser!.primaryEmail)
	},
	insertNewAboutMeCategory: async ({}, use) => {
		let categoryId: string | undefined = undefined
		await use(async (options) => {
			const category = await getOrInsertAboutMeCategory(options)
			categoryId = category.id
			return category
		})
		if (categoryId) {
			await prisma.aboutMeCategory
				.delete({ where: { id: categoryId } })
				.catch(() => {})
		}
	},
	insertNewAboutMe: async ({}, use) => {
		let aboutMeId: string | undefined = undefined
		await use(async (options) => {
			const aboutMe = await getOrInsertAboutMe(options)
			aboutMeId = aboutMe.id
			return aboutMe
		})
		if (aboutMeId) {
			await prisma.aboutMe.delete({ where: { id: aboutMeId } }).catch(() => {})
		}
	},
})
export const { expect } = test

/**
 * This allows you to wait for something (like an email to be available).
 *
 * It calls the callback every 50ms until it returns a value (and does not throw
 * an error). After the timeout, it will throw the last error that was thrown or
 * throw the error message provided as a fallback
 */
export async function waitFor<ReturnValue>(
	cb: () => ReturnValue | Promise<ReturnValue>,
	{
		errorMessage,
		timeout = 5000,
	}: { errorMessage?: string; timeout?: number } = {},
) {
	const endTime = Date.now() + timeout
	let lastError: unknown = new Error(errorMessage)
	while (Date.now() < endTime) {
		try {
			const response = await cb()
			if (response) return response
		} catch (e: unknown) {
			lastError = e
		}
		await new Promise((r) => setTimeout(r, 100))
	}
	throw lastError
}

/**
 * Helper function to scroll down the page with different scrolling options.
 * This can be useful for testing lazy-loaded content or infinite scroll.
 *
 * @param page - The Playwright page object to perform the scrolling on.
 * @param options - Configuration options for scrolling behavior.
 * @param options.mode - The scrolling mode: 'bottom' to scroll to the very bottom, 'halfPage' to scroll half a page height, or 'fullPage' to scroll a full page height.
 * @param options.maxAttempts - Maximum number of scroll attempts before giving up (default: 10). Only applicable when mode is 'bottom'.
 * @returns A promise that resolves when the scrolling action is complete.
 */
export async function scrollDown(
	page: any,
	options: {
		mode: 'bottom' | 'halfPage' | 'fullPage'
		maxAttempts?: number
	} = { mode: 'bottom', maxAttempts: 10 },
): Promise<void> {
	const { mode, maxAttempts = 10 } = options

	if (mode === 'bottom') {
		let attempts = 0
		let lastHeight = 0

		while (attempts < maxAttempts) {
			// Get the current scroll height
			await page.evaluate(() => document.documentElement.scrollHeight)

			// Scroll to the bottom of the current view
			await page.evaluate(() =>
				window.scrollTo(0, document.documentElement.scrollHeight),
			)

			// Wait for potential new content to load
			await page.waitForTimeout(500)

			// Check the new scroll height after scrolling
			const newHeight = await page.evaluate(
				() => document.documentElement.scrollHeight,
			)

			// If the height hasn't changed, we've likely reached the bottom
			if (newHeight === lastHeight) {
				break
			}

			lastHeight = newHeight
			attempts++
		}
	} else if (mode === 'halfPage' || mode === 'fullPage') {
		// Get the viewport height
		const viewportHeight = await page.evaluate(() => window.innerHeight)
		// Calculate scroll distance based on mode
		const scrollDistance =
			mode === 'halfPage' ? viewportHeight / 2 : viewportHeight
		// Perform the scroll
		await page.evaluate((distance: number) => {
			window.scrollBy(0, distance)
		}, scrollDistance)
		// Wait for potential new content to load
		await page.waitForTimeout(500)
	}
}

/**
 * Locates all table header cells within a specific locator context.
 * @param locator - The Playwright locator to search within.
 * @returns An array of locators for the table header cells.
 */
export async function locateTableHeader(locator: Locator): Promise<Locator[]> {
	return locator.locator('thead').locator('th').all()
}

/**
 * Verifies the headers of a table against an expected list of header names.
 * @param tableLocator - The Playwright locator for the table to check.
 * @param expectedHeaders - An array of strings representing the expected header names.
 * @param opts - Optional configuration object to account for additional columns like selection checkboxes or actions.
 */
export async function verifyTableHeaders(
	tableLocator: Locator,
	expectedHeaders: string[],
	opts: { hasSelectColumn?: boolean; hasActionsColumn?: boolean } = {
		hasSelectColumn: false,
		hasActionsColumn: false,
	},
): Promise<void> {
	const { hasSelectColumn = false, hasActionsColumn = false } = opts
	let offset = 0
	if (hasSelectColumn) offset += 1
	if (hasActionsColumn) offset += 1

	const tableHeaders = await locateTableHeader(tableLocator)
	await expect(tableHeaders).toHaveLength(expectedHeaders.length + offset)

	for (let i = 0; i < expectedHeaders.length; i++) {
		const headerIndex = i + (hasSelectColumn ? 1 : 0)
		const locator = tableHeaders[headerIndex] as Locator
		await expect(locator).toHaveText(expectedHeaders[i]!)
	}
}

export const testDateToday = new Date().toLocaleDateString('en-US', {
	month: 'numeric',
	day: 'numeric',
	year: 'numeric',
}) // test created and updated are today, formatted as M/D/YYYY

/**
 * Locates a table row by its text content within a specific locator context.
 * @param locator - The Playwright locator to search within.
 * @returns A locator for the table rows.
 */
export async function locateTableRows(locator: Locator): Promise<Locator[]> {
	return locator.locator('tbody').locator('tr').all()
}

/**
 * Verifies the data of a specific row in a table against expected cell values.
 * @param tableLocator - The Playwright locator for the table to check.
 * @param rowIndex - The index of the row to verify.
 * @param expectedData - An array of strings representing the expected cell values for the row.
 * @param opts - Optional configuration object to account for additional columns like selection checkboxes.
 */
export async function verifyTableRowData(
	tableLocator: Locator,
	rowIndex: number,
	expectedData: string[],
	opts: { hasSelectColumn?: boolean } = {
		hasSelectColumn: false,
	},
): Promise<void> {
	const { hasSelectColumn = false } = opts
	const rows = await locateTableRows(tableLocator)
	await expect(rows.length).toBeGreaterThan(rowIndex)

	const row = rows[rowIndex] as Locator
	const cells = await row.locator('td').all()

	let startIndex = hasSelectColumn ? 1 : 0
	for (let i = 0; i < expectedData.length; i++) {
		const cellIndex = startIndex + i
		const cell = cells[cellIndex] as Locator
		await expect(cell).toHaveText(expectedData[i]!)
	}
}

/**
 * Verifies the data of multiple rows in a table against expected cell values for each row.
 * @param tableLocator - The Playwright locator for the table to check.
 * @param expectedDataArrays - An array of arrays, where each inner array contains strings representing the expected cell values for a row.
 * @param opts - Optional configuration object to account for additional columns like selection checkboxes.
 */
export async function verifyMultipleTableRowsData(
	tableLocator: Locator,
	expectedDataArrays: string[][],
	opts: { hasSelectColumn?: boolean } = {
		hasSelectColumn: false,
	},
): Promise<void> {
	for (let rowIndex = 0; rowIndex < expectedDataArrays.length; rowIndex++) {
		await verifyTableRowData(
			tableLocator,
			rowIndex,
			expectedDataArrays[rowIndex]!,
			opts,
		)
	}
}
