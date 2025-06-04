import { invariantResponse } from '@epic-web/invariant'
import { type LoaderFunctionArgs, Link, useLoaderData } from 'react-router'
import {
	AppContainerContent,
	AppContainerGroup,
} from '#app/components/app-container.tsx'
import { GeneralErrorBoundary } from '#app/components/error-boundary.tsx'
import { Button } from '#app/components/ui/button.tsx'
import {
	Card,
	CardContent,
	CardTitle,
	CardHeader,
	CardDescription,
} from '#app/components/ui/card.tsx'
import { Icon } from '#app/components/ui/icon.tsx'
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

	console.log('about.$aboutId server - view mode')

	return { aboutMe }
}

export default function DashboardAboutDetailsRoute() {
	const { aboutMe } = useLoaderData<typeof loader>()

	console.log('about.$aboutId client - view mode')

	return (
		<AppContainerContent id="about-details-content" className="container py-6">
			<AppContainerGroup className="px-0">
				<div className="mb-6 flex items-center justify-between">
					<h1 className="text-2xl font-bold">{aboutMe.name}</h1>
					<div className="flex gap-2">
						<Link to={`/dashboard/about/${aboutMe.id}/edit`}>
							<Button variant="outline" size="sm">
								<Icon name="pencil-1" className="mr-2" />
								Edit
							</Button>
						</Link>
						<Link to="/dashboard/about">
							<Button variant="ghost" size="sm">
								<Icon name="arrow-left" className="mr-2" />
								Back to List
							</Button>
						</Link>
					</div>
				</div>

				<Card>
					<CardHeader>
						<CardTitle className="text-2xl">{aboutMe.name}</CardTitle>
						<CardDescription>
							{aboutMe.description ?? 'No description'}
						</CardDescription>
					</CardHeader>
					<CardContent className="flex flex-col gap-4 md:grid md:grid-cols-[minmax(120px,auto)_1fr] md:items-baseline md:gap-x-8 md:gap-y-6">
						<h3 className="text-foreground text-base font-medium">Content</h3>
						<p className="prose prose-sm text-muted-foreground sm:prose-base max-w-none text-sm break-words whitespace-pre-wrap">
							{aboutMe.content}
						</p>

						<h3 className="text-foreground text-base font-medium">Category</h3>
						<p className="text-muted-foreground text-sm">
							{aboutMe.aboutMeCategory.name}
						</p>

						<h3 className="text-foreground text-base font-medium">Status</h3>
						<p className="text-muted-foreground text-sm">
							{aboutMe.isPublished ? 'Published' : 'Draft'}
						</p>
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
