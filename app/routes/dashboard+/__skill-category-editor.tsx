import { useForm, getFormProps, getInputProps  } from '@conform-to/react'
import { getZodConstraint, parseWithZod } from '@conform-to/zod'
import { useFetcher, Form } from 'react-router'
import { z } from 'zod'
import { ErrorList, Field, TextareaField } from '#app/components/forms.tsx'
import { Button } from '#app/components/ui/button.tsx'
import { StatusButton } from '#app/components/ui/status-button.tsx'
import { DashboardSkillIntent } from './__skill-category-editor.server.tsx'

const SkillCategoryEditorSchema = z.object({
	id: z.string().optional(),
	name: z.string({ required_error: 'Name is required' }).min(1),
	description: z.string().optional(),
})

export function SkillCategoryEditor({
	category,
	actionData,
	onClose,
}: {
	category?: { id: string; name: string; description?: string | null } | null
	actionData?: {
		result: any
		status: string
	}
	onClose: () => void
}) {
	const fetcher = useFetcher()
	const [form, fields] = useForm({
		id: 'skill-category-editor',
		constraint: getZodConstraint(SkillCategoryEditorSchema),
		lastResult: actionData?.result,
		onValidate({ formData }) {
			return parseWithZod(formData, { schema: SkillCategoryEditorSchema })
		},
		defaultValue: {
			...category,
			description: category?.description ?? '',
		},
		shouldRevalidate: 'onBlur',
	})

	return (
		<fetcher.Form method="POST" {...getFormProps(form)} className="space-y-4">
			<input type="hidden" name="id" value={category?.id} />

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

			<ErrorList errors={form.errors} id={form.errorId} />

			<div className="flex justify-end gap-4">
				<Button type="button" variant="ghost" onClick={onClose}>
					Cancel
				</Button>
				<StatusButton
					type="submit"
					name="intent"
					value={
						category?.id
							? DashboardSkillIntent.CATEGORY_UPDATE
							: DashboardSkillIntent.CATEGORY_CREATE
					}
					status={fetcher.state !== 'idle' ? 'pending' : 'idle'}
				>
					{category?.id ? 'Update' : 'Create'}
				</StatusButton>
			</div>
		</fetcher.Form>
	)
}
