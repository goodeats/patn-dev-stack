import { type Locator, type Page } from '@playwright/test'
import { type IEditorPOM } from './editor.pom'
import { BasePage } from './page.pom'

// The base for any 'index' or 'list' page, like /dashboard/about.
// It is generic over the type of editor that its "New" button creates.
export abstract class BaseListPagePOM<
	TItemEditor extends IEditorPOM,
> extends BasePage {
	protected readonly newItemButton: Locator

	constructor(page: Page, newItemButtonLocator: Locator) {
		super(page)
		this.newItemButton = newItemButtonLocator
	}

	// This method is now standardized for all list pages.
	async createNewItem(): Promise<TItemEditor> {
		await this.newItemButton.click()
		// The subclass will be responsible for constructing the correct editor POM.
		// This base class just performs the click.
		// We can't construct TItemEditor here, so the subclass must do it.
		// This will be handled in the concrete implementation.
		return this.constructEditor()
	}

	// Subclasses must implement this to return the correct editor type.
	protected abstract constructEditor(): TItemEditor | Promise<TItemEditor>
}
