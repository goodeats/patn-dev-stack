import { parseWithZod } from '@conform-to/zod'
import { invariantResponse } from '@epic-web/invariant'
import { createId as cuid } from '@paralleldrive/cuid2'
import { data, redirect, type ActionFunctionArgs } from 'react-router'
import { requireUserId } from '#app/utils/auth.server.ts'
import { prisma } from '#app/utils/db.server.ts'
import { redirectWithToast } from '#app/utils/toast.server.ts'
import { AboutEditorSchema } from './__about-editor.tsx'

export async function action({ request }: ActionFunctionArgs) {
	const userId = await requireUserId(request)
	const formData = await request.formData()
	const intent = formData.get('intent')

	if (intent === 'delete') {
		const aboutId = formData.get('id')
		invariantResponse(
			typeof aboutId === 'string',
			'ID is required for deletion',
		)

		const deleted = await prisma.aboutMe.delete({
			where: {
				id: aboutId,
				userId,
			},
		})

		if (!deleted) {
			return redirectWithToast('/dashboard/about', {
				title: 'About Me item not found',
				description: 'The item was not found.',
			})
		}

		return redirectWithToast('/dashboard/about', {
			title: `${deleted.name} deleted`,
			description: 'The about me item has been deleted successfully.',
		})
	}

	const submission = await parseWithZod(formData, {
		schema: AboutEditorSchema.superRefine(async (val, ctx) => {
			if (!val.id) return // New item, no server-side owner check needed yet

			const existingAboutMe = await prisma.aboutMe.findUnique({
				where: { id: val.id, userId },
				select: { id: true },
			})
			if (!existingAboutMe) {
				ctx.addIssue({
					code: 'custom',
					message: 'About Me item not found or not owned by user',
					path: ['id'],
				})
			}
		}).transform(async (data) => {
			const aboutId = data.id ?? cuid()
			return {
				...data,
				id: aboutId,
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
		id: aboutId,
		name,
		content,
		description,
		aboutMeCategoryId,
		isPublished,
	} = submission.value

	const updatedAboutMe = await prisma.aboutMe.upsert({
		select: { id: true },
		where: { id: aboutId },
		create: {
			id: aboutId,
			name,
			content,
			description,
			aboutMeCategoryId,
			isPublished,
			userId,
		},
		update: {
			name,
			content,
			description,
			aboutMeCategoryId,
			isPublished,
		},
	})

	return redirect(`/dashboard/about/${updatedAboutMe.id}`)
}
