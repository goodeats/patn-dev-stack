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

	constructor(page: Page, container: Locator) {
		this.page = page
		this.tableContainer = container
		this.table = this.tableContainer.locator('table')
	}

	/**
	 * Returns the row locator matching the identifier text.
	 */
	async getRow(identifier: string): Promise<Locator> {
		return await this.table.getByRole('row').filter({ hasText: identifier })
	}

	/**
	 * Verifies the table headers match the expected headers.
	 */
	async verifyHeaders(
		expectedHeaders: string[],
		options?: { hasSelectColumn?: boolean; hasActionsColumn?: boolean },
	): Promise<void> {
		await verifyTableHeaders(this.table, expectedHeaders, options)
	}

	/**
	 * Verifies the table data matches the expected data.
	 */
	async verifyData(
		data: string[][],
		options?: { hasSelectColumn?: boolean },
	): Promise<void> {
		await verifyMultipleTableRowsData(this.table, data, options)
	}

	/**
	 * Returns the trimmed, non-empty table header texts.
	 */
	async getHeaders(): Promise<string[]> {
		const headers = await this.table.locator('th').allTextContents()
		return headers.map((h) => h.trim()).filter((h) => h.length > 0)
	}
}

// --- Composable Feature Mixins ---
export class MixinBase extends BaseDataTablePOM {}

/**
 * MIXIN FACTORY: Creates a MenuDriven mixin for a specific Editor POM type.
 */
export function MenuDriven<TEditPOM extends IEditorPOM>() {
	// The returned function is the actual mixin. It now accepts any constructor.
	return function <TBase extends DataTableConstructor<BaseDataTablePOM>>(
		Base: TBase,
	) {
		abstract class MenuDrivenPOM extends Base {
			abstract readonly menuName: string
			abstract edit(name: string): Promise<TEditPOM>

			/**
			 * Opens the row menu for the given row.
			 */
			protected async openRowMenu(row: Locator): Promise<void> {
				await row.getByRole('button', { name: this.menuName }).click()
			}

			/**
			 * Clicks the Edit button in the row menu for the given name.
			 */
			protected async clickEditButton(name: string): Promise<void> {
				const row = await this.getRow(name)
				await this.openRowMenu(row)
				await this.page.getByRole('menuitem', { name: 'Edit' }).click()
			}

			/**
			 * Clicks the Delete button in the row menu for the given name.
			 */
			protected async clickDeleteButton(name: string): Promise<void> {
				const row = await this.getRow(name)
				await this.openRowMenu(row)
				await this.page.getByRole('menuitem', { name: 'Delete' }).click()
			}

			/**
			 * Deletes the row with the given name, accepting the confirmation dialog.
			 */
			async delete(name: string): Promise<void> {
				this.page.on('dialog', (dialog) => dialog.accept())
				await this.clickDeleteButton(name)
			}
		}
		return MenuDrivenPOM
	}
}

/**
 * MIXIN: Adds functionality for rows containing a generic toggle switch.
 */
export function Switchable<
	TBase extends DataTableConstructor<BaseDataTablePOM>,
>(Base: TBase) {
	return class SwitchablePOM extends Base {
		/**
		 * The accessible name or regex for the switch in the row.
		 */
		protected switchName: string | RegExp = /toggle/i

		/**
		 * Returns the switch locator for the given row identifier.
		 */
		async getSwitch(identifier: string): Promise<Locator> {
			const row = await this.getRow(identifier)
			return row.getByRole('switch', { name: this.switchName })
		}

		/**
		 * Toggles the switch for the given row identifier.
		 */
		async toggleSwitch(identifier: string): Promise<void> {
			await (await this.getSwitch(identifier)).click()
		}

		/**
		 * Sets the switch state for the given row identifier.
		 */
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
		/**
		 * Map of filter names to their Locators.
		 */
		private readonly filters: Map<string, Locator> = new Map<string, Locator>()

		/**
		 * Returns the filter locator by its placeholder text.
		 */
		private getFilterByPlaceholder(placeholder: string): Locator {
			return this.tableContainer.getByPlaceholder(placeholder)
		}

		/**
		 * Adds a filter by name and placeholder.
		 */
		protected addFilter(name: string, placeholder: string): void {
			this.filters.set(name, this.getFilterByPlaceholder(placeholder))
		}

		/**
		 * Adds multiple filters at once.
		 */
		protected addFilters(
			filters: { name: string; placeholder: string }[],
		): void {
			for (const { name, placeholder } of filters) {
				this.addFilter(name, placeholder)
			}
		}

		/**
		 * Returns the filter locator by name, or throws if not found.
		 */
		getFilter(name: string): Locator {
			const filterLocator = this.filters.get(name)
			if (!filterLocator) {
				const available = Array.from(this.filters.keys()).join(', ') || 'none'
				throw new Error(
					`Filter "${name}" not found. Available filters: [${available}]`,
				)
			}
			return filterLocator
		}

		/**
		 * Fills the filter with the given value.
		 */
		async filterBy(name: string, value: string): Promise<void> {
			await this.getFilter(name).fill(value)
		}

		/**
		 * Clears the filter value.
		 */
		async clearFilter(name: string): Promise<void> {
			await this.getFilter(name).clear()
		}
	}
}

/**
 * MIXIN: Adds functionality for opening dialogs when clicking row names.
 */
export function DialogDriven<TEditPOM extends IEditorPOM>() {
	return function <TBase extends DataTableConstructor<BaseDataTablePOM>>(
		Base: TBase,
	) {
		abstract class DialogDrivenPOM extends Base {
			abstract edit(name: string): Promise<TEditPOM>

			/**
			 * Opens a dialog for the given row name. Should be overridden by subclasses.
			 */
			openDialog(name: string): Promise<TEditPOM> {
				throw new Error(`openDialog not implemented for ${name}`)
			}

			/**
			 * Clicks the row name to open the dialog.
			 */
			async clickName(name: string): Promise<TEditPOM> {
				return this.openDialog(name)
			}
		}

		return DialogDrivenPOM
	}
}
