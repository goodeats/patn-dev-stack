import { type Locator, type Page } from '@playwright/test'
import {
	verifyMultipleTableRowsData,
	verifyTableHeaders,
} from '#tests/helpers/table-locator'
import { type IEditorPOM } from './editor.pom'

export abstract class BaseDataTablePOM {
	protected readonly page: Page
	public readonly tableContainer: Locator
	readonly table: Locator

	/**
	 * @param page The Playwright Page object.
	 * @param container The Locator for the container element of the table (e.g., '#about-me-sections'). This scopes all actions.
	 */
	constructor(page: Page, container: Locator) {
		this.page = page
		this.tableContainer = container
		this.table = this.tableContainer.locator('table')
	}

	/**
	 * Gets a filter input by its placeholder text.
	 * @param placeholder The placeholder text of the input.
	 */
	getFilterByPlaceholder(placeholder: string): Locator {
		return this.tableContainer.getByPlaceholder(placeholder)
	}

	/**
	 * Gets a specific row in the table by a unique text identifier within that row.
	 * @param identifier The unique text to find the row, e.g., the item's name.
	 */
	async getRow(identifier: string): Promise<Locator> {
		return await this.table.getByRole('row').filter({ hasText: identifier })
	}

	/**
	 * Verifies the table headers are correct.
	 * @param expectedHeaders Array of expected header strings.
	 * @param options Options for header verification (e.g., has select/actions columns).
	 */
	async verifyHeaders(
		expectedHeaders: string[],
		options?: { hasSelectColumn?: boolean; hasActionsColumn?: boolean },
	): Promise<void> {
		await verifyTableHeaders(this.table, expectedHeaders, options)
	}

	/**
	 * Verifies the data in the table body matches the expected data.
	 * @param data A 2D array of strings representing the expected row data.
	 * @param options Options for data verification (e.g., has a select column).
	 */
	async verifyData(
		data: string[][],
		options?: { hasSelectColumn?: boolean },
	): Promise<void> {
		await verifyMultipleTableRowsData(this.table, data, options)
	}

	/**
	 * Gets the publish status switch for a given row.
	 * @param name The name of the item in the row.
	 */
	async getPublishSwitch(name: string): Promise<Locator> {
		const row = await this.getRow(name)
		return row.getByRole('switch', {
			name: `Toggle publish status for ${name}`,
		})
	}

	/**
	 * Clicks the publish switch for a given row to toggle its state.
	 * @param name The name of the item in the row.
	 */
	async togglePublishStatus(name: string): Promise<void> {
		const publishSwitch = await this.getPublishSwitch(name)
		await publishSwitch.click()
	}

	async getHeaders(): Promise<string[]> {
		const headers = await this.table.locator('th').allTextContents()
		return headers.map((h) => h.trim()).filter((h) => h.length > 0)
	}
}

// For tables where actions are in a '...' dropdown menu.
export abstract class MenuDrivenDataTablePOM<
	TEditPOM extends IEditorPOM,
> extends BaseDataTablePOM {
	abstract readonly menuName: string

	/**
	 * Opens the menu for a given row.
	 * @param row The row locator to open the menu for.
	 */
	async openRowMenu(row: Locator): Promise<void> {
		await row.getByRole('button', { name: this.menuName }).click()
	}

	async clickEditButton(name: string): Promise<void> {
		const row = await this.getRow(name)
		await this.openRowMenu(row)
		await this.page.getByRole('menuitem', { name: 'Edit' }).click()
	}

	abstract edit(name: string): Promise<TEditPOM>

	async clickDeleteButton(name: string): Promise<void> {
		const row = await this.getRow(name)
		await this.openRowMenu(row)
		await this.page.getByRole('menuitem', { name: 'Delete' }).click()
	}

	async delete(name: string): Promise<void> {
		this.page.on('dialog', (dialog) => dialog.accept())
		await this.clickDeleteButton(name)
	}
}

// For tables where clicking the name opens an edit dialog.
export abstract class DialogDrivenDataTablePOM<
	TEditPOM extends IEditorPOM,
> extends BaseDataTablePOM {
	async clickName(name: string): Promise<void> {
		const row = await this.getRow(name)
		await row.getByRole('link', { name }).click()
	}

	abstract edit(name: string): Promise<TEditPOM>
}
