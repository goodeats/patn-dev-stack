import { type Page, type Locator, expect } from '@playwright/test'

// The contract all editors must follow.
export interface IEditorPOM {
	waitUntilVisible(): Promise<void>
}

// A base interface for data passed to editor methods
export interface BaseEditorData {
	name: string
	description?: string
}

export abstract class BaseEditorPOM<T extends BaseEditorData>
	implements IEditorPOM
{
	readonly nameInput: Locator
	readonly descriptionInput: Locator
	readonly createButton: Locator
	readonly saveButton: Locator
	readonly deleteButton: Locator // optional
	readonly nameError: Locator

	/**
	 * @param page The Playwright Page object.
	 * @param scope The Locator for the editor's scope. For a page, this can be `page`. For a dialog, it should be `page.getByRole('dialog')`.
	 * @param formId The base ID of the form, used to locate specific error elements.
	 */
	constructor(
		protected page: Page,
		protected scope: Locator | Page, // Can be the whole page or a specific locator like a dialog
		formId: string,
	) {
		this.nameInput = this.scope.getByLabel('Name')
		this.descriptionInput = this.scope.getByLabel('Description (Optional)')
		this.createButton = this.scope.getByRole('button', {
			name: /Create/i,
		})
		this.saveButton = this.scope.getByRole('button', { name: 'Save Changes' })
		this.deleteButton = this.scope.getByRole('button', { name: 'Delete' })
		this.nameError = this.scope.locator(`#${formId}-name-error`)
	}

	// This method must be implemented by subclasses.
	abstract waitUntilVisible(): Promise<void>

	async fillForm(data: Partial<T>): Promise<void> {
		if (data.name) await this.nameInput.fill(data.name)
		if (data.description) await this.descriptionInput.fill(data.description)
	}

	async create(data: T): Promise<void> {
		await this.fillForm(data)
		await this.createButton.click()
	}

	async update(data: Partial<T>): Promise<void> {
		if (data.name) await this.nameInput.fill(data.name)
		if (data.description) await this.descriptionInput.fill(data.description)
		await this.saveButton.click()
	}

	async delete(): Promise<void> {
		this.page.on('dialog', (dialog) => dialog.accept())
		await this.deleteButton.click()
	}

	async clearName(): Promise<void> {
		await this.nameInput.clear()
	}

	async verifyRequiredNameError(isVisible: boolean = true): Promise<void> {
		if (isVisible) {
			await expect(this.nameError).toBeVisible()
		} else {
			await expect(this.nameError).not.toBeVisible()
		}
	}
}

export abstract class BasePageEditorPOM<
	T extends BaseEditorData,
> extends BaseEditorPOM<T> {
	protected url: string = '' // To be defined by the extended class

	constructor(page: Page, formId: string) {
		// The scope is the entire page.
		super(page, page, formId)
	}

	// For a page, "visible" means the page has loaded. We can consider it instantly visible.
	async waitUntilVisible(): Promise<void> {
		// A more robust check could be to wait for a specific element, like the form itself.
		await expect(this.scope.locator('form')).toBeVisible()
	}

	async gotoNew(): Promise<void> {
		await this.page.goto(`${this.url}/new`)
	}

	async gotoEdit(id: string): Promise<void> {
		await this.page.goto(`${this.url}/${id}/edit`)
	}
}

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
