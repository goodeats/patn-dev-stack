import { faker } from '@faker-js/faker'
import { prisma } from '#app/utils/db.server.ts'
import {
	type AboutMeCategoryPlaywright,
	type AboutMePlaywright,
	type UserPlaywright,
	expect,
	test,
	testDateToday,
} from '#tests/playwright-utils.ts'
import { DashboardAboutDetailsPOM } from '../pom/dashboard/about-details-page.pom'
import {
	DashboardAboutCategoryEditorDialogPOM,
	DashboardAboutMeEditorPOM,
} from '../pom/dashboard/about-editors.pom'
import { DashboardAboutListPOM } from '../pom/dashboard/about-list-page.pom'

let user: UserPlaywright
let listPage: DashboardAboutListPOM
let detailsPage: DashboardAboutDetailsPOM
let editorPage: DashboardAboutMeEditorPOM
let categoryDialog: DashboardAboutCategoryEditorDialogPOM
let category: AboutMeCategoryPlaywright
let category2: AboutMeCategoryPlaywright
let categoryToDelete: AboutMeCategoryPlaywright
let initialSection: AboutMePlaywright
let sectionToDelete: AboutMePlaywright

let sectionName: string
let sectionContent: string
let sectionDescription: string
let updatedName: string
let updatedContent: string
let updatedDescription: string
let categoryName: string
let categoryDescription: string

// test.beforeEach(async () => {
// 	await prisma.aboutMe.deleteMany()
// 	await prisma.aboutMeCategory.deleteMany()
// })

