import { type Page, expect } from '@playwright/test'
import { BaseDetailsPagePOM, type DetailTuple } from '../base/page-details.pom'
import { DashboardSkillEditorPOM } from './skill-editors.pom'

export class DashboardSkillDetailsPOM extends BaseDetailsPagePOM {
	constructor(page: Page) {
		super(page, 'skill-details-content', 'skill-details-card')
	}

	async goto(skillId: string) {
		await this.page.goto(`/dashboard/skills/${skillId}`)
	}

	async goBack() {
		await this.backLink.click()
		await expect(this.page).toHaveURL(/\/dashboard\/skills/)
	}

	async edit(): Promise<DashboardSkillEditorPOM> {
		await super.clickEdit()
		const editor = new DashboardSkillEditorPOM(this.page)
		return editor
	}

	async verifySkillDetails(details: {
		name: string
		description: string
		category: string
		status: 'Published' | 'Draft'
	}): Promise<void> {
		const detailTuples: DetailTuple[] = [
			['Description', details.description],
			['Category', details.category],
			['Status', details.status],
		]
		await super.verifyDetails(details.name, detailTuples)
	}
}
