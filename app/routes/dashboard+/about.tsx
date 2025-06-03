import * as React from 'react'
import { Outlet } from 'react-router'
import {
	AppContainerContent,
	AppContainerGroup,
} from '#app/components/app-container.tsx'
import { GeneralErrorBoundary } from '#app/components/error-boundary.tsx'
import { APP_NAME } from '#app/utils/app-name.ts'
import { type Route } from './+types/about.ts'

export default function DashboardAboutLayoutRoute() {
	return (
		<AppContainerContent id="about-layout-content" className="container py-6">
			<AppContainerGroup>
				<Outlet />
			</AppContainerGroup>
		</AppContainerContent>
	)
}

export const meta: Route.MetaFunction = () => {
	return [
		{ title: `About | Dashboard | ${APP_NAME}` },
		{
			name: 'description',
			content: `Manage About Me sections on ${APP_NAME}`,
		},
	]
}

export function ErrorBoundary() {
	return (
		<GeneralErrorBoundary
			statusHandlers={
				{
					// Can have generic status handlers for the layout
					// 404: () => <p>About section not found.</p>,
				}
			}
		/>
	)
}
