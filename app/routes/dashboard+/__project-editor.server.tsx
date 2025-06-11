import { parseWithZod } from '@conform-to/zod'
import { invariantResponse } from '@epic-web/invariant'
import { createId as cuid } from '@paralleldrive/cuid2'
import { type ActionFunctionArgs, data, redirect } from 'react-router'
import { requireUserId } from '#app/utils/auth.server.ts'
import { prisma } from '#app/utils/db.server.ts'
import { redirectWithToast } from '#app/utils/toast.server.ts'
import { ProjectEditorSchema } from './__project-editor'
import { DashboardProjectIntent } from './projects.index'

export async function action({ request }: ActionFunctionArgs) {
	const userId = await requireUserId(request)
	const formData = await request.formData()
	const intent = formData.get('intent')

	if (intent === DashboardProjectIntent.PROJECT_DELETE) {
		const projectId = formData.get('id')
		invariantResponse(typeof projectId === 'string', 'Project ID is required')

		const deleted = await prisma.project.delete({
			where: { id: projectId, userId: userId },
		})

		if (!deleted) {
			return redirectWithToast('/dashboard/projects', {
				title: 'Project not found',
				description: 'The project was not found.',
			})
		}

		return redirectWithToast('/dashboard/projects', {
			title: `${deleted.title} deleted`,
			description: 'The project has been deleted successfully.',
		})
	}

	const submission = await parseWithZod(formData, {
		schema: ProjectEditorSchema.superRefine(async (val, ctx) => {
			if (!val.id) return // New item, no server-side owner check needed yet

			const existingProject = await prisma.project.findUnique({
				where: { id: val.id, userId },
				select: { id: true },
			})
			if (!existingProject) {
				ctx.addIssue({
					code: 'custom',
					message: 'Project item not found or not owned by user',
					path: ['id'],
				})
			}
		}).transform(async (data) => {
			const projectId = data.id ?? cuid()
			return {
				...data,
				id: projectId,
			}
		}),
		async: true,
	})

	if (submission.status !== 'success') {
		return data(
			{ result: submission.reply() },
			{ status: submission.status === 'error' ? 400 : 200 },
		)
	}

	const {
		id: projectId,
		title,
		description,
		liveDemoUrl,
		sourceCodeUrl,
		comments,
		isPublished = true,
	} = submission.value

	const projectData = {
		title,
		description,
		liveDemoUrl,
		sourceCodeUrl,
		comments,
		isPublished,
	}

	const updatedProject = await prisma.project.upsert({
		select: { id: true },
		where: { id: projectId },
		create: {
			id: projectId,
			userId,
			...projectData,
		},
		update: projectData,
	})

	return redirect(`/dashboard/projects/${updatedProject.id}`)
}
