import { type SEOHandle } from '@nasa-gcn/remix-seo'
import { type LoaderFunctionArgs, useActionData } from 'react-router'
import {
	AppContainerContent,
	AppContainerGroup,
} from '#app/components/app-container.tsx'
import { BackLink } from '#app/components/button-links.tsx'
import { GeneralErrorBoundary } from '#app/components/error-boundary.tsx'
import { requireUserId } from '#app/utils/auth.server.ts'
import { prisma } from '#app/utils/db.server.ts'
import { type Route } from './+types/about.new.ts'
import { type action as aboutEditorAction } from './__about-editor.server.tsx'
import { AboutEditor } from './__about-editor.tsx'

export { action } from './__about-editor.server.tsx'

export const handle: SEOHandle = {
	getSitemapEntries: () => null,
}

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

export default function DashboardAboutNewRoute({
	loaderData,
}: Route.ComponentProps) {
	const { categories } = loaderData
	const actionData = useActionData<typeof aboutEditorAction>()

	return (
		<AppContainerContent id="about-new-content" className="container py-6">
			<AppContainerGroup className="px-0">
				<BackLink label="Back to Abouts" className="self-start" />
			</AppContainerGroup>

			<AppContainerGroup className="px-0">
				<h1 className="text-2xl font-bold">Create New About</h1>
			</AppContainerGroup>

			<AppContainerGroup className="px-0">
				<AboutEditor categories={categories} actionData={actionData} />
			</AppContainerGroup>
		</AppContainerContent>
	)
}

export const meta: Route.MetaFunction = () => {
	return [
		{ title: `Create About Me | Dashboard ` },
		{
			name: 'description',
			content: `Create a new About Me section`,
		},
	]
}

export function ErrorBoundary() {
	return <GeneralErrorBoundary />
}
