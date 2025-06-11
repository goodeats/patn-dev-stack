import { type Page, expect } from '@playwright/test'
import { BaseDetailsPagePOM, type DetailTuple } from '../base/page-details.pom'
import { DashboardProjectEditorPOM } from './project-editors.pom'

export class DashboardProjectDetailsPOM extends BaseDetailsPagePOM {
	constructor(page: Page) {
		super(page, 'project-details-content', 'project-details-card')
	}

	async goto(projectId: string) {
		await this.page.goto(`/dashboard/projects/${projectId}`)
	}

	async goBack() {
		await this.backLink.click()
		await expect(this.page).toHaveURL(/\/dashboard\/projects/)
	}

	async edit(): Promise<DashboardProjectEditorPOM> {
		await super.clickEdit()
		const editor = new DashboardProjectEditorPOM(this.page)
		return editor
	}

	async verifyProjectDetails(details: {
		title: string
		description: string
		liveDemoUrl?: string
		sourceCodeUrl?: string
		comments?: string
		skillsCount: number
		status: 'Published' | 'Draft'
		createdAt: string
		updatedAt: string
	}): Promise<void> {
		const detailTuples: DetailTuple[] = [
			['Description', details.description],
			['Live Demo URL', details.liveDemoUrl ?? 'None'],
			['Source Code URL', details.sourceCodeUrl ?? 'None'],
			['Comments', details.comments ?? 'None'],
			['Skills Count', details.skillsCount.toString()],
			['Status', details.status],
			['Created', details.createdAt],
			['Last Updated', details.updatedAt],
		]
		await super.verifyDetails(details.title, detailTuples)
	}
}
