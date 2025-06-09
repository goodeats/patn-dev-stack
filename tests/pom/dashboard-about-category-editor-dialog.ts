import { type Page } from '@playwright/test'
import { BaseDialogEditorPOM } from './base/editor.pom'

interface CategoryData {
	name: string
	description?: string
}

export class DashboardAboutCategoryEditorDialog extends BaseDialogEditorPOM<CategoryData> {
	constructor(page: Page) {
		super(page, 'about-category-editor')
	}
}
