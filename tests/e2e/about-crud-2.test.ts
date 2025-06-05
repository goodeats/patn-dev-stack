import { faker } from '@faker-js/faker'
import { type Page } from '@playwright/test'
import {
	expect,
	scrollDown,
	test,
	testDateToday,
	verifyMultipleTableRowsData,
	verifyTableHeaders,
} from '#tests/playwright-utils.ts'

const aboutMeSection = (page: Page) => page.locator('#about-me-sections')
const categoriesSection = (page: Page) => page.locator('#about-me-categories')

test.describe('About Me Sections', () => {
	test.describe('CRUD', () => {
		test('can create a new section', async ({
			page,
			login,
			insertNewAboutMeCategory,
		}) => {
			await login({ name: faker.person.firstName() })
			const category = await insertNewAboutMeCategory()

			await page.goto('/dashboard/about')
			await page.getByRole('link', { name: 'New' }).click()
			await expect(page).toHaveURL('/dashboard/about/new')

			const sectionName = faker.lorem.words(3)
			const sectionContent = faker.lorem.paragraph()
			const sectionDescription = faker.lorem.sentence()

			await page.getByLabel('Name').fill(sectionName)
			await page.getByLabel('Content').fill(sectionContent)
			await page.getByLabel('Description (Optional)').fill(sectionDescription)
			await page.getByRole('combobox', { name: 'Category' }).click()
			await page.getByRole('option', { name: category.name }).click()
			await page.getByRole('button', { name: 'Create About Me' }).click()

			await expect(page).toHaveURL(/\/dashboard\/about\/[a-zA-Z0-9]+$/)
			await expect(
				page.getByRole('heading', { name: sectionName }),
			).toBeVisible()
			await expect(page.getByText(sectionContent)).toBeVisible()
			await expect(page.getByText(sectionDescription)).toBeVisible()
			await expect(page.getByText(category.name)).toBeVisible()
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

			await page.goto(`/dashboard/about/${initialSection.id}`)
			await page.getByRole('link', { name: 'Edit' }).click()
			await expect(page).toHaveURL(`/dashboard/about/${initialSection.id}/edit`)

			await expect(page.getByLabel('Name')).toHaveValue(initialSection.name)
			await expect(page.getByLabel('Content')).toHaveValue(
				initialSection.content,
			)

			const updatedName = faker.lorem.words(3)
			const updatedContent = faker.lorem.paragraph()

			await page.getByLabel('Name').fill(updatedName)
			await page.getByLabel('Content').fill(updatedContent)
			await page.getByRole('combobox', { name: 'Category' }).click()
			await page.getByRole('option', { name: category2.name }).click()
			await page.getByRole('switch', { name: 'Published' }).click() // unpublish
			await scrollDown(page, { mode: 'bottom' })
			await page.getByRole('button', { name: 'Save Changes' }).click()

			await expect(page).toHaveURL(`/dashboard/about/${initialSection.id}`)
			await expect(
				page.getByRole('heading', { name: updatedName }),
			).toBeVisible()
			await expect(page.getByText(updatedContent)).toBeVisible()
			await expect(page.getByText(category2.name)).toBeVisible()
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

			await page.goto('/dashboard/about')
			await expect(page.getByText(sectionToDelete.name)).toBeVisible()

			const row = page
				.getByRole('row')
				.filter({ hasText: sectionToDelete.name })
			await row.getByRole('button', { name: 'Open menu' }).click()

			page.on('dialog', (dialog) => dialog.accept())
			await page.getByRole('button', { name: 'Delete' }).click()

			await expect(page.getByText(sectionToDelete.name)).not.toBeVisible()
		})

		test('can be deleted from its edit page', async ({
			page,
			login,
			insertNewAboutMe,
		}) => {
			const user = await login()
			const sectionToDelete = await insertNewAboutMe({ userId: user.id })

			await page.goto(`/dashboard/about/${sectionToDelete.id}/edit`)

			page.on('dialog', (dialog) => dialog.accept())
			await page.getByRole('button', { name: 'Delete' }).click()

			await expect(page).toHaveURL('/dashboard/about')
			await expect(
				aboutMeSection(page).getByText(sectionToDelete.name),
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

			await page.goto('/dashboard/about')

			// Verify Sections Table
			const aboutMeTable = aboutMeSection(page).locator('table')
			await verifyTableHeaders(
				aboutMeTable,
				[
					'Name',
					'Content',
					'Category',
					'Created At',
					'Updated At',
					'Published',
				],
				{ hasSelectColumn: true, hasActionsColumn: true },
			)
			await verifyMultipleTableRowsData(
				aboutMeTable,
				[
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
				],
				{ hasSelectColumn: true },
			)

			// Verify Categories Table
			const categoriesTable = categoriesSection(page).locator('table')
			await verifyTableHeaders(
				categoriesTable,
				['Name', 'Description', 'Created At', 'Updated At', 'Published'],
				{ hasSelectColumn: true, hasActionsColumn: true },
			)
			await verifyMultipleTableRowsData(
				categoriesTable,
				[
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
				],
				{ hasSelectColumn: true },
			)
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
			// Test creation validation
			await page.goto('/dashboard/about/new')
			await page.getByRole('button', { name: 'Create About Me' }).click()
			await expect(
				page.locator('#about-editor-name-error').getByText('Required'),
			).toBeVisible()
			await expect(
				page.locator('#about-editor-content-error').getByText('Required'),
			).toBeVisible()
			await expect(
				page.locator('form').getByText('Category is required'),
			).toBeVisible()

			// Test editing validation
			const section = await insertNewAboutMe({ userId: user.id })
			await page.goto(`/dashboard/about/${section.id}/edit`)
			await page.getByLabel('Name').clear()
			await page.getByLabel('Content').clear()
			await page.getByRole('button', { name: 'Save Changes' }).click()
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

			await page.goto('/dashboard/about')

			const sectionRow = page.getByRole('row').filter({ hasText: sectionName })
			const publishSwitch = sectionRow.getByRole('switch', {
				name: `Toggle publish status for ${sectionName}`,
			})

			await expect(publishSwitch).toBeChecked()
			await publishSwitch.click()
			await expect(publishSwitch).not.toBeChecked()

			await page.reload()
			const reloadedSwitch = page.getByRole('switch', {
				name: `Toggle publish status for ${sectionName}`,
			})
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

			await page.goto('/dashboard/about')

			// Filter by content
			await page
				.getByPlaceholder('Filter content...')
				.fill(section1.content.slice(0, 10))
			await expect(page.getByText(section1.name)).toBeVisible()
			await expect(page.getByText(section2.name)).not.toBeVisible()

			// Filter by category
			await page.getByPlaceholder('Filter content...').clear()
			await page.getByPlaceholder('Filter category...').fill(category2.name)
			await expect(page.getByText(section1.name)).not.toBeVisible()
			await expect(page.getByText(section2.name)).toBeVisible()
		})
	})
})

test.describe('About Me Categories', () => {
	test.describe('CRUD (via Dialog)', () => {
		test('can create a new category', async ({ page, login }) => {
			await login()
			await page.goto('/dashboard/about')

			await categoriesSection(page).getByRole('button', { name: 'New' }).click()

			await expect(page.getByRole('dialog')).toBeVisible()
			const categoryName = faker.lorem.words(2)
			await page.getByLabel('Name').fill(categoryName)
			await page
				.getByLabel('Description (Optional)')
				.fill(faker.lorem.sentence())
			await page.getByRole('button', { name: 'Create Category' }).click()

			await expect(page.getByRole('dialog')).not.toBeVisible()
			await expect(
				categoriesSection(page).getByText(categoryName),
			).toBeVisible()
		})

		test('can edit an existing category', async ({
			page,
			login,
			insertNewAboutMeCategory,
		}) => {
			await login()
			const category = await insertNewAboutMeCategory()

			await page.goto('/dashboard/about')
			await categoriesSection(page).getByText(category.name).click()
			await expect(page.getByRole('dialog')).toBeVisible()

			const updatedCategoryName = faker.lorem.words(2)
			await page.getByLabel('Name').fill(updatedCategoryName)
			await page.getByRole('button', { name: 'Save Changes' }).click()

			await expect(page.getByRole('dialog')).not.toBeVisible()
			await expect(
				categoriesSection(page).getByText(updatedCategoryName),
			).toBeVisible()
		})

		test('can be deleted', async ({
			page,
			login,
			insertNewAboutMeCategory,
		}) => {
			await login()
			const category = await insertNewAboutMeCategory()

			await page.goto('/dashboard/about')
			const categoryRow = categoriesSection(page)
				.getByRole('row')
				.filter({ hasText: category.name })
			await categoryRow.getByRole('button', { name: 'Open menu' }).click()

			page.on('dialog', (dialog) => dialog.accept())
			await page.getByRole('button', { name: 'Delete' }).click()

			await expect(
				categoriesSection(page).getByText(category.name),
			).not.toBeVisible()
		})
	})

	test.describe('Validation', () => {
		test('validates the required name field on creation', async ({
			page,
			login,
		}) => {
			await login()
			await page.goto('/dashboard/about')
			await categoriesSection(page).getByRole('button', { name: 'New' }).click()

			await expect(page.getByRole('dialog')).toBeVisible()
			await page.getByRole('button', { name: 'Create Category' }).click()

			await expect(
				page
					.getByRole('dialog')
					.locator('#about-category-editor-name-error')
					.getByText('Required'),
			).toBeVisible()
			await expect(page.getByRole('dialog')).toBeVisible()
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

			await page.goto('/dashboard/about')

			const categoryRow = page
				.getByRole('row')
				.filter({ hasText: categoryName })
			const publishSwitch = categoryRow.getByRole('switch', {
				name: `Toggle publish status for ${categoryName}`,
			})

			await expect(publishSwitch).toBeChecked()
			await publishSwitch.click()
			await expect(publishSwitch).not.toBeChecked()

			await page.reload()
			const reloadedSwitch = page
				.getByRole('row')
				.filter({ hasText: categoryName })
				.getByRole('switch')
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

			await page.goto('/dashboard/about')

			await page.getByPlaceholder('Filter name...').fill(cat1.name)
			await expect(page.getByText(cat1.name)).toBeVisible()
			await expect(page.getByText(cat2.name)).not.toBeVisible()

			await page.getByPlaceholder('Filter name...').clear()
			await page
				.getByPlaceholder('Filter description...')
				.fill(cat2.description ?? '')
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

		await page.goto('/dashboard/about')
		await expect(
			aboutMeSection(page).getByText(sectionToDelete.name),
		).toBeVisible()
		await expect(
			categoriesSection(page).getByText(categoryToDelete.name),
		).toBeVisible()

		const categoryRow = page
			.getByRole('row')
			.filter({ hasText: categoryToDelete.name })
		await categoryRow
			.getByRole('button', { name: 'Open about category menu' })
			.click()

		page.on('dialog', (dialog) => dialog.accept())
		await page.getByRole('button', { name: 'Delete' }).click()

		await expect(
			categoriesSection(page).getByText(categoryToDelete.name),
		).not.toBeVisible()
		await expect(
			aboutMeSection(page).getByText(sectionToDelete.name),
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

		// Test on 'new section' page
		await page.goto('/dashboard/about/new')
		await page.getByRole('combobox', { name: 'Category' }).click()
		await expect(
			page.getByRole('option', { name: publishedCat.name }),
		).toBeVisible()
		await expect(
			page.getByRole('option', { name: unpublishedCat.name }),
		).not.toBeVisible()
		await page.keyboard.press('Escape')

		// Test on 'edit section' page
		await page.goto(`/dashboard/about/${sectionWithPublishedCat.id}/edit`)
		await page.getByRole('combobox', { name: 'Category' }).click()
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

		await page.goto('/dashboard/about')

		// Unpublish the category
		const catRow = categoriesSection(page)
			.getByRole('row')
			.filter({ hasText: categoryToUnpublish.name })
		await catRow.getByRole('switch').click()
		await page.waitForTimeout(100) // allow for server action to complete

		await page.goto(`/dashboard/about/${section.id}/edit`)

		// The unpublished category should not be selected anymore
		const categoryValue = await page
			.getByRole('combobox', { name: 'Category' })
			.textContent()
		await expect(categoryValue).not.toBe(categoryToUnpublish.name)

		// It should not be in the dropdown options
		await page.getByRole('combobox', { name: 'Category' }).click()
		await expect(
			page.getByRole('option', { name: categoryToUnpublish.name }),
		).not.toBeVisible()
		// But other published categories should be
		await expect(
			page.getByRole('option', { name: fallbackCategory.name }),
		).toBeVisible()
		await page.getByRole('option', { name: fallbackCategory.name }).click()

		// Attempt to save
		await page.getByRole('button', { name: 'Save Changes' }).click()

		// Assert save is successful and category is updated
		await expect(page).toHaveURL(`/dashboard/about/${section.id}`)
		await expect(page.getByText(fallbackCategory.name)).toBeVisible()
	})
})
