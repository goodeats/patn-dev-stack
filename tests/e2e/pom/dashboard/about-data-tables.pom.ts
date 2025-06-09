import { type Locator, type Page } from '@playwright/test'
import {
	BaseDataTablePOM,
	BaseDialogDataTablePOM,
} from '../base/data-table.pom'

export class AboutMeSectionsTable extends BaseDataTablePOM {
	readonly contentFilter: Locator
	readonly categoryFilter: Locator
	readonly expectedHeaders: string[] = [
		'Name',
		'Content',
		'Category',
		'Created At',
		'Updated At',
		'Published',
	]
	readonly menuName = 'Open about section menu'

	constructor(page: Page, container: Locator) {
		super(page, container)
		this.contentFilter = this.getFilterByPlaceholder('Filter content...')
		this.categoryFilter = this.getFilterByPlaceholder('Filter category...')
	}

	async verifyHeaders(): Promise<void> {
		await super.verifyHeaders(this.expectedHeaders, {
			hasSelectColumn: true,
			hasActionsColumn: true,
		})
	}

	async edit(name: string): Promise<void> {
		await super.edit(name, this.menuName)
	}

	// The delete method uses a specific menu name
	async delete(name: string): Promise<void> {
		await super.delete(name, this.menuName)
	}
}

export class AboutMeCategoriesTable extends BaseDialogDataTablePOM {
	readonly nameFilter: Locator
	readonly descriptionFilter: Locator
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
		this.nameFilter = this.getFilterByPlaceholder('Filter name...')
		this.descriptionFilter = this.getFilterByPlaceholder(
			'Filter description...',
		)
	}

	async verifyHeaders(): Promise<void> {
		await super.verifyHeaders(this.expectedHeaders, {
			hasSelectColumn: true,
			hasActionsColumn: true,
		})
	}

	async edit(name: string): Promise<void> {
		await super.edit(name)
	}

	async delete(name: string): Promise<void> {
		await super.delete(name, this.menuName)
	}
}
