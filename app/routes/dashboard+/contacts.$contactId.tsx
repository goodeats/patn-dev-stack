import { invariantResponse } from '@epic-web/invariant'
import { type SEOHandle } from '@nasa-gcn/remix-seo'
import { type LoaderFunctionArgs } from 'react-router'
import {
	AppContainerContent,
	AppContainerGroup,
} from '#app/components/app-container.tsx'
import {
	EntityDetailsCard,
	EntityDetailsLinks,
} from '#app/components/entity-details.tsx'
import { GeneralErrorBoundary } from '#app/components/error-boundary.tsx'
import { CardDetailsValue, CardDetailsItem } from '#app/components/ui/card.tsx'
import { requireUserId } from '#app/utils/auth.server.ts'
import { prisma } from '#app/utils/db.server.ts'
import { type Route } from './+types/contacts.$contactId.ts'

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
			href: true,
			icon: true,
			label: true,
			text: true,
			isPublished: true,
		},
	})

	invariantResponse(contact, 'Contact item not found', { status: 404 })

	return { contact }
}

export default function DashboardContactDetailsRoute({
	loaderData,
}: Route.ComponentProps) {
	const { contact } = loaderData

	return (
		<AppContainerContent
			id="contact-details-content"
			className="container py-6"
		>
			<AppContainerGroup className="px-0">
				<EntityDetailsLinks backLabel="Back to Contacts" />
			</AppContainerGroup>

			<AppContainerGroup className="px-0">
				<h1 className="text-2xl font-bold">{contact.text}</h1>
			</AppContainerGroup>

			<AppContainerGroup className="px-0">
				<EntityDetailsCard id="contact-details-card">
					<CardDetailsItem label="URL">
						<CardDetailsValue variant="prose">{contact.href}</CardDetailsValue>
					</CardDetailsItem>

					<CardDetailsItem label="Icon">
						<CardDetailsValue>{contact.icon}</CardDetailsValue>
					</CardDetailsItem>

					<CardDetailsItem label="Label">
						<CardDetailsValue>{contact.label}</CardDetailsValue>
					</CardDetailsItem>

					<CardDetailsItem label="Status">
						<CardDetailsValue>
							{contact.isPublished ? 'Published' : 'Draft'}
						</CardDetailsValue>
					</CardDetailsItem>
				</EntityDetailsCard>
			</AppContainerGroup>
		</AppContainerContent>
	)
}

export const meta: Route.MetaFunction = ({ data }) => {
	const contactText = data?.contact?.text ?? 'Contact'
	return [
		{ title: `${contactText} | Dashboard` },
		{
			name: 'description',
			content: `Details for ${contactText}`,
		},
	]
}

export function ErrorBoundary() {
	return (
		<GeneralErrorBoundary
			statusHandlers={{
				404: () => <p>Contact item not found.</p>,
			}}
		/>
	)
}
