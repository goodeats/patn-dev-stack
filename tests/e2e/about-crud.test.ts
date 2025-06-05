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

test('can create about me section', async ({
	page,
	login,
	insertNewAboutMeCategory,
}) => {
	const userName = faker.person.firstName()
	await login({ name: userName })
	const category = await insertNewAboutMeCategory()

	// Navigate to About page
	await page.goto('/dashboard/about')
	await expect(page).toHaveURL('/dashboard/about')

	// Click Add Section button
	await page.getByRole('link', { name: 'New' }).click()
	await expect(page).toHaveURL('/dashboard/about/new')

	// Fill out the form
	const sectionName = faker.lorem.words(3)
	const sectionContent = faker.lorem.paragraph()
	const sectionDescription = faker.lorem.sentence()
	const categoryToSelect = category.name

	await page.getByLabel('Name').fill(sectionName)
	await page.getByLabel('Content').fill(sectionContent)
	await page.getByLabel('Description (Optional)').fill(sectionDescription)

	await page.getByRole('combobox', { name: 'Category' }).click()
	await page.getByRole('option', { name: categoryToSelect }).click()

	// Submit the form for creation
	await page.getByRole('button', { name: 'Create About Me' }).click()

	// Should redirect to the new section's view page
	const viewPageRegex = new RegExp(`/dashboard/about/[a-zA-Z0-9]+$`)
	await expect(page).toHaveURL(viewPageRegex)

	// Verify the data is displayed on the view page
	await expect(page.getByRole('heading', { name: sectionName })).toBeVisible()
	await expect(page.getByText('Content')).toBeVisible()
	await expect(page.getByText(sectionContent)).toBeVisible()
	await expect(page.getByText('Description')).toBeVisible()
	await expect(page.getByText(sectionDescription)).toBeVisible()
	await expect(page.getByText('Category')).toBeVisible()
	await expect(page.getByText(categoryToSelect)).toBeVisible()
	await expect(page.getByText('Status')).toBeVisible()
	await expect(page.getByText('Published')).toBeVisible()
})

test('can edit about me section', async ({
	page,
	login,
	insertNewUser,
	insertNewAboutMeCategory,
	insertNewAboutMe,
}) => {
	const user = await insertNewUser()
	await login({ id: user.id })
	const category = await insertNewAboutMeCategory({
		name: 'Test Category for Edit',
	})
	const category2 = await insertNewAboutMeCategory({
		name: 'Test Category for Edit 2',
	})

	const initialSection = await insertNewAboutMe({
		userId: user.id,
		name: faker.lorem.words(3),
		content: faker.lorem.paragraph(),
		description: faker.lorem.sentence(),
		aboutMeCategoryId: category.id,
	})

	await page.goto(`/dashboard/about/${initialSection.id}`)

	// Navigate to the edit page for this section
	await page.getByRole('link', { name: 'Edit' }).click()
	await expect(page).toHaveURL(`/dashboard/about/${initialSection.id}/edit`)

	// Verify the data is displayed in the edit form
	await expect(page.getByLabel('Name')).toHaveValue(initialSection.name)
	await expect(page.getByLabel('Content')).toHaveValue(initialSection.content)
	await expect(page.getByLabel('Description (Optional)')).toHaveValue(
		initialSection.description ?? '',
	)
	const categoryValue = await page
		.getByRole('combobox', { name: 'Category' })
		.textContent()
	await expect(categoryValue).toBe(category.name)

	// Edit the section
	const updatedName = faker.lorem.words(3)
	const updatedContent = faker.lorem.paragraph()
	const updatedDescription = faker.lorem.sentence()
	await page.getByLabel('Name').clear()
	await page.getByLabel('Name').fill(updatedName)
	await page.getByLabel('Content').clear()
	await page.getByLabel('Content').fill(updatedContent)
	await page.getByLabel('Description (Optional)').clear()
	await page.getByLabel('Description (Optional)').fill(updatedDescription)
	await page.getByRole('combobox', { name: 'Category' }).click()
	await page.getByRole('option', { name: category2.name }).click()
	await page.getByRole('switch', { name: 'Published' }).click() // unpublish
	// Scroll to the bottom of the page to ensure all elements are visible
	await scrollDown(page, { mode: 'bottom' })
	await page.getByRole('button', { name: 'Save Changes' }).click()

	// Should redirect back to the view page after saving
	const viewPageRegex = new RegExp(`/dashboard/about/${initialSection.id}$`)
	await expect(page).toHaveURL(viewPageRegex)
	await expect(page.getByRole('heading', { name: updatedName })).toBeVisible()
	await expect(page.getByText(updatedContent)).toBeVisible()
	await expect(page.getByText(updatedDescription)).toBeVisible()
	await expect(page.getByText(category2.name)).toBeVisible()
	await expect(page.getByText('Draft')).toBeVisible()

	// Go back to list to ensure it's visible there too (optional sanity check)
	await page.getByRole('link', { name: 'Back to Abouts' }).click()
	await expect(page).toHaveURL('/dashboard/about')
	await expect(page.getByText(updatedName)).toBeVisible()
})

