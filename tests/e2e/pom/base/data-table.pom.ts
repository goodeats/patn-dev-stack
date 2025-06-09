import { type Locator, type Page } from '@playwright/test'
import {
	verifyMultipleTableRowsData,
	verifyTableHeaders,
} from '#tests/helpers/table-locator'

export abstract class BaseDataTablePOM {
	readonly table: Locator

	/**
	 * @param page The Playwright Page object.
	 * @param container The Locator for the container element of the table (e.g., '#about-me-sections'). This scopes all actions.
	 */
	constructor(
		protected page: Page,
		protected container: Locator,
	) {
		this.table = this.container.locator('table')
	}

	/**
	 * Gets a filter input by its placeholder text.
	 * @param placeholder The placeholder text of the input.
	 */
	getFilterByPlaceholder(placeholder: string): Locator {
		return this.container.getByPlaceholder(placeholder)
	}

	/**
	 * Gets a specific row in the table by a unique text identifier within that row.
	 * @param identifier The unique text to find the row, e.g., the item's name.
	 */
	getRow(identifier: string): Locator {
		return this.table.getByRole('row').filter({ hasText: identifier })
	}

	/**
	 * Gets the publish status switch for a given row.
	 * @param name The name of the item in the row.
	 */
	getPublishSwitch(name: string): Locator {
		const row = this.getRow(name)
		return row.getByRole('switch', {
			name: `Toggle publish status for ${name}`,
		})
	}

	/**
	 * Clicks the publish switch for a given row to toggle its state.
	 * @param name The name of the item in the row.
	 */
	async togglePublishStatus(name: string): Promise<void> {
		await this.getPublishSwitch(name).click()
	}

	/**
	 * Edits an item in the table using the actions menu.
	 * @param name The name of the item to edit.
	 * @param menuName The accessible name of the 'more options' menu button.
	 */
	async edit(name: string, menuName: string): Promise<void> {
		const row = this.getRow(name)
		await row.getByRole('button', { name: menuName }).click()
		// The edit button is in a dropdown, but scoping to the page should be safe after the menu is opened.
		await this.page.getByRole('menuitem', { name: 'Edit' }).click()
	}

	/**
	 * Deletes an item from the table using the actions menu.
	 * Handles the confirmation dialog.
	 * @param name The name of the item to delete.
	 * @param menuName The accessible name of the 'more options' menu button.
	 */
	async delete(name: string, menuName: string): Promise<void> {
		this.page.on('dialog', (dialog) => dialog.accept())
		const row = this.getRow(name)
		await row.getByRole('button', { name: menuName }).click()
		// The delete button is in a dropdown, but scoping to the page should be safe after the menu is opened.
		await this.page.getByRole('button', { name: 'Delete' }).click()
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
}

export abstract class BaseDialogDataTablePOM extends BaseDataTablePOM {
	readonly nameFilter: Locator
	readonly descriptionFilter?: Locator // Optional, as SkillCategory doesn't have it

	constructor(page: Page, container: Locator, hasDescription: boolean = true) {
		super(page, container)
		this.nameFilter = this.getFilterByPlaceholder('Filter name...')
		if (hasDescription) {
			this.descriptionFilter = this.getFilterByPlaceholder(
				'Filter description...',
			)
		}
	}

	// assumes clicking the name opens the dialog
	async edit(name: string): Promise<void> {
		await this.getRow(name).getByRole('button', { name }).click()
	}

	async delete(name: string, menuName: string): Promise<void> {
		await super.delete(name, menuName)
	}
}
