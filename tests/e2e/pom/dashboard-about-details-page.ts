import { type Locator, type Page, expect } from '@playwright/test'

export class DashboardAboutDetailsPage {
	readonly page: Page
	readonly container: Locator
	readonly backLink: Locator
	readonly heading: Locator
	readonly detailsCard: Locator

	constructor(page: Page) {
		this.page = page
		this.container = page.locator('#about-details-content')
		this.backLink = this.container.getByRole('link', { name: 'Back to Abouts' })
		this.heading = this.container.getByRole('heading', { level: 1 })
		this.detailsCard = this.container.locator('#about-details-card')
	}

	async goto(aboutId: string) {
		await this.page.goto(`/dashboard/about/${aboutId}`)
	}

	async goBack() {
		await this.backLink.click()
		await expect(this.page).toHaveURL(/\/dashboard\/about/)
	}

	private getDetailItem(label: string) {
		return this.detailsCard.locator('dt', { hasText: label }).locator('..')
	}

	getDetailValue(label: 'Content' | 'Description' | 'Category' | 'Status') {
		const item = this.getDetailItem(label)
		return item.locator('dd')
	}

	async verifyDetails(details: {
		name: string
		content: string
		description: string
		category: string
		status: 'Published' | 'Draft'
	}) {
		await expect(this.heading).toHaveText(details.name)
		await expect(this.getDetailValue('Content')).toHaveText(details.content)
		await expect(this.getDetailValue('Description')).toHaveText(
			details.description,
		)
		await expect(this.getDetailValue('Category')).toHaveText(details.category)
		await expect(this.getDetailValue('Status')).toHaveText(details.status)
	}
}
