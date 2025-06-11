import { parseWithZod } from '@conform-to/zod'
import { invariantResponse } from '@epic-web/invariant'
import { createId as cuid } from '@paralleldrive/cuid2'
import { type ActionFunctionArgs, data, redirect } from 'react-router'
import { requireUserId } from '#app/utils/auth.server.ts'
import { prisma } from '#app/utils/db.server.ts'
import { redirectWithToast } from '#app/utils/toast.server.ts'
import { ContactEditorSchema } from './__contact-editor'
import { DashboardContactIntent } from './contacts.index'

export async function action({ request }: ActionFunctionArgs) {
	const userId = await requireUserId(request)
	const formData = await request.formData()
	const intent = formData.get('intent')

	if (intent === DashboardContactIntent.CONTACT_DELETE) {
		const contactId = formData.get('id')
		invariantResponse(typeof contactId === 'string', 'Contact ID is required')

		const deleted = await prisma.socialLink.delete({
			where: { id: contactId, userId: userId },
		})

		if (!deleted) {
			return redirectWithToast('/dashboard/contact', {
				title: 'Contact not found',
				description: 'The contact was not found.',
			})
		}

		return redirectWithToast('/dashboard/contact', {
			title: `${deleted.text} deleted`,
			description: 'The contact has been deleted successfully.',
		})
	}

	const submission = await parseWithZod(formData, {
		schema: ContactEditorSchema.superRefine(async (val, ctx) => {
			if (!val.id) return // New item, no server-side owner check needed yet

			const existingContact = await prisma.socialLink.findUnique({
				where: { id: val.id, userId },
				select: { id: true },
			})
			if (!existingContact) {
				ctx.addIssue({
					code: 'custom',
					message: 'Contact item not found or not owned by user',
					path: ['id'],
				})
			}
		}).transform(async (data) => {
			const contactId = data.id ?? cuid()
			return {
				...data,
				id: contactId,
			}
		}),
		async: true,
	})

	if (submission.status !== 'success') {
		return data(
			{ result: submission.reply() },
			{ status: submission.status === 'error' ? 400 : 200 },
		)
	}

	const {
		id: contactId,
		text,
		label,
		href,
		icon,
		isPublished = false,
	} = submission.value

	const contactData = {
		text,
		label,
		href,
		icon,
		isPublished,
	}

	const updatedContact = await prisma.socialLink.upsert({
		select: { id: true },
		where: { id: contactId },
		create: {
			id: contactId,
			userId,
			...contactData,
		},
		update: contactData,
	})

	return redirect(`/dashboard/contacts/${updatedContact.id}`)
}
