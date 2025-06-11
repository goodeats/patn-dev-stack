import { type Locator, type Page } from '@playwright/test'
import {
	MenuDriven,
	Filterable,
	Switchable,
	MixinBase,
} from '../base/data-table.pom'
import { DashboardContactEditorPOM } from './contact-editors.pom'

const ContactsComposableTable = Filterable(
	Switchable(MenuDriven<DashboardContactEditorPOM>()(MixinBase)),
)

export class ContactsTablePOM extends ContactsComposableTable {
	// --- Required abstract members ---
	readonly menuName = 'Open contact menu'
	readonly expectedHeaders: string[] = [
		'Name',
		'URL',
		'Created At',
		'Updated At',
		'Published',
	]

	constructor(page: Page, container: Locator) {
		super(page, container)
		this.switchName = /toggle publish/i
		this.addFilters([
			{ name: 'text', placeholder: 'Filter name...' },
			{ name: 'href', placeholder: 'Filter URL...' },
		])
	}

	// --- MenuDriven mixin implementation ---
	/**
	 * Edit a contact by name (from MenuDriven mixin)
	 */
	async edit(name: string): Promise<DashboardContactEditorPOM> {
		await this.clickEditButton(name)
		return new DashboardContactEditorPOM(this.page)
	}

	// --- Switchable mixin extensions ---
	/**
	 * Publish a contact by setting its switch to true
	 */
	async publish(name: string): Promise<void> {
		await this.setSwitchState(name, true)
	}

	/**
	 * Unpublish a contact by setting its switch to false
	 */
	async unpublish(name: string): Promise<void> {
		await this.setSwitchState(name, false)
	}

	// --- Filterable mixin extensions ---
	/**
	 * Filter contacts by name
	 */
	async filterByName(name: string): Promise<void> {
		await this.filterBy('text', name)
	}

	/**
	 * Clear the name filter
	 */
	async clearNameFilter(): Promise<void> {
		await this.clearFilter('text')
	}

	/**
	 * Filter contacts by URL
	 */
	async filterByUrl(url: string): Promise<void> {
		await this.filterBy('href', url)
	}

	/**
	 * Clear the URL filter
	 */
	async clearUrlFilter(): Promise<void> {
		await this.clearFilter('href')
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
