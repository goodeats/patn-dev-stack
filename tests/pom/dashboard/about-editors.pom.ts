import { type Locator, type Page, expect } from '@playwright/test'
import {
	type BaseEditorData,
	BaseDialogEditorPOM,
	BasePageEditorPOM,
} from '../base/editor.pom'

export interface SectionData extends BaseEditorData {
	content: string
	categoryName?: string
	isPublished?: boolean
}

export class DashboardAboutMeEditorPOM extends BasePageEditorPOM<SectionData> {
	readonly contentInput: Locator
	readonly contentError: Locator
	readonly categorySelect: Locator
	readonly categoryError: Locator
	readonly publishSwitch: Locator

	constructor(page: Page) {
		super(page, 'about-editor', '/dashboard/about')
		this.contentInput = page.getByLabel('Content')
		this.contentError = page.locator('#about-editor-content-error')
		this.categorySelect = page.getByRole('combobox', { name: 'Category' })
		this.categoryError = this.categorySelect.locator(
			'xpath=./following-sibling::div',
		)
		this.publishSwitch = page.getByRole('switch', { name: 'Published' })
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

	// use this if combobox is already open
	// helpful when testing that an option is not there before
	async selectCategoryOption(name: string) {
		await this.page.getByRole('option', { name }).click()
	}

	async selectCategory(name: string) {
		await this.openCategoryDropdown()
		await this.selectCategoryOption(name)
	}

	async getSelectedCategoryText() {
		return this.categorySelect.textContent()
	}

	override async fillForm(data: Partial<SectionData>) {
		await super.fillForm(data)
		if (data.content) await this.contentInput.fill(data.content)
		if (data.categoryName) await this.selectCategory(data.categoryName)
		if (data.isPublished !== undefined) {
			if (data.isPublished) {
				await this.publish()
			} else {
				await this.unpublish()
			}
		}
	}

	async clearContent() {
		await this.contentInput.clear()
	}

	async togglePublish() {
		await this.publishSwitch.click()
	}

	async publish() {
		const isPublished = await this.publishSwitch.isChecked()
		if (!isPublished) {
			await this.togglePublish()
		}
		return isPublished
	}

	async unpublish() {
		const isPublished = await this.publishSwitch.isChecked()
		if (isPublished) {
			await this.togglePublish()
		}
		return isPublished
	}

	async verifyRequiredNameError(isVisible: boolean = true) {
		await expect(this.nameError.getByText('Required')).toBeVisible({
			visible: isVisible,
		})
	}

	async verifyRequiredContentError(isVisible: boolean = true) {
		await expect(this.contentError.getByText('Required')).toBeVisible({
			visible: isVisible,
		})
	}

	async verifyRequiredCategoryError(isVisible: boolean = true) {
		await expect(this.categoryError).toBeVisible({
			visible: isVisible,
		})
	}

	async verifyRequiredErrors() {
		await this.verifyRequiredNameError()
		await this.verifyRequiredContentError()
		await this.verifyRequiredCategoryError()
	}

	override async delete(): Promise<void> {
		await super.delete('/dashboard/about')
	}
}

interface CategoryData extends BaseEditorData {
	isPublished?: boolean
}

export class DashboardAboutCategoryEditorDialogPOM extends BaseDialogEditorPOM<CategoryData> {
	readonly publishSwitch: Locator

	constructor(page: Page) {
		super(page, 'about-category-editor')
		this.publishSwitch = page.getByRole('switch', { name: 'Published' })
	}

	override async fillForm(data: Partial<CategoryData>) {
		await super.fillForm(data)

		if (data.isPublished !== undefined) {
			if (data.isPublished) {
				await this.publish()
			} else {
				await this.unpublish()
			}
		}
	}

	async togglePublish() {
		await this.publishSwitch.click()
	}

	async publish() {
		const isPublished = await this.publishSwitch.isChecked()
		if (!isPublished) {
			await this.togglePublish()
		}
		return isPublished
	}

	async unpublish() {
		const isPublished = await this.publishSwitch.isChecked()
		if (isPublished) {
			await this.togglePublish()
		}
		return isPublished
	}
}