test('can delete about me section from list page', async ({
	page,
	login,
	insertNewUser,
	insertNewAboutMeCategory,
	insertNewAboutMe,
}) => {
	const user = await insertNewUser()
	await login({ id: user.id })
	const category = await insertNewAboutMeCategory({
		name: 'Test Category for Delete',
	})

	const sectionToDelete = await insertNewAboutMe({
		userId: user.id,
		name: `SectionToDelete ${faker.lorem.word()}`,
		content: faker.lorem.paragraph(),
		aboutMeCategoryId: category.id,
	})

	await page.goto('/dashboard/about')
	await expect(page.getByText(sectionToDelete.name)).toBeVisible()

	// Delete the section from the list page
	const row = page.getByRole('row').filter({ hasText: sectionToDelete.name })
	await row.getByRole('button', { name: 'Open menu' }).click()

	// Handle the confirmation dialog
	page.on('dialog', (dialog) => dialog.accept())
	await page.getByRole('button', { name: 'Delete' }).click()

	// Verify the section is deleted
	await expect(page.getByText(sectionToDelete.name)).not.toBeVisible()
})

test('can create about me category using dialog', async ({ page, login }) => {
	const userName = faker.person.firstName()
	await login({ name: userName })

	// Navigate to About page
	await page.goto('/dashboard/about')
	await expect(page).toHaveURL('/dashboard/about')

	// Click Create Category button in the Categories section
	const categoriesSection = page
		.locator('text=About Me Categories')
		.locator('..')
	await categoriesSection.getByRole('button', { name: 'New' }).click()

	// Wait for dialog to open
	await expect(page.getByRole('dialog')).toBeVisible()
	await expect(
		page.getByRole('heading', { name: 'Create Category' }),
	).toBeVisible()

	// Fill out the category form
	const categoryName = faker.lorem.words(2)
	const categoryDescription = faker.lorem.sentence()

	await page.getByLabel('Name').fill(categoryName)
	await page.getByLabel('Description (Optional)').fill(categoryDescription)

	// Submit the form
	await page.getByRole('button', { name: 'Create Category' }).click()

	// Wait for dialog to close and verify category appears in the list
	await expect(page.getByRole('dialog')).not.toBeVisible()
	await expect(categoriesSection.getByText(categoryName)).toBeVisible()
})

test('can edit about me category using dialog', async ({
	page,
	login,
	insertNewAboutMeCategory,
}) => {
	const userName = faker.person.firstName()
	await login({ name: userName })

	// Create a category to edit
	const category = await insertNewAboutMeCategory({
		name: faker.lorem.words(2),
		description: faker.lorem.sentence(),
	})

	// Navigate to About page
	await page.goto('/dashboard/about')

	// Edit the category by clicking on its name
	const categoriesSection = page
		.locator('text=About Me Categories')
		.locator('..')
	await categoriesSection.getByText(category.name).click()

	// Wait for edit dialog to open
	await expect(page.getByRole('dialog')).toBeVisible()
	await expect(
		page.getByRole('heading', { name: 'Edit Category' }),
	).toBeVisible()

	// Update the category name
	const updatedCategoryName = faker.lorem.words(2)
	await page.getByLabel('Name').clear()
	await page.getByLabel('Name').fill(updatedCategoryName)
	await page.getByRole('button', { name: 'Save Changes' }).click()

	// Wait for dialog to close and verify updated name appears
	await expect(page.getByRole('dialog')).not.toBeVisible()
	await expect(categoriesSection.getByText(updatedCategoryName)).toBeVisible()
})

