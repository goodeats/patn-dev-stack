import { parseWithZod } from '@conform-to/zod'
import { invariantResponse } from '@epic-web/invariant'
import { data } from 'react-router'
import { z } from 'zod'
import { requireUserId } from '#app/utils/auth.server.ts'
import { prisma } from '#app/utils/db.server.ts'
import { createToastHeaders } from '#app/utils/toast.server.ts'

export const SkillEditorSchema = z.object({
	id: z.string().optional(),
	name: z.string().min(1),
	description: z.string().optional(),
	skillCategoryId: z.string(),
	isPublished: z.boolean().optional(),
})

export const DashboardSkillIntent = {
	SKILL_CREATE: 'skill-create',
	SKILL_UPDATE: 'skill-update',
	SKILL_DELETE: 'skill-delete',
} as const

export async function action({
	request,
	params,
}: {
	request: Request
	params: { userId: string }
}) {
	const userId = await requireUserId(request)
	const formData = await request.formData()
	const intent = formData.get('intent')

	if (intent === DashboardSkillIntent.SKILL_DELETE) {
		const skillId = formData.get('skillId')
		invariantResponse(typeof skillId === 'string', 'Skill ID is required')
		await prisma.skill.delete({
			where: { id: skillId, userId: userId },
		})
		const headers = await createToastHeaders({
			title: 'Skill Deleted',
			description: 'The skill has been successfully deleted.',
		})
		return data({ status: 'success' } as const, { headers })
	}

	const submission = parseWithZod(formData, {
		schema: SkillEditorSchema,
	})

	if (submission.status !== 'success') {
		return data({ result: submission.reply(), status: 'error' } as const, {
			status: 400,
		})
	}

	const {
		id,
		name,
		description,
		skillCategoryId,
		isPublished = false,
	} = submission.value

	const skillData = {
		userId,
		name,
		description,
		skillCategoryId,
		isPublished,
	}

	if (id) {
		await prisma.skill.update({
			where: { id, userId },
			data: skillData,
		})
		const headers = await createToastHeaders({
			title: 'Skill Updated',
			description: 'Your skill has been updated.',
		})
		return data({ status: 'success' } as const, { headers })
	} else {
		await prisma.skill.create({
			data: skillData,
		})
		const headers = await createToastHeaders({
			title: 'Skill Created',
			description: 'New skill created successfully.',
		})
		return data({ status: 'success' } as const, { headers })
	}
}
