import { type Locator } from '@playwright/test'
import { BaseDataTablePOM } from './data-table.pom'
import { type IEditorPOM } from './editor.pom'

// For tables where actions are in a '...' dropdown menu.
export abstract class MenuDrivenDataTablePOM<
	TEditPOM extends IEditorPOM,
> extends BaseDataTablePOM {
	abstract readonly menuName: string

	abstract edit(name: string): Promise<TEditPOM>

	async delete(name: string): Promise<void> {
		this.page.on('dialog', (dialog) => dialog.accept())
		const row = await this.getRow(name)
		await this.openRowMenu(row)

		const menu = await row.getByRole('menu')
		await menu.getByRole('button', { name: 'Delete' }).click()
	}

	/**
	 * Opens the menu for a given row.
	 * @param row The row locator to open the menu for.
	 */
	async openRowMenu(row: Locator): Promise<void> {
		await row.getByRole('button', { name: this.menuName }).click()
	}
}

// For tables where clicking the name opens an edit dialog.
export abstract class DialogDrivenDataTablePOM<
	TEditPOM extends IEditorPOM,
> extends BaseDataTablePOM {
	abstract readonly menuName: string

	abstract edit(name: string): Promise<TEditPOM>

	async delete(name: string): Promise<void> {
		this.page.on('dialog', (dialog) => dialog.accept())
		const row = await this.getRow(name)
		await this.openRowMenu(row)

		const menu = await row.getByRole('menu')
		await menu.getByRole('button', { name: 'Delete' }).click()
	}

	/**
	 * Opens the menu for a given row.
	 * @param row The row locator to open the menu for.
	 */
	async openRowMenu(row: Locator): Promise<void> {
		await row.getByRole('button', { name: this.menuName }).click()
	}
}
