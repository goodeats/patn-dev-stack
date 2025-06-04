import {
	type LoaderFunctionArgs,
	useLoaderData,
	useActionData,
} from 'react-router'
import {
	AppContainerContent,
	AppContainerGroup,
} from '#app/components/app-container.tsx'
import { GeneralErrorBoundary } from '#app/components/error-boundary.tsx'
import { APP_NAME } from '#app/utils/app-name.ts'
import { requireUserId } from '#app/utils/auth.server.ts'
import { prisma } from '#app/utils/db.server.ts'
import { type Route } from './+types/about.new.ts'
import { type action as aboutEditorAction } from './__about-editor.server.tsx'
import { AboutEditor } from './__about-editor.tsx'

export { action } from './__about-editor.server.tsx'

export async function loader({ request }: LoaderFunctionArgs) {
	await requireUserId(request)

	const categories = await prisma.aboutMeCategory.findMany({
		where: { isPublished: true },
		select: {
			id: true,
			name: true,
		},
		orderBy: { name: 'asc' },
	})

	return { categories }
}

export default function DashboardAboutNewRoute() {
	const { categories } = useLoaderData<typeof loader>()
	const actionData = useActionData<typeof aboutEditorAction>()

	return (
		<AppContainerContent
			id="about-new-content"
			className="container h-full py-6"
		>
			<AppContainerGroup className="h-full">
				<AboutEditor categories={categories} actionData={actionData} />
			</AppContainerGroup>
		</AppContainerContent>
	)
}

export const meta: Route.MetaFunction = () => {
	return [
		{ title: `Create About Me | Dashboard | ${APP_NAME}` },
		{
			name: 'description',
			content: `Create a new About Me section on ${APP_NAME}`,
		},
	]
}

export function ErrorBoundary() {
	return <GeneralErrorBoundary />
}
