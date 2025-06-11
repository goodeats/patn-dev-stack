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
import { type Info } from './+types/contacts.$contactId_.edit.ts'
import { DashboardContactIntent } from './contacts.index'

export const ContactEditorSchema = z.object({
	id: z.string().optional(),
	text: StringMinMaxLengthSchema(1, 100),
	label: StringMinMaxLengthSchema(1, 100),
	href: z.string().url('Must be a valid URL'),
	icon: StringMinMaxLengthSchema(1, 50),
	isPublished: CheckboxFieldSchema.default(false),
})

export function ContactEditor({
	contact,
	actionData,
}: {
	contact?: Info['loaderData']['contact']
	actionData?: Info['actionData']
}) {
	const isPending = useIsPending()

	const [form, fields] = useForm({
		id: 'contact-editor',
		constraint: getZodConstraint(ContactEditorSchema),
		lastResult: actionData?.result,
		onValidate({ formData }) {
			return parseWithZod(formData, { schema: ContactEditorSchema })
		},
		defaultValue: {
			...contact,
			isPublished:
				contact?.isPublished === undefined ? true : contact.isPublished,
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
					{contact?.id ? (
						<input type="hidden" name="id" value={contact.id} />
					) : null}

					<div className="flex flex-col gap-1">
						<Field
							labelProps={{ children: 'Text' }}
							inputProps={{
								autoFocus: true,
								...getInputProps(fields.text, { type: 'text' }),
								placeholder: 'Enter display text for this contact',
							}}
							errors={fields.text.errors}
						/>
						<Field
							labelProps={{ children: 'Label' }}
							inputProps={{
								...getInputProps(fields.label, { type: 'text' }),
								placeholder: 'Enter aria label for this contact',
							}}
							errors={fields.label.errors}
						/>
						<Field
							labelProps={{ children: 'URL' }}
							inputProps={{
								...getInputProps(fields.href, { type: 'url' }),
								placeholder: 'Enter URL for this contact',
							}}
							errors={fields.href.errors}
						/>
						<Field
							labelProps={{ children: 'Icon' }}
							inputProps={{
								...getInputProps(fields.icon, { type: 'text' }),
								placeholder: 'Enter icon name for this contact',
							}}
							errors={fields.icon.errors}
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
							contact?.id
								? DashboardContactIntent.CONTACT_UPDATE
								: DashboardContactIntent.CONTACT_CREATE
						}
						disabled={isPending}
						status={isPending ? 'pending' : 'idle'}
					>
						{contact?.id ? 'Save Changes' : 'Create Contact'}
					</StatusButton>

					{contact?.id ? (
						<StatusButton
							form={form.id}
							type="submit"
							name="intent"
							value={DashboardContactIntent.CONTACT_DELETE}
							variant="destructive"
							disabled={isPending}
							status={isPending ? 'pending' : 'idle'}
							onClick={(e) => {
								if (!confirm('Are you sure you want to delete this contact?')) {
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
				404: () => <p>Contact not found.</p>,
			}}
		/>
	)
}
