import { invariantResponse } from '@epic-web/invariant'
import { type SEOHandle } from '@nasa-gcn/remix-seo'
import { type LoaderFunctionArgs, type MetaFunction } from 'react-router'
import {
	AppContainerContent,
	AppContainerGroup,
} from '#app/components/app-container.tsx'
import { GeneralErrorBoundary } from '#app/components/error-boundary.tsx'
import { requireUserId } from '#app/utils/auth.server.ts'
import { prisma } from '#app/utils/db.server.ts'
import { type Route } from './+types/about.$aboutId_.edit.ts'
import { AboutEditor } from './__about-editor.tsx'

export { action } from './__about-editor.server.tsx'

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
		},
	})
	invariantResponse(aboutMe, 'About Me item not found', { status: 404 })

	const categories = await prisma.aboutMeCategory.findMany({
		where: { isPublished: true },
		select: {
			id: true,
			name: true,
		},
		orderBy: { name: 'asc' },
	})

	return { aboutMe, categories }
}

export default function DashboardAboutEditRoute({
	loaderData,
	actionData,
}: Route.ComponentProps) {
	const { aboutMe, categories } = loaderData

	return (
		<AppContainerContent
			id="about-edit-content"
			className="container h-full py-6"
		>
			<AppContainerGroup className="h-full">
				<AboutEditor
					aboutMe={aboutMe}
					categories={categories}
					actionData={actionData}
				/>
			</AppContainerGroup>
		</AppContainerContent>
	)
}

export const meta: MetaFunction<typeof loader> = ({ data }) => {
	const aboutMeName = data?.aboutMe?.name ?? 'About Me Item'
	return [
		{ title: `Edit ${aboutMeName} | Dashboard` },
		{
			name: 'description',
			content: `Edit ${aboutMeName} details`,
		},
	]
}

export function ErrorBoundary() {
	return (
		<GeneralErrorBoundary
			statusHandlers={{
				404: ({ params }) => (
					<p>About Me item with id "{params.aboutId}" not found.</p>
				),
			}}
		/>
	)
}
