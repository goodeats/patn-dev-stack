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

	// private implementation
	// readonly categoryEditorDialog: DashboardAboutCategoryEditorDialog

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
		// this.categoryEditorDialog = new DashboardAboutCategoryEditorDialog(page)
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

	// async clickNewSection() {
	// 	await this.newSectionButton.click()
	// 	await expect(this.page).toHaveURL('/dashboard/about/new')
	// }

	// async clickNewCategory() {
	// 	await this.newCategoryButton.click()
	// 	await expect(this.categoryEditorDialog.dialog).toBeVisible()
	// }

	// async gotoNewSection() {
	// 	await this.newSectionButton.click()
	// }

	// getSectionElement(name: string) {
	// 	return this.aboutMeTable.getRow(name)
	// }

	// getCategoryElement(name: string) {
	// 	return this.categoriesTable.getRow(name)
	// }

	// async filterSectionsByContent(content: string) {
	// 	await this.aboutMeTable.filterByContent(content)
	// }

	// async clearContentFilter() {
	// 	await this.aboutMeTable.clearContentFilter()
	// }

	// async filterSectionsByCategory(category: string) {
	// 	await this.aboutMeTable.filterByCategory(category)
	// }

	// getSectionPublishSwitch(name: string) {
	// 	return this.aboutMeTable.getPublishSwitch(name)
	// }

	// async clickNewCategoryButton() {
	// 	await this.clickNewCategory()
	// }

	// async clickCategory(name: string) {
	// 	await this.categoriesTable.edit(name)
	// }

	// async deleteCategory(name: string) {
	// 	await this.categoriesTable.delete(name)
	// }

	// getCategoryPublishSwitch(name: string) {
	// 	return this.categoriesTable.getPublishSwitch(name)
	// }

	// async toggleCategoryPublishStatus(name: string) {
	// 	await this.categoriesTable.togglePublishStatus(name)
	// }

	// async filterCategoriesByName(name: string) {
	// 	await this.categoriesTable.filterByName(name)
	// }

	// async clearNameFilter() {
	// 	await this.categoriesTable.clearNameFilter()
	// }

	// async filterCategoriesByDescription(description: string) {
	// 	await this.categoriesTable.filterByDescription(description)
	// }
}

// class AboutMeSectionsTable {
// 	readonly page: Page
// 	readonly container: Locator
// 	readonly table: Locator
// 	readonly contentFilter: Locator
// 	readonly categoryFilter: Locator

// 	constructor(page: Page, container: Locator) {
// 		this.page = page
// 		this.container = container
// 		this.table = this.container.locator('table')
// 		this.contentFilter = this.container.getByPlaceholder('Filter content...')
// 		this.categoryFilter = this.container.getByPlaceholder('Filter category...')
// 	}

// 	async filterByContent(content: string) {
// 		await this.contentFilter.fill(content)
// 	}

// 	async filterByCategory(category: string) {
// 		await this.categoryFilter.fill(category)
// 	}

// 	async clearContentFilter() {
// 		await this.contentFilter.clear()
// 	}

// 	getRow(name: string) {
// 		return this.table.getByRole('row').filter({ hasText: name })
// 	}

// 	getPublishSwitch(name: string) {
// 		const row = this.getRow(name)
// 		return row.getByRole('switch', {
// 			name: `Toggle publish status for ${name}`,
// 		})
// 	}

// 	async isPublished(name: string) {
// 		return this.getPublishSwitch(name).isChecked()
// 	}

// 	async togglePublishStatus(name: string) {
// 		await this.getPublishSwitch(name).click()
// 	}

// 	async delete(name: string) {
// 		this.page.on('dialog', (dialog) => dialog.accept())
// 		const row = this.getRow(name)
// 		await row.getByRole('button', { name: 'Open about section menu' }).click()
// 		await this.container.page().getByRole('button', { name: 'Delete' }).click()
// 	}

// 	async verifyHeaders() {
// 		await verifyTableHeaders(
// 			this.table,
// 			['Name', 'Content', 'Category', 'Created At', 'Updated At', 'Published'],
// 			{ hasSelectColumn: true, hasActionsColumn: true },
// 		)
// 	}

// 	async verifyData(data: string[][]) {
// 		await verifyMultipleTableRowsData(this.table, data, {
// 			hasSelectColumn: true,
// 		})
// 	}
// }

// class AboutMeCategoriesTable {
// 	readonly page: Page
// 	readonly container: Locator
// 	readonly table: Locator
// 	readonly nameFilter: Locator
// 	readonly descriptionFilter: Locator
// 	readonly categoryEditorDialog: DashboardAboutCategoryEditorDialog

// 	constructor(page: Page, container: Locator) {
// 		this.page = page
// 		this.container = container
// 		this.table = this.container.locator('table')
// 		this.nameFilter = this.container.getByPlaceholder('Filter name...')
// 		this.descriptionFilter = this.container.getByPlaceholder(
// 			'Filter description...',
// 		)
// 		this.categoryEditorDialog = new DashboardAboutCategoryEditorDialog(page)
// 	}

// 	async filterByName(name: string) {
// 		await this.nameFilter.fill(name)
// 	}

// 	async filterByDescription(description: string) {
// 		await this.descriptionFilter.fill(description)
// 	}

// 	async clearNameFilter() {
// 		await this.nameFilter.clear()
// 	}

// 	getRow(name: string) {
// 		return this.table.getByRole('row').filter({ hasText: name })
// 	}

// 	async edit(name: string) {
// 		await this.getRow(name).getByText(name).click()
// 		await expect(this.categoryEditorDialog.dialog).toBeVisible()
// 	}

// 	getPublishSwitch(name: string) {
// 		const row = this.getRow(name)
// 		return row.getByRole('switch', {
// 			name: `Toggle publish status for ${name}`,
// 		})
// 	}

// 	async isPublished(name: string) {
// 		return this.getPublishSwitch(name).isChecked()
// 	}

// 	async togglePublishStatus(name: string) {
// 		await this.getPublishSwitch(name).click()
// 	}

// 	async delete(name: string) {
// 		this.page.on('dialog', (dialog) => dialog.accept())
// 		const row = this.getRow(name)
// 		await row.getByRole('button', { name: 'Open about category menu' }).click()
// 		await this.container.page().getByRole('button', { name: 'Delete' }).click()
// 	}

// 	async verifyHeaders() {
// 		await verifyTableHeaders(
// 			this.table,
// 			['Name', 'Description', 'Created At', 'Updated At', 'Published'],
// 			{ hasSelectColumn: true, hasActionsColumn: true },
// 		)
// 	}

// 	async verifyData(data: string[][]) {
// 		await verifyMultipleTableRowsData(this.table, data, {
// 			hasSelectColumn: true,
// 		})
// 	}
// }
