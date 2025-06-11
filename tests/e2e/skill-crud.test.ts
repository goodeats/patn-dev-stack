import { faker } from '@faker-js/faker'
import {
	type SkillCategoryPlaywright,
	type SkillPlaywright,
	type UserPlaywright,
	expect,
	test,
	testDateToday,
} from '#tests/playwright-utils.ts'
import { DashboardSkillDetailsPOM } from '../pom/dashboard/skill-details-page.pom'
import {
	DashboardSkillCategoryEditorDialogPOM,
	DashboardSkillEditorPOM,
} from '../pom/dashboard/skill-editors.pom'
import { DashboardSkillListPOM } from '../pom/dashboard/skill-list-page.pom'

let user: UserPlaywright
let listPage: DashboardSkillListPOM
let detailsPage: DashboardSkillDetailsPOM
let editorPage: DashboardSkillEditorPOM
let categoryDialog: DashboardSkillCategoryEditorDialogPOM
let category: SkillCategoryPlaywright
let category2: SkillCategoryPlaywright
let categoryToDelete: SkillCategoryPlaywright
let initialSkill: SkillPlaywright
let skillToDelete: SkillPlaywright

let skillName: string
let skillDescription: string
let updatedName: string
let updatedDescription: string
let categoryName: string
let categoryDescription: string