test('can delete about me category using dialog', async ({
	page,
	login,
	insertNewAboutMeCategory,
}) => {
	const userName = faker.person.firstName()
	await login({ name: userName })

	// Create a category to delete
	const category = await insertNewAboutMeCategory({
		name: faker.lorem.words(2),
		description: faker.lorem.sentence(),
	})

	// Navigate to About page
	await page.goto('/dashboard/about')

	// Delete the category using the dropdown menu
	const categoriesSection = page
		.locator('text=About Me Categories')
		.locator('..')
	const categoryRow = categoriesSection
		.getByRole('row')
		.filter({ hasText: category.name })
	await categoryRow.getByRole('button', { name: 'Open menu' }).click()

	// Handle the confirmation dialog
	page.on('dialog', (dialog) => dialog.accept())
	await page.getByRole('button', { name: 'Delete' }).click()

	// Verify the category is deleted
	await expect(categoriesSection.getByText(category.name)).not.toBeVisible()
})

test('displays existing about me sections from list page', async ({
	page,
	login,
	insertNewAboutMe,
	insertNewAboutMeCategory,
}) => {
	const user = await login()

	// Create two categories
	const category1 = await insertNewAboutMeCategory({
		name: 'Background',
		description: 'Professional background',
	})

	const category2 = await insertNewAboutMeCategory({
		name: 'Education',
		description: 'Academic history',
	})

	// Create two about me sections
	const aboutMe1 = await insertNewAboutMe({
		userId: user.id,
		name: 'Software Engineer',
		content: 'My experience as a developer',
		aboutMeCategoryId: category1.id,
	})

	const aboutMe2 = await insertNewAboutMe({
		userId: user.id,
		name: 'University Degree',
		content: 'My educational background',
		aboutMeCategoryId: category2.id,
	})

	await page.goto('/dashboard/about')
	await expect(page).toHaveURL('/dashboard/about')

	// Verify about me sections are visible in the about me section with specific column reference
	const aboutMeSection = page.locator('#about-me-sections')
	const aboutMeTable = aboutMeSection.locator('table')
	const aboutMeExpectedHeaders = [
		'Name',
		'Content',
		'Category',
		'Created At',
		'Updated At',
		'Published',
	]
	await verifyTableHeaders(aboutMeTable, aboutMeExpectedHeaders, {
		hasSelectColumn: true,
		hasActionsColumn: true,
	})

	// createdat desc
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

	const categoriesSection = page.locator('#about-me-categories')
	const categoriesTable = categoriesSection.locator('table')
	const categoriesExpectedHeaders = [
		'Name',
		'Description',
		'Created At',
		'Updated At',
		'Published',
	]
	await verifyTableHeaders(categoriesTable, categoriesExpectedHeaders, {
		hasSelectColumn: true,
		hasActionsColumn: true,
	})

	// createdat desc
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

test('toggles "Published" status for an About Me Section from list page', async ({
	page,
	login,
	insertNewUser,
	insertNewAboutMe,
	insertNewAboutMeCategory,
}) => {
	const user = await insertNewUser()
	await login({ id: user.id })
	const category = await insertNewAboutMeCategory({
		name: 'Professional',
	})
	await page.goto('/dashboard/about')

	// Create a section to toggle using the new helper
	const sectionName = `PublishToggle Section ${faker.lorem.word()}`
	await insertNewAboutMe({
		userId: user.id,
		name: sectionName,
		content: faker.lorem.paragraph(),
		aboutMeCategoryId: category.id,
		isPublished: true,
	})

	// Reload the page to see the newly inserted section
	await page.reload()

	// Locate the section row and its switch
	const sectionRow = page.getByRole('row').filter({ hasText: sectionName })
	const publishSwitch = sectionRow.getByRole('switch', {
		name: `Toggle publish status for ${sectionName}`,
	})

	// Default should be published (true) as set by the helper
	await expect(publishSwitch).toBeChecked()

	// Toggle to unpublished
	await publishSwitch.click()
	await expect(publishSwitch).not.toBeChecked()
	await page.reload() // Verify persistence
	const reloadedSwitchUnchecked = page
		.getByRole('row')
		.filter({ hasText: sectionName })
		.getByRole('switch')
	await expect(reloadedSwitchUnchecked).not.toBeChecked()

	// Toggle back to published
	await reloadedSwitchUnchecked.click()
	await expect(reloadedSwitchUnchecked).toBeChecked()
	await page.reload() // Verify persistence
	const reloadedSwitchChecked = page
		.getByRole('row')
		.filter({ hasText: sectionName })
		.getByRole('switch')
	await expect(reloadedSwitchChecked).toBeChecked()
})

test('validates About Me Section creation and editing', async ({
	page,
	login,
	insertNewAboutMeCategory,
}) => {
	const userName = faker.person.firstName()
	await login({ name: userName })

	const category = await insertNewAboutMeCategory({
		name: 'Professional',
	})

	// Test creation validation
	await page.goto('/dashboard/about/new')
	await page.getByRole('button', { name: 'Create About Me' }).click()
	await expect(
		page.locator('#about-editor-name-error').getByText('Required'),
	).toBeVisible()
	await expect(
		page.locator('#about-editor-content-error').getByText('Required'),
	).toBeVisible()
	const categoryError = page
		.getByRole('combobox', { name: 'Category' })
		.locator('xpath=./following-sibling::div')
	await expect(categoryError).toHaveText('Category is required')

	await page.getByLabel('Name').fill(faker.lorem.words(2))
	await page.getByRole('button', { name: 'Create About Me' }).click()
	await expect(
		page.locator('#about-editor-name-error').getByText('Required'),
	).not.toBeVisible()
	await expect(
		page.locator('#about-editor-content-error').getByText('Required'),
	).toBeVisible()
	await expect(categoryError).toHaveText('Category is required')

	await page.getByLabel('Content').fill(faker.lorem.paragraph())
	await page.getByRole('button', { name: 'Create About Me' }).click()
	await expect(
		page.locator('#about-editor-content-error').getByText('Required'),
	).not.toBeVisible()
	await expect(categoryError).toHaveText('Category is required')

	// Create a section for edit validation
	await page.getByRole('combobox', { name: 'Category' }).click()
	await page.getByRole('option', { name: category.name }).click()
	await page.getByRole('button', { name: 'Create About Me' }).click() // Redirects to view

	await page.getByRole('link', { name: 'Edit' }).click()
	await expect(page).toHaveURL(/\/dashboard\/about\/[a-zA-Z0-9]+\/edit/)

	// Test editing validation
	await page.getByLabel('Name').clear()
	await page.getByRole('button', { name: 'Save Changes' }).click()
	await expect(
		page.locator('#about-editor-name-error').getByText('Required'),
	).toBeVisible()

	await page.getByLabel('Name').fill(faker.lorem.words(2)) // Restore name
	await page.getByLabel('Content').clear()
	await page.getByRole('button', { name: 'Save Changes' }).click()
	await expect(
		page.locator('#about-editor-content-error').getByText('Required'),
	).toBeVisible()
})

test('deletes About Me Section from its Edit Page', async ({
	page,
	login,
	insertNewAboutMeCategory,
}) => {
	const userName = faker.person.firstName()
	await login({ name: userName })
	const category = await insertNewAboutMeCategory({
		name: 'Professional',
	})
	await page.goto('/dashboard/about')

	// Create a section
	const sectionName = `DeleteFromEdit ${faker.lorem.word()}`
	await page.getByRole('link', { name: 'New' }).click()
	await page.getByLabel('Name').fill(sectionName)
	await page.getByLabel('Content').fill(faker.lorem.paragraph())
	await page.getByRole('combobox', { name: 'Category' }).click()
	await page.getByRole('option', { name: category.name }).click()
	await page.getByRole('button', { name: 'Create About Me' }).click() // Redirects to view

	await page.getByRole('link', { name: 'Edit' }).click()
	await expect(page).toHaveURL(/\/dashboard\/about\/[a-zA-Z0-9]+\/edit/)

	// Delete from edit page
	page.on('dialog', (dialog) => dialog.accept())
	await page.getByRole('button', { name: 'Delete' }).click()

	await expect(page).toHaveURL('/dashboard/about')
	const aboutMeSection = page.locator('#about-me-sections')
	await expect(aboutMeSection.getByText(sectionName)).not.toBeVisible()
})

test('filters About Me Sections on the list page', async ({
	page,
	login,
	insertNewAboutMeCategory,
	insertNewAboutMe,
}) => {
	const userName = faker.person.firstName()
	const user = await login({ name: userName })
	const category1 = await insertNewAboutMeCategory({
		name: 'Professional',
	})
	const category2 = await insertNewAboutMeCategory({
		name: 'Personal',
	})

	// Create two sections
	const section1 = await insertNewAboutMe({
		userId: user.id,
		aboutMeCategoryId: category1.id,
	})

	const section2 = await insertNewAboutMe({
		userId: user.id,
		aboutMeCategoryId: category2.id,
	})
	console.log(section1, section2)

	await page.goto('/dashboard/about')

	// Filter by content
	// first 10 characters of section1.content
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

test('toggles "Published" status for an About Me Category from list page', async ({
	page,
	login,
	insertNewUser,
	insertNewAboutMeCategory,
}) => {
	const user = await insertNewUser()
	await login({ id: user.id })
	await page.goto('/dashboard/about')

	const categoryName = `PublishToggle Cat ${faker.lorem.word()}`
	// Create a category to toggle using the new helper
	await insertNewAboutMeCategory({
		name: categoryName,
		isPublished: true,
	})

	// Reload the page to see the newly inserted category
	await page.reload()

	// Locate the category row and its switch
	const categoryRow = page.getByRole('row').filter({ hasText: categoryName })
	// The label for the switch in the category section might be different, assuming similar pattern
	const publishSwitch = categoryRow.getByRole('switch', {
		name: `Toggle publish status for ${categoryName}`,
	})

	await expect(publishSwitch).toBeChecked() // Default should be published

	// Toggle to unpublished
	await publishSwitch.click()
	await expect(publishSwitch).not.toBeChecked()
	await page.reload()
	const reloadedSwitchUnchecked = page
		.getByRole('row')
		.filter({ hasText: categoryName })
		.getByRole('switch')
	await expect(reloadedSwitchUnchecked).not.toBeChecked()

	// Toggle back to published
	await reloadedSwitchUnchecked.click()
	await expect(reloadedSwitchUnchecked).toBeChecked()
	await page.reload()
	const reloadedSwitchChecked = page
		.getByRole('row')
		.filter({ hasText: categoryName })
		.getByRole('switch')
	await expect(reloadedSwitchChecked).toBeChecked()

	// Cleanup: Delete the category
	// The helper will automatically clean up the category after the test
})

test('validates About Me Category creation in dialog', async ({
	page,
	login,
}) => {
	const userName = faker.person.firstName()
	await login({ name: userName })
	await page.goto('/dashboard/about')

	const categoriesSection = page
		.locator('text=About Me Categories')
		.locator('..')
	await categoriesSection.getByRole('button', { name: 'New' }).click()

	await expect(page.getByRole('dialog')).toBeVisible()
	await page.getByRole('button', { name: 'Create Category' }).click() // Attempt submit with empty name

	await expect(
		page
			.getByRole('dialog')
			.locator('#about-category-editor-name-error')
			.getByText('Required'),
	).toBeVisible()
	await expect(page.getByRole('dialog')).toBeVisible() // Dialog should still be open

	// Close dialog
	await page.getByRole('button', { name: 'Cancel' }).click() // Or an X button if available
	await expect(page.getByRole('dialog')).not.toBeVisible()
})

test('deletion of Category also deletes its associated About Me Sections', async ({
	page,
	login,
	insertNewAboutMeCategory,
	insertNewAboutMe,
}) => {
	const userName = faker.person.firstName()
	const user = await login({ name: userName })

	const categoryToDelete = await insertNewAboutMeCategory({
		name: `CatToDelete ${faker.lorem.word()}`,
	})
	const aboutMeSectionToBeDeletedByCategory = await insertNewAboutMe({
		userId: user.id,
		aboutMeCategoryId: categoryToDelete.id,
	})

	await page.goto('/dashboard/about')

	await expect(
		aboutMeSection(page).getByText(categoryToDelete.name),
	).toBeVisible()
	await expect(
		categoriesSection(page).getByText(categoryToDelete.name),
	).toBeVisible()
	await expect(
		aboutMeSection(page).getByText(aboutMeSectionToBeDeletedByCategory.name),
	).toBeVisible()

	// 3. Delete "CategoryToDelete"
	const categoryRow = page
		.getByRole('row')
		.filter({ hasText: categoryToDelete.name })
	await categoryRow
		.getByRole('button', { name: 'Open about category menu' })
		.click()
	page.on('dialog', (dialog) => dialog.accept()) // Accepts the "are you sure? this will delete sections"
	await page.getByRole('button', { name: 'Delete' }).click()

	// 4. Assertions
	await expect(
		aboutMeSection(page).getByText(categoryToDelete.name),
	).not.toBeVisible()
	await expect(
		categoriesSection(page).getByText(categoryToDelete.name),
	).not.toBeVisible()
	await expect(
		aboutMeSection(page).getByText(aboutMeSectionToBeDeletedByCategory.name),
	).not.toBeVisible()
})

test('filters About Me Categories on the list page', async ({
	page,
	login,
	insertNewAboutMeCategory,
}) => {
	const userName = faker.person.firstName()
	await login({ name: userName })

	const cat1 = await insertNewAboutMeCategory({
		name: `FilterCat1 ${faker.lorem.word()}`,
		description: `UniqueDesc1 ${faker.string.uuid()}`,
	})
	const cat2 = await insertNewAboutMeCategory({
		name: `FilterCat2 ${faker.lorem.word()}`,
		description: `UniqueDesc2 ${faker.string.uuid()}`,
	})

	await page.goto('/dashboard/about')

	// Filter by name
	await page.getByPlaceholder('Filter name...').fill(cat1.name)
	await expect(page.getByText(cat1.name)).toBeVisible()
	await expect(page.getByText(cat2.name)).not.toBeVisible()

	// Filter by description
	await page.getByPlaceholder('Filter name...').clear()
	await page
		.getByPlaceholder('Filter description...')
		.fill(cat2.description ?? '')
	await expect(page.getByText(cat1.name)).not.toBeVisible()
	await expect(page.getByText(cat2.name)).toBeVisible()
})

test('non-published categories are not available for selection', async ({
	page,
	login,
	insertNewAboutMeCategory,
}) => {
	const userName = faker.person.firstName()
	await login({ name: userName })

	const publishedCat = await insertNewAboutMeCategory({
		name: `PublishedCat ${faker.lorem.word()}`,
		isPublished: true,
	})
	const unpublishedCat = await insertNewAboutMeCategory({
		name: `UnpublishedCat ${faker.lorem.word()}`,
		isPublished: false,
	})

	await page.goto('/dashboard/about')
	// Navigate to create section page
	await aboutMeSection(page).getByRole('link', { name: 'New' }).click()
	await page.getByRole('combobox', { name: 'Category' }).click()
	await expect(
		page.getByRole('option', { name: publishedCat.name }),
	).toBeVisible()
	await expect(
		page.getByRole('option', { name: unpublishedCat.name }),
	).not.toBeVisible()
	await page.keyboard.press('Escape') // Close combobox

	// Create a section with PublishedCat
	const sectionName = `SectionWithPubCat ${faker.lorem.word()}`
	await page.getByLabel('Name').fill(sectionName)
	await page.getByLabel('Content').fill(faker.lorem.paragraph())
	await page.getByRole('combobox', { name: 'Category' }).click()
	await page.getByRole('option', { name: publishedCat.name }).click()
	await page.getByRole('button', { name: 'Create About Me' }).click() // to view page

	// Navigate to edit page of this section
	await page.getByRole('link', { name: 'Edit' }).click()
	await page.getByRole('combobox', { name: 'Category' }).click()
	await expect(
		page.getByRole('option', { name: publishedCat.name }),
	).toBeVisible()
	await expect(
		page.getByRole('option', { name: unpublishedCat.name }),
	).not.toBeVisible()
	await page.keyboard.press('Escape')

	// Cleanup
	await page.goto('/dashboard/about')
	const pubCatRow = categoriesSection(page)
		.getByRole('row')
		.filter({ hasText: publishedCat.name })
	await pubCatRow
		.getByRole('button', { name: 'Open about category menu' })
		.click()
	page.once('dialog', (dialog) => dialog.accept())
	await page.getByRole('button', { name: 'Delete' }).click()

	const unpubCatRow = categoriesSection(page)
		.getByRole('row')
		.filter({ hasText: unpublishedCat.name })
	await unpubCatRow
		.getByRole('button', { name: 'Open about category menu' })
		.click()
	page.once('dialog', (dialog) => dialog.accept())
	await page.getByRole('button', { name: 'Delete' }).click()
	// Section will be auto-deleted with category if cascade delete works, or delete manually
})

test('editing section whose category becomes unpublished', async ({
	page,
	login,
}) => {
	const userName = faker.person.firstName()
	await login({ name: userName })
	await page.goto('/dashboard/about')

	const catXName = `CatXToUnpublish ${faker.lorem.word()}`
	const sectionYName = `SectionYWithCatX ${faker.lorem.word()}`

	// Create CatX (published)
	const categoriesSection = page
		.locator('text=About Me Categories')
		.locator('..')
	await categoriesSection.getByRole('button', { name: 'Create' }).click()
	await page.getByLabel('Name').fill(catXName)
	await page.getByRole('button', { name: 'Create Category' }).click()

	// Create SectionY and assign to CatX
	await page.getByRole('link', { name: 'New' }).click()
	await page.getByLabel('Name').fill(sectionYName)
	await page.getByLabel('Content').fill(faker.lorem.paragraph())
	await page.getByRole('combobox', { name: 'Category' }).click()
	await page.getByRole('option', { name: catXName }).click()
	await page.getByRole('button', { name: 'Create About Me' }).click() // to view
	const sectionId = page.url().split('/').pop()
	await page.getByRole('link', { name: 'Back to Abouts' }).click()

	// Unpublish CatX
	const catXRow = page.getByRole('row').filter({ hasText: catXName })
	await catXRow.getByRole('switch').click()
	await page.reload()

	// Navigate to edit SectionY
	await page.goto(`/dashboard/about/${sectionId}/edit`)

	// Assert: Category select field shows CatX, but CatX is not in dropdown options
	// The value of the select might be the ID, so we check the text content of the selected item if possible
	// For Playwright, getByRole('combobox').inputValue() or .textContent() might give the displayed text
	await expect(page.getByRole('combobox', { name: 'Category' })).toHaveValue(
		catXName.toLowerCase(),
	) // Or check ID if value is ID

	await page.getByRole('combobox', { name: 'Category' }).click()
	await expect(page.getByRole('option', { name: catXName })).not.toBeVisible()
	await expect(page.getByRole('option', { name: 'Professional' })).toBeVisible() // Assuming Professional is still an option
	await page.keyboard.press('Escape')

	// Attempt to save without changing category
	const newContent = faker.lorem.sentence()
	await page.getByLabel('Content').clear()
	await page.getByLabel('Content').fill(newContent)
	await page.getByRole('button', { name: 'Save Changes' }).click()

	// Assert save is successful (redirects to view page)
	await expect(page).toHaveURL(`/dashboard/about/${sectionId}`)
	await expect(
		page.locator('text=Content').locator('xpath=following-sibling::*[1]'),
	).toHaveText(newContent)
	await expect(
		page.locator('text=Category').locator('xpath=following-sibling::*[1]'),
	).toHaveText(catXName) // Still associated

	// Cleanup
	await page.goto('/dashboard/about')
	// Delete section first if category deletion doesn't cascade or if you want to be sure
	const sectionRow = page.getByRole('row').filter({ hasText: sectionYName })
	if (await sectionRow.isVisible()) {
		await sectionRow.getByRole('button', { name: 'Open menu' }).click()
		page.once('dialog', (d) => d.accept())
		await page.getByRole('button', { name: 'Delete' }).click()
	}

	const catXRowToDel = page.getByRole('row').filter({ hasText: catXName })
	await catXRowToDel.getByRole('button', { name: 'Open menu' }).click()
	page.once('dialog', (d) => d.accept())
	await page.getByRole('button', { name: 'Delete' }).click()
})
