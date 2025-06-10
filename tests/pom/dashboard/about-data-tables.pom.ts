import { type Locator, type Page } from '@playwright/test'
import {
	DialogDrivenDataTablePOM,
	MenuDrivenDataTablePOM,
} from '../base/data-table.pom'
import {
	DashboardAboutCategoryEditorDialog,
	DashboardAboutMeEditorPage,
} from './about-editors.pom'

export class AboutMeSectionsTable extends MenuDrivenDataTablePOM<DashboardAboutMeEditorPage> {
	// --- Configuration for MenuDrivenDataTablePOM ---
	readonly expectedHeaders: string[] = [
		'Name',
		'Content',
		'Category',
		'Created At',
		'Updated At',
		'Published',
	]
	readonly menuName = 'Open about section menu'

	// --- Specific to this table ---
	readonly contentFilter: Locator
	readonly categoryFilter: Locator

	constructor(page: Page, container: Locator) {
		super(page, container)
		this.contentFilter = this.getFilterByPlaceholder('Filter content...')
		this.categoryFilter = this.getFilterByPlaceholder('Filter category...')
	}

	// --- Specific methods for this table ---
	async verifyHeaders(): Promise<void> {
		await super.verifyHeaders(this.expectedHeaders, {
			hasSelectColumn: true,
			hasActionsColumn: true,
		})
	}

	// This is the public API for the page to use.
	async filterByContent(content: string): Promise<void> {
		await this.contentFilter.fill(content)
	}

	async clearContentFilter(): Promise<void> {
		await this.contentFilter.clear()
	}

	async filterByCategory(category: string): Promise<void> {
		await this.categoryFilter.fill(category)
	}

	async clearCategoryFilter(): Promise<void> {
		await this.categoryFilter.clear()
	}

	async edit(name: string): Promise<DashboardAboutMeEditorPage> {
		const row = this.getRow(name)
		await row.getByRole('button', { name: this.menuName }).click()
		await this.page.getByRole('menuitem', { name: 'Edit' }).click()

		// Construct and return the editor page object
		return new DashboardAboutMeEditorPage(this.page)
	}

	async delete(name: string): Promise<void> {
		await super.delete(name)
	}
}

export class AboutMeCategoriesTable extends DialogDrivenDataTablePOM<DashboardAboutCategoryEditorDialog> {
	// --- Configuration for DialogDrivenDataTablePOM ---
	readonly expectedHeaders: string[] = [
		'Name',
		'Description',
		'Created At',
		'Updated At',
		'Published',
	]
	readonly menuName = 'Open about category menu'

	// --- Specific to this table ---
	readonly nameFilter: Locator
	readonly descriptionFilter: Locator

	constructor(page: Page, container: Locator) {
		super(page, container)
		this.nameFilter = this.getFilterByPlaceholder('Filter name...')
		this.descriptionFilter = this.getFilterByPlaceholder(
			'Filter description...',
		)
	}

	// --- Specific methods for this table ---
	async verifyHeaders(): Promise<void> {
		await super.verifyHeaders(this.expectedHeaders, {
			hasSelectColumn: true,
			hasActionsColumn: true,
		})
	}

	async filterByName(name: string): Promise<void> {
		await this.nameFilter.fill(name)
	}

	async clearNameFilter(): Promise<void> {
		await this.nameFilter.clear()
	}

	async filterByDescription(description: string): Promise<void> {
		await this.descriptionFilter.fill(description)
	}

	async clearDescriptionFilter(): Promise<void> {
		await this.descriptionFilter.clear()
	}

	async edit(name: string): Promise<DashboardAboutCategoryEditorDialog> {
		await this.getRow(name).getByRole('button', { name }).click()

		// Construct and return the editor dialog object
		const dialog = new DashboardAboutCategoryEditorDialog(this.page)
		await dialog.waitUntilVisible() // Good practice to wait for dialog to be ready
		return dialog
	}

	async delete(name: string): Promise<void> {
		await super.delete(name)
	}
}
