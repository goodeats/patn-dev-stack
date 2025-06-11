import { type Locator, type Page, expect } from '@playwright/test'
import {
	type BaseEditorData,
	BaseDialogEditorPOM,
	BasePageEditorPOM,
} from '../base/editor.pom'

export interface SkillData extends BaseEditorData {
	categoryName?: string
	isPublished?: boolean
}

export class DashboardSkillEditorPOM extends BasePageEditorPOM<SkillData> {
	readonly categorySelect: Locator
	readonly publishSwitch: Locator
	readonly categoryError: Locator

	constructor(page: Page) {
		super(page, 'skill-editor', '/dashboard/skills')
		this.categorySelect = page.getByRole('combobox', { name: 'Category' })
		this.publishSwitch = page.getByRole('switch', { name: 'Published' })
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

	override async fillForm(data: Partial<SkillData>) {
		await super.fillForm(data)
		if (data.categoryName) await this.selectCategory(data.categoryName)
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

	async verifyRequiredNameError(isVisible: boolean = true) {
		await expect(this.nameError.getByText('Required')).toBeVisible({
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
		await this.verifyRequiredCategoryError()
	}

	override async delete(): Promise<void> {
		await super.delete('/dashboard/skills')
	}
}

interface SkillCategoryData extends BaseEditorData {
	isPublished?: boolean
}

export class DashboardSkillCategoryEditorDialogPOM extends BaseDialogEditorPOM<SkillCategoryData> {
	readonly publishSwitch: Locator

	constructor(page: Page) {
		super(page, 'skill-category-editor')
		this.publishSwitch = page.getByRole('switch', { name: 'Published' })
	}

	override async fillForm(data: Partial<SkillCategoryData>) {
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
