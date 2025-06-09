// import { expect, type Locator, type Page } from '@playwright/test'
// import { type BaseEditorData, BaseEditorPOM } from '../base/editor.pom'

// // Extend base data with specific fields for this editor
// export interface SectionData extends BaseEditorData {
// 	content: string
// 	categoryName?: string
// }
// export interface CategoryData extends BaseEditorData {}

// export class DashboardAboutMeEditorPage extends BaseEditorPOM<SectionData> {
// 	readonly contentInput: Locator
// 	readonly categorySelect: Locator
// 	readonly publishSwitch: Locator
// 	readonly contentError: Locator
// 	readonly categoryError: Locator

// 	constructor(page: Page) {
// 		// The scope is the entire page, and the form ID is 'about-editor'
// 		super(page, page, 'about-editor')

// 		this.contentInput = this.scope.getByLabel('Content')
// 		this.categorySelect = this.scope.getByRole('combobox', { name: 'Category' })
// 		this.publishSwitch = this.scope.getByRole('switch', { name: 'Published' })
// 		this.contentError = this.scope
// 			.locator('#about-editor-content-error')
// 			.getByText('Required')
// 		this.categoryError = this.scope.getByText('Category is required')
// 	}

// 	async gotoNew() {
// 		await this.page.goto('/dashboard/about/new')
// 	}

// 	async gotoEdit(sectionId: string) {
// 		await this.page.goto(`/dashboard/about/${sectionId}/edit`)
// 	}

// 	// Override fillForm to handle specific fields
// 	async fillForm(data: SectionData): Promise<void> {
// 		await super.fillForm(data) // Fills name and description
// 		await this.contentInput.fill(data.content)
// 		if (data.categoryName) {
// 			await this.selectCategory(data.categoryName)
// 		}
// 	}

// 	// Override update as well
// 	async update(data: Partial<SectionData>): Promise<void> {
// 		await super.update(data) // Handles name/description update
// 		if (data.content) await this.contentInput.fill(data.content)
// 		if (data.categoryName) await this.selectCategory(data.categoryName)
// 		await this.saveButton.click()
// 	}

// 	async selectCategory(name: string) {
// 		await this.categorySelect.click()
// 		await this.page.getByRole('option', { name }).click()
// 	}

// 	async clearContent() {
// 		await this.contentInput.clear()
// 	}

// 	async verifyRequiredContentError(isVisible: boolean = true) {
// 		await expect(this.contentError).toBeVisible({ visible: isVisible })
// 	}

// 	async verifyRequiredCategoryError(isVisible: boolean = true) {
// 		await expect(this.categoryError).toBeVisible({ visible: isVisible })
// 	}
// }
