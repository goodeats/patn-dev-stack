import { type Locator, type Page, expect } from '@playwright/test'
import { BaseListPagePOM } from '../base/page-list.pom'
import {
	AboutMeCategoriesTable,
	AboutMeSectionsTable,
} from './about-data-tables.pom'
import {
	DashboardAboutCategoryEditorDialog,
	DashboardAboutMeEditorPage,
} from './about-editors.pom'

// https://playwright.dev/docs/pom

export class DashboardAboutPage extends BaseListPagePOM<DashboardAboutMeEditorPage> {
	readonly aboutMeSectionContainer: Locator
	readonly categoriesSectionContainer: Locator
	private readonly newSectionButton: Locator
	private readonly newCategoryButton: Locator

	// public interface
	readonly aboutMeTable: AboutMeSectionsTable
	readonly categoriesTable: AboutMeCategoriesTable

	constructor(page: Page) {
		const newSectionButton = page.locator('#about-me-sections-new')
		super(page, newSectionButton)
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
