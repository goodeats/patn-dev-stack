/**
 * @vitest-environment jsdom
 */
import { faker } from '@faker-js/faker'
import { render, screen } from '@testing-library/react'
import { createRoutesStub } from 'react-router'
import setCookieParser from 'set-cookie-parser'
import { test, expect } from 'vitest'
import { loader as rootLoader } from '#app/root.tsx'
import { getSessionExpirationDate, sessionKey } from '#app/utils/auth.server.ts'
import { prisma } from '#app/utils/db.server.ts'
import { authSessionStorage } from '#app/utils/session.server.ts'
import { getUserImages } from '#tests/db-utils.ts'
import { createUser } from '#tests/models/user-test-setup.ts'
import { default as UsernameRoute, loader } from './$username.tsx'

test('The user profile when not logged in as self', async () => {
	const userImages = await getUserImages()
	const userImage =
		userImages[faker.number.int({ min: 0, max: userImages.length - 1 })]
	const user = await prisma.user.create({
		select: { id: true, username: true, name: true },
		data: { ...createUser(), image: { create: userImage } },
	})
	const routeUrl = `/users/${user.username}`

	// Create a request object similar to what the loader expects
	const request = new Request(`http://localhost${routeUrl}`)

	try {
		// Directly call the loader for the user profile route
		// The root loader setup within createRoutesStub is not strictly necessary
		// for this test anymore as we are not rendering the full app,
		// but testing the loader's redirect logic directly.
		// However, if UsernameRoute loader relies on rootContext, it might be.
		// For now, let's assume UsernameRoute loader is self-contained or
		// handles missing root context gracefully when redirecting.
		await loader({
			request,
			params: { username: user.username },
			context: {}, // Provide an empty context or mock as needed
		})
		// If the loader does not throw, this test should fail,
		// as we expect a redirect.
		expect.fail('Loader did not redirect as expected.')
	} catch (error) {
		// Check if the error is a Response object (which is how redirects are thrown)
		expect(error).toBeInstanceOf(Response)
		const response = error as Response
		expect(response.status).toBe(302) // Or the specific redirect status code used by requireUserId
		const locationHeader = response.headers.get('Location')
		expect(locationHeader).not.toBeNull()
		// Check if the redirect is to the login page, possibly with a redirectTo param
		expect(locationHeader?.startsWith('/login')).toBe(true)
		if (locationHeader?.includes('redirectTo')) {
			expect(locationHeader).toBe(
				`/login?redirectTo=${encodeURIComponent(routeUrl)}`,
			)
		} else {
			expect(locationHeader).toBe('/login')
		}
	}

	// Since we are now testing for a redirect, the following assertions
	// for page content are no longer applicable for a non-logged-in user.
	// await screen.findByRole('heading', { level: 1, name: user.name! })
	// await screen.findByRole('img', { name: user.name! })
	// await screen.findByRole('link', { name: `${user.name}'s notes` })
})

test('The user profile when logged in as self', async () => {
	const userImages = await getUserImages()
	const userImage =
		userImages[faker.number.int({ min: 0, max: userImages.length - 1 })]
	const user = await prisma.user.create({
		select: { id: true, username: true, name: true },
		data: { ...createUser(), image: { create: userImage } },
	})
	const session = await prisma.session.create({
		select: { id: true },
		data: {
			expirationDate: getSessionExpirationDate(),
			userId: user.id,
		},
	})

	const authSession = await authSessionStorage.getSession()
	authSession.set(sessionKey, session.id)
	const setCookieHeader = await authSessionStorage.commitSession(authSession)
	const parsedCookie = setCookieParser.parseString(setCookieHeader)
	const cookieHeader = new URLSearchParams({
		[parsedCookie.name]: parsedCookie.value,
	}).toString()

	const App = createRoutesStub([
		{
			id: 'root',
			path: '/',
			loader: async (args) => {
				// add the cookie header to the request
				args.request.headers.set('cookie', cookieHeader)
				return rootLoader({ ...args, context: args.context })
			},
			HydrateFallback: () => <div>Loading...</div>,
			children: [
				{
					path: 'users/:username',
					Component: UsernameRoute,
					loader: async (args) => {
						// add the cookie header to the request
						args.request.headers.set('cookie', cookieHeader)
						return loader(args)
					},
				},
			],
		},
	])

	const routeUrl = `/users/${user.username}`
	render(<App initialEntries={[routeUrl]} />)

	await screen.findByRole('heading', { level: 1, name: user.name! })
	await screen.findByRole('img', { name: user.name! })
	await screen.findByRole('button', { name: /logout/i })
	await screen.findByRole('link', { name: /my notes/i })
	await screen.findByRole('link', { name: /edit profile/i })
})
