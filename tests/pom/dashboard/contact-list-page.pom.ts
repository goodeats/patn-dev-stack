import { type Locator, type Page, expect } from '@playwright/test'
import { BasePagePOM } from '../base/page.pom'
import { ContactsTablePOM } from './contact-data-tables.pom'
import { DashboardContactEditorPOM } from './contact-editors.pom'

// https://playwright.dev/docs/pom

export class DashboardContactListPOM extends BasePagePOM {
	readonly contactsTable: ContactsTablePOM
	readonly contactsSectionContainer: Locator
	private readonly newContactButton: Locator

	constructor(page: Page) {
		super(page)
		this.contactsSectionContainer = page.locator('#contacts-list')
		this.contactsTable = new ContactsTablePOM(
			page,
			this.contactsSectionContainer,
		)

		this.newContactButton = this.contactsSectionContainer.getByRole('link', {
			name: 'New',
		})
	}

	async goto() {
		await this.page.goto('/dashboard/contacts')
	}

	async gotoNewContact() {
		await this.newContactButton.click()
		await expect(this.page).toHaveURL('/dashboard/contacts/new')
	}

	async createNewContact(): Promise<DashboardContactEditorPOM> {
		await this.gotoNewContact()
		return new DashboardContactEditorPOM(this.page)
	}
}
