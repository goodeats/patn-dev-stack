import { parseWithZod } from '@conform-to/zod'
import { invariantResponse } from '@epic-web/invariant'
import { data, redirect, type ActionFunctionArgs } from 'react-router'
import { requireUserId } from '#app/utils/auth.server.ts'
import { prisma } from '#app/utils/db.server.ts'
import { AboutEditorSchema } from './__about-editor.tsx'

export async function action({ request, params }: ActionFunctionArgs) {
	const userId = await requireUserId(request)
	const formData = await request.formData()
	const intent = formData.get('intent')

	if (intent === 'delete') {
		const aboutId = formData.get('id')
		invariantResponse(
			typeof aboutId === 'string',
			'ID is required for deletion',
		)

		await prisma.aboutMe.deleteMany({
			where: {
				id: aboutId,
				userId,
			},
		})
		return redirect('/dashboard/about')
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
		}),
		async: true,
	})

	if (submission.status !== 'success') {
		return data(
			{ result: submission.reply({ hideFields: ['id'] }) }, // hide 'id' from client errors if it was part of submission
			{ status: submission.status === 'error' ? 400 : 200 },
		)
	}

	const { id, name, content, description, aboutMeCategoryId, isPublished } =
		submission.value

	if (intent === 'create') {
		const newAboutMe = await prisma.aboutMe.create({
			data: {
				name,
				content,
				description,
				aboutMeCategoryId,
				isPublished,
				userId,
			},
			select: { id: true },
		})
		return redirect(`/dashboard/about/${newAboutMe.id}`)
	}

	if (intent === 'update') {
		invariantResponse(id, 'ID is required for update')
		const updatedAboutMe = await prisma.aboutMe.update({
			where: {
				id: id,
				// userId check already done in superRefine for safety, but can be repeated here
			},
			data: {
				name,
				content,
				description,
				aboutMeCategoryId,
				isPublished,
			},
			select: { id: true },
		})
		return redirect(`/dashboard/about/${updatedAboutMe.id}`)
	}

	// Should not happen if intent is correctly set on buttons
	return data({ result: submission.reply() }, { status: 400 })
}
