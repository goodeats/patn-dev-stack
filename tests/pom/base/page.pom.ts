import { type Page } from '@playwright/test'

// The absolute root for any Page Object Model that represents a full route.
export abstract class BasePage {
	constructor(protected page: Page) {}

	// Enforces that every route must know how to navigate to itself.
	// Using `...args` makes it flexible for routes that need an ID vs. those that don't.
	abstract goto(...args: any[]): Promise<void>
}
