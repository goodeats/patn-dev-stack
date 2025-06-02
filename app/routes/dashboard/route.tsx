import { invariantResponse } from '@epic-web/invariant'
import { type LoaderFunctionArgs, useLoaderData } from 'react-router'
import { type z } from 'zod'
import {
	AppContainerContent,
	AppContainerGroup,
} from '#app/components/app-container.tsx'
import { DashboardLayout } from '#app/components/app-layout.tsx'
import { AppSidebar } from '#app/components/app-sidebar.tsx'
import { ChartAreaInteractive } from '#app/components/chart-area-interactive.tsx'
import { DashboardHeader } from '#app/components/dashboard-header.tsx'
import { DataTable } from '#app/components/data-table.tsx'
import { GeneralErrorBoundary } from '#app/components/error-boundary.tsx'
import { SectionCards } from '#app/components/section-cards.tsx'
import { Spacer } from '#app/components/spacer.tsx'
import { SidebarProvider } from '#app/components/ui/sidebar.tsx'
import dashboardData from '#app/dashboard/data.json'
import { APP_NAME } from '#app/utils/app-name.ts'
import { requireUserId } from '#app/utils/auth.server.ts'
import { prisma } from '#app/utils/db.server.ts'
import { useOptionalUser } from '#app/utils/user.ts'
import { type Route } from './+types/route.ts'

export async function loader({ request }: LoaderFunctionArgs) {
	const userId = await requireUserId(request)
	const user = await prisma.user.findUnique({
		where: { id: userId },
		select: {
			id: true,
			name: true,
			username: true,
			createdAt: true,
			image: { select: { id: true, objectKey: true } },
		},
	})

	invariantResponse(user, 'User not found', { status: 404 })

	return { user, userJoinedDisplay: user.createdAt.toLocaleDateString() }
}

export default function DashboardRoute() {
	const data = useLoaderData<typeof loader>()
	const user = data.user
	const userDisplayName = user.name ?? user.username
	const loggedInUser = useOptionalUser()
	const isLoggedInUser = user.id === loggedInUser?.id

	return (
		<DashboardLayout>
			<AppContainerContent>
				<DashboardHeader />
				<AppContainerContent className="container">
					<AppContainerGroup>
						<SectionCards />
					</AppContainerGroup>
					<AppContainerGroup>
						<ChartAreaInteractive />
					</AppContainerGroup>
					<AppContainerGroup>
						<DataTable data={dashboardData} />
					</AppContainerGroup>
				</AppContainerContent>
			</AppContainerContent>
		</DashboardLayout>
	)
}

export const meta: Route.MetaFunction = ({ data, params }) => {
	const displayName = data?.user.name ?? params.username
	return [
		{ title: `${displayName} | ${APP_NAME}` },
		{
			name: 'description',
			content: `Profile of ${displayName} on ${APP_NAME}`,
		},
	]
}

export function ErrorBoundary() {
	return (
		<GeneralErrorBoundary
			statusHandlers={{
				404: ({ params }) => (
					<p>No user with the username "{params.username}" exists</p>
				),
			}}
		/>
	)
}
