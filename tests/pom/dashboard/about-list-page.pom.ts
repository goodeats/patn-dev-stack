import { type Locator, type Page, expect } from '@playwright/test'
import { BasePagePOM } from '../base/page.pom'
import {
	AboutMeCategoriesTablePOM,
	AboutMeSectionsTablePOM,
} from './about-data-tables.pom'
import {
	DashboardAboutCategoryEditorDialogPOM,
	DashboardAboutMeEditorPOM,
} from './about-editors.pom'

// https://playwright.dev/docs/pom

export class DashboardAboutListPOM extends BasePagePOM {
	readonly aboutMeTable: AboutMeSectionsTablePOM
	readonly categoriesTable: AboutMeCategoriesTablePOM
	readonly aboutMeSectionContainer: Locator
	readonly categoriesSectionContainer: Locator
	private readonly newSectionButton: Locator
	private readonly newCategoryButton: Locator

	constructor(page: Page) {
		super(page)
		this.aboutMeSectionContainer = page.locator('#about-me-sections')
		this.categoriesSectionContainer = page.locator('#about-me-categories')

		this.aboutMeTable = new AboutMeSectionsTablePOM(
			page,
			this.aboutMeSectionContainer,
		)
		this.categoriesTable = new AboutMeCategoriesTablePOM(
			page,
			this.categoriesSectionContainer,
		)

		this.newSectionButton = this.aboutMeSectionContainer.getByRole('link', {
			name: 'New',
		})
		this.newCategoryButton = this.categoriesSectionContainer.getByRole(
			'button',
			{ name: 'New' },
		)
	}

	async goto() {
		await this.page.goto('/dashboard/about')
	}

	async gotoNewSection() {
		await this.newSectionButton.click()
		await expect(this.page).toHaveURL('/dashboard/about/new')
	}

	async createNewSection(): Promise<DashboardAboutMeEditorPOM> {
		await this.gotoNewSection()
		return new DashboardAboutMeEditorPOM(this.page)
	}

	async createNewCategory(): Promise<DashboardAboutCategoryEditorDialogPOM> {
		await this.newCategoryButton.click()
		const dialog = new DashboardAboutCategoryEditorDialogPOM(this.page)
		await dialog.waitUntilVisible()
		return dialog
	}
}
