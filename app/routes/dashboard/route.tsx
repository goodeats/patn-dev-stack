import { invariantResponse } from '@epic-web/invariant'
import { type LoaderFunctionArgs } from 'react-router'
import {
	AppContainerContent,
	AppContainerGroup,
} from '#app/components/app-container.tsx'
import { ChartAreaInteractive } from '#app/components/chart-area-interactive.tsx'
import { DataTable } from '#app/components/data-table.tsx'
import { GeneralErrorBoundary } from '#app/components/error-boundary.tsx'
import { SectionCards } from '#app/components/section-cards.tsx'
import { Spacer } from '#app/components/spacer.tsx'
import dashboardData from '#app/dashboard/data.json'
import { APP_NAME } from '#app/utils/app-name.ts'
import { requireUserId } from '#app/utils/auth.server.ts'
import { prisma } from '#app/utils/db.server.ts'
import { type Route } from './+types/route.ts'
import { DashboardLayout } from './__layout.tsx'

export async function loader({ request }: LoaderFunctionArgs) {
	const userId = await requireUserId(request)
	const user = await prisma.user.findUnique({
		where: { id: userId },
		select: {
			id: true,
			email: true,
			name: true,
			username: true,
			createdAt: true,
			image: { select: { id: true, objectKey: true } },
		},
	})

	invariantResponse(user, 'User not found', { status: 404 })

	return { user, userJoinedDisplay: user.createdAt.toLocaleDateString() }
}

export default function DashboardRoute({ loaderData }: Route.ComponentProps) {
	const user = loaderData.user

	return (
		<DashboardLayout user={user}>
			<AppContainerContent id="dashboard-content" className="container">
				<AppContainerGroup>
					<SectionCards />
				</AppContainerGroup>
				<AppContainerGroup>
					<ChartAreaInteractive />
				</AppContainerGroup>
				<AppContainerGroup>
					<DataTable data={dashboardData} />
				</AppContainerGroup>
				<AppContainerGroup>
					<Spacer size="xs" />
				</AppContainerGroup>
			</AppContainerContent>
		</DashboardLayout>
	)
}

export const meta: Route.MetaFunction = () => {
	return [
		{ title: `Dashboard | ${APP_NAME}` },
		{
			name: 'description',
			content: `Dashboard on ${APP_NAME}`,
		},
	]
}

export function ErrorBoundary() {
	return (
		<GeneralErrorBoundary
			statusHandlers={{
				404: () => <p>No user exists</p>,
			}}
		/>
	)
}
