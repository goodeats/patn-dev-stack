import {
	FormProvider,
	getFormProps,
	getInputProps,
	getTextareaProps,
	useForm,
} from '@conform-to/react'
import { getZodConstraint, parseWithZod } from '@conform-to/zod'
import { Form, useActionData } from 'react-router'
import { z } from 'zod'
import { GeneralErrorBoundary } from '#app/components/error-boundary.tsx'
import { floatingToolbarClassName } from '#app/components/floating-toolbar.tsx'
import { ErrorList, Field, TextareaField } from '#app/components/forms.tsx'
import { Button } from '#app/components/ui/button.tsx'
import { Label } from '#app/components/ui/label.tsx'
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '#app/components/ui/select.tsx'
import { StatusButton } from '#app/components/ui/status-button.tsx'
import { useIsPending } from '#app/utils/misc.tsx'
import { type action } from './__about-editor.server.tsx'
import { type loader as editLoader } from './about.$aboutId.edit.tsx'
import { type loader as newLoader } from './about.new.tsx'

const nameMinLength = 1
const nameMaxLength = 100
const contentMinLength = 1
const contentMaxLength = 10000
const descriptionMaxLength = 500

export const AboutEditorSchema = z.object({
	id: z.string().optional(),
	name: z.string().min(nameMinLength).max(nameMaxLength),
	content: z.string().min(contentMinLength).max(contentMaxLength),
	description: z.string().max(descriptionMaxLength).optional().nullable(),
	aboutMeCategoryId: z.string({ required_error: 'Category is required' }),
	isPublished: z.boolean().default(false),
})

type Category = {
	id: string
	name: string
}

type AboutMeSchemaType = z.infer<typeof AboutEditorSchema>

type AboutEditorProps =
	| {
			aboutMe: AboutMeSchemaType & { id: string }
			categories: Category[]
	  }
	| {
			aboutMe?: undefined
			categories: Category[]
	  }

export function AboutEditor({
	aboutMe,
	categories,
}: AboutEditorProps & {
	actionData?: ReturnType<typeof useActionData<typeof action>>
}) {
	const isPending = useIsPending()
	const lastResult = useActionData<typeof action>()?.result

	const [form, fields] = useForm({
		id: 'about-editor',
		constraint: getZodConstraint(AboutEditorSchema),
		lastResult: lastResult,
		onValidate({ formData }) {
			const parsedData = parseWithZod(formData, { schema: AboutEditorSchema })
			if (parsedData.status === 'success') {
				parsedData.value.isPublished = formData.get('isPublished') === 'true'
			}
			return parsedData
		},
		defaultValue: {
			name: aboutMe?.name ?? '',
			content: aboutMe?.content ?? '',
			description: aboutMe?.description ?? '',
			aboutMeCategoryId: aboutMe?.aboutMeCategoryId ?? '',
			isPublished:
				aboutMe?.isPublished === undefined ? true : aboutMe.isPublished,
		},
		shouldRevalidate: 'onBlur',
	})

	return (
		<div className="absolute inset-0">
			<FormProvider context={form.context}>
				<Form
					method="POST"
					className="flex h-full flex-col gap-y-4 overflow-x-hidden overflow-y-auto px-10 pt-12 pb-28"
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
						<div>
							<Label htmlFor={fields.aboutMeCategoryId.id}>Category</Label>
							<Select
								name={fields.aboutMeCategoryId.name}
								defaultValue={fields.aboutMeCategoryId.initialValue}
								disabled={isPending}
								required
							>
								<SelectTrigger id={fields.aboutMeCategoryId.id}>
									<SelectValue placeholder="Select a category" />
								</SelectTrigger>
								<SelectContent>
									{categories.map((category: Category) => (
										<SelectItem key={category.id} value={category.id}>
											{category.name}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
							<div className="min-h-[32px] px-4 pt-1 pb-3">
								<ErrorList
									id={fields.aboutMeCategoryId.errorId}
									errors={fields.aboutMeCategoryId.errors}
								/>
							</div>
						</div>

						<div className="flex items-center space-x-2">
							<input
								{...getInputProps(fields.isPublished, { type: 'checkbox' })}
								id={fields.isPublished.id}
								name={fields.isPublished.name}
								defaultChecked={Boolean(fields.isPublished.initialValue)}
								value="true"
								className="size-4"
								disabled={isPending}
							/>
							<Label htmlFor={fields.isPublished.id}>Published</Label>
							<div className="min-h-[32px] px-4 pt-1 pb-3">
								<ErrorList
									id={fields.isPublished.errorId}
									errors={fields.isPublished.errors}
								/>
							</div>
						</div>
					</div>
					<ErrorList id={form.errorId} errors={form.errors} />
				</Form>
				<div className={floatingToolbarClassName}>
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
						{aboutMe?.id ? 'Save Changes' : 'Create Section'}
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
								if (!confirm('Are you sure you want to delete this section?')) {
									e.preventDefault()
								}
							}}
						>
							Delete
						</StatusButton>
					) : null}
				</div>
			</FormProvider>
		</div>
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
