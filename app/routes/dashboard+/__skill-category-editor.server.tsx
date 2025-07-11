import { parseWithZod } from '@conform-to/zod'
import { invariantResponse } from '@epic-web/invariant'
import { createId as cuid } from '@paralleldrive/cuid2'
import { data } from 'react-router'
import { prisma } from '#app/utils/db.server.ts'
import { createToastHeaders } from '#app/utils/toast.server.ts'
import { SkillCategoryEditorSchema } from './__skill-category-editor.tsx'
import { DashboardSkillsIntent } from './skills.index.tsx'

export async function handleCategoryAction(formData: FormData) {
	const intent = formData.get('intent')

	if (intent === DashboardSkillsIntent.CATEGORY_DELETE) {
		const categoryId = formData.get('id')
		invariantResponse(
			typeof categoryId === 'string',
			'ID is required for deletion',
		)

		const deleted = await prisma.skillCategory.delete({
			where: {
				id: categoryId,
			},
		})

		if (!deleted) {
			return data(
				{ type: 'error', message: 'Category not found' },
				{
					status: 404,
					headers: await createToastHeaders({
						title: 'Category not found',
						description: 'The category was not found.',
						type: 'error',
					}),
				},
			)
		}

		return data(
			{ type: 'success', entity: 'skillCategory' },
			{
				status: 200,
				headers: await createToastHeaders({
					title: `${deleted.name} deleted`,
					description: 'The category has been deleted successfully.',
					type: 'success',
				}),
			},
		)
	}

	const submission = await parseWithZod(formData, {
		schema: SkillCategoryEditorSchema.superRefine(async (val, ctx) => {
			if (!val.id) return // New category, no server-side check needed yet

			const existingCategory = await prisma.skillCategory.findUnique({
				where: { id: val.id },
				select: { id: true },
			})
			if (!existingCategory) {
				ctx.addIssue({
					code: 'custom',
					message: 'Category not found',
					path: ['id'],
				})
			}
		}).transform(async (data) => {
			const categoryId = data.id ?? cuid()
			return {
				...data,
				id: categoryId,
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

	const { id: categoryId, name, description, isPublished } = submission.value

	const isUpdate = intent === DashboardSkillsIntent.CATEGORY_UPDATE
	const action = isUpdate ? 'updated' : 'created'

	const updatedCategory = await prisma.skillCategory.upsert({
		select: { id: true, name: true },
		where: { id: categoryId },
		create: {
			id: categoryId,
			name,
			description,
			isPublished,
		},
		update: {
			name,
			description,
			isPublished,
		},
	})

	return data(
		{ type: 'success', entity: 'skillCategory' },
		{
			status: 200,
			headers: await createToastHeaders({
				title: `Category ${action}`,
				description: `${updatedCategory.name} has been ${action} successfully.`,
				type: 'success',
			}),
		},
	)
}
