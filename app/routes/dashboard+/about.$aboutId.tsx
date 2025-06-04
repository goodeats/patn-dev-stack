import { invariantResponse } from '@epic-web/invariant'
import { type LoaderFunctionArgs } from 'react-router'
import {
	AppContainerContent,
	AppContainerGroup,
} from '#app/components/app-container.tsx'
import { BackLink, EditLink } from '#app/components/button-links.tsx'
import { GeneralErrorBoundary } from '#app/components/error-boundary.tsx'
import {
	Card,
	CardContent,
	CardTitle,
	CardHeader,
	CardDescription,
	CardDetailsValue,
	CardDetailsItem,
} from '#app/components/ui/card.tsx'
import { APP_NAME } from '#app/utils/app-name.ts'
import { requireUserId } from '#app/utils/auth.server.ts'
import { prisma } from '#app/utils/db.server.ts'
import { type Route } from './+types/about.$aboutId.ts'

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
				<div className="mb-6 flex items-center justify-between">
					<BackLink label="Back to Abouts" />
					<EditLink />
				</div>
			</AppContainerGroup>

			<AppContainerGroup className="px-0">
				<Card>
					<CardHeader>
						<CardTitle className="text-2xl">{aboutMe.name}</CardTitle>
						<CardDescription>
							{aboutMe.description ?? 'No description'}
						</CardDescription>
					</CardHeader>
					<CardContent variant="details">
						<CardDetailsItem label="Content">
							<CardDetailsValue variant="prose">
								{aboutMe.content}
							</CardDetailsValue>
						</CardDetailsItem>

						<CardDetailsItem label="Category">
							<CardDetailsValue>
								{aboutMe.aboutMeCategory.name}
							</CardDetailsValue>
						</CardDetailsItem>

						<CardDetailsItem label="Status">
							<CardDetailsValue>
								{aboutMe.isPublished ? 'Published' : 'Draft'}
							</CardDetailsValue>
						</CardDetailsItem>
					</CardContent>
				</Card>
			</AppContainerGroup>
		</AppContainerContent>
	)
}

export const meta: Route.MetaFunction = ({ data }) => {
	const aboutMeName = data?.aboutMe?.name ?? 'About Me'
	return [
		{ title: `${aboutMeName} | Dashboard | ${APP_NAME}` },
		{
			name: 'description',
			content: `Details for ${aboutMeName} on ${APP_NAME}`,
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
