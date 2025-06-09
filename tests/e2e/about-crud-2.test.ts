import { faker } from '@faker-js/faker'
import { DashboardAboutCategoryEditorDialog } from '#tests/e2e/pom/dashboard-about-category-editor-dialog'
import { expect, test, testDateToday } from '#tests/playwright-utils.ts'
import { DashboardAboutDetailsPage } from './pom/dashboard-about-details-page'
import { DashboardAboutMeEditorPage } from './pom/dashboard-about-me-editor-page'
import { DashboardAboutPage } from './pom/dashboard-about-page'

test.describe('About Me Sections', () => {
	test.describe('CRUD', () => {
		test('can create a new section', async ({
			page,
			login,
			insertNewAboutMeCategory,
		}) => {
			await login({ name: faker.person.firstName() })
			const category = await insertNewAboutMeCategory()
			const dashboardAboutPage = new DashboardAboutPage(page)
			const editorPage = new DashboardAboutMeEditorPage(page)
			const detailsPage = new DashboardAboutDetailsPage(page)

			await dashboardAboutPage.goto()
			await dashboardAboutPage.clickNewSection()

			const sectionName = faker.lorem.words(3)
			const sectionContent = faker.lorem.paragraph()
			const sectionDescription = faker.lorem.sentence()

			await editorPage.create({
				name: sectionName,
				content: sectionContent,
				description: sectionDescription,
				categoryName: category.name,
			})

			await detailsPage.verifyDetails({
				name: sectionName,
				content: sectionContent,
				description: sectionDescription,
				category: category.name,
				status: 'Published',
			})
		})

		test('can edit an existing section', async ({
			page,
			login,
			insertNewAboutMeCategory,
			insertNewAboutMe,
		}) => {
			const user = await login()
			const category1 = await insertNewAboutMeCategory()
			const category2 = await insertNewAboutMeCategory()
			const initialSection = await insertNewAboutMe({
				userId: user.id,
				aboutMeCategoryId: category1.id,
			})
			const editorPage = new DashboardAboutMeEditorPage(page)
			const detailsPage = new DashboardAboutDetailsPage(page)

			await detailsPage.goto(initialSection.id)
			await detailsPage.clickEdit()

			await expect(editorPage.nameInput).toHaveValue(initialSection.name)
			await expect(editorPage.contentInput).toHaveValue(initialSection.content)

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

			await detailsPage.verifyDetails({
				name: updatedName,
				content: updatedContent,
				description: updatedDescription,
				category: category2.name,
				status: 'Published',
			})
		})

		test('can be deleted from the list page', async ({
			page,
			login,
			insertNewAboutMe,
		}) => {
			const user = await login()
			const sectionToDelete = await insertNewAboutMe({
				userId: user.id,
				name: `SectionToDelete ${faker.lorem.word()}`,
			})
			const dashboardAboutPage = new DashboardAboutPage(page)

			await dashboardAboutPage.goto()
			await expect(page.getByText(sectionToDelete.name)).toBeVisible()

			await dashboardAboutPage.aboutMeTable.delete(sectionToDelete.name)

			await expect(page.getByText(sectionToDelete.name)).not.toBeVisible()
		})

		test('can be deleted from its edit page', async ({
			page,
			login,
			insertNewAboutMe,
		}) => {
			const user = await login()
			const sectionToDelete = await insertNewAboutMe({ userId: user.id })
			const dashboardAboutPage = new DashboardAboutPage(page)
			const editorPage = new DashboardAboutMeEditorPage(page)

			await editorPage.gotoEdit(sectionToDelete.id)

			await editorPage.delete()

			await expect(
				dashboardAboutPage.aboutMeTable.getRow(sectionToDelete.name),
			).not.toBeVisible()
		})

		test('displays existing sections and categories on the main page', async ({
			page,
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
			const dashboardAboutPage = new DashboardAboutPage(page)

			await dashboardAboutPage.goto()

			const aboutMeTable = dashboardAboutPage.aboutMeTable
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

			const categoriesTable = dashboardAboutPage.categoriesTable
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
		test('validates About Me Section creation', async ({
			page,
			login,
			insertNewAboutMeCategory,
		}) => {
			await login({ name: faker.person.firstName() })
			const category = await insertNewAboutMeCategory({
				name: 'Professional',
			})
			const editorPage = new DashboardAboutMeEditorPage(page)

			await editorPage.gotoNew()
			await editorPage.clickCreateButton()
			await editorPage.verifyRequiredErrors()

			await editorPage.nameInput.fill(faker.lorem.words(2))
			await editorPage.clickCreateButton()
			await editorPage.verifyRequiredNameError(false)
			await editorPage.verifyRequiredContentError()
			await editorPage.verifyRequiredCategoryError()

			await editorPage.contentInput.fill(faker.lorem.paragraph())
			await editorPage.clickCreateButton()
			await editorPage.verifyRequiredContentError(false)
			await editorPage.verifyRequiredCategoryError()

			// Successfully create with valid data
			await editorPage.selectCategory(category.name)
			await editorPage.clickCreateButton()
			await expect(page).toHaveURL(/\/dashboard\/about\/[a-zA-Z0-9]+$/)
		})

		test('validates About Me Section editing', async ({
			page,
			login,
			insertNewAboutMeCategory,
			insertNewAboutMe,
		}) => {
			const user = await login()
			const category = await insertNewAboutMeCategory({
				name: 'Professional',
			})
			const section = await insertNewAboutMe({
				userId: user.id,
				aboutMeCategoryId: category.id,
			})
			const editorPage = new DashboardAboutMeEditorPage(page)
			const detailsPage = new DashboardAboutDetailsPage(page)

			await detailsPage.goto(section.id)
			await detailsPage.clickEdit()

			// Test editing validation
			await editorPage.clearName()
			await editorPage.clickSaveButton()
			await expect(editorPage.nameError).toBeVisible()

			await editorPage.nameInput.fill(faker.lorem.words(2)) // Restore name
			await editorPage.clearContent()
			await editorPage.clickSaveButton()
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
			const dashboardAboutPage = new DashboardAboutPage(page)

			await dashboardAboutPage.goto()

			const publishSwitch =
				dashboardAboutPage.getSectionPublishSwitch(sectionName)

			await expect(publishSwitch).toBeChecked()
			await publishSwitch.click()
			await expect(publishSwitch).not.toBeChecked()

			await page.reload()
			const reloadedSwitch =
				dashboardAboutPage.getSectionPublishSwitch(sectionName)
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
			const dashboardAboutPage = new DashboardAboutPage(page)

			await dashboardAboutPage.goto()

			// Filter by content
			await dashboardAboutPage.filterSectionsByContent(
				section1.content.slice(0, 10),
			)
			await expect(page.getByText(section1.name)).toBeVisible()
			await expect(page.getByText(section2.name)).not.toBeVisible()

			// Filter by category
			await dashboardAboutPage.clearContentFilter()
			await dashboardAboutPage.filterSectionsByCategory(category2.name)
			await expect(page.getByText(section1.name)).not.toBeVisible()
			await expect(page.getByText(section2.name)).toBeVisible()
		})
	})
})

test.describe('About Me Categories', () => {
	test.describe('CRUD (via Dialog)', () => {
		test('can create a new category', async ({ page, login }) => {
			await login()
			const dashboardAboutPage = new DashboardAboutPage(page)
			const categoryDialog = new DashboardAboutCategoryEditorDialog(page)

			await dashboardAboutPage.goto()
			await dashboardAboutPage.clickNewCategory()

			const categoryName = faker.lorem.words(2)
			const categoryDescription = faker.lorem.sentence()

			await categoryDialog.create({
				name: categoryName,
				description: categoryDescription,
			})

			await expect(
				dashboardAboutPage.getCategoryElement(categoryName),
			).toBeVisible()
		})

		test('can edit an existing category', async ({
			page,
			login,
			insertNewAboutMeCategory,
		}) => {
			await login()
			const category = await insertNewAboutMeCategory()
			const dashboardAboutPage = new DashboardAboutPage(page)
			const categoryDialog = new DashboardAboutCategoryEditorDialog(page)

			await dashboardAboutPage.goto()
			await dashboardAboutPage.clickCategory(category.name)

			const updatedCategoryName = faker.lorem.words(2)
			const updatedCategoryDescription = faker.lorem.sentence()

			await categoryDialog.update({
				name: updatedCategoryName,
				description: updatedCategoryDescription,
			})

			await expect(
				dashboardAboutPage.getCategoryElement(updatedCategoryName),
			).toBeVisible()
			await expect(
				dashboardAboutPage.getCategoryElement(updatedCategoryDescription),
			).toBeVisible()
			await expect(
				dashboardAboutPage.getCategoryElement(category.name),
			).not.toBeVisible()
		})

		test('can be deleted', async ({
			page,
			login,
			insertNewAboutMeCategory,
		}) => {
			await login()
			const category = await insertNewAboutMeCategory()
			const dashboardAboutPage = new DashboardAboutPage(page)

			await dashboardAboutPage.goto()
			await dashboardAboutPage.deleteCategory(category.name)

			await expect(
				dashboardAboutPage.getCategoryElement(category.name),
			).not.toBeVisible()
		})
	})

	test.describe('Validation', () => {
		test('validates the required name field on creation', async ({
			page,
			login,
		}) => {
			await login()
			const dashboardAboutPage = new DashboardAboutPage(page)
			const categoryDialog = new DashboardAboutCategoryEditorDialog(page)

			await dashboardAboutPage.goto()
			await dashboardAboutPage.clickNewCategoryButton()

			await expect(categoryDialog.dialog).toBeVisible()
			await categoryDialog.clickCreateButton()

			await expect(categoryDialog.nameError).toBeVisible()
			await expect(categoryDialog.dialog).toBeVisible()
		})

		test('validates the required name field on editing', async ({
			page,
			login,
			insertNewAboutMeCategory,
		}) => {
			await login()
			const category = await insertNewAboutMeCategory()
			const dashboardAboutPage = new DashboardAboutPage(page)
			const categoryDialog = new DashboardAboutCategoryEditorDialog(page)

			await dashboardAboutPage.goto()
			await dashboardAboutPage.clickCategory(category.name)

			await categoryDialog.clearName()
			await categoryDialog.clickSaveButton()
			await categoryDialog.verifyRequiredNameError()
		})
	})

	test.describe('List Page Functionality', () => {
		test('toggles the "Published" status from the list page', async ({
			page,
			login,
			insertNewAboutMeCategory,
		}) => {
			await login()
			const categoryName = `PublishToggle Cat ${faker.lorem.word()}`
			await insertNewAboutMeCategory({ name: categoryName, isPublished: true })
			const dashboardAboutPage = new DashboardAboutPage(page)

			await dashboardAboutPage.goto()

			const publishSwitch =
				dashboardAboutPage.getCategoryPublishSwitch(categoryName)

			await expect(publishSwitch).toBeChecked()
			await publishSwitch.click()
			await expect(publishSwitch).not.toBeChecked()

			await page.reload()
			const reloadedSwitch =
				dashboardAboutPage.getCategoryPublishSwitch(categoryName)
			await expect(reloadedSwitch).not.toBeChecked()
		})

		test('filters categories by name and description', async ({
			page,
			login,
			insertNewAboutMeCategory,
		}) => {
			await login()
			const cat1 = await insertNewAboutMeCategory({
				name: `FilterCat1 ${faker.lorem.word()}`,
				description: `UniqueDesc1 ${faker.string.uuid()}`,
			})
			const cat2 = await insertNewAboutMeCategory({
				name: `FilterCat2 ${faker.lorem.word()}`,
				description: `UniqueDesc2 ${faker.string.uuid()}`,
			})
			const dashboardAboutPage = new DashboardAboutPage(page)

			await dashboardAboutPage.goto()

			await dashboardAboutPage.filterCategoriesByName(cat1.name)
			await expect(page.getByText(cat1.name)).toBeVisible()
			await expect(page.getByText(cat2.name)).not.toBeVisible()

			await dashboardAboutPage.clearNameFilter()
			await dashboardAboutPage.filterCategoriesByDescription(
				cat2.description ?? '',
			)
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
		const dashboardAboutPage = new DashboardAboutPage(page)

		await dashboardAboutPage.goto()
		await expect(
			dashboardAboutPage.getSectionElement(sectionToDelete.name),
		).toBeVisible()
		await expect(
			dashboardAboutPage.getCategoryElement(categoryToDelete.name),
		).toBeVisible()

		await dashboardAboutPage.deleteCategory(categoryToDelete.name)

		await expect(
			dashboardAboutPage.getCategoryElement(categoryToDelete.name),
		).not.toBeVisible()
		await expect(
			dashboardAboutPage.getSectionElement(sectionToDelete.name),
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
		const dashboardAboutPage = new DashboardAboutPage(page)
		const editorPage = new DashboardAboutMeEditorPage(page)

		// Test on 'new section' page
		await dashboardAboutPage.gotoNewSection()
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
		const dashboardAboutPage = new DashboardAboutPage(page)
		const editorPage = new DashboardAboutMeEditorPage(page)

		await dashboardAboutPage.goto()

		// Unpublish the category
		await dashboardAboutPage.toggleCategoryPublishStatus(
			categoryToUnpublish.name,
		)
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
		await editorPage.clickSaveButton()

		// Assert save is successful and category is updated
		await expect(page).toHaveURL(`/dashboard/about/${section.id}`)
		await expect(page.getByText(fallbackCategory.name)).toBeVisible()
	})
})
