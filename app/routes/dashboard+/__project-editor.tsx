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
import { ErrorList, Field, ToggleField } from '#app/components/forms.tsx'
import { Button } from '#app/components/ui/button.tsx'
import { StatusButton } from '#app/components/ui/status-button.tsx'
import { cn, useIsPending } from '#app/utils/misc.tsx'
import {
	CheckboxFieldSchema,
	StringMinMaxLengthSchema,
} from '#app/utils/zod-helpers.tsx'
import { type Info } from './+types/projects.$projectId_.edit.ts'
import { DashboardProjectIntent } from './projects.index'

export const ProjectEditorSchema = z.object({
	id: z.string().optional(),
	title: StringMinMaxLengthSchema(1, 100),
	description: StringMinMaxLengthSchema(1, 1000),
	liveDemoUrl: z.string().url('Must be a valid URL').optional().nullable(),
	sourceCodeUrl: z.string().url('Must be a valid URL').optional().nullable(),
	isPublished: CheckboxFieldSchema.default(true),
})

export function ProjectEditor({
	project,
	actionData,
}: {
	project?: Info['loaderData']['project']
	actionData?: Info['actionData']
}) {
	const isPending = useIsPending()

	const [form, fields] = useForm({
		id: 'project-editor',
		constraint: getZodConstraint(ProjectEditorSchema),
		lastResult: actionData?.result,
		onValidate({ formData }) {
			return parseWithZod(formData, { schema: ProjectEditorSchema })
		},
		defaultValue: {
			...project,
			isPublished:
				project?.isPublished === undefined ? true : project.isPublished,
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
					{project?.id ? (
						<input type="hidden" name="id" value={project.id} />
					) : null}

					<div className="flex flex-col gap-1">
						<Field
							labelProps={{ children: 'Title' }}
							inputProps={{
								autoFocus: true,
								...getInputProps(fields.title, { type: 'text' }),
								placeholder: 'Enter project title',
							}}
							errors={fields.title.errors}
						/>
						<Field
							labelProps={{ children: 'Description' }}
							inputProps={{
								...getInputProps(fields.description, { type: 'textarea' }),
								placeholder: 'Enter project description',
							}}
							errors={fields.description.errors}
						/>
						<Field
							labelProps={{ children: 'Live Demo URL' }}
							inputProps={{
								...getInputProps(fields.liveDemoUrl, { type: 'url' }),
								placeholder: 'Enter live demo URL (optional)',
							}}
							errors={fields.liveDemoUrl.errors}
						/>
						<Field
							labelProps={{ children: 'Source Code URL' }}
							inputProps={{
								...getInputProps(fields.sourceCodeUrl, { type: 'url' }),
								placeholder: 'Enter source code URL (optional)',
							}}
							errors={fields.sourceCodeUrl.errors}
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
							project?.id
								? DashboardProjectIntent.PROJECT_UPDATE
								: DashboardProjectIntent.PROJECT_CREATE
						}
						disabled={isPending}
						status={isPending ? 'pending' : 'idle'}
					>
						{project?.id ? 'Save Changes' : 'Create Project'}
					</StatusButton>

					{project?.id ? (
						<StatusButton
							form={form.id}
							type="submit"
							name="intent"
							value={DashboardProjectIntent.PROJECT_DELETE}
							variant="destructive"
							disabled={isPending}
							status={isPending ? 'pending' : 'idle'}
							onClick={(e) => {
								if (!confirm('Are you sure you want to delete this project?')) {
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
				404: () => <p>Project not found.</p>,
			}}
		/>
	)
}