test.describe('About Me Sections', () => {
	test.beforeEach(async ({ page, login }) => {
		await login()
		listPage = new DashboardAboutListPOM(page)
		detailsPage = new DashboardAboutDetailsPOM(page)
	})

	test.describe('CRUD', () => {
		test.describe('can create a new section', () => {
			test.beforeEach(async ({ insertNewAboutMeCategory }) => {
				category = await insertNewAboutMeCategory()
				sectionName = faker.lorem.words(3)
				sectionContent = faker.lorem.paragraph()
				sectionDescription = faker.lorem.sentence()
				await listPage.goto()
			})

			test('that is published', async () => {
				const editorPage = await listPage.createNewSection()

				await editorPage.create({
					name: sectionName,
					content: sectionContent,
					description: sectionDescription,
					categoryName: category.name,
					isPublished: true,
				})

				await detailsPage.verifyAboutDetails({
					name: sectionName,
					content: sectionContent,
					description: sectionDescription,
					category: category.name,
					status: 'Published',
				})
			})

			test('that is unpublished', async () => {
				const editorPage = await listPage.createNewSection()

				await editorPage.create({
					name: sectionName,
					content: sectionContent,
					description: sectionDescription,
					categoryName: category.name,
					isPublished: false,
				})

				await detailsPage.verifyAboutDetails({
					name: sectionName,
					content: sectionContent,
					description: sectionDescription,
					category: category.name,
					status: 'Draft',
				})
			})
		})

		test.describe('can edit an existing section', () => {
			test.beforeEach(
				async ({ login, insertNewAboutMeCategory, insertNewAboutMe }) => {
					user = await login()
					category = await insertNewAboutMeCategory()
					category2 = await insertNewAboutMeCategory()
					initialSection = await insertNewAboutMe({
						userId: user.id,
						aboutMeCategoryId: category.id,
					})
					updatedName = faker.lorem.words(3)
					updatedContent = faker.lorem.paragraph()
					updatedDescription = faker.lorem.sentence()
				},
			)

			test('from the list page', async ({ page }) => {
				await listPage.goto()
				const editorPage = await listPage.aboutMeTable.edit(initialSection.name)

				await expect(editorPage.nameInput).toHaveValue(initialSection.name)
				await expect(editorPage.contentInput).toHaveValue(
					initialSection.content,
				)

				await editorPage.update({
					name: updatedName,
					content: updatedContent,
					description: updatedDescription,
					categoryName: category2.name,
				})

				await expect(page).toHaveURL(`/dashboard/about/${initialSection.id}`)

				await detailsPage.verifyAboutDetails({
					name: updatedName,
					content: updatedContent,
					description: updatedDescription,
					category: category2.name,
					status: 'Published',
				})
			})

			test('from the details page', async ({ page }) => {
				await detailsPage.goto(initialSection.id)
				const editorPage = await detailsPage.edit()

				await expect(editorPage.nameInput).toHaveValue(initialSection.name)
				await expect(editorPage.contentInput).toHaveValue(
					initialSection.content,
				)

				const updatedName = faker.lorem.words(3)
				const updatedContent = faker.lorem.paragraph()
				const updatedDescription = faker.lorem.sentence()

				await editorPage.update({
					name: updatedName,
					content: updatedContent,
					description: updatedDescription,
					categoryName: category2.name,
				})

				await expect(page).toHaveURL(`/dashboard/about/${initialSection.id}`)

				await detailsPage.verifyAboutDetails({
					name: updatedName,
					content: updatedContent,
					description: updatedDescription,
					category: category2.name,
					status: 'Published',
				})
			})
		})

		test.describe('can toggle publish status', () => {
			test.beforeEach(
				async ({ login, insertNewAboutMeCategory, insertNewAboutMe }) => {
					user = await login()
					category = await insertNewAboutMeCategory()
					initialSection = await insertNewAboutMe({
						userId: user.id,
						aboutMeCategoryId: category.id,
						isPublished: true,
					})
				},
			)

			test('from the list page', async ({ page }) => {
				await listPage.goto()
				const publishSwitch = await listPage.aboutMeTable.getSwitch(
					initialSection.name,
				)

				// Initially published
				await expect(publishSwitch).toBeChecked()

				// Toggle to unpublished
				await publishSwitch.click()
				await expect(publishSwitch).not.toBeChecked()

				// Verify persisted after reload
				await page.reload()
				await expect(
					await listPage.aboutMeTable.getSwitch(initialSection.name),
				).not.toBeChecked()

				// Toggle back to published
				await listPage.aboutMeTable.toggleSwitch(initialSection.name)
				await expect(
					await listPage.aboutMeTable.getSwitch(initialSection.name),
				).toBeChecked()

				await page.reload()
				await expect(
					await listPage.aboutMeTable.getSwitch(initialSection.name),
				).toBeChecked()
			})

			test('from the edit page', async ({}) => {
				await detailsPage.goto(initialSection.id)
				const editorPage = await detailsPage.edit()

				// Initially published
				await expect(editorPage.publishSwitch).toBeChecked()

				// Toggle to unpublished
				await editorPage.publishSwitch.click()
				await editorPage.saveButton.click()

				await detailsPage.verifyAboutDetails({
					name: initialSection.name,
					content: initialSection.content,
					description: initialSection.description ?? '',
					category: category.name,
					status: 'Draft',
				})

				// Toggle back to published
				await detailsPage.edit()
				await editorPage.publishSwitch.click()
				await editorPage.saveButton.click()

				await detailsPage.verifyAboutDetails({
					name: initialSection.name,
					content: initialSection.content,
					description: initialSection.description ?? '',
					category: category.name,
					status: 'Published',
				})
			})
		})

		test.describe('can delete an existing section', () => {
			test.beforeEach(async ({ login, insertNewAboutMe }) => {
				user = await login()
				sectionToDelete = await insertNewAboutMe({ userId: user.id })
			})

			test('can be deleted from the list page', async ({ page }) => {
				await listPage.goto()
				await expect(page.getByText(sectionToDelete.name)).toBeVisible()

				await listPage.aboutMeTable.delete(sectionToDelete.name)

				await expect(page.getByText(sectionToDelete.name)).not.toBeVisible()
			})

			test('can be deleted from its edit page', async ({ page }) => {
				const editorPage = new DashboardAboutMeEditorPOM(page)

				await editorPage.gotoEdit(sectionToDelete.id)

				await editorPage.delete()

				await expect(page.getByText(sectionToDelete.name)).not.toBeVisible()
			})
		})

		test('displays existing sections and categories on the main page', async ({
			login,
			insertNewAboutMe,
			insertNewAboutMeCategory,
		}) => {
			const user = await login()
			const category1 = await insertNewAboutMeCategory()
			const category2 = await insertNewAboutMeCategory()
			const aboutMe1 = await insertNewAboutMe({
				userId: user.id,
				aboutMeCategoryId: category1.id,
			})
			const aboutMe2 = await insertNewAboutMe({
				userId: user.id,
				aboutMeCategoryId: category2.id,
			})

			await listPage.goto()

			const aboutMeTable = listPage.aboutMeTable
			await aboutMeTable.verifyHeaders()
			await aboutMeTable.verifyData([
				[
					aboutMe2.name,
					aboutMe2.content,
					category2.name,
					testDateToday,
					testDateToday,
				],
				[
					aboutMe1.name,
					aboutMe1.content,
					category1.name,
					testDateToday,
					testDateToday,
				],
			])

			const categoriesTable = listPage.categoriesTable
			await categoriesTable.verifyHeaders()
			await categoriesTable.verifyData([
				[
					category2.name,
					category2.description ?? '',
					testDateToday,
					testDateToday,
				],
				[
					category1.name,
					category1.description ?? '',
					testDateToday,
					testDateToday,
				],
			])
		})
	})

	test.describe('Validation', () => {
		test.beforeEach(async ({ page, login, insertNewAboutMeCategory }) => {
			user = await login({ name: faker.person.firstName() })
			category = await insertNewAboutMeCategory({
				name: 'Professional',
			})
			editorPage = new DashboardAboutMeEditorPOM(page)
		})

		test('validates About Me Section creation', async ({ page }) => {
			await editorPage.gotoNew()
			await editorPage.createButton.click()
			await editorPage.verifyRequiredErrors()

			await editorPage.nameInput.fill(faker.lorem.words(2))
			await editorPage.createButton.click()
			await editorPage.verifyRequiredNameError(false)
			await editorPage.verifyRequiredContentError()
			await editorPage.verifyRequiredCategoryError()

			await editorPage.contentInput.fill(faker.lorem.paragraph())
			await editorPage.createButton.click()
			await editorPage.verifyRequiredContentError(false)
			await editorPage.verifyRequiredCategoryError()

			// Successfully create with valid data
			await editorPage.selectCategory(category.name)
			await editorPage.createButton.click()
			await expect(page).toHaveURL(/\/dashboard\/about\/[a-zA-Z0-9]+$/)
		})

		test('validates About Me Section editing', async ({
			page,
			insertNewAboutMe,
		}) => {
			const section = await insertNewAboutMe({
				userId: user.id,
				aboutMeCategoryId: category.id,
			})
			const detailsPage = new DashboardAboutDetailsPOM(page)

			await detailsPage.goto(section.id)
			await detailsPage.edit()

			// Test editing validation
			await editorPage.clearName()
			await editorPage.saveButton.click()
			await expect(editorPage.nameError).toBeVisible()

			await editorPage.nameInput.fill(faker.lorem.words(2)) // Restore name
			await editorPage.clearContent()
			await editorPage.saveButton.click()
			await expect(editorPage.contentError).toBeVisible()
		})
	})

	test.describe('List Page Functionality', () => {
		test('filters sections by content and category', async ({
			page,
			login,
			insertNewAboutMeCategory,
			insertNewAboutMe,
		}) => {
			const user = await login()
			const category1 = await insertNewAboutMeCategory()
			const category2 = await insertNewAboutMeCategory()
			const section1 = await insertNewAboutMe({
				userId: user.id,
				aboutMeCategoryId: category1.id,
			})
			const section2 = await insertNewAboutMe({
				userId: user.id,
				aboutMeCategoryId: category2.id,
			})

			await listPage.goto()

			// Filter by content
			await listPage.aboutMeTable.filterByContent(section1.content.slice(0, 10))
			await expect(page.getByText(section1.name)).toBeVisible()
			await expect(page.getByText(section2.name)).not.toBeVisible()

			// Filter by category
			await listPage.aboutMeTable.clearContentFilter()
			await listPage.aboutMeTable.filterByCategory(category2.name)
			await expect(page.getByText(section1.name)).not.toBeVisible()
			await expect(page.getByText(section2.name)).toBeVisible()
		})
	})
})

