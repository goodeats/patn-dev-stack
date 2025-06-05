import {
	FormProvider,
	getFormProps,
	getInputProps,
	getTextareaProps,
	useForm,
} from '@conform-to/react'
import { getZodConstraint, parseWithZod } from '@conform-to/zod'
import { Form } from 'react-router'
import { z } from 'zod'
import { AppContainerContent } from '#app/components/app-container.tsx'
import { GeneralErrorBoundary } from '#app/components/error-boundary.tsx'
import { nonFloatingToolbarClassName } from '#app/components/floating-toolbar.tsx'
import {
	ErrorList,
	Field,
	SelectField,
	TextareaField,
	ToggleField,
} from '#app/components/forms.tsx'
import { Button } from '#app/components/ui/button.tsx'
import { StatusButton } from '#app/components/ui/status-button.tsx'
import { cn, useIsPending } from '#app/utils/misc.tsx'
import {
	CheckboxFieldSchema,
	StringMinMaxLengthSchema,
} from '#app/utils/zod-helpers.tsx'
import { type Info } from './+types/about.$aboutId_.edit.ts'

export const AboutEditorSchema = z.object({
	id: z.string().optional(),
	name: StringMinMaxLengthSchema(1, 100),
	content: StringMinMaxLengthSchema(1, 10000),
	description: StringMinMaxLengthSchema(1, 500).optional().nullable(),
	aboutMeCategoryId: z.string({ required_error: 'Category is required' }),
	isPublished: CheckboxFieldSchema.default(false),
})

export function AboutEditor({
	aboutMe,
	categories,
	actionData,
}: {
	aboutMe?: Info['loaderData']['aboutMe']
	categories: Info['loaderData']['categories']
	actionData?: Info['actionData']
}) {
	const isPending = useIsPending()

	const [form, fields] = useForm({
		id: 'about-editor',
		constraint: getZodConstraint(AboutEditorSchema),
		lastResult: actionData?.result,
		onValidate({ formData }) {
			return parseWithZod(formData, { schema: AboutEditorSchema })
		},
		defaultValue: {
			...aboutMe,
			isPublished:
				aboutMe?.isPublished === undefined ? true : aboutMe.isPublished,
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
					{aboutMe?.id ? (
						<input type="hidden" name="id" value={aboutMe.id} />
					) : null}

					<div className="flex flex-col gap-1">
						<Field
							labelProps={{ children: 'Name' }}
							inputProps={{
								autoFocus: true,
								...getInputProps(fields.name, { type: 'text' }),
								placeholder: 'Enter a name for this section',
							}}
							errors={fields.name.errors}
						/>
						<TextareaField
							labelProps={{ children: 'Content' }}
							textareaProps={{
								...getTextareaProps(fields.content),
								rows: 6,
								placeholder: 'Enter the content for this section',
							}}
							errors={fields.content.errors}
						/>
						<Field
							labelProps={{ children: 'Description (Optional)' }}
							inputProps={{
								...getInputProps(fields.description, { type: 'text' }),
								placeholder: 'Brief description of this section',
							}}
							errors={fields.description.errors}
						/>
						<SelectField
							labelProps={{ children: 'Category' }}
							selectProps={{
								name: fields.aboutMeCategoryId.name,
								defaultValue: fields.aboutMeCategoryId.initialValue,
								disabled: isPending,
								required: true,
							}}
							options={categories.map((category) => ({
								value: category.id,
								label: category.name,
							}))}
							errors={fields.aboutMeCategoryId.errors}
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
						value={aboutMe?.id ? 'update' : 'create'}
						disabled={isPending}
						status={isPending ? 'pending' : 'idle'}
					>
						{aboutMe?.id ? 'Save Changes' : 'Create About Me'}
					</StatusButton>
					{aboutMe?.id ? (
						<StatusButton
							form={form.id}
							type="submit"
							name="intent"
							value="delete"
							variant="destructive"
							disabled={isPending}
							status={isPending ? 'pending' : 'idle'}
							onClick={(e) => {
								if (!confirm('Are you sure you want to delete this item?')) {
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
				404: () => <p>About Me item not found.</p>,
			}}
		/>
	)
}
