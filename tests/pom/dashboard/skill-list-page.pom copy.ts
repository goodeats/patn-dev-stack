import { type Locator, type Page, expect } from '@playwright/test'
import { BasePagePOM } from '../base/page.pom'
import {
	SkillCategoriesTablePOM,
	SkillsTablePOM,
} from './skill-data-tables.pom'
import {
	DashboardSkillCategoryEditorDialogPOM,
	DashboardSkillEditorPOM,
} from './skill-editors.pom'

// https://playwright.dev/docs/pom

export class DashboardSkillListPOM extends BasePagePOM {
	readonly skillsTable: SkillsTablePOM
	readonly categoriesTable: SkillCategoriesTablePOM
	readonly skillsSectionContainer: Locator
	readonly categoriesSectionContainer: Locator
	private readonly newSkillButton: Locator
	private readonly newCategoryButton: Locator

	constructor(page: Page) {
		super(page)
		this.skillsSectionContainer = page.locator('#skills-list')
		this.categoriesSectionContainer = page.locator('#skill-categories')

		this.skillsTable = new SkillsTablePOM(page, this.skillsSectionContainer)
		this.categoriesTable = new SkillCategoriesTablePOM(
			page,
			this.categoriesSectionContainer,
		)

		this.newSkillButton = this.skillsSectionContainer.getByRole('link', {
			name: 'New',
		})
		this.newCategoryButton = this.categoriesSectionContainer.getByRole(
			'button',
			{ name: 'New' },
		)
	}

	async goto() {
		await this.page.goto('/dashboard/skills')
	}

	async gotoNewSkill() {
		await this.newSkillButton.click()
		await expect(this.page).toHaveURL('/dashboard/skills/new')
	}

	async createNewSkill(): Promise<DashboardSkillEditorPOM> {
		await this.gotoNewSkill()
		return new DashboardSkillEditorPOM(this.page)
	}

	async createNewCategory(): Promise<DashboardSkillCategoryEditorDialogPOM> {
		await this.newCategoryButton.click()
		const dialog = new DashboardSkillCategoryEditorDialogPOM(this.page)
		await dialog.waitUntilVisible()
		return dialog
	}
}
