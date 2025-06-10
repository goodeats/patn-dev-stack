import { type Locator, type Page } from '@playwright/test'
import {
	verifyMultipleTableRowsData,
	verifyTableHeaders,
} from '#tests/helpers/table-locator'
import { type IEditorPOM } from './editor.pom'

// A standard helper type for creating mixins in TypeScript.
type DataTableConstructor<T = {}> = new (...args: any[]) => T

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
}

// --- Composable Feature Mixins ---

// --- Composable Feature Mixins ---

/**
 * MIXIN: Adds functionality for a row menu. It requires the final class
 * to implement 'menuName' and 'edit'.
 */
export function MenuDriven<
	TEditPOM extends IEditorPOM,
	TBase extends DataTableConstructor<BaseDataTablePOM>,
>(Base: TBase) {
	// The returned class is ABSTRACT because it has abstract members.
	abstract class MenuDrivenPOM extends Base {
		// This MUST be implemented by the final concrete class.
		abstract readonly menuName: string

		// This MUST also be implemented to define how an edit session is started.
		abstract edit(name: string): Promise<TEditPOM>

		// The mixin provides the helper methods.
		protected async openRowMenu(row: Locator): Promise<void> {
			await row.getByRole('button', { name: this.menuName }).click()
		}

		protected async clickEditButton(name: string): Promise<void> {
			const row = await this.getRow(name)
			await this.openRowMenu(row)
			await this.page.getByRole('menuitem', { name: 'Edit' }).click()
		}

		protected async clickDeleteButton(name: string): Promise<void> {
			const row = await this.getRow(name)
			await this.openRowMenu(row)
			await this.page.getByRole('menuitem', { name: 'Delete' }).click()
		}

		async delete(name: string): Promise<void> {
			this.page.on('dialog', (dialog) => dialog.accept())
			await this.clickDeleteButton(name)
		}
	}
	return MenuDrivenPOM
}

/**
 * MIXIN: Adds functionality for rows containing a generic toggle switch.
 */
export function Switchable<
	TBase extends DataTableConstructor<BaseDataTablePOM>,
>(Base: TBase) {
	return class SwitchablePOM extends Base {
		protected switchName: string | RegExp = /toggle/i

		async getSwitch(identifier: string): Promise<Locator> {
			const row = await this.getRow(identifier)
			return row.getByRole('switch', { name: this.switchName })
		}

		async toggleSwitch(identifier: string): Promise<void> {
			await (await this.getSwitch(identifier)).click()
		}

		async setSwitchState(
			identifier: string,
			desiredState: boolean,
		): Promise<void> {
			const rowSwitch = await this.getSwitch(identifier)
			if ((await rowSwitch.isChecked()) !== desiredState) {
				await rowSwitch.click()
			}
		}
	}
}

/**
 * MIXIN: Adds functionality for tables with column filters.
 */
export function Filterable<
	TBase extends DataTableConstructor<BaseDataTablePOM>,
>(Base: TBase) {
	return class FilterablePOM extends Base {
		private readonly filters = new Map<string, Locator>()

		private getFilterByPlaceholder(placeholder: string): Locator {
			return this.tableContainer.getByPlaceholder(placeholder)
		}

		protected addFilter(name: string, placeholder: string): void {
			this.filters.set(name, this.getFilterByPlaceholder(placeholder))
		}

		getFilter(name: string): Locator {
			const filterLocator = this.filters.get(name)
			if (!filterLocator) throw new Error(`Filter "${name}" not found.`)
			return filterLocator
		}

		async filterBy(name: string, value: string): Promise<void> {
			await this.getFilter(name).fill(value)
		}

		async clearFilter(name: string): Promise<void> {
			await this.getFilter(name).clear()
		}
	}
}

// DialogDriven variant for completeness.
export abstract class DialogDrivenDataTablePOM<
	TEditPOM extends IEditorPOM,
> extends BaseDataTablePOM {
	async clickName(name: string): Promise<void> {
		await this.getRow(name).then((row) =>
			row.getByRole('link', { name }).click(),
		)
	}
	abstract edit(name: string): Promise<TEditPOM>
}
