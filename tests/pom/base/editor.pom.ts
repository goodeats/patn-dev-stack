import { type Page, type Locator, expect } from '@playwright/test'

// The contract all editors must follow.
export interface IEditorPOM {
	waitUntilVisible(): Promise<void>
}

// A base interface for data passed to editor methods
export interface BaseEditorData {
	name?: string
	description?: string
}

// --- LAYER 1: THE ROOT EDITOR POM ---
// It handles common locators and the fillForm logic.
export abstract class BaseEditorPOM<T extends BaseEditorData>
	implements IEditorPOM
{
	readonly nameInput: Locator
	readonly descriptionInput: Locator
	readonly createButton: Locator
	readonly saveButton: Locator
	readonly deleteButton: Locator
	readonly nameError: Locator

	/**
	 * @param page The Playwright Page object.
	 * @param scope The Locator for the editor's scope. For a page, this can be `page`. For a dialog, it should be `page.getByRole('dialog')`.
	 * @param formId The base ID of the form, used to locate specific error elements.
	 */
	constructor(
		protected page: Page,
		protected scope: Locator | Page,
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
		await this.fillForm(data)
		await this.saveButton.click()
	}

	async delete(redirectTo: string): Promise<void> {
		this.page.on('dialog', (dialog) => dialog.accept())
		await this.deleteButton.click()
		await expect(this.page).toHaveURL(redirectTo)
	}

	async clearName(): Promise<void> {
		await this.nameInput.clear()
	}

	async verifyRequiredNameError(isVisible: boolean = true): Promise<void> {
		await expect(this.nameError.getByText('Required')).toBeVisible({
			visible: isVisible,
		})
	}
}

// --- LAYER 2: THE PAGE-SPECIFIC EDITOR BASE ---
export abstract class BasePageEditorPOM<
	T extends BaseEditorData,
> extends BaseEditorPOM<T> {
	constructor(
		page: Page,
		formId: string,
		protected url: string,
	) {
		super(page, page, formId)
	}

	async waitUntilVisible(): Promise<void> {
		await expect(this.scope.locator('form')).toBeVisible()
	}

	async gotoNew(): Promise<void> {
		await this.page.goto(`${this.url}/new`)
	}

	async gotoEdit(id: string): Promise<void> {
		await this.page.goto(`${this.url}/${id}/edit`)
	}

	override async create(data: T): Promise<void> {
		await super.create(data)
		await expect(this.page).toHaveURL(/\/[\w-]+$/)
	}

	override async update(data: Partial<T>): Promise<void> {
		await super.update(data)
		await expect(this.page).toHaveURL(/\/[\w-]+$/)
	}
}

// --- LAYER 2: THE DIALOG-SPECIFIC EDITOR BASE ---
export abstract class BaseDialogEditorPOM<
	T extends BaseEditorData,
> extends BaseEditorPOM<T> {
	readonly dialog: Locator

	constructor(page: Page, formId: string) {
		const dialogLocator = page.getByRole('dialog')
		super(page, dialogLocator, formId)
		this.dialog = dialogLocator
	}

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
