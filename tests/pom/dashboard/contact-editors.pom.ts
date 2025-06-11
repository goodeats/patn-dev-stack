import { type Locator, type Page, expect } from '@playwright/test'
import { type BaseEditorData, BasePageEditorPOM } from '../base/editor.pom'

export interface ContactData extends BaseEditorData {
	text?: string
	label?: string
	href?: string
	icon?: string
	isPublished?: boolean
}

export class DashboardContactEditorPOM extends BasePageEditorPOM<ContactData> {
	readonly textInput: Locator
	readonly textError: Locator
	readonly labelInput: Locator
	readonly labelError: Locator
	readonly hrefInput: Locator
	readonly hrefError: Locator
	readonly iconInput: Locator
	readonly iconError: Locator
	readonly publishSwitch: Locator

	constructor(page: Page) {
		super(page, 'contact-editor', '/dashboard/contacts')
		this.textInput = page.getByRole('textbox', { name: 'Text' })
		this.textError = page.locator('#contact-editor-text-error')
		this.labelInput = page.getByRole('textbox', { name: 'Label' })
		this.labelError = page.locator('#contact-editor-label-error')
		this.hrefInput = page.getByRole('textbox', { name: 'URL' })
		this.hrefError = page.locator('#contact-editor-href-error')
		this.iconInput = page.getByRole('textbox', { name: 'Icon' })
		this.iconError = page.locator('#contact-editor-icon-error')
		this.publishSwitch = page.getByRole('switch', { name: 'Published' })
	}

	override async gotoNew(): Promise<void> {
		await this.page.goto(`${this.url}/new`)
	}

	override async gotoEdit(id: string): Promise<void> {
		await this.page.goto(`${this.url}/${id}/edit`)
	}

	override async fillForm(data: Partial<ContactData>) {
		await super.fillForm(data)
		if (data.text) await this.textInput.fill(data.text)
		if (data.label) await this.labelInput.fill(data.label)
		if (data.href) await this.hrefInput.fill(data.href)
		if (data.icon) await this.iconInput.fill(data.icon)
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

	async clearText(): Promise<void> {
		await this.textInput.clear()
	}

	async verifyRequiredTextError(isVisible: boolean = true): Promise<void> {
		await expect(this.textError.getByText('Required')).toBeVisible({
			visible: isVisible,
		})
	}

	async clearLabel(): Promise<void> {
		await this.labelInput.clear()
	}

	async verifyRequiredLabelError(isVisible: boolean = true): Promise<void> {
		await expect(this.labelError.getByText('Required')).toBeVisible({
			visible: isVisible,
		})
	}

	async clearHref(): Promise<void> {
		await this.hrefInput.clear()
	}

	async verifyRequiredHrefError(isVisible: boolean = true): Promise<void> {
		await expect(this.hrefError.getByText('Required')).toBeVisible({
			visible: isVisible,
		})
	}

	async clearIcon(): Promise<void> {
		await this.iconInput.clear()
	}

	async verifyRequiredIconError(isVisible: boolean = true): Promise<void> {
		await expect(this.iconError.getByText('Required')).toBeVisible({
			visible: isVisible,
		})
	}

	async verifyRequiredErrors() {
		await this.verifyRequiredTextError()
		await this.verifyRequiredLabelError()
		await this.verifyRequiredHrefError()
		await this.verifyRequiredIconError()
	}

	override async delete(): Promise<void> {
		await super.delete('/dashboard/contacts')
	}
}
