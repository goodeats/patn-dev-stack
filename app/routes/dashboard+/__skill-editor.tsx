import { useForm, getFormProps, getInputProps } from '@conform-to/react'
import { getZodConstraint, parseWithZod } from '@conform-to/zod'
import { useActionData, useFetcher, Form } from 'react-router'
import {
	ErrorList,
	Field,
	SelectField,
	TextareaField,
} from '#app/components/forms.tsx'
import { StatusButton } from '#app/components/ui/status-button.tsx'
import {
	type action,
	SkillEditorSchema,
	DashboardSkillIntent,
} from './__skill-editor.server.tsx'

export function SkillEditor({
	skill,
	categories,
}: {
	skill?: {
		id: string
		name: string
		description?: string | null
		skillCategoryId: string
		isPublished: boolean
	} | null
	categories: { id: string; name: string }[]
}) {
	const actionData = useActionData<typeof action>()
	const fetcher = useFetcher()
	const [form, fields] = useForm({
		id: 'skill-editor',
		constraint: getZodConstraint(SkillEditorSchema),
		lastResult: actionData?.status === 'error' ? actionData.result : undefined,
		onValidate({ formData }) {
			return parseWithZod(formData, { schema: SkillEditorSchema })
		},
		defaultValue: {
			...skill,
			description: skill?.description ?? '',
		},
	})

	return (
		<fetcher.Form method="POST" {...getFormProps(form)} className="space-y-4">
			<input type="hidden" name="id" value={skill?.id} />
			<Field
				labelProps={{ children: 'Name' }}
				inputProps={{
					...getInputProps(fields.name, { type: 'text' }),
					autoComplete: 'name',
				}}
				errors={fields.name.errors}
			/>
			<TextareaField
				labelProps={{ children: 'Description' }}
				textareaProps={{
					...getInputProps(fields.description, {
						type: 'text',
					}),
					autoComplete: 'description',
				}}
				errors={fields.description.errors}
			/>
			<SelectField
				labelProps={{ children: 'Category' }}
				selectProps={{
					...getInputProps(fields.skillCategoryId, { type: 'text' }),
					defaultValue: skill?.skillCategoryId,
				}}
				options={categories.map((c) => ({ label: c.name, value: c.id }))}
				errors={fields.skillCategoryId.errors}
			/>

			<ErrorList errors={form.errors} id={form.errorId} />

			<div className="flex justify-end gap-4">
				<StatusButton
					type="submit"
					name="intent"
					value={
						skill?.id
							? DashboardSkillIntent.SKILL_UPDATE
							: DashboardSkillIntent.SKILL_CREATE
					}
					status={fetcher.state !== 'idle' ? 'pending' : 'idle'}
					className="w-full"
				>
					{skill?.id ? 'Update Skill' : 'Create Skill'}
				</StatusButton>
			</div>
		</fetcher.Form>
	)
}
