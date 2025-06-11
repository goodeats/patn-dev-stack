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
	type DashboardSkillCategoryEditorDialogPOM,
	DashboardSkillEditorPOM,
} from '../pom/dashboard/skill-editors.pom'
import { DashboardSkillListPOM } from '../pom/dashboard/skill-list-page.pom'

let user: UserPlaywright
let listPage: DashboardSkillListPOM
let detailsPage: DashboardSkillDetailsPOM
let editorPage: DashboardSkillEditorPOM
let initialSkill: SkillPlaywright
let skillToDelete: SkillPlaywright

let skillName: string
let skillDescription: string
let updatedName: string
let updatedDescription: string

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
