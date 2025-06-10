import { type Page, expect } from '@playwright/test'
import { type BaseEditorData, BaseEditorPOM } from './editor.pom'

export abstract class BasePageEditorPOM<
	T extends BaseEditorData,
> extends BaseEditorPOM<T> {
	constructor(
		page: Page,
		formId: string,
		protected url: string,
	) {
		// The scope is the entire page.
		super(page, page, formId)
		this.url = url
	}

	// For a page, "visible" means the page has loaded. We can consider it instantly visible.
	async waitUntilVisible(): Promise<void> {
		// A more robust check could be to wait for a specific element, like the form itself.
		await expect(this.scope.locator('form')).toBeVisible()
	}

	async gotoNew(): Promise<void> {
		await this.page.goto(`${this.url}/new`)
	}

	async gotoEdit(id: string): Promise<void> {
		await this.page.goto(`${this.url}/${id}/edit`)
	}
}
