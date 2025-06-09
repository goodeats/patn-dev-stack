import { type Locator, type Page, expect } from '@playwright/test'

interface CategoryData {
	name: string
	description?: string
}

export class DashboardAboutCategoryEditorDialog {
	readonly page: Page
	readonly dialog: Locator
	readonly nameInput: Locator
	readonly descriptionInput: Locator
	readonly createButton: Locator
	readonly saveButton: Locator
	readonly cancelButton: Locator
	readonly nameError: Locator

	constructor(page: Page) {
		this.page = page
		this.dialog = page.getByRole('dialog')
		this.nameInput = this.dialog.getByLabel('Name')
		this.descriptionInput = this.dialog.getByLabel('Description (Optional)')
		this.createButton = this.dialog.getByRole('button', {
			name: 'Create Category',
		})
		this.saveButton = this.dialog.getByRole('button', { name: 'Save Changes' })
		this.cancelButton = this.dialog.getByRole('button', { name: 'Cancel' })
		this.nameError = this.dialog.locator('#about-category-editor-name-error')
	}

	async fillName(name: string) {
		await this.nameInput.fill(name)
	}

	async fillDescription(description: string) {
		await this.descriptionInput.fill(description)
	}

	async fillForm({ name, description }: CategoryData) {
		await this.nameInput.fill(name)
		if (description) {
			await this.descriptionInput.fill(description)
		}
	}

	async create(data: CategoryData) {
		await this.fillForm(data)
		await this.createButton.click()
		await expect(this.dialog).not.toBeVisible()
	}

	async clickCreateButton() {
		await this.createButton.click()
	}

	async update(data: CategoryData) {
		await this.fillForm(data)
		await this.saveButton.click()
		await expect(this.dialog).not.toBeVisible()
	}

	async clickSaveButton() {
		await this.saveButton.click()
	}

	async verifyRequiredNameError() {
		await expect(this.nameError.getByText('Required')).toBeVisible()
	}
}
