import { parseWithZod } from '@conform-to/zod'
import { invariantResponse } from '@epic-web/invariant'
import { createId as cuid } from '@paralleldrive/cuid2'
import { type ActionFunctionArgs, data, redirect } from 'react-router'
import { requireUserId } from '#app/utils/auth.server.ts'
import { prisma } from '#app/utils/db.server.ts'
import { redirectWithToast } from '#app/utils/toast.server.ts'
import { SkillEditorSchema } from './__skill-editor'
import { DashboardSkillsIntent } from './skills.index'

export async function action({ request }: ActionFunctionArgs) {
	const userId = await requireUserId(request)
	const formData = await request.formData()
	const intent = formData.get('intent')

	if (intent === DashboardSkillsIntent.SKILL_DELETE) {
		const skillId = formData.get('id')
		invariantResponse(typeof skillId === 'string', 'Skill ID is required')

		const deleted = await prisma.skill.delete({
			where: { id: skillId, userId: userId },
		})

		if (!deleted) {
			return redirectWithToast('/dashboard/skills', {
				title: 'Skill not found',
				description: 'The skill was not found.',
			})
		}

		return redirectWithToast('/dashboard/skills', {
			title: `${deleted.name} deleted`,
			description: 'The skill has been deleted successfully.',
		})
	}

	const submission = await parseWithZod(formData, {
		schema: SkillEditorSchema.superRefine(async (val, ctx) => {
			if (!val.id) return // New item, no server-side owner check needed yet

			const existingSkill = await prisma.skill.findUnique({
				where: { id: val.id, userId },
				select: { id: true },
			})
			if (!existingSkill) {
				ctx.addIssue({
					code: 'custom',
					message: 'Skill item not found or not owned by user',
					path: ['id'],
				})
			}
		}).transform(async (data) => {
			const skillId = data.id ?? cuid()
			return {
				...data,
				id: skillId,
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
		id: skillId,
		name,
		description,
		skillCategoryId,
		isPublished = false,
	} = submission.value

	const skillData = {
		name,
		description,
		skillCategoryId,
		isPublished,
	}

	const updatedSkill = await prisma.skill.upsert({
		select: { id: true },
		where: { id: skillId },
		create: {
			id: skillId,
			userId,
			...skillData,
		},
		update: skillData,
	})

	return redirect(`/dashboard/skills/${updatedSkill.id}`)
}
