import { type Locator, type Page, expect } from '@playwright/test'
import { BasePage } from './page.pom'

// A flexible type for detail verification
export type DetailTuple = [
	string, // The label of the detail item (e.g., 'Category', 'Status')
	string, // The expected value of the detail item
]

// The base class for any 'details' view
export abstract class BaseDetailsPagePOM extends BasePage {
	readonly container: Locator
	readonly backLink: Locator
	readonly editLink: Locator
	readonly heading: Locator
	readonly detailsCard: Locator

	// The subclass must provide the container ID and the URL slug
	constructor(page: Page, containerId: string, cardId: string) {
		super(page)
		this.container = page.locator(`#${containerId}`)
		this.backLink = this.container.getByRole('link', { name: 'Back' })
		this.editLink = this.container.getByRole('link', { name: 'Edit' })
		this.heading = this.container.getByRole('heading', { level: 1 })
		this.detailsCard = this.container.locator(`#${cardId}`)
	}

	abstract override goto(itemId: string): Promise<void>

	async goBack(): Promise<void> {
		await this.backLink.click()
	}

	protected async clickEdit(): Promise<void> {
		await this.editLink.click()
	}

	private getDetailItem(label: string): Locator {
		// Finding the <dt> with the specified label text
		return this.detailsCard.locator('dt', { hasText: label })
	}

	getDetailValue(label: string): Locator {
		// Getting the sibling <dd> element next to the <dt> with the specified label
		return this.getDetailItem(label).locator('xpath=following-sibling::dd')
	}

	// A more flexible verification method
	async verifyDetails(heading: string, details: DetailTuple[]): Promise<void> {
		await expect(this.heading).toHaveText(heading)
		for (const [label, value] of details) {
			await expect(this.getDetailValue(label)).toHaveText(value)
		}
	}
}
