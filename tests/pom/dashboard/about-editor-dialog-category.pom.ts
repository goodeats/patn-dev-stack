// import { expect, type Locator, type Page } from '@playwright/test'

// export class DashboardAboutCategoryEditorDialog extends BaseEditorPOM<CategoryData> {
// 	readonly cancelButton: Locator

// 	constructor(page: Page) {
// 		// The scope is the dialog, and the form ID is 'about-category-editor'
// 		super(page, page.getByRole('dialog'), 'about-category-editor')
// 		this.cancelButton = this.scope.getByRole('button', { name: 'Cancel' })
// 	}

// 	// Override create/update to add the dialog visibility check
// 	async create(data: CategoryData): Promise<void> {
// 		await super.create(data)
// 		await expect(this.scope).not.toBeVisible()
// 	}

// 	async update(data: CategoryData): Promise<void> {
// 		await super.update(data)
// 		await expect(this.scope).not.toBeVisible()
// 	}
// }