test.describe('About Me Categories', () => {
	test.beforeEach(async ({ page, login }) => {
		await login()
		listPage = new DashboardAboutListPOM(page)
		categoryDialog = new DashboardAboutCategoryEditorDialogPOM(page)
		await listPage.goto()
	})

	test.describe('CRUD (via Dialog)', () => {
		test.beforeEach(async ({ page, login }) => {
			await login()
			listPage = new DashboardAboutListPOM(page)
		})

		test.describe('can create a new category', () => {
			test.beforeEach(async () => {
				categoryName = faker.lorem.words(2)
				categoryDescription = faker.lorem.sentence()
			})

			test('that is published', async () => {
				const categoryDialog = await listPage.createNewCategory()

				await categoryDialog.create({
					name: categoryName,
					description: categoryDescription,
					isPublished: true,
				})

				const categoryRow = await listPage.categoriesTable.getRow(categoryName)
				await expect(categoryRow).toBeVisible()
				await expect(categoryRow.getByRole('switch')).toBeChecked()
			})

			test('that is unpublished', async () => {
				await listPage.createNewCategory()

				await categoryDialog.create({
					name: categoryName,
					description: categoryDescription,
					isPublished: false,
				})

				const categoryRow = await listPage.categoriesTable.getRow(categoryName)
				await expect(categoryRow).toBeVisible()
				await expect(categoryRow.getByRole('switch')).not.toBeChecked()
			})
		})

		test('can edit an existing category', async ({
			insertNewAboutMeCategory,
		}) => {
			const category = await insertNewAboutMeCategory()
			const initialCategoryName = category.name
			await listPage.goto() // needed to see the new category
			await listPage.categoriesTable.edit(category.name)

			const updatedCategoryName = faker.lorem.words(2)
			const updatedCategoryDescription = faker.lorem.sentence()

			await categoryDialog.update({
				name: updatedCategoryName,
				description: updatedCategoryDescription,
			})

			const categoryRow =
				await listPage.categoriesTable.getRow(updatedCategoryName)
			await expect(categoryRow).toBeVisible()
			await expect(categoryRow.getByRole('switch')).toBeChecked()

			const previousCategoryRow =
				await listPage.categoriesTable.getRow(initialCategoryName)
			await expect(previousCategoryRow).not.toBeVisible()
		})

		test.describe('can toggle publish status', () => {
			test.beforeEach(async ({ insertNewAboutMeCategory }) => {
				category = await insertNewAboutMeCategory({
					isPublished: true,
				})
				await listPage.goto()
			})

			test('from the table', async ({ page }) => {
				const publishSwitch = await listPage.categoriesTable.getSwitch(
					category.name,
				)

				// Initially published
				await expect(publishSwitch).toBeChecked()

				// Toggle to unpublished
				await publishSwitch.click()
				await expect(publishSwitch).not.toBeChecked()

				// Verify persisted after reload
				await page.reload()
				await expect(
					await listPage.categoriesTable.getSwitch(category.name),
				).not.toBeChecked()

				// Toggle back to published
				await (await listPage.categoriesTable.getSwitch(category.name)).click()
				await expect(
					await listPage.categoriesTable.getSwitch(category.name),
				).toBeChecked()

				await page.reload()
				await expect(
					await listPage.categoriesTable.getSwitch(category.name),
				).toBeChecked()
			})

			test('from the dialog', async ({ page }) => {
				categoryDialog = await listPage.categoriesTable.edit(category.name)

				// Initially published
				await expect(categoryDialog.publishSwitch).toBeChecked()

				// Toggle to unpublished
				await categoryDialog.unpublish()
				await categoryDialog.saveButton.click()

				await expect(
					await listPage.categoriesTable.getSwitch(category.name),
				).not.toBeChecked()

				// Verify persisted after reload
				await page.reload()
				await expect(
					await listPage.categoriesTable.getSwitch(category.name),
				).not.toBeChecked()

				// Toggle back to published
				categoryDialog = await listPage.categoriesTable.edit(category.name)
				await categoryDialog.publish()
				await categoryDialog.saveButton.click()

				await expect(
					await listPage.categoriesTable.getSwitch(category.name),
				).toBeChecked()
			})
		})

		test('can be deleted', async ({ insertNewAboutMeCategory }) => {
			const category = await insertNewAboutMeCategory()
			await listPage.goto()
			await listPage.categoriesTable.delete(category.name)

			const categoryRow = await listPage.categoriesTable.getRow(category.name)
			await expect(categoryRow).not.toBeVisible()
		})
	})

	test.describe('Validation', () => {
		test('validates the required name field on creation', async () => {
			const categoryDialog = await listPage.createNewCategory()

			await expect(categoryDialog.dialog).toBeVisible()
			await categoryDialog.createButton.click()

			await expect(categoryDialog.nameError).toBeVisible()
			await expect(categoryDialog.dialog).toBeVisible()
		})

		test('validates the required name field on editing', async ({
			insertNewAboutMeCategory,
		}) => {
			const category = await insertNewAboutMeCategory()
			await listPage.goto()
			await listPage.categoriesTable.edit(category.name)

			await categoryDialog.clearName()
			await categoryDialog.saveButton.click()
			await expect(categoryDialog.nameError).toBeVisible()

			const updatedCategoryName = faker.lorem.words(2)
			await categoryDialog.nameInput.fill(updatedCategoryName)
			await categoryDialog.saveButton.click()
			await categoryDialog.verifyRequiredNameError(false)
		})
	})

	test.describe('List Page Functionality', () => {
		test('filters categories by name and description', async ({
			page,
			insertNewAboutMeCategory,
		}) => {
			const cat1 = await insertNewAboutMeCategory({
				name: `FilterCat1 ${faker.lorem.word()}`,
				description: `UniqueDesc1 ${faker.string.uuid()}`,
			})
			const cat2 = await insertNewAboutMeCategory({
				name: `FilterCat2 ${faker.lorem.word()}`,
				description: `UniqueDesc2 ${faker.string.uuid()}`,
			})

			await listPage.goto()

			await listPage.categoriesTable.filterByName(cat1.name)
			await expect(page.getByText(cat1.name)).toBeVisible()
			await expect(page.getByText(cat2.name)).not.toBeVisible()

			await listPage.categoriesTable.clearNameFilter()
			await listPage.categoriesTable.filterByDescription(cat2.description ?? '')
			await expect(page.getByText(cat1.name)).not.toBeVisible()
			await expect(page.getByText(cat2.name)).toBeVisible()
		})
	})

	test('can open category dialog by clicking name', async ({
		page,
		insertNewAboutMeCategory,
	}) => {
		const category = await insertNewAboutMeCategory()
		await listPage.goto()

		// Use the new clickName method from DialogDriven mixin
		const dialog = await listPage.categoriesTable.clickName(category.name)

		// Verify dialog opened with correct data
		await expect(dialog.dialog).toBeVisible()
		await expect(dialog.nameInput).toHaveValue(category.name)
		if (category.description) {
			await expect(dialog.descriptionInput).toHaveValue(category.description)
		}

		// Close dialog by clicking outside of it
		await page.mouse.click(10, 10)
		await expect(dialog.dialog).not.toBeVisible()
	})
})

