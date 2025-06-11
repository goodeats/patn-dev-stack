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
import { type Route } from './+types/skills.$skillId.ts'

export const handle: SEOHandle = {
	getSitemapEntries: () => null,
}

export async function loader({ request, params }: LoaderFunctionArgs) {
	const userId = await requireUserId(request)
	const { skillId } = params

	invariantResponse(skillId, 'Skill ID is required')

	const skill = await prisma.skill.findFirst({
		where: {
			id: skillId,
			userId,
		},
		select: {
			id: true,
			name: true,
			description: true,
			icon: true,
			isPublished: true,
			skillCategoryId: true,
			skillCategory: {
				select: {
					name: true,
				},
			},
		},
	})

	invariantResponse(skill, 'Skill item not found', { status: 404 })

	return { skill }
}

export default function DashboardSkillDetailsRoute({
	loaderData,
}: Route.ComponentProps) {
	const { skill } = loaderData

	return (
		<AppContainerContent id="skill-details-content" className="container py-6">
			<AppContainerGroup className="px-0">
				<EntityDetailsLinks backLabel="Back to Skills" />
			</AppContainerGroup>

			<AppContainerGroup className="px-0">
				<h1 className="text-2xl font-bold">{skill.name}</h1>
			</AppContainerGroup>

			<AppContainerGroup className="px-0">
				<EntityDetailsCard id="skill-details-card">
					<CardDetailsItem label="Description">
						<CardDetailsValue variant="prose">
							{skill.description ?? 'No description'}
						</CardDetailsValue>
					</CardDetailsItem>

					<CardDetailsItem label="Icon">
						<CardDetailsValue>{skill.icon ?? 'No icon'}</CardDetailsValue>
					</CardDetailsItem>

					<CardDetailsItem label="Category">
						<CardDetailsValue>{skill.skillCategory.name}</CardDetailsValue>
					</CardDetailsItem>

					<CardDetailsItem label="Status">
						<CardDetailsValue>
							{skill.isPublished ? 'Published' : 'Draft'}
						</CardDetailsValue>
					</CardDetailsItem>
				</EntityDetailsCard>
			</AppContainerGroup>
		</AppContainerContent>
	)
}

export const meta: Route.MetaFunction = ({ data }) => {
	const skillName = data?.skill?.name ?? 'Skill'
	return [
		{ title: `${skillName} | Dashboard` },
		{
			name: 'description',
			content: `Details for ${skillName}`,
		},
	]
}

export function ErrorBoundary() {
	return (
		<GeneralErrorBoundary
			statusHandlers={{
				404: () => <p>Skill item not found.</p>,
			}}
		/>
	)
}
