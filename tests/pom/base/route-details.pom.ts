import { type Locator, type Page, expect } from '@playwright/test'

// A flexible type for detail verification
export type DetailTuple = [
	string, // The label of the detail item (e.g., 'Category', 'Status')
	string, // The expected value of the detail item
]

// The base class for any 'details' view
export abstract class BaseDetailsPagePOM {
	readonly container: Locator
	readonly backLink: Locator
	readonly editLink: Locator
	readonly heading: Locator
	readonly detailsCard: Locator

	// The subclass must provide the container ID and the URL slug
	constructor(
		protected page: Page,
		containerId: string,
		cardId: string,
	) {
		this.container = page.locator(`#${containerId}`)
		this.backLink = this.container.getByRole('link', { name: 'Back' })
		this.editLink = this.container.getByRole('link', { name: 'Edit' })
		this.heading = this.container.getByRole('heading', { level: 1 })
		this.detailsCard = this.container.locator(`#${cardId}`)
	}

	// Abstract goto method, to be implemented by subclass
	abstract goto(itemId: string): Promise<void>

	async goBack(): Promise<void> {
		await this.backLink.click()
	}

	// This is now generic and can return any editor POM
	// async clickEdit<TEditorPOM>(
	// 	EditorPOM: new (page: Page) => TEditorPOM,
	// ): Promise<TEditorPOM> {
	// 	await this.editLink.click()
	// 	return new EditorPOM(this.page)
	// }
	protected async clickEdit(): Promise<void> {
		await this.editLink.click()
	}

	private getDetailItem(label: string): Locator {
		// This locator is robust, finding the <dt> and then its parent `div`
		return this.detailsCard.locator('dt', { hasText: label }).locator('..')
	}

	getDetailValue(label: string): Locator {
		return this.getDetailItem(label).locator('dd')
	}

	// A more flexible verification method
	async verifyDetails(heading: string, details: DetailTuple[]): Promise<void> {
		await expect(this.heading).toHaveText(heading)
		for (const [label, value] of details) {
			await expect(this.getDetailValue(label)).toHaveText(value)
		}
	}
}
