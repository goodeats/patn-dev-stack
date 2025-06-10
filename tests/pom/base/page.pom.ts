import { expect, type Locator, type Page } from '@playwright/test'

// The absolute root for any Page Object Model that represents a full route.
export abstract class BasePagePOM {
	readonly backLink: Locator
	readonly heading: Locator

	constructor(protected page: Page) {
		this.backLink = this.page.getByRole('link', { name: /Back/i })
		this.heading = this.page.getByRole('heading', { level: 1 })
	}

	// Enforces that every route must know how to navigate to itself.
	// Using `...args` makes it flexible for routes that need an ID vs. those that don't.
	abstract goto(...args: any[]): Promise<void>

	async goBack(): Promise<void> {
		await this.backLink.click()
	}

	async verifyHeading(expectedHeading: string): Promise<void> {
		await expect(this.heading).toHaveText(expectedHeading)
	}
}
