import { faker } from '@faker-js/faker'
import { expect, test, testDateToday } from '#tests/playwright-utils.ts'
import { AboutDashboardPage } from './pom/about-dashboard-page.ts'
import { AboutMeEditorPage } from './pom/about-me-editor-page.ts'

test.describe('About Me Sections', () => {
	test.describe('CRUD', () => {
		test('can create a new section', async ({
			page,
			login,
			insertNewAboutMeCategory,
		}) => {
			await login({ name: faker.person.firstName() })
			const category = await insertNewAboutMeCategory()

			const aboutDashboardPage = new AboutDashboardPage(page)
			await aboutDashboardPage.goto()
			await aboutDashboardPage.clickNewSection()

			const aboutMeEditorPage = new AboutMeEditorPage(page)
			const sectionData = {
				name: faker.lorem.words(3),
				content: faker.lorem.paragraph(),
				description: faker.lorem.sentence(),
				categoryName: category.name,
			}
			await aboutMeEditorPage.create(sectionData)

			await expect(
				page.getByRole('heading', { name: sectionData.name }),
			).toBeVisible()
			await expect(page.getByText(sectionData.content)).toBeVisible()
			await expect(page.getByText(sectionData.description)).toBeVisible()
			await expect(page.getByText(sectionData.categoryName)).toBeVisible()
			await expect(page.getByText('Published')).toBeVisible()
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

			const aboutMeEditorPage = new AboutMeEditorPage(page)
			await aboutMeEditorPage.gotoEdit(initialSection.id)

			await expect(aboutMeEditorPage.nameInput).toHaveValue(initialSection.name)
			await expect(aboutMeEditorPage.contentInput).toHaveValue(
				initialSection.content,
			)

			const updatedSectionData = {
				name: faker.lorem.words(3),
				content: faker.lorem.paragraph(),
				categoryName: category2.name,
			}
			await aboutMeEditorPage.unpublish()
			await aboutMeEditorPage.update(updatedSectionData)

			await expect(page).toHaveURL(`/dashboard/about/${initialSection.id}`)
			await expect(
				page.getByRole('heading', { name: updatedSectionData.name }),
			).toBeVisible()
			await expect(page.getByText(updatedSectionData.content)).toBeVisible()
			await expect(
				page.getByText(updatedSectionData.categoryName),
			).toBeVisible()
			await expect(page.getByText('Draft')).toBeVisible()
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

			const aboutDashboardPage = new AboutDashboardPage(page)
			await aboutDashboardPage.goto()
			await expect(
				aboutDashboardPage.aboutMeTable.getRow(sectionToDelete.name),
			).toBeVisible()

			page.on('dialog', (dialog) => dialog.accept())
			await aboutDashboardPage.aboutMeTable.delete(sectionToDelete.name)

			await expect(
				aboutDashboardPage.aboutMeTable.getRow(sectionToDelete.name),
			).not.toBeVisible()
		})

		test('can be deleted from its edit page', async ({
			page,
			login,
			insertNewAboutMe,
		}) => {
			const user = await login()
			const sectionToDelete = await insertNewAboutMe({ userId: user.id })

			const aboutMeEditorPage = new AboutMeEditorPage(page)
			await aboutMeEditorPage.gotoEdit(sectionToDelete.id)
			await aboutMeEditorPage.delete()

			const aboutDashboardPage = new AboutDashboardPage(page)
			await expect(
				aboutDashboardPage.aboutMeTable.getRow(sectionToDelete.name),
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

			const aboutDashboardPage = new AboutDashboardPage(page)
			await aboutDashboardPage.goto()

			await aboutDashboardPage.aboutMeTable.verifyHeaders()
			await aboutDashboardPage.aboutMeTable.verifyData([
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

			await aboutDashboardPage.categoriesTable.verifyHeaders()
			await aboutDashboardPage.categoriesTable.verifyData([
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
		test('validates required fields on creation and editing', async ({
			page,
			login,
			insertNewAboutMeCategory,
			insertNewAboutMe,
		}) => {
			const user = await login()
			await insertNewAboutMeCategory()

			const aboutMeEditorPage = new AboutMeEditorPage(page)
			await aboutMeEditorPage.gotoNew()
			await aboutMeEditorPage.createButton.click()
			await aboutMeEditorPage.verifyRequiredErrors()

			const section = await insertNewAboutMe({ userId: user.id })
			await aboutMeEditorPage.gotoEdit(section.id)
			await aboutMeEditorPage.nameInput.clear()
			await aboutMeEditorPage.contentInput.clear()
			await aboutMeEditorPage.saveButton.click()
			await expect(
				page.locator('#about-editor-name-error').getByText('Required'),
			).toBeVisible()
			await expect(
				page.locator('#about-editor-content-error').getByText('Required'),
			).toBeVisible()
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

			const aboutDashboardPage = new AboutDashboardPage(page)
			await aboutDashboardPage.goto()

			const { aboutMeTable } = aboutDashboardPage
			await expect(aboutMeTable.getPublishSwitch(sectionName)).toBeChecked()
			await aboutMeTable.togglePublishStatus(sectionName)
			await expect(aboutMeTable.getPublishSwitch(sectionName)).not.toBeChecked()

			await page.reload()
			await expect(aboutMeTable.getPublishSwitch(sectionName)).not.toBeChecked()
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

			const aboutDashboardPage = new AboutDashboardPage(page)
			await aboutDashboardPage.goto()
			const { aboutMeTable } = aboutDashboardPage

			await aboutMeTable.filterByContent(section1.content.slice(0, 10))
			await expect(aboutMeTable.getRow(section1.name)).toBeVisible()
			await expect(aboutMeTable.getRow(section2.name)).not.toBeVisible()

			await aboutMeTable.clearContentFilter()
			await aboutMeTable.filterByCategory(category2.name)
			await expect(aboutMeTable.getRow(section1.name)).not.toBeVisible()
			await expect(aboutMeTable.getRow(section2.name)).toBeVisible()
		})
	})
})

test.describe('About Me Categories', () => {
	test.describe('CRUD (via Dialog)', () => {
		test('can create a new category', async ({ page, login }) => {
			await login()
			const aboutDashboardPage = new AboutDashboardPage(page)
			await aboutDashboardPage.goto()
			await aboutDashboardPage.clickNewCategory()

			const categoryData = {
				name: faker.lorem.words(2),
				description: faker.lorem.sentence(),
			}
			await aboutDashboardPage.categoryEditorDialog.create(categoryData)

			await expect(
				aboutDashboardPage.categoriesTable.getRow(categoryData.name),
			).toBeVisible()
		})

		test('can edit an existing category', async ({
			page,
			login,
			insertNewAboutMeCategory,
		}) => {
			await login()
			const category = await insertNewAboutMeCategory()

			const aboutDashboardPage = new AboutDashboardPage(page)
			await aboutDashboardPage.goto()
			await aboutDashboardPage.categoriesTable.edit(category.name)

			const updatedCategoryData = {
				name: faker.lorem.words(2),
			}
			await aboutDashboardPage.categoryEditorDialog.update(updatedCategoryData)

			await expect(
				aboutDashboardPage.categoriesTable.getRow(updatedCategoryData.name),
			).toBeVisible()
		})

		test('can be deleted', async ({
			page,
			login,
			insertNewAboutMeCategory,
		}) => {
			await login()
			const category = await insertNewAboutMeCategory()

			const aboutDashboardPage = new AboutDashboardPage(page)
			await aboutDashboardPage.goto()

			page.on('dialog', (dialog) => dialog.accept())
			await aboutDashboardPage.categoriesTable.delete(category.name)

			await expect(
				aboutDashboardPage.categoriesTable.getRow(category.name),
			).not.toBeVisible()
		})
	})

	test.describe('Validation', () => {
		test('validates the required name field on creation', async ({
			page,
			login,
		}) => {
			await login()
			const aboutDashboardPage = new AboutDashboardPage(page)
			await aboutDashboardPage.goto()
			await aboutDashboardPage.clickNewCategory()

			const { categoryEditorDialog } = aboutDashboardPage
			await categoryEditorDialog.createButton.click()
			await categoryEditorDialog.verifyRequiredNameError()
			await expect(categoryEditorDialog.dialog).toBeVisible()
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

			const aboutDashboardPage = new AboutDashboardPage(page)
			await aboutDashboardPage.goto()
			const { categoriesTable } = aboutDashboardPage

			await expect(categoriesTable.getPublishSwitch(categoryName)).toBeChecked()
			await categoriesTable.togglePublishStatus(categoryName)
			await expect(
				categoriesTable.getPublishSwitch(categoryName),
			).not.toBeChecked()

			await page.reload()
			await expect(
				categoriesTable.getPublishSwitch(categoryName),
			).not.toBeChecked()
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

			const aboutDashboardPage = new AboutDashboardPage(page)
			await aboutDashboardPage.goto()
			const { categoriesTable } = aboutDashboardPage

			await categoriesTable.filterByName(cat1.name)
			await expect(categoriesTable.getRow(cat1.name)).toBeVisible()
			await expect(categoriesTable.getRow(cat2.name)).not.toBeVisible()

			await categoriesTable.clearNameFilter()
			await categoriesTable.filterByDescription(cat2.description ?? '')
			await expect(categoriesTable.getRow(cat1.name)).not.toBeVisible()
			await expect(categoriesTable.getRow(cat2.name)).toBeVisible()
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

		const aboutDashboardPage = new AboutDashboardPage(page)
		await aboutDashboardPage.goto()

		await expect(
			aboutDashboardPage.aboutMeTable.getRow(sectionToDelete.name),
		).toBeVisible()
		await expect(
			aboutDashboardPage.categoriesTable.getRow(categoryToDelete.name),
		).toBeVisible()

		page.on('dialog', (dialog) => dialog.accept())
		await aboutDashboardPage.categoriesTable.delete(categoryToDelete.name)

		await expect(
			aboutDashboardPage.categoriesTable.getRow(categoryToDelete.name),
		).not.toBeVisible()
		await expect(
			aboutDashboardPage.aboutMeTable.getRow(sectionToDelete.name),
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

		const aboutMeEditorPage = new AboutMeEditorPage(page)
		await aboutMeEditorPage.gotoNew()
		await aboutMeEditorPage.categorySelect.click()
		await expect(
			page.getByRole('option', { name: publishedCat.name }),
		).toBeVisible()
		await expect(
			page.getByRole('option', { name: unpublishedCat.name }),
		).not.toBeVisible()
		await page.keyboard.press('Escape')

		await aboutMeEditorPage.gotoEdit(sectionWithPublishedCat.id)
		await aboutMeEditorPage.categorySelect.click()
		await expect(
			page.getByRole('option', { name: publishedCat.name }),
		).toBeVisible()
		await expect(
			page.getByRole('option', { name: unpublishedCat.name }),
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

		const aboutDashboardPage = new AboutDashboardPage(page)
		await aboutDashboardPage.goto()
		await aboutDashboardPage.categoriesTable.togglePublishStatus(
			categoryToUnpublish.name,
		)
		await page.waitForTimeout(100)

		const aboutMeEditorPage = new AboutMeEditorPage(page)
		await aboutMeEditorPage.gotoEdit(section.id)

		const categoryValue = await aboutMeEditorPage.categorySelect.textContent()
		await expect(categoryValue).not.toBe(categoryToUnpublish.name)

		await aboutMeEditorPage.categorySelect.click()
		await expect(
			page.getByRole('option', { name: categoryToUnpublish.name }),
		).not.toBeVisible()
		await expect(
			page.getByRole('option', { name: fallbackCategory.name }),
		).toBeVisible()
		await page.getByRole('option', { name: fallbackCategory.name }).click()

		await aboutMeEditorPage.saveButton.click()

		await expect(page).toHaveURL(`/dashboard/about/${section.id}`)
		await expect(page.getByText(fallbackCategory.name)).toBeVisible()
	})
})
