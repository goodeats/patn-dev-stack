import { type Page, expect } from '@playwright/test'
import { BaseDetailsPagePOM, type DetailTuple } from '../base/page-details.pom'
import { DashboardContactEditorPOM } from './contact-editors.pom'

export class DashboardContactDetailsPOM extends BaseDetailsPagePOM {
	constructor(page: Page) {
		super(page, 'contact-details-content', 'contact-details-card')
	}

	async goto(contactId: string) {
		await this.page.goto(`/dashboard/contacts/${contactId}`)
	}

	async goBack() {
		await this.backLink.click()
		await expect(this.page).toHaveURL(/\/dashboard\/contacts/)
	}

	async edit(): Promise<DashboardContactEditorPOM> {
		await super.clickEdit()
		const editor = new DashboardContactEditorPOM(this.page)
		return editor
	}

	async verifyContactDetails(details: {
		text: string
		href: string
		icon: string
		label: string
		status: 'Published' | 'Draft'
	}): Promise<void> {
		const detailTuples: DetailTuple[] = [
			['URL', details.href],
			['Icon', details.icon],
			['Label', details.label],
			['Status', details.status],
		]
		await super.verifyDetails(details.text, detailTuples)
	}
}
