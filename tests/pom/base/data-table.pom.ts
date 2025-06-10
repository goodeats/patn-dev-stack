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

	async getRow(identifier: string): Promise<Locator> {
		return await this.table.getByRole('row').filter({ hasText: identifier })
	}

	async verifyHeaders(
		expectedHeaders: string[],
		options?: { hasSelectColumn?: boolean; hasActionsColumn?: boolean },
	): Promise<void> {
		await verifyTableHeaders(this.table, expectedHeaders, options)
	}

	async verifyData(
		data: string[][],
		options?: { hasSelectColumn?: boolean },
	): Promise<void> {
		await verifyMultipleTableRowsData(this.table, data, options)
	}

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

/**
 * MIXIN: Adds functionality for opening dialogs when clicking row names.
 */
export function DialogDriven<TEditPOM extends IEditorPOM>() {
	return function <TBase extends DataTableConstructor<BaseDataTablePOM>>(
		Base: TBase,
	) {
		abstract class DialogDrivenPOM extends Base {
			abstract edit(name: string): Promise<TEditPOM>

			// openDialog is now optional, with a default implementation
			openDialog(name: string): Promise<TEditPOM> {
				throw new Error(`openDialog not implemented for ${name}`)
			}

			async clickName(name: string): Promise<TEditPOM> {
				return this.openDialog(name)
			}
		}

		return DialogDrivenPOM
	}
}
