import { type Locator, type Page, expect } from '@playwright/test'
import { BasePagePOM } from '../base/page.pom'
import {
	AboutMeCategoriesTable,
	AboutMeSectionsTable,
} from './about-data-tables.pom'
import {
	DashboardAboutCategoryEditorDialogPOM,
	DashboardAboutMeEditorPOM,
} from './about-editors.pom'

// https://playwright.dev/docs/pom

export class DashboardAboutListPOM extends BasePagePOM {
	readonly aboutMeTable: AboutMeSectionsTable
	readonly categoriesTable: AboutMeCategoriesTable
	private readonly newSectionButton: Locator
	private readonly newCategoryButton: Locator
	private readonly sectionContentFilter: Locator
	private readonly sectionCategoryFilter: Locator
	private readonly categoryNameFilter: Locator
	private readonly categoryDescriptionFilter: Locator

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
		this.sectionContentFilter =
			aboutMeSectionContainer.getByLabel('Filter by content')
		this.sectionCategoryFilter =
			aboutMeSectionContainer.getByLabel('Filter by category')
		this.categoryNameFilter =
			categoriesSectionContainer.getByLabel('Filter by name')
		this.categoryDescriptionFilter = categoriesSectionContainer.getByLabel(
			'Filter by description',
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

	// About Me Sections
	getSectionRow(name: string) {
		return this.aboutMeTable.tableContainer.getByRole('row', { name })
	}

	getSectionElement(name: string) {
		return this.getSectionRow(name)
	}

	getSectionPublishSwitch(name: string) {
		return this.getSectionRow(name).getByRole('switch', { name: 'Published' })
	}

	async filterSectionsByContent(content: string) {
		await this.sectionContentFilter.fill(content)
	}

	async clearContentFilter() {
		await this.sectionContentFilter.clear()
	}

	async filterSectionsByCategory(category: string) {
		await this.sectionCategoryFilter.click()
		await this.page.getByRole('option', { name: category }).click()
	}

	// About Me Categories
	getCategoryRow(name: string) {
		return this.categoriesTable.tableContainer.getByRole('row', { name })
	}

	getCategoryElement(name: string) {
		return this.getCategoryRow(name)
	}

	async clickCategory(name: string) {
		await this.getCategoryRow(name).click()
	}

	async deleteCategory(name: string) {
		await this.categoriesTable.delete(name)
	}

	getCategoryPublishSwitch(name: string) {
		return this.getCategoryRow(name).getByRole('switch', { name: 'Published' })
	}

	async toggleCategoryPublishStatus(name: string) {
		await this.getCategoryPublishSwitch(name).click()
	}

	async filterCategoriesByName(name: string) {
		await this.categoryNameFilter.fill(name)
	}

	async clearNameFilter() {
		await this.categoryNameFilter.clear()
	}

	async filterCategoriesByDescription(description: string) {
		await this.categoryDescriptionFilter.fill(description)
	}
}
