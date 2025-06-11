import { type SEOHandle } from '@nasa-gcn/remix-seo'
import { type LoaderFunctionArgs, useActionData } from 'react-router'
import {
	AppContainerContent,
	AppContainerGroup,
} from '#app/components/app-container.tsx'
import { BackLink } from '#app/components/button-links.tsx'
import { GeneralErrorBoundary } from '#app/components/error-boundary.tsx'
import { requireUserId } from '#app/utils/auth.server.ts'
import { type Route } from './+types/contacts.new.ts'
import { type action as contactEditorAction } from './__contact-editor.server.tsx'
import { ContactEditor } from './__contact-editor.tsx'

export { action } from './__skill-editor.server.tsx'

export const handle: SEOHandle = {
	getSitemapEntries: () => null,
}

export async function loader({ request }: LoaderFunctionArgs) {
	await requireUserId(request)

	return {}
}

export default function DashboardContactsNewRoute({}: Route.ComponentProps) {
	const actionData = useActionData<typeof contactEditorAction>()

	return (
		<AppContainerContent id="skill-new-content" className="container py-6">
			<AppContainerGroup className="px-0">
				<BackLink label="Back to Skills" className="self-start" />
			</AppContainerGroup>

			<AppContainerGroup className="px-0">
				<h1 className="text-2xl font-bold">Create New Skill</h1>
			</AppContainerGroup>

			<AppContainerGroup className="px-0">
				<ContactEditor actionData={actionData} />
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