test.describe('Skills', () => {
	test.beforeEach(async ({ page, login }) => {
		await login()
		listPage = new DashboardSkillListPOM(page)
		detailsPage = new DashboardSkillDetailsPOM(page)
	})

	test.describe('CRUD', () => {
		test.describe('can create a new skill', () => {
			test.beforeEach(async ({ insertNewSkillCategory }) => {
				category = await insertNewSkillCategory()
				skillName = faker.lorem.words(3)
				skillDescription = faker.lorem.sentence()
				await listPage.goto()
			})

			test('that is published', async () => {
				const editorPage = await listPage.createNewSkill()

				await editorPage.create({
					name: skillName,
					description: skillDescription,
					categoryName: category.name,
					isPublished: true,
				})

				await detailsPage.verifySkillDetails({
					name: skillName,
					description: skillDescription,
					category: category.name,
					status: 'Published',
				})
			})

			test('that is unpublished', async () => {
				const editorPage = await listPage.createNewSkill()

				await editorPage.create({
					name: skillName,
					description: skillDescription,
					categoryName: category.name,
					isPublished: false,
				})

				await detailsPage.verifySkillDetails({
					name: skillName,
					description: skillDescription,
					category: category.name,
					status: 'Draft',
				})
			})
		})

		test.describe('can edit an existing skill', () => {
			test.beforeEach(
				async ({ login, insertNewSkillCategory, insertNewSkill }) => {
					user = await login()
					category = await insertNewSkillCategory()
					category2 = await insertNewSkillCategory()
					initialSkill = await insertNewSkill({
						userId: user.id,
						skillCategoryId: category.id,
					})
					updatedName = faker.lorem.words(3)
					updatedDescription = faker.lorem.sentence()
				},
			)

			test('from the list page', async ({ page }) => {
				await listPage.goto()
				const editorPage = await listPage.skillsTable.edit(initialSkill.name)

				await expect(editorPage.nameInput).toHaveValue(initialSkill.name)

				await editorPage.update({
					name: updatedName,
					description: updatedDescription,
					categoryName: category2.name,
				})

				await expect(page).toHaveURL(`/dashboard/skills/${initialSkill.id}`)

				await detailsPage.verifySkillDetails({
					name: updatedName,
					description: updatedDescription,
					category: category2.name,
					status: 'Published',
				})
			})

			test('from the details page', async ({ page }) => {
				await detailsPage.goto(initialSkill.id)
				const editorPage = await detailsPage.edit()

				await expect(editorPage.nameInput).toHaveValue(initialSkill.name)

				const updatedName = faker.lorem.words(3)
				const updatedDescription = faker.lorem.sentence()

				await editorPage.update({
					name: updatedName,
					description: updatedDescription,
					categoryName: category2.name,
				})

				await expect(page).toHaveURL(`/dashboard/skills/${initialSkill.id}`)

				await detailsPage.verifySkillDetails({
					name: updatedName,
					description: updatedDescription,
					category: category2.name,
					status: 'Published',
				})
			})
		})

		test.describe('can toggle publish status', () => {
			test.beforeEach(
				async ({ login, insertNewSkillCategory, insertNewSkill }) => {
					user = await login()
					category = await insertNewSkillCategory()
					initialSkill = await insertNewSkill({
						userId: user.id,
						skillCategoryId: category.id,
						isPublished: true,
					})
				},
			)

			test('from the list page', async ({ page }) => {
				await listPage.goto()
				const publishSwitch = await listPage.skillsTable.getSwitch(
					initialSkill.name,
				)

				// Initially published
				await expect(publishSwitch).toBeChecked()

				// Toggle to unpublished
				await publishSwitch.click()
				await expect(publishSwitch).not.toBeChecked()

				// Verify persisted after reload
				await page.reload()
				await expect(
					await listPage.skillsTable.getSwitch(initialSkill.name),
				).not.toBeChecked()

				// Toggle back to published
				await listPage.skillsTable.toggleSwitch(initialSkill.name)
				await expect(
					await listPage.skillsTable.getSwitch(initialSkill.name),
				).toBeChecked()

				await page.reload()
				await expect(
					await listPage.skillsTable.getSwitch(initialSkill.name),
				).toBeChecked()
			})

			test('from the edit page', async ({}) => {
				await detailsPage.goto(initialSkill.id)
				const editorPage = await detailsPage.edit()

				// Initially published
				await expect(editorPage.publishSwitch).toBeChecked()

				// Toggle to unpublished
				await editorPage.publishSwitch.click()
				await editorPage.saveButton.click()

				await detailsPage.verifySkillDetails({
					name: initialSkill.name,
					description: initialSkill.description ?? '',
					category: category.name,
					status: 'Draft',
				})

				// Toggle back to published
				await detailsPage.edit()
				await editorPage.publishSwitch.click()
				await editorPage.saveButton.click()

				await detailsPage.verifySkillDetails({
					name: initialSkill.name,
					description: initialSkill.description ?? '',
					category: category.name,
					status: 'Published',
				})
			})
		})

		test.describe('can delete an existing skill', () => {
			test.beforeEach(async ({ login, insertNewSkill }) => {
				user = await login()
				skillToDelete = await insertNewSkill({ userId: user.id })
			})

			test('can be deleted from the list page', async ({ page }) => {
				await listPage.goto()
				await expect(page.getByText(skillToDelete.name)).toBeVisible()

				await listPage.skillsTable.delete(skillToDelete.name)

				await expect(await listPage.skillsSectionContainer).toBeVisible()
				await expect(page.getByText(skillToDelete.name)).not.toBeVisible()
			})

			test('can be deleted from its edit page', async ({ page }) => {
				const editorPage = new DashboardSkillEditorPOM(page)

				await editorPage.gotoEdit(skillToDelete.id)

				await editorPage.delete()

				await expect(page.getByText(skillToDelete.name)).not.toBeVisible()
			})
		})

		test('displays existing skills and categories on the main page', async ({
			login,
			insertNewSkill,
			insertNewSkillCategory,
		}) => {
			const user = await login()
			const category1 = await insertNewSkillCategory()
			const category2 = await insertNewSkillCategory()
			const skill1 = await insertNewSkill({
				userId: user.id,
				skillCategoryId: category1.id,
			})
			const skill2 = await insertNewSkill({
				userId: user.id,
				skillCategoryId: category2.id,
			})

			await listPage.goto()

			const skillsTable = listPage.skillsTable
			await skillsTable.verifyHeaders()
			await skillsTable.verifyData([
				[skill2.name, category2.name, testDateToday, testDateToday],
				[skill1.name, category1.name, testDateToday, testDateToday],
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
		test.beforeEach(async ({ page, login, insertNewSkillCategory }) => {
			user = await login({ name: faker.person.firstName() })
			category = await insertNewSkillCategory({
				name: 'Professional',
			})
			editorPage = new DashboardSkillEditorPOM(page)
		})

		test('validates Skill creation', async ({ page }) => {
			await editorPage.gotoNew()
			await editorPage.createButton.click()
			await editorPage.verifyRequiredErrors()

			await editorPage.nameInput.fill(faker.lorem.words(2))
			await editorPage.createButton.click()
			await editorPage.verifyRequiredNameError(false)
			await editorPage.verifyRequiredCategoryError()

			// Successfully create with valid data
			await editorPage.selectCategory(category.name)
			await editorPage.createButton.click()
			await expect(page).toHaveURL(/\/dashboard\/skills\/[a-zA-Z0-9]+$/)
		})

		test('validates Skill editing', async ({ page, insertNewSkill }) => {
			const skill = await insertNewSkill({
				userId: user.id,
				skillCategoryId: category.id,
			})
			const detailsPage = new DashboardSkillDetailsPOM(page)

			await detailsPage.goto(skill.id)
			await detailsPage.edit()

			// Test editing validation
			await editorPage.clearName()
			await editorPage.saveButton.click()
			await expect(editorPage.nameError).toBeVisible()

			await editorPage.nameInput.fill(faker.lorem.words(2)) // Restore name
		})
	})

	test.describe('List Page Functionality', () => {
		test('filters skills by category', async ({
			page,
			login,
			insertNewSkillCategory,
			insertNewSkill,
		}) => {
			const user = await login()
			const category1 = await insertNewSkillCategory()
			const category2 = await insertNewSkillCategory()
			const skill1 = await insertNewSkill({
				userId: user.id,
				skillCategoryId: category1.id,
			})
			const skill2 = await insertNewSkill({
				userId: user.id,
				skillCategoryId: category2.id,
			})

			await listPage.goto()

			// Filter by category
			await listPage.skillsTable.filterByCategory(category2.name)
			await expect(page.getByText(skill1.name)).not.toBeVisible()
			await expect(page.getByText(skill2.name)).toBeVisible()
		})
	})
})

test.describe('Skill Categories', () => {
	test.beforeEach(async ({ page, login }) => {
		await login()
		listPage = new DashboardSkillListPOM(page)
		categoryDialog = new DashboardSkillCategoryEditorDialogPOM(page)
		await listPage.goto()
	})

	test.describe('CRUD (via Dialog)', () => {
		test.beforeEach(async ({ page, login }) => {
			await login()
			listPage = new DashboardSkillListPOM(page)
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
			insertNewSkillCategory,
		}) => {
			const category = await insertNewSkillCategory()
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
			test.beforeEach(async ({ insertNewSkillCategory }) => {
				category = await insertNewSkillCategory({
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

		test('can be deleted', async ({ insertNewSkillCategory }) => {
			const category = await insertNewSkillCategory()
			await listPage.goto()
			await listPage.categoriesTable.delete(category.name)

			await expect(await listPage.categoriesSectionContainer).toBeVisible()
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
			insertNewSkillCategory,
		}) => {
			const category = await insertNewSkillCategory()
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
			insertNewSkillCategory,
		}) => {
			const cat1 = await insertNewSkillCategory({
				name: `FilterCat1 ${faker.lorem.word()}`,
				description: `UniqueDesc1 ${faker.string.uuid()}`,
			})
			const cat2 = await insertNewSkillCategory({
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
		insertNewSkillCategory,
	}) => {
		const category = await insertNewSkillCategory()
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

test.describe('Interactions between Skills and Categories', () => {
	test.beforeEach(async ({ page, login }) => {
		user = await login()
		listPage = new DashboardSkillListPOM(page)
	})

	test('deleting a category also deletes its associated skills', async ({
		insertNewSkillCategory,
		insertNewSkill,
	}) => {
		categoryToDelete = await insertNewSkillCategory()
		skillToDelete = await insertNewSkill({
			userId: user.id,
			skillCategoryId: categoryToDelete.id,
		})

		await listPage.goto()
		const skillRow = await listPage.skillsTable.getRow(skillToDelete.name)
		await expect(skillRow).toBeVisible()
		const categoryRow = await listPage.categoriesTable.getRow(
			categoryToDelete.name,
		)
		await expect(categoryRow).toBeVisible()

		await listPage.categoriesTable.delete(categoryToDelete.name)

		await expect(categoryRow).not.toBeVisible()
		await expect(skillRow).not.toBeVisible()
	})

	test('non-published categories are not available for selection in the skill editor', async ({
		page,
		insertNewSkillCategory,
		insertNewSkill,
	}) => {
		const publishedCat = await insertNewSkillCategory({ isPublished: true })
		const unpublishedCat = await insertNewSkillCategory({
			isPublished: false,
		})
		const skillWithPublishedCat = await insertNewSkill({
			userId: user.id,
			skillCategoryId: publishedCat.id,
		})
		const editorPage = new DashboardSkillEditorPOM(page)

		await listPage.goto()

		// Test on 'new skill' page
		await listPage.gotoNewSkill()
		await editorPage.openCategoryDropdown()
		await expect(editorPage.getCategoryOption(publishedCat.name)).toBeVisible()
		await expect(
			editorPage.getCategoryOption(unpublishedCat.name),
		).not.toBeVisible()
		await page.keyboard.press('Escape')

		// Test on 'edit skill' page
		await editorPage.gotoEdit(skillWithPublishedCat.id)
		await editorPage.openCategoryDropdown()
		await expect(editorPage.getCategoryOption(publishedCat.name)).toBeVisible()
		await expect(
			editorPage.getCategoryOption(unpublishedCat.name),
		).not.toBeVisible()
	})

	test('handles editing a skill whose category is no longer published', async ({
		page,
		insertNewSkillCategory,
		insertNewSkill,
	}) => {
		const categoryToUnpublish = await insertNewSkillCategory({
			isPublished: true,
		})
		const fallbackCategory = await insertNewSkillCategory({
			isPublished: true,
		})
		const skill = await insertNewSkill({
			userId: user.id,
			skillCategoryId: categoryToUnpublish.id,
		})
		const editorPage = new DashboardSkillEditorPOM(page)

		await listPage.goto()

		// Unpublish the category
		await listPage.categoriesTable.unpublish(categoryToUnpublish.name)
		const publishSwitch = await listPage.categoriesTable.getSwitch(
			categoryToUnpublish.name,
		)
		await expect(publishSwitch).not.toBeChecked()

		await editorPage.gotoEdit(skill.id)

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
		await expect(page).toHaveURL(`/dashboard/skills/${skill.id}`)
		await expect(page.getByText(fallbackCategory.name)).toBeVisible()
	})
})
