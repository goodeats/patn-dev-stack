import { faker } from '@faker-js/faker'
import {
	type ProjectPlaywright,
	type UserPlaywright,
	expect,
	test,
	testDateToday,
} from '#tests/playwright-utils.ts'
import { DashboardProjectDetailsPOM } from '../pom/dashboard/project-details-page.pom'
import { DashboardProjectEditorPOM } from '../pom/dashboard/project-editors.pom'
import { DashboardProjectListPOM } from '../pom/dashboard/project-list-page.pom'

let user: UserPlaywright
let listPage: DashboardProjectListPOM
let detailsPage: DashboardProjectDetailsPOM
let editorPage: DashboardProjectEditorPOM
let initialProject: ProjectPlaywright
let projectToDelete: ProjectPlaywright

let projectTitle: string
let projectDescription: string
let updatedTitle: string
let updatedDescription: string

test.describe('Projects', () => {
	test.beforeEach(async ({ page, login }) => {
		await login()
		listPage = new DashboardProjectListPOM(page)
		detailsPage = new DashboardProjectDetailsPOM(page)
	})

	test.describe('CRUD', () => {
		test.describe('can create a new project', () => {
			test.beforeEach(async () => {
				projectTitle = faker.lorem.words(3)
				projectDescription = faker.lorem.sentence()
				await listPage.goto()
			})

			test('that is published', async () => {
				const editorPage = await listPage.createNewProject()

				await editorPage.create({
					title: projectTitle,
					description: projectDescription,
					isPublished: true,
				})

				await detailsPage.verifyProjectDetails({
					title: projectTitle,
					description: projectDescription,
					status: 'Published',
					skillsCount: 0,
					createdAt: testDateToday,
					updatedAt: testDateToday,
				})
			})

			test('that is unpublished', async () => {
				const editorPage = await listPage.createNewProject()

				await editorPage.create({
					title: projectTitle,
					description: projectDescription,
					isPublished: false,
				})

				await detailsPage.verifyProjectDetails({
					title: projectTitle,
					description: projectDescription,
					status: 'Draft',
					skillsCount: 0,
					createdAt: testDateToday,
					updatedAt: testDateToday,
				})
			})
		})

		test.describe('can edit an existing project', () => {
			test.beforeEach(async ({ login, insertNewProject }) => {
				user = await login()
				initialProject = await insertNewProject({
					userId: user.id,
				})
				updatedTitle = faker.lorem.words(3)
				updatedDescription = faker.lorem.sentence()
			})

			test('from the list page', async ({ page }) => {
				await listPage.goto()
				const editorPage = await listPage.projectsTable.edit(
					initialProject.title,
				)

				await expect(editorPage.titleInput).toHaveValue(initialProject.title)

				await editorPage.update({
					title: updatedTitle,
					description: updatedDescription,
				})

				await expect(page).toHaveURL(`/dashboard/projects/${initialProject.id}`)

				await detailsPage.verifyProjectDetails({
					title: updatedTitle,
					description: updatedDescription,
					status: 'Published',
					skillsCount: 0,
					createdAt: testDateToday,
					updatedAt: testDateToday,
				})
			})

			test('from the details page', async ({ page }) => {
				await detailsPage.goto(initialProject.id)
				const editorPage = await detailsPage.edit()

				await expect(editorPage.titleInput).toHaveValue(initialProject.title)

				const updatedTitle = faker.lorem.words(3)
				const updatedDescription = faker.lorem.sentence()

				await editorPage.update({
					title: updatedTitle,
					description: updatedDescription,
				})

				await expect(page).toHaveURL(`/dashboard/projects/${initialProject.id}`)

				await detailsPage.verifyProjectDetails({
					title: updatedTitle,
					description: updatedDescription,
					status: 'Published',
					skillsCount: 0,
					createdAt: testDateToday,
					updatedAt: testDateToday,
				})
			})
		})

		test.describe('can toggle publish status', () => {
			test.beforeEach(async ({ login, insertNewProject }) => {
				user = await login()
				initialProject = await insertNewProject({
					userId: user.id,
					isPublished: true,
				})
			})

			test('from the list page', async ({ page }) => {
				await listPage.goto()
				const publishSwitch = await listPage.projectsTable.getSwitch(
					initialProject.title,
				)

				// Initially published
				await expect(publishSwitch).toBeChecked()

				// Toggle to unpublished
				await publishSwitch.click()
				await expect(publishSwitch).not.toBeChecked()

				// Verify persisted after reload
				await page.reload()
				await expect(
					await listPage.projectsTable.getSwitch(initialProject.title),
				).not.toBeChecked()

				// Toggle back to published
				await listPage.projectsTable.toggleSwitch(initialProject.title)
				await expect(
					await listPage.projectsTable.getSwitch(initialProject.title),
				).toBeChecked()

				await page.reload()
				await expect(
					await listPage.projectsTable.getSwitch(initialProject.title),
				).toBeChecked()
			})

			test('from the edit page', async ({}) => {
				await detailsPage.goto(initialProject.id)
				const editorPage = await detailsPage.edit()

				// Initially published
				await expect(editorPage.publishSwitch).toBeChecked()

				// Toggle to unpublished
				await editorPage.publishSwitch.click()
				await editorPage.saveButton.click()

				await detailsPage.verifyProjectDetails({
					title: initialProject.title,
					description: initialProject.description ?? '',
					status: 'Draft',
					skillsCount: 0,
					createdAt: testDateToday,
					updatedAt: testDateToday,
				})

				// Toggle back to published
				await detailsPage.edit()
				await editorPage.publishSwitch.click()
				await editorPage.saveButton.click()

				await detailsPage.verifyProjectDetails({
					title: initialProject.title,
					description: initialProject.description ?? '',
					status: 'Published',
					skillsCount: 0,
					createdAt: testDateToday,
					updatedAt: testDateToday,
				})
			})
		})

		test.describe('can delete an existing project', () => {
			test.beforeEach(async ({ login, insertNewProject }) => {
				user = await login()
				projectToDelete = await insertNewProject({ userId: user.id })
			})

			test('can be deleted from the list page', async ({ page }) => {
				await listPage.goto()
				await expect(page.getByText(projectToDelete.title)).toBeVisible()

				await listPage.projectsTable.delete(projectToDelete.title)

				await expect(await listPage.projectsSectionContainer).toBeVisible()
				await expect(page.getByText(projectToDelete.title)).not.toBeVisible()
			})

			test('can be deleted from its edit page', async ({ page }) => {
				const editorPage = new DashboardProjectEditorPOM(page)

				await editorPage.gotoEdit(projectToDelete.id)

				await editorPage.delete()

				await expect(page.getByText(projectToDelete.title)).not.toBeVisible()
			})
		})

		test('displays existing projects on the main page', async ({
			login,
			insertNewProject,
		}) => {
			const user = await login()
			const project1 = await insertNewProject({
				userId: user.id,
			})
			const project2 = await insertNewProject({
				userId: user.id,
			})

			await listPage.goto()

			const projectsTable = listPage.projectsTable
			await projectsTable.verifyHeaders()
			await projectsTable.verifyData([
				[project2.title, testDateToday, testDateToday],
				[project1.title, testDateToday, testDateToday],
			])
		})
	})

	test.describe('Validation', () => {
		test.beforeEach(async ({ page, login }) => {
			user = await login({ name: faker.person.firstName() })
			editorPage = new DashboardProjectEditorPOM(page)
		})

		test('validates Project creation', async ({ page }) => {
			await editorPage.gotoNew()
			await editorPage.createButton.click()
			await editorPage.verifyRequiredErrors()

			await editorPage.titleInput.fill(faker.lorem.words(2))
			await editorPage.createButton.click()
			await editorPage.verifyRequiredTitleError(false)

			// Successfully create with valid data
			await editorPage.createButton.click()
			await expect(page).toHaveURL(/\/dashboard\/projects\/[a-zA-Z0-9]+$/)
		})

		test('validates Project editing', async ({ page, insertNewProject }) => {
			const project = await insertNewProject({
				userId: user.id,
			})
			const detailsPage = new DashboardProjectDetailsPOM(page)

			await detailsPage.goto(project.id)
			await detailsPage.edit()

			// Test editing validation
			await editorPage.clearTitle()
			await editorPage.saveButton.click()
			await expect(editorPage.titleError).toBeVisible()

			await editorPage.titleInput.fill(faker.lorem.words(2)) // Restore name
		})
	})

	test.describe('List Page Functionality', () => {
		test('filters projects by title', async ({
			page,
			login,
			insertNewProject,
		}) => {
			const user = await login()
			const project1 = await insertNewProject({
				userId: user.id,
				title: `FilterProject1 ${faker.lorem.word()}`,
			})
			const project2 = await insertNewProject({
				userId: user.id,
				title: `FilterProject2 ${faker.lorem.word()}`,
			})

			await listPage.goto()

			await listPage.projectsTable.filterByTitle(project1.title)
			await expect(page.getByText(project1.title)).toBeVisible()
			await expect(page.getByText(project2.title)).not.toBeVisible()
		})
	})
})
