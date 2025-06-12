import { useForm, getFormProps } from '@conform-to/react'
import { getZodConstraint, parseWithZod } from '@conform-to/zod'
import { useFetcher } from 'react-router'
import { z } from 'zod'
import { ErrorList, SelectField } from '#app/components/forms.tsx'
import { SkillBadge } from '#app/components/skill-badge.tsx'
import { Button } from '#app/components/ui/button.tsx'
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '#app/components/ui/card.tsx'
import { Icon } from '#app/components/ui/icon.tsx'
import { useIsPending } from '#app/utils/misc.tsx'
import { type Info } from './+types/projects.$projectId.tsx'

export const ProjectSkillActionIntent = {
	SKILL_ADD: 'skill-add',
	SKILL_REMOVE: 'skill-remove',
} as const

export const ProjectSkillSchema = z.object({
	projectId: z.string({ required_error: 'Project is required' }),
	skillId: z.string({ required_error: 'Skill is required' }),
	intent: z.nativeEnum(ProjectSkillActionIntent),
})

export function ProjectSkillsEditor({
	project,
	userSkills,
}: {
	project: Info['loaderData']['project']
	userSkills: Info['loaderData']['userSkills']
}) {
	const fetcher = useFetcher()
	const isPending = useIsPending()

	const projectSkillIds = new Set(project.skills.map((s) => s.id))
	const skillsOptions =
		userSkills?.filter((s) => !projectSkillIds.has(s.id)) ?? []

	const [form, fields] = useForm({
		id: 'project-skills-editor',
		constraint: getZodConstraint(ProjectSkillSchema),
		lastResult: fetcher.data?.result,
		onValidate({ formData }) {
			return parseWithZod(formData, { schema: ProjectSkillSchema })
		},
		shouldRevalidate: 'onBlur',
	})

	return (
		<Card>
			<CardHeader>
				<CardTitle>Skills</CardTitle>
				<CardDescription>
					Manage the skills associated with this project.
				</CardDescription>
			</CardHeader>
			<CardContent>
				<div className="flex flex-wrap gap-2">
					{project.skills.map((skill) => (
						<div
							key={skill.id}
							className="bg-secondary flex items-center gap-1 rounded-md"
						>
							<div className="pl-2">
								<SkillBadge skill={skill} />
							</div>
							<fetcher.Form method="POST" {...getFormProps(form)}>
								<input type="hidden" name="skillId" value={skill.id} />
								<input type="hidden" name="projectId" value={project.id} />
								<Button
									type="submit"
									name="intent"
									value={ProjectSkillActionIntent.SKILL_REMOVE}
									variant="ghost"
									size="sm"
									className="text-destructive hover:text-destructive h-auto px-1 py-0"
									disabled={isPending}
								>
									<Icon name="cross-1" className="size-3" />
									<span className="sr-only">Remove {skill.name}</span>
								</Button>
							</fetcher.Form>
						</div>
					))}
				</div>

				{skillsOptions.length > 0 ? (
					<fetcher.Form
						method="POST"
						className="mt-4 flex items-start gap-2"
						{...getFormProps(form)}
					>
						<input type="hidden" name="projectId" value={project.id} />
						<SelectField
							labelProps={{
								children: 'Available Skills',
								className: 'sr-only',
							}}
							selectProps={{
								...fields.skillId,
								name: 'skillId',
							}}
							options={skillsOptions.map((s) => ({
								label: s.name,
								value: s.id,
							}))}
							errors={fields.skillId.errors}
							placeholder="Select a skill to add"
						/>
						<Button
							type="submit"
							name="intent"
							value={ProjectSkillActionIntent.SKILL_ADD}
							disabled={isPending}
						>
							<Icon name="plus" className="mr-2" />
							Add Skill
						</Button>
					</fetcher.Form>
				) : (
					<p className="text-muted-foreground mt-4 text-sm">
						All available skills have been added to this project.
					</p>
				)}

				<ErrorList id={form.errorId} errors={form.errors} />
			</CardContent>
		</Card>
	)
}
