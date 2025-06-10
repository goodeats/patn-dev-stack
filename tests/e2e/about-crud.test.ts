import { faker } from '@faker-js/faker'
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
let initialSection: AboutMePlaywright
let sectionToDelete: AboutMePlaywright
let sectionName: string
let sectionContent: string
let sectionDescription: string
let updatedName: string
let updatedContent: string
let updatedDescription: string

test.describe('About Me Sections', () => {
	test.describe('CRUD', () => {
		test.beforeEach(async ({ page, login }) => {
			await login()
			listPage = new DashboardAboutListPOM(page)
			detailsPage = new DashboardAboutDetailsPOM(page)
		})

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
			test.beforeEach(async ({ login, insertNewAboutMe }) => {
				user = await login()
				initialSection = await insertNewAboutMe({
					userId: user.id,
					isPublished: true,
				})
			})

			test('from the list page', async ({ page }) => {
				await listPage.goto()
				const publishSwitch = await listPage.aboutMeTable.getPublishSwitch(
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
					await listPage.aboutMeTable.getPublishSwitch(initialSection.name),
				).not.toBeChecked()

				// Toggle back to published
				await (
					await listPage.aboutMeTable.getPublishSwitch(initialSection.name)
				).click()
				await expect(
					await listPage.aboutMeTable.getPublishSwitch(initialSection.name),
				).toBeChecked()

				await page.reload()
				await expect(
					await listPage.aboutMeTable.getPublishSwitch(initialSection.name),
				).toBeChecked()
			})

			test('from the edit page', async ({ page }) => {
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
					category: initialSection.aboutMeCategoryId
						? 'Category Name Placeholder'
						: '',
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
					category: initialSection.aboutMeCategoryId
						? 'Category Name Placeholder'
						: '',
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
		test('toggles the "Published" status from the list page', async ({
			page,
			login,
			insertNewAboutMe,
		}) => {
			const user = await login()
			const sectionName = `PublishToggle Section ${faker.lorem.word()}`
			await insertNewAboutMe({
				userId: user.id,
				name: sectionName,
				isPublished: true,
			})

			await listPage.goto()

			const publishSwitch =
				await listPage.aboutMeTable.getPublishSwitch(sectionName)

			await expect(publishSwitch).toBeChecked()
			await publishSwitch.click()
			await expect(publishSwitch).not.toBeChecked()

			await page.reload()
			const reloadedSwitch =
				await listPage.aboutMeTable.getPublishSwitch(sectionName)
			await expect(reloadedSwitch).not.toBeChecked()
		})

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
		test('can create a new category', async () => {
			await listPage.createNewCategory()

			const categoryName = faker.lorem.words(2)
			const categoryDescription = faker.lorem.sentence()

			await categoryDialog.create({
				name: categoryName,
				description: categoryDescription,
			})

			await expect(listPage.categoriesTable.getRow(categoryName)).toBeVisible()
		})

		test('can edit an existing category', async ({
			insertNewAboutMeCategory,
		}) => {
			const category = await insertNewAboutMeCategory()
			await listPage.goto() // needed to see the new category
			await listPage.categoriesTable.edit(category.name)

			const updatedCategoryName = faker.lorem.words(2)
			const updatedCategoryDescription = faker.lorem.sentence()

			await categoryDialog.update({
				name: updatedCategoryName,
				description: updatedCategoryDescription,
			})

			await expect(
				listPage.getCategoryElement(updatedCategoryName),
			).toBeVisible()
			await expect(listPage.getCategoryElement(category.name)).not.toBeVisible()
		})

		test('can be deleted', async ({ insertNewAboutMeCategory }) => {
			const category = await insertNewAboutMeCategory()
			await listPage.goto()
			await listPage.deleteCategory(category.name)

			await expect(listPage.getCategoryElement(category.name)).not.toBeVisible()
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
		test('toggles the "Published" status from the list page', async ({
			page,
			insertNewAboutMeCategory,
		}) => {
			const categoryName = `PublishToggle Cat ${faker.lorem.word()}`
			await insertNewAboutMeCategory({ name: categoryName, isPublished: true })

			await listPage.goto()

			const publishSwitch = listPage.getCategoryPublishSwitch(categoryName)

			await expect(publishSwitch).toBeChecked()
			await publishSwitch.click()
			await expect(publishSwitch).not.toBeChecked()

			await page.reload()
			const reloadedSwitch = listPage.getCategoryPublishSwitch(categoryName)
			await expect(reloadedSwitch).not.toBeChecked()
		})

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

			await listPage.filterCategoriesByName(cat1.name)
			await expect(page.getByText(cat1.name)).toBeVisible()
			await expect(page.getByText(cat2.name)).not.toBeVisible()

			await listPage.clearNameFilter()
			await listPage.filterCategoriesByDescription(cat2.description ?? '')
			await expect(page.getByText(cat1.name)).not.toBeVisible()
			await expect(page.getByText(cat2.name)).toBeVisible()
		})
	})
})

test.describe('Interactions between Sections and Categories', () => {
	test('deleting a category also deletes its associated sections', async ({
		page,
		login,
		insertNewAboutMeCategory,
		insertNewAboutMe,
	}) => {
		const user = await login()
		const categoryToDelete = await insertNewAboutMeCategory()
		const sectionToDelete = await insertNewAboutMe({
			userId: user.id,
			aboutMeCategoryId: categoryToDelete.id,
		})

		await listPage.goto()
		await expect(listPage.getSectionElement(sectionToDelete.name)).toBeVisible()
		await expect(
			listPage.getCategoryElement(categoryToDelete.name),
		).toBeVisible()

		await listPage.deleteCategory(categoryToDelete.name)

		await expect(
			listPage.getCategoryElement(categoryToDelete.name),
		).not.toBeVisible()
		await expect(
			listPage.getSectionElement(sectionToDelete.name),
		).not.toBeVisible()
	})

	test('non-published categories are not available for selection in the section editor', async ({
		page,
		login,
		insertNewAboutMeCategory,
		insertNewAboutMe,
	}) => {
		const user = await login()
		const publishedCat = await insertNewAboutMeCategory({ isPublished: true })
		const unpublishedCat = await insertNewAboutMeCategory({
			isPublished: false,
		})
		const sectionWithPublishedCat = await insertNewAboutMe({
			userId: user.id,
			aboutMeCategoryId: publishedCat.id,
		})
		const editorPage = new DashboardAboutMeEditorPOM(page)

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
		login,
		insertNewAboutMeCategory,
		insertNewAboutMe,
	}) => {
		const user = await login()
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
		await listPage.toggleCategoryPublishStatus(categoryToUnpublish.name)
		await page.waitForTimeout(100) // allow for server action to complete

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
		await editorPage.selectCategory(fallbackCategory.name)

		// Attempt to save
		await editorPage.saveButton.click()

		// Assert save is successful and category is updated
		await expect(page).toHaveURL(`/dashboard/about/${section.id}`)
		await expect(page.getByText(fallbackCategory.name)).toBeVisible()
	})
})
