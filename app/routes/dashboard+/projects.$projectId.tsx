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
import { ExternalIconLink } from '#app/components/external-icon-link.tsx'
import { CardDetailsValue, CardDetailsItem } from '#app/components/ui/card.tsx'
import { requireUserId } from '#app/utils/auth.server.ts'
import { prisma } from '#app/utils/db.server.ts'
import { type Route } from './+types/projects.$projectId.ts'

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
			isPublished: true,
			liveDemoUrl: true,
			sourceCodeUrl: true,
			comments: true,
			createdAt: true,
			updatedAt: true,
			_count: {
				select: {
					skills: true,
				},
			},
		},
	})

	invariantResponse(project, 'Project not found', { status: 404 })

	return { project }
}

export default function DashboardProjectDetailsRoute({
	loaderData,
}: Route.ComponentProps) {
	const { project } = loaderData

	return (
		<AppContainerContent
			id="project-details-content"
			className="container py-6"
		>
			<AppContainerGroup className="px-0">
				<EntityDetailsLinks backLabel="Back to Projects" />
			</AppContainerGroup>

			<AppContainerGroup className="px-0">
				<h1 className="text-2xl font-bold">{project.title}</h1>
			</AppContainerGroup>

			<AppContainerGroup className="px-0">
				<EntityDetailsCard id="project-details-card">
					<CardDetailsItem label="Description">
						<CardDetailsValue variant="prose">
							{project.description}
						</CardDetailsValue>
					</CardDetailsItem>

					{project.liveDemoUrl ? (
						<CardDetailsItem label="Live Demo URL">
							<CardDetailsValue>
								<ExternalIconLink href={project.liveDemoUrl} />
							</CardDetailsValue>
						</CardDetailsItem>
					) : null}

					{project.sourceCodeUrl ? (
						<CardDetailsItem label="Source Code URL">
							<CardDetailsValue>
								<ExternalIconLink href={project.sourceCodeUrl} />
							</CardDetailsValue>
						</CardDetailsItem>
					) : null}

					{project.comments ? (
						<CardDetailsItem label="Comments">
							<CardDetailsValue variant="prose">
								{project.comments}
							</CardDetailsValue>
						</CardDetailsItem>
					) : null}

					<CardDetailsItem label="Skills Count">
						<CardDetailsValue>{project._count.skills}</CardDetailsValue>
					</CardDetailsItem>

					<CardDetailsItem label="Status">
						<CardDetailsValue>
							{project.isPublished ? 'Published' : 'Draft'}
						</CardDetailsValue>
					</CardDetailsItem>

					<CardDetailsItem label="Created">
						<CardDetailsValue>
							{new Date(project.createdAt).toLocaleDateString()}
						</CardDetailsValue>
					</CardDetailsItem>

					<CardDetailsItem label="Last Updated">
						<CardDetailsValue>
							{new Date(project.updatedAt).toLocaleDateString()}
						</CardDetailsValue>
					</CardDetailsItem>
				</EntityDetailsCard>
			</AppContainerGroup>
		</AppContainerContent>
	)
}

export const meta: Route.MetaFunction = ({ data }) => {
	const projectTitle = data?.project?.title ?? 'Project'
	return [
		{ title: `${projectTitle} | Dashboard` },
		{
			name: 'description',
			content: `Details for ${projectTitle}`,
		},
	]
}

export function ErrorBoundary() {
	return (
		<GeneralErrorBoundary
			statusHandlers={{
				404: () => <p>Project not found.</p>,
			}}
		/>
	)
}
