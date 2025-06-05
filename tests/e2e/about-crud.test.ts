import { faker } from '@faker-js/faker'
import { expect, test } from '#tests/playwright-utils.ts'

test('can create, view, edit, and delete about me sections', async ({
	page,
	login,
	insertNewAboutMeCategory,
}) => {
	const userName = faker.person.firstName()
	await login({ name: userName })

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
	const category = await insertNewAboutMeCategory()
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
	const sectionId = page.url().split('/').pop()

	// Verify the data is displayed on the view page
	await expect(page.getByRole('heading', { name: sectionName })).toBeVisible()
	await expect(page.getByText('Content')).toBeVisible()
	await expect(page.getByText(sectionContent)).toBeVisible()
	await expect(page.getByText('Description')).toBeVisible()
	await expect(page.getByText(sectionDescription)).toBeVisible()
	await expect(page.getByText('Category')).toBeVisible()
	await expect(page.getByText(categoryToSelect)).toBeVisible()

	// Navigate to the edit page for this section
	await page.getByRole('link', { name: 'Edit' }).click()
	await expect(page).toHaveURL(`/dashboard/about/${sectionId}/edit`)

	// Verify the data is displayed in the edit form
	await expect(page.getByLabel('Name')).toHaveValue(sectionName)
	await expect(page.getByLabel('Content')).toHaveValue(sectionContent)
	await expect(page.getByLabel('Description (Optional)')).toHaveValue(
		sectionDescription,
	)
	await expect(page.getByRole('combobox', { name: 'Category' })).toHaveValue(
		categoryToSelect.toLowerCase(),
	) // combobox value might be the ID

	// Edit the section
	const updatedName = faker.lorem.words(3)
	await page.getByLabel('Name').clear()
	await page.getByLabel('Name').fill(updatedName)
	await page.getByRole('button', { name: 'Save Changes' }).click()

	// Should redirect back to the view page after saving
	await expect(page).toHaveURL(viewPageRegex)
	await expect(page.getByRole('heading', { name: updatedName })).toBeVisible()

	// Go back to list
	await page.getByRole('link', { name: 'Back to Abouts' }).click()
	await expect(page).toHaveURL('/dashboard/about')

	// Verify the updated name appears in the list
	await expect(page.getByText(updatedName)).toBeVisible()

	// Delete the section from the list page
	const row = page.getByRole('row').filter({ hasText: updatedName })
	await row.getByRole('button', { name: 'Open menu' }).click()

	// Handle the confirmation dialog
	page.on('dialog', (dialog) => dialog.accept())
	await page.getByRole('button', { name: 'Delete' }).click()

	// Verify the section is deleted
	await expect(page.getByText(updatedName)).not.toBeVisible()
})

test('can create, edit, and delete about me categories using dialogs', async ({
	page,
	login,
}) => {
	const userName = faker.person.firstName()
	await login({ name: userName })

	// Navigate to About page
	await page.goto('/dashboard/about')
	await expect(page).toHaveURL('/dashboard/about')

	// Click Create Category button in the Categories section
	const categoriesSection = page
		.locator('text=About Me Categories')
		.locator('..')
	await categoriesSection.getByRole('button', { name: 'Create' }).click()

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
	await expect(page.getByText(categoryName)).toBeVisible()

	// Edit the category by clicking on its name
	await page.getByText(categoryName).click()

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
	await expect(page.getByText(updatedCategoryName)).toBeVisible()

	// Delete the category using the dropdown menu
	const categoryRow = page
		.getByRole('row')
		.filter({ hasText: updatedCategoryName })
	await categoryRow.getByRole('button', { name: 'Open menu' }).click()

	// Handle the confirmation dialog
	page.on('dialog', (dialog) => dialog.accept())
	await page.getByRole('button', { name: 'Delete' }).click()

	// Verify the category is deleted
	await expect(page.getByText(updatedCategoryName)).not.toBeVisible()
})

test('displays existing about me sections from seed data', async ({
	page,
	login,
}) => {
	// Login as the seeded admin user
	await login({ username: 'pat' })

	await page.goto('/dashboard/about')
	await expect(page).toHaveURL('/dashboard/about')

	// Check for seeded content
	await expect(page.getByText('Professional')).toBeVisible()
	await expect(page.getByText('Personal')).toBeVisible()
})

