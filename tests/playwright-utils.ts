import { test as base } from '@playwright/test'
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

export * from './models/index.ts'
export * from './db-utils.ts'

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

export const testDateToday = new Date().toLocaleDateString('en-US', {
	month: 'numeric',
	day: 'numeric',
	year: 'numeric',
}) // test created and updated are today, formatted as M/D/YYYY
