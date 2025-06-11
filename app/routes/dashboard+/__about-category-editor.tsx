import {
	FormProvider,
	getFormProps,
	getInputProps,
	useForm,
} from '@conform-to/react'
import { getZodConstraint, parseWithZod } from '@conform-to/zod'
import { Form } from 'react-router'
import { z } from 'zod'
import { AppContainerContent } from '#app/components/app-container.tsx'
import { nonFloatingToolbarClassName } from '#app/components/floating-toolbar.tsx'
import { ErrorList, Field, ToggleField } from '#app/components/forms.tsx'
import { Button } from '#app/components/ui/button.tsx'
import { StatusButton } from '#app/components/ui/status-button.tsx'
import { cn, useIsPending } from '#app/utils/misc.tsx'
import {
	CheckboxFieldSchema,
	StringMinMaxLengthSchema,
} from '#app/utils/zod-helpers.tsx'
import { DashboardAboutIntent } from './about.index'

export const AboutCategoryEditorSchema = z.object({
	id: z.string().optional(),
	name: StringMinMaxLengthSchema(1, 100),
	description: StringMinMaxLengthSchema(1, 500).optional().nullable(),
	isPublished: CheckboxFieldSchema.default(false),
})

export function AboutCategoryEditor({
	category,
	actionData,
	onClose,
}: {
	category?: {
		id: string
		name: string
		description: string | null
		isPublished: boolean
	} | null
	actionData?: { result: any }
	onClose?: () => void
}) {
	const isPending = useIsPending()

	const [form, fields] = useForm({
		id: 'about-category-editor',
		constraint: getZodConstraint(AboutCategoryEditorSchema),
		lastResult: actionData?.result,
		onValidate({ formData }) {
			return parseWithZod(formData, { schema: AboutCategoryEditorSchema })
		},
		defaultValue: {
			...category,
			isPublished:
				category?.isPublished === undefined ? true : category.isPublished,
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
					{category?.id ? (
						<input type="hidden" name="id" value={category.id} />
					) : null}

					<div className="flex flex-col gap-1">
						<Field
							labelProps={{ children: 'Name' }}
							inputProps={{
								autoFocus: true,
								...getInputProps(fields.name, { type: 'text' }),
								placeholder: 'Enter category name',
							}}
							errors={fields.name.errors}
						/>

						<Field
							labelProps={{ children: 'Description (Optional)' }}
							inputProps={{
								...getInputProps(fields.description, { type: 'text' }),
								placeholder: 'Brief description of this category',
							}}
							errors={fields.description.errors}
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
					{onClose && (
						<Button
							type="button"
							variant="outline"
							onClick={onClose}
							disabled={isPending}
						>
							Cancel
						</Button>
					)}
					<Button
						variant="destructive"
						{...form.reset.getButtonProps()}
						disabled={isPending}
					>
						Reset
					</Button>
					<StatusButton
						form={form.id}
						type="submit"
						name="intent"
						value={
							category?.id
								? DashboardAboutIntent.CATEGORY_UPDATE
								: DashboardAboutIntent.CATEGORY_CREATE
						}
						disabled={isPending}
						status={isPending ? 'pending' : 'idle'}
					>
						{category?.id ? 'Save Changes' : 'Create Category'}
					</StatusButton>
					{category?.id ? (
						<StatusButton
							form={form.id}
							type="submit"
							name="intent"
							value={DashboardAboutIntent.CATEGORY_DELETE}
							variant="destructive"
							disabled={isPending}
							status={isPending ? 'pending' : 'idle'}
							onClick={(e) => {
								if (
									!confirm(
										'Are you sure you want to delete this category? This will also delete all associated About Me sections.',
									)
								) {
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
