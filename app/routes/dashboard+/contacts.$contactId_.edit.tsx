import { invariantResponse } from '@epic-web/invariant'
import { type SEOHandle } from '@nasa-gcn/remix-seo'
import { type LoaderFunctionArgs, type MetaFunction } from 'react-router'
import {
	AppContainerContent,
	AppContainerGroup,
} from '#app/components/app-container.tsx'
import { BackLink } from '#app/components/button-links.tsx'
import { GeneralErrorBoundary } from '#app/components/error-boundary.tsx'
import { requireUserId } from '#app/utils/auth.server.ts'
import { prisma } from '#app/utils/db.server.ts'
import { type Route } from './+types/contacts.$contactId_.edit.ts'
import { ContactEditor } from './__contact-editor.tsx'

export { action } from './__contact-editor.server.tsx'

export const handle: SEOHandle = {
	getSitemapEntries: () => null,
}

export async function loader({ request, params }: LoaderFunctionArgs) {
	const userId = await requireUserId(request)
	const { contactId } = params
	invariantResponse(contactId, 'Contact ID is required')

	const contact = await prisma.socialLink.findFirst({
		where: {
			id: contactId,
			userId,
		},
		select: {
			id: true,
			text: true,
			label: true,
			href: true,
			icon: true,
			isPublished: true,
		},
	})
	invariantResponse(contact, 'Contact not found', { status: 404 })

	return { contact }
}

export default function DashboardContactEditRoute({
	loaderData,
	actionData,
}: Route.ComponentProps) {
	const { contact } = loaderData

	return (
		<AppContainerContent id="contact-edit-content" className="container py-6">
			<AppContainerGroup className="px-0">
				<BackLink label="Back to Contact" className="self-start" />
			</AppContainerGroup>

			<AppContainerGroup className="px-0">
				<h1 className="text-2xl font-bold">Edit {contact.text}</h1>
			</AppContainerGroup>

			<AppContainerGroup className="px-0">
				<ContactEditor contact={contact} actionData={actionData} />
			</AppContainerGroup>
		</AppContainerContent>
	)
}

export const meta: MetaFunction<typeof loader> = ({ data }) => {
	const contactName = data?.contact?.text ?? 'Contact'
	return [
		{ title: `Edit ${contactName} | Dashboard` },
		{
			name: 'description',
			content: `Edit ${contactName} details`,
		},
	]
}

export function ErrorBoundary() {
	return (
		<GeneralErrorBoundary
			statusHandlers={{
				404: ({ params }) => (
					<p>Contact with id "{params.contactId}" not found.</p>
				),
			}}
		/>
	)
}