test.describe('Interactions between Sections and Categories', () => {
	test.beforeEach(async ({ page, login }) => {
		user = await login()
		listPage = new DashboardAboutListPOM(page)
	})

	test('deleting a category also deletes its associated sections', async ({
		insertNewAboutMeCategory,
		insertNewAboutMe,
	}) => {
		categoryToDelete = await insertNewAboutMeCategory()
		sectionToDelete = await insertNewAboutMe({
			userId: user.id,
			aboutMeCategoryId: categoryToDelete.id,
		})

		await listPage.goto()
		const sectionRow = await listPage.aboutMeTable.getRow(sectionToDelete.name)
		await expect(sectionRow).toBeVisible()
		const categoryRow = await listPage.categoriesTable.getRow(
			categoryToDelete.name,
		)
		await expect(categoryRow).toBeVisible()

		await listPage.categoriesTable.delete(categoryToDelete.name)

		await expect(categoryRow).not.toBeVisible()
		await expect(sectionRow).not.toBeVisible()
	})

	test('non-published categories are not available for selection in the section editor', async ({
		page,
		insertNewAboutMeCategory,
		insertNewAboutMe,
	}) => {
		const publishedCat = await insertNewAboutMeCategory({ isPublished: true })
		const unpublishedCat = await insertNewAboutMeCategory({
			isPublished: false,
		})
		const sectionWithPublishedCat = await insertNewAboutMe({
			userId: user.id,
			aboutMeCategoryId: publishedCat.id,
		})
		const editorPage = new DashboardAboutMeEditorPOM(page)

		await listPage.goto()

		// Test on 'new section' page
		await listPage.gotoNewSection()
		await editorPage.openCategoryDropdown()
		await expect(editorPage.getCategoryOption(publishedCat.name)).toBeVisible()
		await expect(
			editorPage.getCategoryOption(unpublishedCat.name),
		).not.toBeVisible()
		await page.keyboard.press('Escape')

		// Test on 'edit section' page
		await editorPage.gotoEdit(sectionWithPublishedCat.id)
		await editorPage.openCategoryDropdown()
		await expect(editorPage.getCategoryOption(publishedCat.name)).toBeVisible()
		await expect(
			editorPage.getCategoryOption(unpublishedCat.name),
		).not.toBeVisible()
	})

	test('handles editing a section whose category is no longer published', async ({
		page,
		insertNewAboutMeCategory,
		insertNewAboutMe,
	}) => {
		const categoryToUnpublish = await insertNewAboutMeCategory({
			isPublished: true,
		})
		const fallbackCategory = await insertNewAboutMeCategory({
			isPublished: true,
		})
		const section = await insertNewAboutMe({
			userId: user.id,
			aboutMeCategoryId: categoryToUnpublish.id,
		})
		const editorPage = new DashboardAboutMeEditorPOM(page)

		await listPage.goto()

		// Unpublish the category
		await listPage.categoriesTable.unpublish(categoryToUnpublish.name)
		const publishSwitch = await listPage.categoriesTable.getSwitch(
			categoryToUnpublish.name,
		)
		await expect(publishSwitch).not.toBeChecked()

		await editorPage.gotoEdit(section.id)

		// The unpublished category should not be selected anymore
		const categoryValue = await editorPage.getSelectedCategoryText()
		await expect(categoryValue).not.toBe(categoryToUnpublish.name)

		// It should not be in the dropdown options
		await editorPage.openCategoryDropdown()
		await expect(
			editorPage.getCategoryOption(categoryToUnpublish.name),
		).not.toBeVisible()
		// But other published categories should be
		await expect(
			editorPage.getCategoryOption(fallbackCategory.name),
		).toBeVisible()
		await editorPage.selectCategoryOption(fallbackCategory.name)

		// Attempt to save
		await editorPage.saveButton.click()

		// Assert save is successful and category is updated
		await expect(page).toHaveURL(`/dashboard/about/${section.id}`)
		await expect(page.getByText(fallbackCategory.name)).toBeVisible()
	})
})
