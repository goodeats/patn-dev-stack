import { type Locator, type Page, expect } from '@playwright/test'
import { scrollDown } from '#tests/playwright-utils'
import {
	BaseDialogEditorPOM,
	BasePageEditorPOM,
	type BaseEditorData,
} from '../base/editor.pom'

export interface SectionData extends BaseEditorData {
	content: string
	categoryName?: string
}

export class DashboardAboutMeEditorPage extends BasePageEditorPOM<SectionData> {
	readonly contentInput: Locator
	readonly categorySelect: Locator
	readonly publishSwitch: Locator
	readonly contentError: Locator
	readonly categoryError: Locator

	constructor(page: Page) {
		super(page, 'about-editor')
		this.url = '/dashboard/about'
		this.contentInput = page.getByLabel('Content')
		this.categorySelect = page.getByRole('combobox', { name: 'Category' })
		this.publishSwitch = page.getByRole('switch', { name: 'Published' })
		this.contentError = page.locator('#about-editor-content-error')
		this.categoryError = this.categorySelect.locator(
			'xpath=./following-sibling::div',
		)
	}

	override async gotoNew(): Promise<void> {
		await this.page.goto(`${this.url}/new`)
	}

	override async gotoEdit(id: string): Promise<void> {
		await this.page.goto(`${this.url}/${id}/edit`)
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

	async verifyRequiredNameError(isVisible: boolean = true) {
		if (isVisible) {
			await expect(this.nameError.getByText('Required')).toBeVisible()
		} else {
			await expect(this.nameError.getByText('Required')).not.toBeVisible()
		}
	}

	async verifyRequiredContentError(isVisible: boolean = true) {
		if (isVisible) {
			await expect(this.contentError.getByText('Required')).toBeVisible()
		} else {
			await expect(this.contentError.getByText('Required')).not.toBeVisible()
		}
	}

	async verifyRequiredCategoryError(isVisible: boolean = true) {
		if (isVisible) {
			await expect(
				this.page.locator('form').getByText('Category is required'),
			).toBeVisible()
		} else {
			await expect(
				this.page.locator('form').getByText('Category is required'),
			).not.toBeVisible()
		}
	}

	async verifyRequiredErrors() {
		await this.verifyRequiredNameError()
		await this.verifyRequiredContentError()
		await this.verifyRequiredCategoryError()
	}
}

interface CategoryData {
	name: string
	description?: string
}

export class DashboardAboutCategoryEditorDialog extends BaseDialogEditorPOM<CategoryData> {
	constructor(page: Page) {
		super(page, 'about-category-editor')
	}
}
