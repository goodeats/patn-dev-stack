import { type Locator, type Page, expect } from '@playwright/test'
import { BasePagePOM } from './page.pom'

// A flexible type for detail verification
export type DetailTuple = [
	string, // The label of the detail item (e.g., 'Category', 'Status')
	string, // The expected value of the detail item
]

// The base class for any 'details' view
export abstract class BaseDetailsPagePOM extends BasePagePOM {
	readonly container: Locator
	readonly editLink: Locator
	readonly detailsCard: Locator

	// The subclass must provide the container ID and the URL slug
	constructor(page: Page, containerId: string, cardId: string) {
		super(page)
		this.container = page.locator(`#${containerId}`)
		this.editLink = this.container.getByRole('link', { name: 'Edit' })
		this.detailsCard = this.container.locator(`#${cardId}`)
	}

	abstract override goto(itemId: string): Promise<void>

	protected async clickEdit(): Promise<void> {
		await this.editLink.click()
	}

	private getDetailItem(label: string): Locator {
		// Finding the <dt> with the specified label text
		return this.detailsCard.locator('dt', { hasText: label })
	}

	getDetailValue(label: string): Locator {
		// Getting the parent container in the <dl> element and then the <dd> element
		return this.getDetailItem(label).locator('..').locator('dd')
	}

	// A more flexible verification method
	async verifyDetails(heading: string, details: DetailTuple[]): Promise<void> {
		await this.verifyHeading(heading)
		for (const [label, value] of details) {
			await expect(this.getDetailValue(label)).toHaveText(value)
		}
	}
}
