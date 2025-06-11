import { type Locator, type Page } from '@playwright/test'
import {
	MenuDriven,
	Filterable,
	Switchable,
	DialogDriven,
	MixinBase,
} from '../base/data-table.pom'
import {
	DashboardSkillCategoryEditorDialogPOM,
	DashboardSkillEditorPOM,
} from './skill-editors.pom'

const SkillsComposableTable = Filterable(
	Switchable(MenuDriven<DashboardSkillEditorPOM>()(MixinBase)),
)

const SkillCategoriesComposableTable =
	DialogDriven<DashboardSkillCategoryEditorDialogPOM>()(
		Filterable(
			Switchable(
				MenuDriven<DashboardSkillCategoryEditorDialogPOM>()(MixinBase),
			),
		),
	)

export class SkillsTablePOM extends SkillsComposableTable {
	// --- Required abstract members ---
	readonly menuName = 'Open skill menu'
	readonly expectedHeaders: string[] = [
		'Name',
		'Category',
		'Created At',
		'Updated At',
		'Published',
	]

	constructor(page: Page, container: Locator) {
		super(page, container)
		this.switchName = /toggle publish/i
		this.addFilters([
			{ name: 'name', placeholder: 'Filter name...' },
			{ name: 'category', placeholder: 'Filter category...' },
		])
	}

	// --- MenuDriven mixin implementation ---
	/**
	 * Edit a skill by name (from MenuDriven mixin)
	 */
	async edit(name: string): Promise<DashboardSkillEditorPOM> {
		await this.clickEditButton(name)
		return new DashboardSkillEditorPOM(this.page)
	}

	// --- Switchable mixin extensions ---
	/**
	 * Publish a skill by setting its switch to true
	 */
	async publish(name: string): Promise<void> {
		await this.setSwitchState(name, true)
	}

	/**
	 * Unpublish a skill by setting its switch to false
	 */
	async unpublish(name: string): Promise<void> {
		await this.setSwitchState(name, false)
	}

	// --- Filterable mixin extensions ---
	/**
	 * Filter skills by name
	 */
	async filterByName(name: string): Promise<void> {
		await this.filterBy('name', name)
	}

	/**
	 * Clear the name filter
	 */
	async clearNameFilter(): Promise<void> {
		await this.clearFilter('name')
	}

	/**
	 * Filter skills by category
	 */
	async filterByCategory(category: string): Promise<void> {
		await this.filterBy('category', category)
	}

	/**
	 * Clear the category filter
	 */
	async clearCategoryFilter(): Promise<void> {
		await this.clearFilter('category')
	}

	// --- Custom methods ---
	/**
	 * Verify table headers with appropriate options
	 */
	override async verifyHeaders(): Promise<void> {
		await super.verifyHeaders(this.expectedHeaders, {
			hasSelectColumn: true,
			hasActionsColumn: true,
		})
	}

	/**
	 * Verify table data with appropriate options
	 */
	override async verifyData(data: string[][]): Promise<void> {
		await super.verifyData(data, { hasSelectColumn: true })
	}
}

export class SkillCategoriesTablePOM extends SkillCategoriesComposableTable {
	// --- Required abstract members ---
	readonly expectedHeaders: string[] = [
		'Name',
		'Description',
		'Created At',
		'Updated At',
		'Published',
	]
	readonly menuName = 'Open skill category menu'

	constructor(page: Page, container: Locator) {
		super(page, container)
		this.switchName = /toggle publish/i
		this.addFilters([
			{ name: 'name', placeholder: 'Filter name...' },
			{ name: 'description', placeholder: 'Filter description...' },
		])
	}

	// --- DialogDriven mixin implementation ---
	/**
	 * Open a dialog by clicking the row name.
	 * Overrides the default clickName from DialogDriven to behave like edit().
	 * This makes clicking the category name open the editor dialog directly.
	 */
	override async clickName(
		name: string,
	): Promise<DashboardSkillCategoryEditorDialogPOM> {
		return this.edit(name) // Delegate to the existing edit method
	}

	// --- MenuDriven mixin implementation ---
	/**
	 * Edit a category by name (from MenuDriven mixin)
	 */
	override async edit(
		name: string,
	): Promise<DashboardSkillCategoryEditorDialogPOM> {
		await this.clickEditButton(name)

		const dialog = new DashboardSkillCategoryEditorDialogPOM(this.page)
		await dialog.waitUntilVisible() // Good practice to wait for dialog to be ready
		return dialog
	}

	// --- Filterable mixin extensions ---
	/**
	 * Filter categories by name
	 */
	async filterByName(name: string): Promise<void> {
		await this.filterBy('name', name)
	}

	/**
	 * Clear the name filter
	 */
	async clearNameFilter(): Promise<void> {
		await this.clearFilter('name')
	}

	/**
	 * Filter categories by description
	 */
	async filterByDescription(description: string): Promise<void> {
		await this.filterBy('description', description)
	}

	/**
	 * Clear the description filter
	 */
	async clearDescriptionFilter(): Promise<void> {
		await this.clearFilter('description')
	}

	// --- Switchable mixin extensions ---
	/**
	 * Publish a category, returns whether it was already published
	 */
	async publish(name: string): Promise<boolean> {
		const switchLocator = await this.getSwitch(name)
		const isPublished = await switchLocator.isChecked()
		if (!isPublished) {
			await this.toggleSwitch(name)
		}
		return isPublished
	}

	/**
	 * Unpublish a category, returns whether it was published
	 */
	async unpublish(name: string): Promise<boolean> {
		const switchLocator = await this.getSwitch(name)
		const isPublished = await switchLocator.isChecked()
		if (isPublished) {
			await this.toggleSwitch(name)
		}
		return isPublished
	}

	// --- Custom methods ---
	/**
	 * Verify table headers with appropriate options
	 */
	override async verifyHeaders(): Promise<void> {
		await super.verifyHeaders(this.expectedHeaders, {
			hasSelectColumn: true,
			hasActionsColumn: true,
		})
	}

	/**
	 * Verify table data with appropriate options
	 */
	override async verifyData(data: string[][]): Promise<void> {
		await super.verifyData(data, { hasSelectColumn: true })
	}
}
