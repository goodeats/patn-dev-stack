import { type Locator, type Page, expect } from '@playwright/test'
import {
	verifyMultipleTableRowsData,
	verifyTableHeaders,
} from '#tests/helpers/table-locator'
import { DashboardAboutCategoryEditorDialog } from './dashboard-about-category-editor-dialog'

// https://playwright.dev/docs/pom

export class DashboardAboutPage {
	readonly page: Page
	readonly aboutMeSection: Locator
	readonly categoriesSection: Locator
	readonly newSectionButton: Locator
	readonly newCategoryButton: Locator
	readonly aboutMeTable: AboutMeSectionsTable
	readonly categoriesTable: AboutMeCategoriesTable
	readonly categoryEditorDialog: DashboardAboutCategoryEditorDialog

	constructor(page: Page) {
		this.page = page
		this.aboutMeSection = page.locator('#about-me-sections')
		this.categoriesSection = page.locator('#about-me-categories')
		this.newSectionButton = this.aboutMeSection.getByRole('link', {
			name: 'New',
		})
		this.newCategoryButton = this.categoriesSection.getByRole('button', {
			name: 'New',
		})
		this.aboutMeTable = new AboutMeSectionsTable(this.aboutMeSection)
		this.categoriesTable = new AboutMeCategoriesTable(this.categoriesSection)
		this.categoryEditorDialog = new DashboardAboutCategoryEditorDialog(page)
	}

	async goto() {
		await this.page.goto('/dashboard/about')
	}

	async clickNewSection() {
		await this.newSectionButton.click()
		await expect(this.page).toHaveURL('/dashboard/about/new')
	}

	async clickNewCategory() {
		await this.newCategoryButton.click()
		await expect(this.categoryEditorDialog.dialog).toBeVisible()
	}

	async gotoNewSection() {
		await this.newSectionButton.click()
	}

	getSectionElement(name: string) {
		return this.aboutMeTable.getRow(name)
	}

	getCategoryElement(name: string) {
		return this.categoriesTable.getRow(name)
	}

	async filterSectionsByContent(content: string) {
		await this.aboutMeTable.filterByContent(content)
	}

	async clearContentFilter() {
		await this.aboutMeTable.clearContentFilter()
	}

	async filterSectionsByCategory(category: string) {
		await this.aboutMeTable.filterByCategory(category)
	}

	getSectionPublishSwitch(name: string) {
		return this.aboutMeTable.getPublishSwitch(name)
	}

	async clickNewCategoryButton() {
		await this.clickNewCategory()
	}

	async clickCategory(name: string) {
		await this.categoriesTable.edit(name)
	}

	async deleteCategory(name: string) {
		await this.categoriesTable.delete(name)
	}

	getCategoryPublishSwitch(name: string) {
		return this.categoriesTable.getPublishSwitch(name)
	}

	async toggleCategoryPublishStatus(name: string) {
		await this.categoriesTable.togglePublishStatus(name)
	}

	async filterCategoriesByName(name: string) {
		await this.categoriesTable.filterByName(name)
	}

	async clearNameFilter() {
		await this.categoriesTable.clearNameFilter()
	}

	async filterCategoriesByDescription(description: string) {
		await this.categoriesTable.filterByDescription(description)
	}
}

class AboutMeSectionsTable {
	readonly container: Locator
	readonly table: Locator
	readonly contentFilter: Locator
	readonly categoryFilter: Locator

	constructor(container: Locator) {
		this.container = container
		this.table = this.container.locator('table')
		this.contentFilter = this.container.getByPlaceholder('Filter content...')
		this.categoryFilter = this.container.getByPlaceholder('Filter category...')
	}

	async filterByContent(content: string) {
		await this.contentFilter.fill(content)
	}

	async filterByCategory(category: string) {
		await this.categoryFilter.fill(category)
	}

	async clearContentFilter() {
		await this.contentFilter.clear()
	}

	getRow(name: string) {
		return this.table.getByRole('row').filter({ hasText: name })
	}

	getPublishSwitch(name: string) {
		const row = this.getRow(name)
		return row.getByRole('switch', {
			name: `Toggle publish status for ${name}`,
		})
	}

	async isPublished(name: string) {
		return this.getPublishSwitch(name).isChecked()
	}

	async togglePublishStatus(name: string) {
		await this.getPublishSwitch(name).click()
	}

	async delete(name: string) {
		const row = this.getRow(name)
		await row.getByRole('button', { name: 'Open menu' }).click()
		await this.container.page().getByRole('button', { name: 'Delete' }).click()
	}

	async verifyHeaders() {
		await verifyTableHeaders(
			this.table,
			['Name', 'Content', 'Category', 'Created At', 'Updated At', 'Published'],
			{ hasSelectColumn: true, hasActionsColumn: true },
		)
	}

	async verifyData(data: string[][]) {
		await verifyMultipleTableRowsData(this.table, data, {
			hasSelectColumn: true,
		})
	}
}

class AboutMeCategoriesTable {
	readonly container: Locator
	readonly table: Locator
	readonly nameFilter: Locator
	readonly descriptionFilter: Locator

	constructor(container: Locator) {
		this.container = container
		this.table = this.container.locator('table')
		this.nameFilter = this.container.getByPlaceholder('Filter name...')
		this.descriptionFilter = this.container.getByPlaceholder(
			'Filter description...',
		)
	}

	async filterByName(name: string) {
		await this.nameFilter.fill(name)
	}

	async filterByDescription(description: string) {
		await this.descriptionFilter.fill(description)
	}

	async clearNameFilter() {
		await this.nameFilter.clear()
	}

	getRow(name: string) {
		return this.table.getByRole('row').filter({ hasText: name })
	}

	async edit(name: string) {
		await this.getRow(name).getByText(name).click()
	}

	getPublishSwitch(name: string) {
		const row = this.getRow(name)
		return row.getByRole('switch', {
			name: `Toggle publish status for ${name}`,
		})
	}

	async isPublished(name: string) {
		return this.getPublishSwitch(name).isChecked()
	}

	async togglePublishStatus(name: string) {
		await this.getPublishSwitch(name).click()
	}

	async delete(name: string) {
		const row = this.getRow(name)
		await row.getByRole('button', { name: 'Open about category menu' }).click()
		await this.container.page().getByRole('button', { name: 'Delete' }).click()
	}

	async verifyHeaders() {
		await verifyTableHeaders(
			this.table,
			['Name', 'Description', 'Created At', 'Updated At', 'Published'],
			{ hasSelectColumn: true, hasActionsColumn: true },
		)
	}

	async verifyData(data: string[][]) {
		await verifyMultipleTableRowsData(this.table, data, {
			hasSelectColumn: true,
		})
	}
}
