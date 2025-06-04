import { faker } from '@faker-js/faker'
import { expect, test } from '#tests/playwright-utils.ts'

test('can create, edit, and delete about me sections', async ({
	page,
	login,
}) => {
	const userName = faker.person.firstName()
	await login({ name: userName })

	// Navigate to About page
	await page.goto('/dashboard/about')
	await expect(page).toHaveURL('/dashboard/about')

	// Click Add Section button
	await page.getByRole('link', { name: 'Create' }).click()
	await expect(page).toHaveURL('/dashboard/about/new')

	// Fill out the form
	const sectionName = faker.lorem.words(3)
	const sectionContent = faker.lorem.paragraph()
	const sectionDescription = faker.lorem.sentence()

	await page.getByLabel('Name').fill(sectionName)
	await page.getByLabel('Content').fill(sectionContent)
	await page.getByLabel('Description (Optional)').fill(sectionDescription)

	// Select a category (assuming Professional exists from seed)
	await page.getByRole('combobox').click()
	await page.getByRole('option', { name: 'Professional' }).click()

	// Submit the form
	await page.getByRole('button', { name: 'Create Section' }).click()

	// Should redirect to edit page
	await expect(page).toHaveURL(/\/dashboard\/about\/[a-zA-Z0-9]+$/)

	// Verify the data is displayed
	await expect(page.getByRole('textbox', { name: 'Name' })).toHaveValue(
		sectionName,
	)
	await expect(page.getByRole('textbox', { name: 'Content' })).toHaveValue(
		sectionContent,
	)
	await expect(
		page.getByRole('textbox', { name: 'Description (Optional)' }),
	).toHaveValue(sectionDescription)

	// Edit the section
	const updatedName = faker.lorem.words(3)
	await page.getByLabel('Name').clear()
	await page.getByLabel('Name').fill(updatedName)
	await page.getByRole('button', { name: 'Save Changes' }).click()

	// Go back to list
	await page.getByRole('link', { name: 'Back to List' }).click()
	await expect(page).toHaveURL('/dashboard/about')

	// Verify the updated name appears in the list
	await expect(page.getByText(updatedName)).toBeVisible()

	// Delete the section
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
