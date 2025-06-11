import {
	useForm,
	getFormProps,
	getInputProps,
	FormProvider,
} from '@conform-to/react'
import { getZodConstraint, parseWithZod } from '@conform-to/zod'
import { Form } from 'react-router'
import z from 'zod'
import { AppContainerContent } from '#app/components/app-container.tsx'
import { GeneralErrorBoundary } from '#app/components/error-boundary.tsx'
import { nonFloatingToolbarClassName } from '#app/components/floating-toolbar.tsx'
import {
	ErrorList,
	Field,
	SelectField,
	ToggleField,
} from '#app/components/forms.tsx'
import { Button } from '#app/components/ui/button.tsx'
import { StatusButton } from '#app/components/ui/status-button.tsx'
import { cn, useIsPending } from '#app/utils/misc.tsx'
import {
	CheckboxFieldSchema,
	StringMinMaxLengthSchema,
} from '#app/utils/zod-helpers.tsx'
import { type Info } from './+types/skills.$skillId_.edit.ts'
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
	skill?: Info['loaderData']['skill']
	categories: Info['loaderData']['categories']
	actionData?: Info['actionData']
}) {
	const isPending = useIsPending()

	const [form, fields] = useForm({
		id: 'skill-editor',
		constraint: getZodConstraint(SkillEditorSchema),
		lastResult: actionData?.result,
		onValidate({ formData }) {
			return parseWithZod(formData, { schema: SkillEditorSchema })
		},
		defaultValue: {
			...skill,
			isPublished: skill?.isPublished === undefined ? true : skill.isPublished,
		},
		shouldRevalidate: 'onBlur',
	})

	return (
		<AppContainerContent>
			<FormProvider context={form.context}>
				<Form
					method="POST"
					className="flex flex-col gap-y-4 overflow-x-hidden overflow-y-auto px-2"
					{...getFormProps(form)}
				>
					<button type="submit" className="hidden" />
					{skill?.id ? (
						<input type="hidden" name="id" value={skill.id} />
					) : null}

					<div className="flex flex-col gap-1">
						<Field
							labelProps={{ children: 'Name' }}
							inputProps={{
								autoFocus: true,
								...getInputProps(fields.name, { type: 'text' }),
								placeholder: 'Enter a name for this skill',
							}}
							errors={fields.name.errors}
						/>
						<Field
							labelProps={{ children: 'Description (Optional)' }}
							inputProps={{
								...getInputProps(fields.description, { type: 'text' }),
								placeholder: 'Brief description of this skill',
							}}
							errors={fields.description.errors}
						/>
						<SelectField
							labelProps={{ children: 'Category' }}
							selectProps={{
								name: fields.skillCategoryId.name,
								defaultValue: fields.skillCategoryId.initialValue,
								disabled: isPending,
								required: true,
							}}
							options={categories.map((category) => ({
								value: category.id,
								label: category.name,
							}))}
							errors={fields.skillCategoryId.errors}
							placeholder="Select a category"
						/>

						<ToggleField
							labelProps={{ children: 'Published' }}
							buttonProps={{
								...getInputProps(fields.isPublished, { type: 'checkbox' }),
								name: fields.isPublished.name,
								form: form.id,
								value: 'true',
								defaultChecked: Boolean(fields.isPublished.initialValue),
								disabled: isPending,
							}}
							errors={fields.isPublished.errors}
							variant="switch"
						/>
					</div>
					<ErrorList id={form.errorId} errors={form.errors} />
				</Form>

				<div className={cn(nonFloatingToolbarClassName, 'mt-10')}>
					<Button variant="destructive" {...form.reset.getButtonProps()}>
						Reset
					</Button>

					<StatusButton
						form={form.id}
						type="submit"
						name="intent"
						value={
							skill?.id
								? DashboardSkillsIntent.SKILL_UPDATE
								: DashboardSkillsIntent.SKILL_CREATE
						}
						disabled={isPending}
						status={isPending ? 'pending' : 'idle'}
					>
						{skill?.id ? 'Save Changes' : 'Create Skill'}
					</StatusButton>

					{skill?.id ? (
						<StatusButton
							form={form.id}
							type="submit"
							name="intent"
							value={DashboardSkillsIntent.SKILL_DELETE}
							variant="destructive"
							disabled={isPending}
							status={isPending ? 'pending' : 'idle'}
							onClick={(e) => {
								if (!confirm('Are you sure you want to delete this skill?')) {
									e.preventDefault()
								}
							}}
						>
							Delete
						</StatusButton>
					) : null}
				</div>
			</FormProvider>
		</AppContainerContent>
	)
}

export function ErrorBoundary() {
	return (
		<GeneralErrorBoundary
			statusHandlers={{
				404: () => <p>Skill not found.</p>,
			}}
		/>
	)
}
