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
import { type Route } from './+types/projects.$projectId_.edit.ts'
import { ProjectEditor } from './__project-editor.tsx'

export { action } from './__project-editor.server.tsx'

export const handle: SEOHandle = {
	getSitemapEntries: () => null,
}

export async function loader({ request, params }: LoaderFunctionArgs) {
	const userId = await requireUserId(request)
	const { projectId } = params
	invariantResponse(projectId, 'Project ID is required')

	const project = await prisma.project.findFirst({
		where: {
			id: projectId,
			userId,
		},
		select: {
			id: true,
			title: true,
			description: true,
			liveDemoUrl: true,
			sourceCodeUrl: true,
			isPublished: true,
			comments: true,
		},
	})
	invariantResponse(project, 'Project not found', { status: 404 })

	return { project }
}

export default function DashboardProjectEditRoute({
	loaderData,
	actionData,
}: Route.ComponentProps) {
	const { project } = loaderData

	return (
		<AppContainerContent id="project-edit-content" className="container py-6">
			<AppContainerGroup className="px-0">
				<BackLink label="Back to Project" className="self-start" />
			</AppContainerGroup>

			<AppContainerGroup className="px-0">
				<h1 className="text-2xl font-bold">Edit {project.title}</h1>
			</AppContainerGroup>

			<AppContainerGroup className="px-0">
				<ProjectEditor project={project} actionData={actionData} />
			</AppContainerGroup>
		</AppContainerContent>
	)
}

export const meta: MetaFunction<typeof loader> = ({ data }) => {
	const projectTitle = data?.project?.title ?? 'Project'
	return [
		{ title: `Edit ${projectTitle} | Dashboard` },
		{
			name: 'description',
			content: `Edit ${projectTitle} details`,
		},
	]
}

export function ErrorBoundary() {
	return (
		<GeneralErrorBoundary
			statusHandlers={{
				404: ({ params }) => (
					<p>Project with id "{params.projectId}" not found.</p>
				),
			}}
		/>
	)
}
