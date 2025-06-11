import { type Page, expect } from '@playwright/test'
import { BaseDetailsPagePOM, type DetailTuple } from '../base/page-details.pom'
import { DashboardAboutMeEditorPOM } from './about-editors.pom'

export class DashboardAboutDetailsPOM extends BaseDetailsPagePOM {
	constructor(page: Page) {
		super(page, 'about-details-content', 'about-details-card')
	}

	async goto(aboutId: string) {
		await this.page.goto(`/dashboard/about/${aboutId}`)
	}

	async goBack() {
		await this.backLink.click()
		await expect(this.page).toHaveURL(/\/dashboard\/about/)
	}

	async edit(): Promise<DashboardAboutMeEditorPOM> {
		await super.clickEdit()
		const editor = new DashboardAboutMeEditorPOM(this.page)
		return editor
	}

	async verifyAboutDetails(details: {
		name: string
		content: string
		description: string
		category: string
		status: 'Published' | 'Draft'
	}): Promise<void> {
		const detailTuples: DetailTuple[] = [
			['Content', details.content],
			['Description', details.description],
			['Category', details.category],
			['Status', details.status],
		]
		await super.verifyDetails(details.name, detailTuples)
	}
}
