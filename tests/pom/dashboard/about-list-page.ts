import { type Locator, type Page, expect } from '@playwright/test'
import { BasePagePOM } from '../base/page.pom'
import {
	AboutMeCategoriesTable,
	AboutMeSectionsTable,
} from './about-data-tables.pom'
import {
	DashboardAboutCategoryEditorDialog,
	DashboardAboutMeEditorPage,
} from './about-editors.pom'

// https://playwright.dev/docs/pom

export class DashboardAboutPage extends BasePagePOM {
	readonly aboutMeTable: AboutMeSectionsTable
	readonly categoriesTable: AboutMeCategoriesTable
	private readonly newSectionButton: Locator
	private readonly newCategoryButton: Locator

	constructor(page: Page) {
		super(page)
		const aboutMeSectionContainer = page.locator('#about-me-sections')
		const categoriesSectionContainer = page.locator('#about-me-categories')

		this.aboutMeTable = new AboutMeSectionsTable(page, aboutMeSectionContainer)
		this.categoriesTable = new AboutMeCategoriesTable(
			page,
			categoriesSectionContainer,
		)

		this.newSectionButton = aboutMeSectionContainer.getByRole('link', {
			name: 'New',
		})
		this.newCategoryButton = categoriesSectionContainer.getByRole('button', {
			name: 'New',
		})
	}

	async goto() {
		await this.page.goto('/dashboard/about')
	}

	async createNewSection(): Promise<DashboardAboutMeEditorPage> {
		await this.newSectionButton.click()
		await expect(this.page).toHaveURL('/dashboard/about/new')
		const editor = new DashboardAboutMeEditorPage(this.page)
		await editor.waitUntilVisible()
		return editor
	}

	// This method now returns the specific editor dialog POM
	async createNewCategory(): Promise<DashboardAboutCategoryEditorDialog> {
		await this.newCategoryButton.click()
		await expect(this.page).toHaveURL('/dashboard/about')
		const dialog = new DashboardAboutCategoryEditorDialog(this.page)
		await dialog.waitUntilVisible()
		return dialog
	}
}
