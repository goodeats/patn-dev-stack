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
import { type Route } from './+types/skills.new.ts'
import { type action as skillEditorAction } from './__skill-editor.server.tsx'
import { SkillEditor } from './__skill-editor.tsx'

export { action } from './__skill-editor.server.tsx'

export const handle: SEOHandle = {
	getSitemapEntries: () => null,
}

export async function loader({ request }: LoaderFunctionArgs) {
	await requireUserId(request)

	const categories = await prisma.skillCategory.findMany({
		where: { isPublished: true },
		select: {
			id: true,
			name: true,
		},
		orderBy: { name: 'asc' },
	})

	return { categories }
}

export default function DashboardSkillNewRoute({
	loaderData,
}: Route.ComponentProps) {
	const { categories } = loaderData
	const actionData = useActionData<typeof skillEditorAction>()

	return (
		<AppContainerContent id="skill-new-content" className="container py-6">
			<AppContainerGroup className="px-0">
				<BackLink label="Back to Skills" className="self-start" />
			</AppContainerGroup>

			<AppContainerGroup className="px-0">
				<h1 className="text-2xl font-bold">Create New Skill</h1>
			</AppContainerGroup>

			<AppContainerGroup className="px-0">
				<SkillEditor categories={categories} actionData={actionData} />
			</AppContainerGroup>
		</AppContainerContent>
	)
}

export const meta: Route.MetaFunction = () => {
	return [
		{ title: 'Create Skill | Dashboard' },
		{
			name: 'description',
			content: 'Create a new skill',
		},
	]
}

export function ErrorBoundary() {
	return <GeneralErrorBoundary />
}
