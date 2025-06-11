import { useForm, getFormProps, getInputProps } from '@conform-to/react'
import { getZodConstraint, parseWithZod } from '@conform-to/zod'
import { useActionData, useFetcher, Form } from 'react-router'
import z from 'zod'
import {
	ErrorList,
	Field,
	SelectField,
	TextareaField,
} from '#app/components/forms.tsx'
import { StatusButton } from '#app/components/ui/status-button.tsx'
import {
	CheckboxFieldSchema,
	StringMinMaxLengthSchema,
} from '#app/utils/zod-helpers.tsx'
import { DashboardSkillsIntent } from './skills.index'

export const SkillEditorSchema = z.object({
	id: z.string().optional(),
	name: StringMinMaxLengthSchema(1, 100),
	description: StringMinMaxLengthSchema(1, 500).optional().nullable(),
	skillCategoryId: z.string({ required_error: 'Category is required' }),
	isPublished: CheckboxFieldSchema.default(false),
})

export function SkillEditor({
	skill,
	categories,
	actionData,
}: {
	skill?: {
		id: string
		name: string
		description?: string | null
		skillCategoryId: string
		isPublished: boolean
	} | null
	categories: { id: string; name: string }[]
	actionData?: {
		result: any
		status: string
	}
}) {
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
