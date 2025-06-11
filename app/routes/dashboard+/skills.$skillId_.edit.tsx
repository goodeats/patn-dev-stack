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
import { type Route } from './+types/skills.$skillId_.edit.ts'
import { SkillEditor } from './__skill-editor.tsx'

export { action } from './__skill-editor.server.tsx'

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
			isPublished: true,
			skillCategoryId: true,
		},
	})
	invariantResponse(skill, 'Skill not found', { status: 404 })

	const categories = await prisma.skillCategory.findMany({
		where: { isPublished: true },
		select: {
			id: true,
			name: true,
		},
		orderBy: { name: 'asc' },
	})

	return { skill, categories }
}

export default function DashboardSkillEditRoute({
	loaderData,
	actionData,
}: Route.ComponentProps) {
	const { skill, categories } = loaderData

	return (
		<AppContainerContent id="skill-edit-content" className="container py-6">
			<AppContainerGroup className="px-0">
				<BackLink label="Back to Skill" className="self-start" />
			</AppContainerGroup>

			<AppContainerGroup className="px-0">
				<h1 className="text-2xl font-bold">Edit {skill.name}</h1>
			</AppContainerGroup>

			<AppContainerGroup className="px-0">
				<SkillEditor
					skill={skill}
					categories={categories}
					actionData={actionData}
				/>
			</AppContainerGroup>
		</AppContainerContent>
	)
}

export const meta: MetaFunction<typeof loader> = ({ data }) => {
	const skillName = data?.skill?.name ?? 'Skill'
	return [
		{ title: `Edit ${skillName} | Dashboard` },
		{
			name: 'description',
			content: `Edit ${skillName} details`,
		},
	]
}

export function ErrorBoundary() {
	return (
		<GeneralErrorBoundary
			statusHandlers={{
				404: ({ params }) => <p>Skill with id "{params.skillId}" not found.</p>,
			}}
		/>
	)
}
