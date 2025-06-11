import { type SEOHandle } from '@nasa-gcn/remix-seo'
import { type LoaderFunctionArgs, useActionData } from 'react-router'
import {
	AppContainerContent,
	AppContainerGroup,
} from '#app/components/app-container.tsx'
import { BackLink } from '#app/components/button-links.tsx'
import { GeneralErrorBoundary } from '#app/components/error-boundary.tsx'
import { requireUserId } from '#app/utils/auth.server.ts'
import { type Route } from './+types/projects.new.ts'
import { type action as projectEditorAction } from './__project-editor.server.tsx'
import { ProjectEditor } from './__project-editor.tsx'

export { action } from './__project-editor.server.tsx'

export const handle: SEOHandle = {
	getSitemapEntries: () => null,
}

export async function loader({ request }: LoaderFunctionArgs) {
	await requireUserId(request)

	return {}
}

export default function DashboardProjectsNewRoute({}: Route.ComponentProps) {
	const actionData = useActionData<typeof projectEditorAction>()

	return (
		<AppContainerContent id="project-new-content" className="container py-6">
			<AppContainerGroup className="px-0">
				<BackLink label="Back to Projects" className="self-start" />
			</AppContainerGroup>

			<AppContainerGroup className="px-0">
				<h1 className="text-2xl font-bold">Create New Project</h1>
			</AppContainerGroup>

			<AppContainerGroup className="px-0">
				<ProjectEditor actionData={actionData} />
			</AppContainerGroup>
		</AppContainerContent>
	)
}

export const meta: Route.MetaFunction = () => {
	return [
		{ title: 'Create Project | Dashboard' },
		{
			name: 'description',
			content: 'Create a new project',
		},
	]
}

export function ErrorBoundary() {
	return <GeneralErrorBoundary />
}
