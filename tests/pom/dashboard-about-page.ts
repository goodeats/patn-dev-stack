import { type Locator, type Page, expect } from '@playwright/test'
import {
	AboutMeCategoriesTable,
	AboutMeSectionsTable,
} from './dashboard/about-data-tables.pom'
import { DashboardAboutCategoryEditorDialog } from './dashboard-about-category-editor-dialog'
import { DashboardAboutMeEditorPage } from './dashboard-about-me-editor-page'

// https://playwright.dev/docs/pom

export class DashboardAboutPage {
	readonly page: Page
	readonly aboutMeSectionContainer: Locator
	readonly categoriesSectionContainer: Locator
	private readonly newSectionButton: Locator
	private readonly newCategoryButton: Locator

	// public interface
	readonly aboutMeTable: AboutMeSectionsTable
	readonly categoriesTable: AboutMeCategoriesTable

	constructor(page: Page) {
		this.page = page
		this.aboutMeSectionContainer = page.locator('#about-me-sections')
		this.categoriesSectionContainer = page.locator('#about-me-categories')
		this.newSectionButton = this.aboutMeSectionContainer.getByRole('link', {
			name: 'New',
		})
		this.newCategoryButton = this.categoriesSectionContainer.getByRole(
			'button',
			{
				name: 'New',
			},
		)
		this.aboutMeTable = new AboutMeSectionsTable(
			page,
			this.aboutMeSectionContainer,
		)
		this.categoriesTable = new AboutMeCategoriesTable(
			page,
			this.categoriesSectionContainer,
		)
	}

	async goto() {
		await this.page.goto('/dashboard/about')
	}

	// This method now returns the specific editor page POM
	async createNewSection(): Promise<DashboardAboutMeEditorPage> {
		await this.newSectionButton.click()
		await expect(this.page).toHaveURL('/dashboard/about/new')
		return new DashboardAboutMeEditorPage(this.page)
	}

	// This method now returns the specific editor dialog POM
	async createNewCategory(): Promise<DashboardAboutCategoryEditorDialog> {
		await this.newCategoryButton.click()
		const dialog = new DashboardAboutCategoryEditorDialog(this.page)
		await dialog.waitUntilVisible()
		return dialog
	}
}
