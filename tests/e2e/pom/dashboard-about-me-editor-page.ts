import { type Locator, type Page, expect } from '@playwright/test'
import { scrollDown } from '#tests/playwright-utils'

interface SectionData {
	name: string
	content: string
	description?: string
	categoryName?: string
}

export class DashboardAboutMeEditorPage {
	readonly page: Page
	readonly nameInput: Locator
	readonly contentInput: Locator
	readonly descriptionInput: Locator
	readonly categorySelect: Locator
	readonly publishSwitch: Locator
	readonly createButton: Locator
	readonly saveButton: Locator
	readonly deleteButton: Locator
	readonly nameError: Locator
	readonly contentError: Locator
	readonly categoryError: Locator

	constructor(page: Page) {
		this.page = page
		this.nameInput = page.getByLabel('Name')
		this.contentInput = page.getByLabel('Content')
		this.descriptionInput = page.getByLabel('Description (Optional)')
		this.categorySelect = page.getByRole('combobox', { name: 'Category' })
		this.publishSwitch = page.getByRole('switch', { name: 'Published' })
		this.createButton = page.getByRole('button', { name: 'Create About Me' })
		this.saveButton = page.getByRole('button', { name: 'Save Changes' })
		this.deleteButton = page.getByRole('button', { name: 'Delete' })
		this.nameError = page.locator('#about-editor-name-error')
		this.contentError = page.locator('#about-editor-content-error')
		this.categoryError = this.categorySelect.locator(
			'xpath=./following-sibling::div',
		)
	}

	async gotoNew() {
		await this.page.goto('/dashboard/about/new')
	}

	async gotoEdit(sectionId: string) {
		await this.page.goto(`/dashboard/about/${sectionId}/edit`)
	}

	async openCategoryDropdown() {
		await this.categorySelect.click()
	}

	getCategoryOption(name: string) {
		return this.page.getByRole('option', { name })
	}

	async getSelectedCategoryText() {
		return this.categorySelect.textContent()
	}

	async selectCategory(name: string) {
		await this.categorySelect.click()
		await this.page.getByRole('option', { name }).click()
	}

	async fillForm(data: SectionData) {
		await this.nameInput.fill(data.name)
		await this.contentInput.fill(data.content)
		if (data.description) {
			await this.descriptionInput.fill(data.description)
		}
		if (data.categoryName) {
			await this.selectCategory(data.categoryName)
		}
	}

	async create(data: SectionData) {
		await this.fillForm(data)
		await this.clickCreateButton()
		await expect(this.page).toHaveURL(/\/dashboard\/about\/[a-zA-Z0-9]+$/)
	}

	async clickCreateButton() {
		await this.createButton.click()
	}

	async clearName() {
		await this.nameInput.clear()
	}

	async clearContent() {
		await this.contentInput.clear()
	}

	async update(data: Partial<SectionData>) {
		if (data.name) await this.nameInput.fill(data.name)
		if (data.content) await this.contentInput.fill(data.content)
		if (data.description) await this.descriptionInput.fill(data.description)
		if (data.categoryName) await this.selectCategory(data.categoryName)

		await scrollDown(this.page, { mode: 'bottom' })
		await this.clickSaveButton()
	}

	async clickSaveButton() {
		await this.saveButton.click()
	}

	async unpublish() {
		await this.publishSwitch.click()
	}

	async delete() {
		this.page.on('dialog', (dialog) => dialog.accept())
		await this.deleteButton.click()
		await expect(this.page).toHaveURL('/dashboard/about')
	}

	async verifyRequiredErrors() {
		await expect(
			this.page.locator('#about-editor-name-error').getByText('Required'),
		).toBeVisible()
		await expect(
			this.page.locator('#about-editor-content-error').getByText('Required'),
		).toBeVisible()
		await expect(
			this.page.locator('form').getByText('Category is required'),
		).toBeVisible()
	}
}
