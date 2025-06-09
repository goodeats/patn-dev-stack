import { type Page, type Locator, expect } from '@playwright/test'

export interface IEditorPOM {
	// A marker interface for all editor Page Object Models.
	// We can add required methods/properties here in the future.
	waitUntilVisible(): Promise<void>
}

// A base interface for data passed to editor methods
export interface BaseEditorData {
	name: string
	description?: string
}

export abstract class BaseEditorPOM<T extends BaseEditorData> {
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
		protected scope: Locator | Page, // Can be the whole page or a specific locator like a dialog
		protected formId: string,
	) {
		this.nameInput = this.scope.getByLabel('Name')
		this.descriptionInput = this.scope.getByLabel('Description (Optional)')
		this.createButton = this.scope.getByRole('button', {
			name: /Create/i,
		})
		this.saveButton = this.scope.getByRole('button', { name: 'Save Changes' })
		this.deleteButton = this.scope.getByRole('button', { name: 'Delete' })
		this.nameError = this.scope
			.locator(`#${formId}-name-error`)
			.getByText('Required')
	}

	async fillForm(data: T): Promise<void> {
		await this.nameInput.fill(data.name)
		if (data.description) {
			await this.descriptionInput.fill(data.description)
		}
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
