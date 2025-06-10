import { type Locator, type Page, expect } from '@playwright/test'
import { type BaseEditorData, BaseEditorPOM } from './editor.pom'

export abstract class BaseDialogEditorPOM<
	T extends BaseEditorData,
> extends BaseEditorPOM<T> {
	readonly dialog: Locator

	constructor(page: Page, formId: string) {
		const dialogLocator = page.getByRole('dialog')
		// The scope for all actions is now the dialog itself.
		super(page, dialogLocator, formId)
		this.dialog = dialogLocator
	}

	// Here we fulfill the contract of IEditorPOM
	async waitUntilVisible(): Promise<void> {
		await expect(this.dialog).toBeVisible()
	}

	// Override to add dialog-specific behavior
	override async create(data: T): Promise<void> {
		await super.create(data)
		await expect(this.dialog).not.toBeVisible()
	}

	override async update(data: Partial<T>): Promise<void> {
		await super.update(data)
		await expect(this.dialog).not.toBeVisible()
	}
}