test('toggles "Published" status for an About Me Section from list page', async ({
	page,
	login,
	insertNewUser,
	insertNewAboutMe,
}) => {
	const user = await insertNewUser()
	await login({ id: user.id })
	await page.goto('/dashboard/about')

	// Create a section to toggle using the new helper
	const sectionName = `PublishToggle Section ${faker.lorem.word()}`
	const aboutMeSection = await insertNewAboutMe({
		userId: user.id,
		name: sectionName,
		content: faker.lorem.paragraph(),
		aboutMeCategoryName: 'Professional', // Assumes Professional category exists or will be created by helper
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

	// Cleanup: Delete the section
	// The helper will automatically clean up the section after the test
})

test('validates About Me Section creation and editing', async ({
	page,
	login,
}) => {
	const userName = faker.person.firstName()
	await login({ name: userName })

	// Test creation validation
	await page.goto('/dashboard/about/new')
	await page.getByRole('button', { name: 'Create About Me' }).click()
	await expect(page.getByText('Name is required')).toBeVisible() // Assuming error messages
	await expect(page.getByText('Content is required')).toBeVisible()
	await expect(page.getByText('Category is required')).toBeVisible()

	await page.getByLabel('Name').fill(faker.lorem.words(2))
	await page.getByRole('button', { name: 'Create About Me' }).click()
	await expect(page.getByText('Name is required')).not.toBeVisible()
	await expect(page.getByText('Content is required')).toBeVisible()
	await expect(page.getByText('Category is required')).toBeVisible()

	await page.getByLabel('Content').fill(faker.lorem.paragraph())
	await page.getByRole('button', { name: 'Create About Me' }).click()
	await expect(page.getByText('Content is required')).not.toBeVisible()
	await expect(page.getByText('Category is required')).toBeVisible()

	// Create a section for edit validation
	await page.getByRole('combobox', { name: 'Category' }).click()
	await page.getByRole('option', { name: 'Professional' }).click()
	await page.getByRole('button', { name: 'Create About Me' }).click() // Redirects to view
	const editUrl = page.url() + '/edit'
	await page.goto(editUrl)

	// Test editing validation
	await page.getByLabel('Name').clear()
	await page.getByRole('button', { name: 'Save Changes' }).click()
	await expect(page.getByText('Name is required')).toBeVisible()

	await page.getByLabel('Name').fill(faker.lorem.words(2)) // Restore name
	await page.getByLabel('Content').clear()
	await page.getByRole('button', { name: 'Save Changes' }).click()
	await expect(page.getByText('Content is required')).toBeVisible()

	// Cleanup: Go back and delete (optional, as it might get deleted by other tests or simply left)
	await page.goto('/dashboard/about')
})

test('deletes About Me Section from its Edit Page', async ({ page, login }) => {
	const userName = faker.person.firstName()
	await login({ name: userName })
	await page.goto('/dashboard/about')

	// Create a section
	const sectionName = `DeleteFromEdit ${faker.lorem.word()}`
	await page.getByRole('link', { name: 'New' }).click()
	await page.getByLabel('Name').fill(sectionName)
	await page.getByLabel('Content').fill(faker.lorem.paragraph())
	await page.getByRole('combobox', { name: 'Category' }).click()
	await page.getByRole('option', { name: 'Professional' }).click()
	await page.getByRole('button', { name: 'Create About Me' }).click() // Redirects to view

	const editUrl = page.url() + '/edit'
	await page.goto(editUrl)

	// Delete from edit page
	page.on('dialog', (dialog) => dialog.accept())
	await page.getByRole('button', { name: 'Delete' }).click()

	await expect(page).toHaveURL('/dashboard/about')
	await expect(page.getByText(sectionName)).not.toBeVisible()
})

test('filters About Me Sections on the list page', async ({ page, login }) => {
	const userName = faker.person.firstName()
	await login({ name: userName })
	await page.goto('/dashboard/about')

	const uniqueContent1 = `UniqueSectionContent1 ${faker.string.uuid()}`
	const sectionName1 = `FilterSec1 ${faker.lorem.word()}`
	const uniqueContent2 = `UniqueSectionContent2 ${faker.string.uuid()}`
	const sectionName2 = `FilterSec2 ${faker.lorem.word()}`
	const category1 = 'Professional' // Seeded
	const category2 = 'Personal' // Seeded

	// Create two sections
	await page.getByRole('link', { name: 'New' }).click()
	await page.getByLabel('Name').fill(sectionName1)
	await page.getByLabel('Content').fill(uniqueContent1)
	await page.getByRole('combobox', { name: 'Category' }).click()
	await page.getByRole('option', { name: category1 }).click()
	await page.getByRole('button', { name: 'Create About Me' }).click()
	await page.getByRole('link', { name: 'Back to Abouts' }).click()

	await page.getByRole('link', { name: 'New' }).click()
	await page.getByLabel('Name').fill(sectionName2)
	await page.getByLabel('Content').fill(uniqueContent2)
	await page.getByRole('combobox', { name: 'Category' }).click()
	await page.getByRole('option', { name: category2 }).click()
	await page.getByRole('button', { name: 'Create About Me' }).click()
	await page.getByRole('link', { name: 'Back to Abouts' }).click()

	// Filter by content
	await page.getByPlaceholder('Filter content...').fill(uniqueContent1)
	await expect(page.getByText(sectionName1)).toBeVisible()
	await expect(page.getByText(sectionName2)).not.toBeVisible()

	// Filter by category
	await page.getByPlaceholder('Filter content...').clear()
	await page.getByPlaceholder('Filter category...').fill(category2) // Assuming this input exists and works by text
	await expect(page.getByText(sectionName1)).not.toBeVisible()
	await expect(page.getByText(sectionName2)).toBeVisible()

	// Cleanup
	const row1 = page.getByRole('row').filter({ hasText: sectionName1 })
	await row1.getByRole('button', { name: 'Open menu' }).click()
	page.once('dialog', (dialog) => dialog.accept())
	await page.getByRole('button', { name: 'Delete' }).click()

	const row2 = page.getByRole('row').filter({ hasText: sectionName2 })
	await row2.getByRole('button', { name: 'Open menu' }).click()
	page.once('dialog', (dialog) => dialog.accept())
	await page.getByRole('button', { name: 'Delete' }).click()
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
	await categoriesSection.getByRole('button', { name: 'Create' }).click()

	await expect(page.getByRole('dialog')).toBeVisible()
	await page.getByRole('button', { name: 'Create Category' }).click() // Attempt submit with empty name

	// Assuming error messages are like "Name is required"
	await expect(
		page.getByRole('dialog').getByText('Name is required'),
	).toBeVisible()
	await expect(page.getByRole('dialog')).toBeVisible() // Dialog should still be open

	// Close dialog
	await page.getByRole('button', { name: 'Cancel' }).click() // Or an X button if available
	await expect(page.getByRole('dialog')).not.toBeVisible()
})

test('deletion of Category also deletes its associated About Me Sections', async ({
	page,
	login,
}) => {
	const userName = faker.person.firstName()
	await login({ name: userName })
	await page.goto('/dashboard/about')

	// 1. Create a new category
	const categoryToDeleteName = `CatToDelete ${faker.lorem.word()}`
	const categoriesSection = page
		.locator('text=About Me Categories')
		.locator('..')
	await categoriesSection.getByRole('button', { name: 'Create' }).click()
	await page.getByLabel('Name').fill(categoryToDeleteName)
	await page.getByRole('button', { name: 'Create Category' }).click()
	await expect(page.getByText(categoryToDeleteName)).toBeVisible()

	// 2. Create a new "About Me Section" and assign it to "CategoryToDelete"
	const sectionInDeletedCategoryName = `SectionInDelCat ${faker.lorem.word()}`
	await page.getByRole('link', { name: 'New' }).click()
	await page.getByLabel('Name').fill(sectionInDeletedCategoryName)
	await page.getByLabel('Content').fill(faker.lorem.paragraph())
	await page.getByRole('combobox', { name: 'Category' }).click()
	await page.getByRole('option', { name: categoryToDeleteName }).click()
	await page.getByRole('button', { name: 'Create About Me' }).click()
	await page.getByRole('link', { name: 'Back to Abouts' }).click()
	await expect(page.getByText(sectionInDeletedCategoryName)).toBeVisible()

	// 3. Delete "CategoryToDelete"
	const categoryRow = page
		.getByRole('row')
		.filter({ hasText: categoryToDeleteName })
	await categoryRow.getByRole('button', { name: 'Open menu' }).click()
	page.on('dialog', (dialog) => dialog.accept()) // Accepts the "are you sure? this will delete sections"
	await page.getByRole('button', { name: 'Delete' }).click()

	// 4. Assertions
	await expect(page.getByText(categoryToDeleteName)).not.toBeVisible()
	await expect(page.getByText(sectionInDeletedCategoryName)).not.toBeVisible()
})

test('filters About Me Categories on the list page', async ({
	page,
	login,
}) => {
	const userName = faker.person.firstName()
	await login({ name: userName })
	await page.goto('/dashboard/about')

	const catName1 = `FilterCat1 ${faker.lorem.word()}`
	const catDesc1 = `UniqueDesc1 ${faker.string.uuid()}`
	const catName2 = `FilterCat2 ${faker.lorem.word()}`
	const catDesc2 = `UniqueDesc2 ${faker.string.uuid()}`

	// Create categories
	const categoriesSection = page
		.locator('text=About Me Categories')
		.locator('..')
	await categoriesSection.getByRole('button', { name: 'Create' }).click()
	await page.getByLabel('Name').fill(catName1)
	await page.getByLabel('Description (Optional)').fill(catDesc1)
	await page.getByRole('button', { name: 'Create Category' }).click()

	await categoriesSection.getByRole('button', { name: 'Create' }).click()
	await page.getByLabel('Name').fill(catName2)
	await page.getByLabel('Description (Optional)').fill(catDesc2)
	await page.getByRole('button', { name: 'Create Category' }).click()

	// Filter by name
	await page.getByPlaceholder('Filter name...').fill(catName1)
	await expect(page.getByText(catName1)).toBeVisible()
	await expect(page.getByText(catName2)).not.toBeVisible()

	// Filter by description
	await page.getByPlaceholder('Filter name...').clear()
	await page.getByPlaceholder('Filter description...').fill(catDesc2)
	await expect(page.getByText(catName1)).not.toBeVisible()
	await expect(page.getByText(catName2)).toBeVisible()

	// Cleanup
	const row1 = page.getByRole('row').filter({ hasText: catName1 })
	await row1.getByRole('button', { name: 'Open menu' }).click()
	page.once('dialog', (dialog) => dialog.accept())
	await page.getByRole('button', { name: 'Delete' }).click()

	const row2 = page.getByRole('row').filter({ hasText: catName2 })
	await row2.getByRole('button', { name: 'Open menu' }).click()
	page.once('dialog', (dialog) => dialog.accept())
	await page.getByRole('button', { name: 'Delete' }).click()
})

test('non-published categories are not available for selection', async ({
	page,
	login,
}) => {
	const userName = faker.person.firstName()
	await login({ name: userName })
	await page.goto('/dashboard/about')

	const publishedCatName = `PublishedCat ${faker.lorem.word()}`
	const unpublishedCatName = `UnpublishedCat ${faker.lorem.word()}`

	// Create PublishedCat
	const categoriesSection = page
		.locator('text=About Me Categories')
		.locator('..')
	await categoriesSection.getByRole('button', { name: 'Create' }).click()
	await page.getByLabel('Name').fill(publishedCatName)
	await page.getByRole('button', { name: 'Create Category' }).click()

	// Create UnpublishedCat
	await categoriesSection.getByRole('button', { name: 'Create' }).click()
	await page.getByLabel('Name').fill(unpublishedCatName)
	await page.getByRole('button', { name: 'Create Category' }).click()

	// Unpublish UnpublishedCat
	const unpublishedCatRow = page
		.getByRole('row')
		.filter({ hasText: unpublishedCatName })
	const publishSwitch = unpublishedCatRow.getByRole('switch')
	await publishSwitch.click() // unpublish
	await page.reload() // ensure it's saved

	// Navigate to create section page
	await page.getByRole('link', { name: 'New' }).click()
	await page.getByRole('combobox', { name: 'Category' }).click()
	await expect(
		page.getByRole('option', { name: publishedCatName }),
	).toBeVisible()
	await expect(
		page.getByRole('option', { name: unpublishedCatName }),
	).not.toBeVisible()
	await page.keyboard.press('Escape') // Close combobox

	// Create a section with PublishedCat
	const sectionName = `SectionWithPubCat ${faker.lorem.word()}`
	await page.getByLabel('Name').fill(sectionName)
	await page.getByLabel('Content').fill(faker.lorem.paragraph())
	await page.getByRole('combobox', { name: 'Category' }).click()
	await page.getByRole('option', { name: publishedCatName }).click()
	await page.getByRole('button', { name: 'Create About Me' }).click() // to view page

	// Navigate to edit page of this section
	await page.getByRole('link', { name: 'Edit' }).click()
	await page.getByRole('combobox', { name: 'Category' }).click()
	await expect(
		page.getByRole('option', { name: publishedCatName }),
	).toBeVisible()
	await expect(
		page.getByRole('option', { name: unpublishedCatName }),
	).not.toBeVisible()
	await page.keyboard.press('Escape')

	// Cleanup
	await page.goto('/dashboard/about')
	const pubCatRow = page.getByRole('row').filter({ hasText: publishedCatName })
	await pubCatRow.getByRole('button', { name: 'Open menu' }).click()
	page.once('dialog', (dialog) => dialog.accept())
	await page.getByRole('button', { name: 'Delete' }).click()

	const unpubCatRow = page
		.getByRole('row')
		.filter({ hasText: unpublishedCatName })
	await unpubCatRow.getByRole('button', { name: 'Open menu' }).click()
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
