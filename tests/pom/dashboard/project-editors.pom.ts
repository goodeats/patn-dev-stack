import { type Locator, type Page, expect } from '@playwright/test'
import { type BaseEditorData, BasePageEditorPOM } from '../base/editor.pom'

export interface ProjectData extends BaseEditorData {
	title: string
	description?: string
	liveDemoUrl?: string
	sourceCodeUrl?: string
	comments?: string
	isPublished?: boolean
}

export class DashboardProjectEditorPOM extends BasePageEditorPOM<ProjectData> {
	readonly titleInput: Locator
	readonly titleError: Locator
	readonly descriptionInput: Locator
	readonly descriptionError: Locator
	readonly liveDemoUrlInput: Locator
	readonly liveDemoUrlError: Locator
	readonly sourceCodeUrlInput: Locator
	readonly sourceCodeUrlError: Locator
	readonly commentsInput: Locator
	readonly commentsError: Locator
	readonly publishSwitch: Locator

	constructor(page: Page) {
		super(page, 'project-editor', '/dashboard/projects')
		this.titleInput = page.getByRole('textbox', { name: 'Title' })
		this.titleError = page.locator('#project-editor-title-error')
		this.descriptionInput = page.getByRole('textbox', { name: 'Description' })
		this.descriptionError = page.locator('#project-editor-description-error')
		this.liveDemoUrlInput = page.getByRole('textbox', { name: 'Live Demo URL' })
		this.liveDemoUrlError = page.locator('#project-editor-liveDemoUrl-error')
		this.sourceCodeUrlInput = page.getByRole('textbox', {
			name: 'Source Code URL',
		})
		this.sourceCodeUrlError = page.locator(
			'#project-editor-sourceCodeUrl-error',
		)
		this.commentsInput = page.getByRole('textbox', { name: 'Comments' })
		this.commentsError = page.locator('#project-editor-comments-error')
		this.publishSwitch = page.getByRole('switch', { name: 'Published' })
	}

	override async gotoNew(): Promise<void> {
		await this.page.goto(`${this.url}/new`)
	}

	override async gotoEdit(id: string): Promise<void> {
		await this.page.goto(`${this.url}/${id}/edit`)
	}

	override async fillForm(data: Partial<ProjectData>) {
		await super.fillForm(data)
		if (data.title) await this.titleInput.fill(data.title)
		if (data.description) await this.descriptionInput.fill(data.description)
		if (data.liveDemoUrl) await this.liveDemoUrlInput.fill(data.liveDemoUrl)
		if (data.sourceCodeUrl)
			await this.sourceCodeUrlInput.fill(data.sourceCodeUrl)
		if (data.comments) await this.commentsInput.fill(data.comments)
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

	async clearTitle(): Promise<void> {
		await this.titleInput.clear()
	}

	async verifyRequiredTitleError(isVisible: boolean = true): Promise<void> {
		await expect(this.titleError.getByText('Required')).toBeVisible({
			visible: isVisible,
		})
	}

	async verifyInvalidLiveDemoUrlError(
		isVisible: boolean = true,
	): Promise<void> {
		await expect(
			this.liveDemoUrlError.getByText('Must be a valid URL'),
		).toBeVisible({
			visible: isVisible,
		})
	}

	async verifyInvalidSourceCodeUrlError(
		isVisible: boolean = true,
	): Promise<void> {
		await expect(
			this.sourceCodeUrlError.getByText('Must be a valid URL'),
		).toBeVisible({
			visible: isVisible,
		})
	}

	async verifyRequiredErrors() {
		await this.verifyRequiredTitleError()
	}

	override async delete(): Promise<void> {
		await super.delete('/dashboard/projects')
	}
}
