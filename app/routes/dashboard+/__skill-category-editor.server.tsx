import { parseWithZod } from '@conform-to/zod'
import { data } from 'react-router'
import { z } from 'zod'
import { prisma } from '#app/utils/db.server.ts'
import { createToastHeaders } from '#app/utils/toast.server.ts'

const SkillCategoryEditorSchema = z.object({
	id: z.string().optional(),
	name: z.string().min(1),
	description: z.string().optional(),
})

export const DashboardSkillIntent = {
	CATEGORY_CREATE: 'category-create',
	CATEGORY_UPDATE: 'category-update',
} as const

export async function handleCategoryAction(formData: FormData) {
	const submission = parseWithZod(formData, {
		schema: SkillCategoryEditorSchema,
	})

	if (submission.status !== 'success') {
		return data({ result: submission.reply(), status: 'error' } as const, {
			status: 400,
		})
	}

	const { id, name, description } = submission.value

	const updateData = {
		name,
		description: description ?? null,
	}

	const select = {
		id: true,
	}

	if (id) {
		// update
		await prisma.skillCategory.update({
			where: { id },
			data: updateData,
			select,
		})
		return data({ result: submission.reply(), status: 'success' } as const, {
			headers: await createToastHeaders({
				title: 'Category Updated',
				description: 'Skill category updated successfully.',
			}),
		})
	} else {
		// create
		await prisma.skillCategory.create({ data: updateData, select })
		return data({ result: submission.reply({}), status: 'success' } as const, {
			headers: await createToastHeaders({
				title: 'Category Created',
				description: 'New skill category created successfully.',
			}),
		})
	}
}
