import { parseWithZod } from '@conform-to/zod'
import { type ActionFunctionArgs, data } from 'react-router'
import { requireUserId } from '#app/utils/auth.server.ts'
import { prisma } from '#app/utils/db.server.ts'
import {
	ProjectSkillActionIntent,
	ProjectSkillSchema,
} from './__project-skills-editor'

export async function action({ request }: ActionFunctionArgs) {
	const userId = await requireUserId(request)
	const formData = await request.formData()

	const submission = await parseWithZod(formData, {
		schema: ProjectSkillSchema.superRefine(async (val, ctx) => {
			const existingProject = await prisma.project.findUnique({
				where: { id: val.projectId, userId },
				select: { id: true },
			})
			if (!existingProject) {
				ctx.addIssue({
					code: 'custom',
					message: 'Project item not found or not owned by user',
					path: ['id'],
				})
			}

			const existingSkill = await prisma.skill.findUnique({
				where: { id: val.skillId, userId },
				select: { id: true },
			})
			if (!existingSkill) {
				ctx.addIssue({
					code: 'custom',
					message: 'Skill item not found or not owned by user',
					path: ['skillId'],
				})
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

	const { projectId, skillId, intent } = submission.value

	switch (intent) {
		case ProjectSkillActionIntent.SKILL_ADD:
			await prisma.project.update({
				where: { id: projectId },
				data: { skills: { connect: { id: skillId } } },
			})
			break

		case ProjectSkillActionIntent.SKILL_REMOVE:
			await prisma.project.update({
				where: { id: projectId },
				data: { skills: { disconnect: { id: skillId } } },
			})
			break

		default:
			return data({ result: submission.reply() }, { status: 400 })
	}

	return data({ result: submission.reply() }, { status: 200 })
}
