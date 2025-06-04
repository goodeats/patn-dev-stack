import { invariantResponse } from '@epic-web/invariant'
import {
	type LoaderFunctionArgs,
	useLoaderData,
	useActionData,
	type MetaFunction,
} from 'react-router'
import {
	AppContainerContent,
	AppContainerGroup,
} from '#app/components/app-container.tsx'
import { GeneralErrorBoundary } from '#app/components/error-boundary.tsx'
import { APP_NAME } from '#app/utils/app-name.ts'
import { requireUserId } from '#app/utils/auth.server.ts'
import { prisma } from '#app/utils/db.server.ts'
// Assuming a +types file might not be strictly necessary if we type inline or it's conventional
// import { type Route } from './+types/about.$aboutId.edit.ts'
import { type action as aboutEditorAction } from './__about-editor.server.tsx'
import { AboutEditor } from './__about-editor.tsx'

export { action } from './__about-editor.server.tsx'

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
		where: { isPublished: true }, // Consider if all categories should be shown for admin regardless of published status
		select: {
			id: true,
			name: true,
		},
		orderBy: { name: 'asc' },
	})

	return { aboutMe, categories }
}

export default function DashboardAboutEditRoute() {
	const { aboutMe, categories } = useLoaderData<typeof loader>()
	const actionData = useActionData<typeof aboutEditorAction>()

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
		{ title: `Edit ${aboutMeName} | Dashboard | ${APP_NAME}` },
		{
			name: 'description',
			content: `Edit ${aboutMeName} on ${APP_NAME}`,
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
