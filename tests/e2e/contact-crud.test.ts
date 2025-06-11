import { faker } from '@faker-js/faker'
import {
	type UserPlaywright,
	type ContactPlaywright,
	expect,
	test,
	testDateToday,
} from '#tests/playwright-utils.ts'
import { DashboardContactDetailsPOM } from '../pom/dashboard/contact-details-page.pom'
import { DashboardContactEditorPOM } from '../pom/dashboard/contact-editors.pom'
import { DashboardContactListPOM } from '../pom/dashboard/contact-list-page.pom'

let user: UserPlaywright
let listPage: DashboardContactListPOM
let detailsPage: DashboardContactDetailsPOM
let editorPage: DashboardContactEditorPOM
let initialContact: ContactPlaywright
let contactToDelete: ContactPlaywright

let contactText: string
let contactHref: string
let contactIcon: string
let contactLabel: string
let updatedText: string
let updatedHref: string
let updatedIcon: string
let updatedLabel: string

test.describe('Contacts', () => {
	test.beforeEach(async ({ page, login }) => {
		await login()
		listPage = new DashboardContactListPOM(page)
		detailsPage = new DashboardContactDetailsPOM(page)
	})

	test.describe('CRUD', () => {
		test.describe('can create a new contact', () => {
			test.beforeEach(async () => {
				contactText = faker.lorem.words(3)
				contactHref = faker.internet.url()
				contactIcon = 'github'
				contactLabel = faker.lorem.words(2)
				await listPage.goto()
			})

			test('that is published', async () => {
				const editorPage = await listPage.createNewContact()

				await editorPage.create({
					text: contactText,
					href: contactHref,
					icon: contactIcon,
					label: contactLabel,
					isPublished: true,
				})

				await detailsPage.verifyContactDetails({
					text: contactText,
					href: contactHref,
					icon: contactIcon,
					label: contactLabel,
					status: 'Published',
				})
			})

			test('that is unpublished', async () => {
				const editorPage = await listPage.createNewContact()

				await editorPage.create({
					text: contactText,
					href: contactHref,
					icon: contactIcon,
					label: contactLabel,
					isPublished: false,
				})

				await detailsPage.verifyContactDetails({
					text: contactText,
					href: contactHref,
					icon: contactIcon,
					label: contactLabel,
					status: 'Draft',
				})
			})
		})

		test.describe('can edit an existing contact', () => {
			test.beforeEach(async ({ login, insertNewContact }) => {
				user = await login()
				initialContact = await insertNewContact({ userId: user.id })
				updatedText = faker.lorem.words(3)
				updatedHref = faker.internet.url()
				updatedIcon = 'linkedin'
				updatedLabel = faker.lorem.words(2)
			})

			test('from the list page', async ({ page }) => {
				await listPage.goto()
				const editorPage = await listPage.contactsTable.edit(
					initialContact.text,
				)

				await expect(editorPage.textInput).toHaveValue(initialContact.text)

				await editorPage.update({
					text: updatedText,
					href: updatedHref,
					icon: updatedIcon,
					label: updatedLabel,
				})

				await expect(page).toHaveURL(`/dashboard/contacts/${initialContact.id}`)

				await detailsPage.verifyContactDetails({
					text: updatedText,
					href: updatedHref,
					icon: updatedIcon,
					label: updatedLabel,
					status: 'Published',
				})
			})

			test('from the details page', async ({ page }) => {
				await detailsPage.goto(initialContact.id)
				const editorPage = await detailsPage.edit()

				await expect(editorPage.textInput).toHaveValue(initialContact.text)

				await editorPage.update({
					text: updatedText,
					href: updatedHref,
					icon: updatedIcon,
					label: updatedLabel,
				})

				await expect(page).toHaveURL(`/dashboard/contacts/${initialContact.id}`)

				await detailsPage.verifyContactDetails({
					text: updatedText,
					href: updatedHref,
					icon: updatedIcon,
					label: updatedLabel,
					status: 'Published',
				})
			})
		})

		test.describe('can toggle publish status', () => {
			test.beforeEach(async ({ login, insertNewContact }) => {
				user = await login()
				initialContact = await insertNewContact({
					userId: user.id,
					isPublished: true,
				})
			})

			test('from the list page', async ({ page }) => {
				await listPage.goto()
				const publishSwitch = await listPage.contactsTable.getSwitch(
					initialContact.text,
				)

				// Initially published
				await expect(publishSwitch).toBeChecked()

				// Toggle to unpublished
				await publishSwitch.click()
				await expect(publishSwitch).not.toBeChecked()

				// Verify persisted after reload
				await page.reload()
				await expect(
					await listPage.contactsTable.getSwitch(initialContact.text),
				).not.toBeChecked()

				// Toggle back to published
				await listPage.contactsTable.toggleSwitch(initialContact.text)
				await expect(
					await listPage.contactsTable.getSwitch(initialContact.text),
				).toBeChecked()

				await page.reload()
				await expect(
					await listPage.contactsTable.getSwitch(initialContact.text),
				).toBeChecked()
			})

			test('from the edit page', async ({}) => {
				await detailsPage.goto(initialContact.id)
				const editorPage = await detailsPage.edit()

				// Initially published
				await expect(editorPage.publishSwitch).toBeChecked()

				// Toggle to unpublished
				await editorPage.publishSwitch.click()
				await editorPage.saveButton.click()

				await detailsPage.verifyContactDetails({
					text: initialContact.text,
					href: initialContact.href,
					icon: initialContact.icon,
					label: initialContact.label,
					status: 'Draft',
				})

				// Toggle back to published
				await detailsPage.edit()
				await editorPage.publishSwitch.click()
				await editorPage.saveButton.click()

				await detailsPage.verifyContactDetails({
					text: initialContact.text,
					href: initialContact.href,
					icon: initialContact.icon,
					label: initialContact.label,
					status: 'Published',
				})
			})
		})

		test.describe('can delete an existing contact', () => {
			test.beforeEach(async ({ login, insertNewContact }) => {
				user = await login()
				contactToDelete = await insertNewContact({ userId: user.id })
			})

			test('can be deleted from the list page', async ({ page }) => {
				await listPage.goto()
				await expect(
					page.getByRole('link', { name: contactToDelete.text }),
				).toBeVisible()

				await listPage.contactsTable.delete(contactToDelete.text)

				await expect(await listPage.contactsSectionContainer).toBeVisible()
				await expect(
					page.getByRole('link', { name: contactToDelete.text }),
				).not.toBeVisible()
			})

			test('can be deleted from its edit page', async ({ page }) => {
				const editorPage = new DashboardContactEditorPOM(page)

				await editorPage.gotoEdit(contactToDelete.id)

				await editorPage.delete()

				await expect(page.getByText(contactToDelete.text)).not.toBeVisible()
			})
		})

		test('displays existing contacts on the main page', async ({
			login,
			insertNewContact,
		}) => {
			const user = await login()
			const contact1 = await insertNewContact({
				text: `Contact1 ${faker.lorem.words(1)}`,
				label: `Label1 ${faker.lorem.words(1)}`,
				userId: user.id,
			})
			const contact2 = await insertNewContact({
				text: `Contact2 ${faker.lorem.words(1)}`,
				label: `Label2 ${faker.lorem.words(1)}`,
				userId: user.id,
			})

			await listPage.goto()

			const contactsTable = listPage.contactsTable
			await contactsTable.verifyHeaders()
			await contactsTable.verifyData([
				[
					contact2.text,
					`${contact2.text}${contact2.href}`, // account for tooltip over icon link
					testDateToday,
					testDateToday,
				],
				[
					contact1.text,
					`${contact1.text}${contact1.href}`, // account for tooltip over icon link
					testDateToday,
					testDateToday,
				],
			])
		})
	})

	test.describe('Validation', () => {
		test.beforeEach(async ({ page, login }) => {
			user = await login({ name: faker.person.firstName() })
			editorPage = new DashboardContactEditorPOM(page)
		})

		test('validates Contact creation', async ({ page }) => {
			await editorPage.gotoNew()
			await editorPage.createButton.click()
			await editorPage.verifyRequiredErrors()

			await editorPage.textInput.fill(faker.lorem.words(2))
			await editorPage.createButton.click()
			await editorPage.verifyRequiredTextError(false)
			await editorPage.verifyRequiredLabelError()
			await editorPage.verifyRequiredHrefError()
			await editorPage.verifyRequiredIconError()

			await editorPage.labelInput.fill(faker.lorem.words(2))
			await editorPage.createButton.click()
			await editorPage.verifyRequiredLabelError(false)
			await editorPage.verifyRequiredHrefError()
			await editorPage.verifyRequiredIconError()

			await editorPage.hrefInput.fill(faker.internet.url())
			await editorPage.createButton.click()
			await editorPage.verifyRequiredHrefError(false)
			await editorPage.verifyRequiredIconError()

			await editorPage.iconInput.fill(faker.lorem.words(2))
			await editorPage.createButton.click()
			await expect(page).toHaveURL(/\/dashboard\/contacts\/[a-zA-Z0-9]+$/)
		})

		test('validates Contact editing', async ({ page, insertNewContact }) => {
			const contact = await insertNewContact({ userId: user.id })
			const detailsPage = new DashboardContactDetailsPOM(page)

			await detailsPage.goto(contact.id)
			await detailsPage.edit()

			// Test editing validation
			await editorPage.clearText()
			await editorPage.saveButton.click()
			await editorPage.verifyRequiredTextError()

			await editorPage.clearHref()
			await editorPage.saveButton.click()
			await editorPage.verifyRequiredHrefError()

			await editorPage.clearLabel()
			await editorPage.saveButton.click()
			await editorPage.verifyRequiredLabelError()

			await editorPage.clearIcon()
			await editorPage.saveButton.click()
			await editorPage.verifyRequiredIconError()
		})
	})

	test.describe('List Page Functionality', () => {
		test('filters contacts by text and URL', async ({
			page,
			login,
			insertNewContact,
		}) => {
			const user = await login()
			const contact1 = await insertNewContact({ userId: user.id })
			const contact2 = await insertNewContact({ userId: user.id })

			await listPage.goto()

			// Filter by text
			await listPage.contactsTable.filterByName(contact2.text)
			await expect(
				page.getByRole('link', { name: contact1.text }),
			).not.toBeVisible()
			await expect(
				page.getByRole('link', { name: contact2.text }),
			).toBeVisible()

			// Filter by URL
			await listPage.contactsTable.clearNameFilter()
			await listPage.contactsTable.filterByUrl(contact1.href)
			await expect(
				page.getByRole('link', { name: contact2.text }),
			).not.toBeVisible()
			await expect(
				page.getByRole('link', { name: contact1.text }),
			).toBeVisible()
		})
	})
})
