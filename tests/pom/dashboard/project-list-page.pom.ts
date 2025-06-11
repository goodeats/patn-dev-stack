import { type Locator, type Page, expect } from '@playwright/test'
import { BasePagePOM } from '../base/page.pom'
import { ProjectsTablePOM } from './project-data-tables.pom'
import { DashboardProjectEditorPOM } from './project-editors.pom'

export class DashboardProjectListPOM extends BasePagePOM {
	readonly projectsTable: ProjectsTablePOM
	readonly projectsSectionContainer: Locator
	private readonly newProjectButton: Locator

	constructor(page: Page) {
		super(page)
		this.projectsSectionContainer = page.locator('#projects-list')
		this.projectsTable = new ProjectsTablePOM(
			page,
			this.projectsSectionContainer,
		)
		this.newProjectButton = this.projectsSectionContainer.getByRole('link', {
			name: 'New',
		})
	}

	async goto() {
		await this.page.goto('/dashboard/projects')
	}

	async gotoNewProject() {
		await this.newProjectButton.click()
		await expect(this.page).toHaveURL('/dashboard/projects/new')
	}

	async createNewProject(): Promise<DashboardProjectEditorPOM> {
		await this.gotoNewProject()
		return new DashboardProjectEditorPOM(this.page)
	}
}
