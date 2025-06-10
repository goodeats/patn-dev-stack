import { type Locator, type Page } from '@playwright/test'
import {
	MenuDriven,
	Filterable,
	Switchable,
	DialogDriven,
	MixinBase,
} from '../base/data-table.pom'
import {
	DashboardAboutCategoryEditorDialogPOM,
	DashboardAboutMeEditorPOM,
} from './about-editors.pom'

const AboutMeSectionsComposableTable = Filterable(
	Switchable(MenuDriven<DashboardAboutMeEditorPOM>()(MixinBase)),
)

const AboutMeCategoriesComposableTable =
	DialogDriven<DashboardAboutCategoryEditorDialogPOM>()(
		Filterable(
			Switchable(
				MenuDriven<DashboardAboutCategoryEditorDialogPOM>()(MixinBase),
			),
		),
	)

export class AboutMeSectionsTable extends AboutMeSectionsComposableTable {
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

export class AboutMeCategoriesTable extends AboutMeCategoriesComposableTable {
	// --- Configuration for MenuDriven mixin ---
	readonly expectedHeaders: string[] = [
		'Name',
		'Description',
		'Created At',
		'Updated At',
		'Published',
	]
	readonly menuName = 'Open about category menu'

	constructor(page: Page, container: Locator) {
		super(page, container)
		this.switchName = /toggle publish/i
		this.addFilter('name', 'Filter name...')
		this.addFilter('description', 'Filter description...')
	}

	// --- Specific methods for this table ---
	async verifyHeaders(): Promise<void> {
		await super.verifyHeaders(this.expectedHeaders, {
			hasSelectColumn: true,
			hasActionsColumn: true,
		})
	}

	async verifyData(data: string[][]): Promise<void> {
		await super.verifyData(data, { hasSelectColumn: true })
	}

	async filterByName(name: string): Promise<void> {
		await this.filterBy('name', name)
	}

	async clearNameFilter(): Promise<void> {
		await this.clearFilter('name')
	}

	async filterByDescription(description: string): Promise<void> {
		await this.filterBy('description', description)
	}

	async clearDescriptionFilter(): Promise<void> {
		await this.clearFilter('description')
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

	async delete(name: string): Promise<void> {
		this.page.on('dialog', (dialog) => dialog.accept())
		await this.clickDeleteButton(name)
	}

	// Required by DialogDriven mixin
	async openDialog(
		name: string,
	): Promise<DashboardAboutCategoryEditorDialogPOM> {
		await this.clickName(name)

		const dialog = new DashboardAboutCategoryEditorDialogPOM(this.page)
		await dialog.waitUntilVisible()
		return dialog
	}

	override async edit(
		name: string,
	): Promise<DashboardAboutCategoryEditorDialogPOM> {
		await this.clickEditButton(name)

		const dialog = new DashboardAboutCategoryEditorDialogPOM(this.page)
		await dialog.waitUntilVisible() // Good practice to wait for dialog to be ready
		return dialog
	}
}
