import { type Locator, type Page } from '@playwright/test'
import {
	MenuDriven,
	Filterable,
	Switchable,
	BaseDataTablePOM,
} from '../base/data-table.pom'
import {
	DashboardAboutCategoryEditorDialogPOM,
	DashboardAboutMeEditorPOM,
} from './about-editors.pom'

// --- Assemble our desired table "recipe" ---
// We want a table that is MenuDriven, Switchable, AND Filterable.
// We apply the mixins to the BaseDataTablePOM to create a new, powerful base class.
// const ComposableBaseTable = Filterable(
// 	Switchable(MenuDriven<DashboardAboutMeEditorPOM>(BaseDataTablePOM)),
// )

export class AboutMeSectionsTable extends Filterable(
	Switchable(MenuDriven<DashboardAboutMeEditorPOM>(BaseDataTablePOM)),
) {
	// --- Implementation of ABSTRACT members required by the mixins ---
	readonly menuName = 'Open about section menu'
	readonly expectedHeaders: string[] = [
		'Name',
		'Content',
		'Category',
		'Created At',
		'Updated At',
		'Published',
	]

	async edit(name: string): Promise<DashboardAboutMeEditorPOM> {
		await this.clickEditButton(name)
		return new DashboardAboutMeEditorPOM(this.page)
	}

	constructor(page: Page, container: Locator) {
		super(page, container)
		this.switchName = /toggle publish/i
		this.addFilter('content', 'Filter content...')
		this.addFilter('category', 'Filter category...')
	}

	async filterByContent(content: string) {
		await this.filterBy('content', content)
	}
	async clearContentFilter() {
		await this.clearFilter('content')
	}
	async filterByCategory(category: string) {
		await this.filterBy('category', category)
	}
	async clearCategoryFilter() {
		await this.clearFilter('category')
	}
	async publish(name: string) {
		await this.setSwitchState(name, true)
	}
	async unpublish(name: string) {
		await this.setSwitchState(name, false)
	}

	// --- Specific methods for this table ---
	override async verifyHeaders(): Promise<void> {
		await super.verifyHeaders(this.expectedHeaders, {
			hasSelectColumn: true,
			hasActionsColumn: true,
		})
	}

	override async verifyData(data: string[][]): Promise<void> {
		await super.verifyData(data, { hasSelectColumn: true })
	}

	async getPublishSwitch(name: string): Promise<Locator> {
		const row = await this.getRow(name)
		return row.getByRole('switch', { name: /toggle publish/i })
	}

	async togglePublish(name: string): Promise<void> {
		const switchLocator = await this.getPublishSwitch(name)
		await switchLocator.click()
	}
}

export class AboutMeCategoriesTable extends MenuDrivenDataTablePOM<DashboardAboutCategoryEditorDialogPOM> {
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

	override async verifyData(data: string[][]): Promise<void> {
		await super.verifyData(data, { hasSelectColumn: true })
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

	async getPublishSwitch(name: string): Promise<Locator> {
		const row = await this.getRow(name)
		return row.getByRole('switch', { name: /toggle publish/i })
	}

	async togglePublish(name: string): Promise<void> {
		const switchLocator = await this.getPublishSwitch(name)
		await switchLocator.click()
	}

	async publish(name: string): Promise<boolean> {
		const switchLocator = await this.getPublishSwitch(name)
		const isPublished = await switchLocator.isChecked()
		if (!isPublished) {
			await this.togglePublish(name)
		}
		return isPublished
	}

	async unpublish(name: string): Promise<boolean> {
		const switchLocator = await this.getPublishSwitch(name)
		const isPublished = await switchLocator.isChecked()
		if (isPublished) {
			await this.togglePublish(name)
		}
		return isPublished
	}

	// async editFromNameClick(
	// 	name: string,
	// ): Promise<DashboardAboutCategoryEditorDialogPOM> {
	// 	await this.clickName(name)

	// 	const dialog = new DashboardAboutCategoryEditorDialogPOM(this.page)
	// 	await dialog.waitUntilVisible() // Good practice to wait for dialog to be ready
	// 	return dialog
	// }

	async edit(name: string): Promise<DashboardAboutCategoryEditorDialogPOM> {
		await this.clickEditButton(name)

		const dialog = new DashboardAboutCategoryEditorDialogPOM(this.page)
		await dialog.waitUntilVisible() // Good practice to wait for dialog to be ready
		return dialog
	}
}
