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
import { type Route } from './+types/about.$aboutId.ts'

export const handle: SEOHandle = {
	getSitemapEntries: () => null,
}

export async function loader({ request, params }: LoaderFunctionArgs) {
	const userId = await requireUserId(request)
	const { aboutId } = params

	invariantResponse(aboutId, 'About ID is required')

	const aboutMe = await prisma.aboutMe.findFirst({
		where: {
			id: aboutId,
			userId,
		},
		select: {
			id: true,
			name: true,
			content: true,
			description: true,
			isPublished: true,
			aboutMeCategoryId: true,
			aboutMeCategory: {
				select: {
					name: true,
				},
			},
		},
	})

	invariantResponse(aboutMe, 'About Me item not found', { status: 404 })

	return { aboutMe }
}

export default function DashboardAboutDetailsRoute({
	loaderData,
}: Route.ComponentProps) {
	const { aboutMe } = loaderData

	return (
		<AppContainerContent id="about-details-content" className="container py-6">
			<AppContainerGroup className="px-0">
				<EntityDetailsLinks backLabel="Back to Abouts" />
			</AppContainerGroup>

			<AppContainerGroup className="px-0">
				<h1 className="text-2xl font-bold">{aboutMe.name}</h1>
			</AppContainerGroup>

			<AppContainerGroup className="px-0">
				<EntityDetailsCard id="about-details-card">
					<CardDetailsItem label="Content">
						<CardDetailsValue variant="prose">
							{aboutMe.content}
						</CardDetailsValue>
					</CardDetailsItem>

					<CardDetailsItem label="Description">
						<CardDetailsValue variant="prose">
							{aboutMe.description ?? 'No description'}
						</CardDetailsValue>
					</CardDetailsItem>

					<CardDetailsItem label="Category">
						<CardDetailsValue>{aboutMe.aboutMeCategory.name}</CardDetailsValue>
					</CardDetailsItem>

					<CardDetailsItem label="Status">
						<CardDetailsValue>
							{aboutMe.isPublished ? 'Published' : 'Draft'}
						</CardDetailsValue>
					</CardDetailsItem>
				</EntityDetailsCard>
			</AppContainerGroup>
		</AppContainerContent>
	)
}

export const meta: Route.MetaFunction = ({ data }) => {
	const aboutMeName = data?.aboutMe?.name ?? 'About Me'
	return [
		{ title: `${aboutMeName} | Dashboard` },
		{
			name: 'description',
			content: `Details for ${aboutMeName}`,
		},
	]
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
