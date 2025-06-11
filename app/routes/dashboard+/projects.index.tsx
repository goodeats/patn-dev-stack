import { invariantResponse } from '@epic-web/invariant'
import { type SEOHandle } from '@nasa-gcn/remix-seo'
import { type ColumnDef } from '@tanstack/react-table'
import * as React from 'react'
import {
	type ActionFunctionArgs,
	type LoaderFunctionArgs,
	data,
	Form,
	Link,
	useFetcher,
} from 'react-router'
import {
	AppContainerContent,
	AppContainerGroup,
} from '#app/components/app-container.tsx'
import { BackLink, NewLink } from '#app/components/button-links.tsx'
import {
	DataTable,
	createDataTableSelectColumn,
	DataTableSortHeader,
} from '#app/components/data-table.tsx'
import { GeneralErrorBoundary } from '#app/components/error-boundary.tsx'
import { TooltipDataTableRowLink } from '#app/components/tooltip-links.tsx'
import { Button } from '#app/components/ui/button.tsx'
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from '#app/components/ui/dropdown-menu.tsx'
import { Icon } from '#app/components/ui/icon.tsx'
import { Switch } from '#app/components/ui/switch.tsx'
import { APP_NAME } from '#app/utils/app-name.ts'
import { requireUserId } from '#app/utils/auth.server.ts'
import { prisma } from '#app/utils/db.server.ts'
import {
	createToastHeaders,
	redirectWithToast,
} from '#app/utils/toast.server.ts'
import { type Route, type Info } from './+types/projects.index.ts'

export const handle: SEOHandle = {
	getSitemapEntries: () => null,
}

export async function loader({ request }: LoaderFunctionArgs) {
	const userId = await requireUserId(request)
	const projectsData = await prisma.project.findMany({
		where: { userId },
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
			userId: true,
			_count: {
				select: {
					skills: true,
				},
			},
		},
		orderBy: { createdAt: 'desc' },
	})

	return data({ projectsData })
}

type ProjectDataItem = Info['loaderData']['projectsData'][number]

export const DashboardProjectIntent = {
	PROJECT_CREATE: 'project-create',
	PROJECT_UPDATE: 'project-update',
	PROJECT_DELETE: 'project-delete',
	PROJECT_PUBLISH_TOGGLE: 'project-publish-toggle',
} as const

export async function action(args: ActionFunctionArgs) {
	const { request } = args
	const userId = await requireUserId(request)
	const formData = await request.formData()
	const intent = formData.get('intent')

	switch (intent) {
		case DashboardProjectIntent.PROJECT_DELETE: {
			const projectId = formData.get('projectId')
			invariantResponse(typeof projectId === 'string', 'Project ID is required')

			const deleted = await prisma.project.delete({
				where: { id: projectId, userId },
			})
			if (!deleted) {
				return redirectWithToast('/dashboard/projects', {
					title: 'Project not found',
					description: 'The project was not found.',
				})
			}

			return data(
				{ type: 'success', entity: 'project' },
				{
					status: 200,
					headers: await createToastHeaders({
						title: `${deleted.title} deleted`,
						description: 'The project has been deleted successfully.',
						type: 'success',
					}),
				},
			)
		}

		case DashboardProjectIntent.PROJECT_PUBLISH_TOGGLE: {
			const projectId = formData.get('projectId')
			const isPublished = formData.get('isPublished') === 'true'
			invariantResponse(typeof projectId === 'string', 'Project ID is required')

			await prisma.project.updateMany({
				where: { id: projectId, userId },
				data: { isPublished },
			})

			return data({
				type: 'success',
				message: 'Publish status updated for project',
				entity: 'project',
			})
		}

		default: {
			throw new Error(`Invalid intent: ${intent}`)
		}
	}
}

const projectColumns = (): ColumnDef<ProjectDataItem>[] => [
	createDataTableSelectColumn<ProjectDataItem>(),
	{
		accessorKey: 'title',
		header: 'Title',
		cell: ({ row }) => (
			<TooltipDataTableRowLink
				to={row.original.id}
				label={row.original.title}
				description={row.original.description}
			/>
		),
	},
	{
		accessorKey: 'description',
		header: 'Description',
		cell: ({ row }) => (
			<span className="text-muted-foreground line-clamp-2 text-sm">
				{row.original.description}
			</span>
		),
	},
	{
		accessorKey: '_count.skills',
		header: 'Skills',
		cell: ({ row }) => (
			<span className="text-muted-foreground text-sm">
				{row.original._count.skills}
			</span>
		),
	},
	{
		accessorKey: 'createdAt',
		header: ({ column }) => (
			<DataTableSortHeader column={column}>Created At</DataTableSortHeader>
		),
		cell: ({ row }) => new Date(row.original.createdAt).toLocaleDateString(),
	},
	{
		accessorKey: 'updatedAt',
		header: ({ column }) => (
			<DataTableSortHeader column={column}>Updated At</DataTableSortHeader>
		),
		cell: ({ row }) => new Date(row.original.updatedAt).toLocaleDateString(),
	},
	{
		id: 'isPublished',
		header: 'Published',
		cell: function IsPublishedCell({ row }) {
			const fetcher = useFetcher()
			const project = row.original
			const isOptimisticPublished = fetcher.formData
				? fetcher.formData.get('isPublished') === 'true'
				: project.isPublished

			return (
				<fetcher.Form
					method="post"
					className="flex items-center justify-center"
				>
					<input type="hidden" name="projectId" value={project.id} />
					<input
						type="hidden"
						name="intent"
						value={DashboardProjectIntent.PROJECT_PUBLISH_TOGGLE}
					/>
					<Switch
						checked={isOptimisticPublished}
						onCheckedChange={(checked) => {
							const formData = new FormData()
							formData.set(
								'intent',
								DashboardProjectIntent.PROJECT_PUBLISH_TOGGLE,
							)
							formData.set('projectId', project.id)
							formData.set('isPublished', String(checked))
							void fetcher.submit(formData, { method: 'post' })
						}}
						aria-label={`Toggle publish status for ${project.title}`}
					/>
				</fetcher.Form>
			)
		},
	},
	{
		id: 'actions',
		cell: ({ row }) => (
			<DropdownMenu>
				<DropdownMenuTrigger asChild>
					<Button
						variant="ghost"
						className="data-[state=open]:bg-muted flex size-8 p-0"
					>
						<Icon name="dots-horizontal" className="size-4" />
						<span className="sr-only">Open project menu</span>
					</Button>
				</DropdownMenuTrigger>
				<DropdownMenuContent align="end" className="w-[160px]">
					<DropdownMenuItem asChild>
						<Link to={`${row.original.id}/edit`}>Edit</Link>
					</DropdownMenuItem>
					<DropdownMenuSeparator />
					<DropdownMenuItem asChild>
						<Form
							method="post"
							onSubmit={(e) => {
								if (!confirm('Are you sure you want to delete this project?')) {
									e.preventDefault()
								}
							}}
						>
							<input type="hidden" name="projectId" value={row.original.id} />
							<button
								type="submit"
								name="intent"
								value={DashboardProjectIntent.PROJECT_DELETE}
								className="bg-destructive text-destructive-foreground hover:bg-destructive/90 relative flex w-full cursor-default items-center rounded-sm px-2 py-1.5 text-sm transition-colors outline-none select-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
							>
								Delete
							</button>
						</Form>
					</DropdownMenuItem>
				</DropdownMenuContent>
			</DropdownMenu>
		),
	},
]

export default function DashboardProjectIndexRoute({
	loaderData,
}: Route.ComponentProps) {
	const { projectsData } = loaderData

	const memoizedProjectColumns = React.useMemo(() => projectColumns(), [])

	return (
		<AppContainerContent id="projects-content" className="container space-y-8">
			<AppContainerGroup className="px-0">
				<BackLink label="Back to Dashboard" className="self-start" />
			</AppContainerGroup>

			<AppContainerGroup className="px-0">
				<h1 className="text-2xl font-bold">Projects</h1>
			</AppContainerGroup>

			<AppContainerGroup id="projects-list" className="px-0">
				<h1 className="text-xl font-bold">Projects List</h1>
				<DataTable
					columns={memoizedProjectColumns}
					data={projectsData}
					getRowId={(row) => row.id}
					toolbarActions={<NewLink />}
					filterFields={[
						{ accessorKey: 'title', placeholder: 'Filter title...' },
						{
							accessorKey: 'description',
							placeholder: 'Filter description...',
						},
					]}
				/>
			</AppContainerGroup>
		</AppContainerContent>
	)
}

export const meta = () => {
	return [
		{ title: `Projects | Dashboard | ${APP_NAME}` },
		{
			name: 'description',
			content: `Manage projects in the ${APP_NAME} dashboard.`,
		},
	]
}

export function ErrorBoundary() {
	return (
		<GeneralErrorBoundary
			statusHandlers={{
				404: () => <p>No projects found.</p>,
			}}
		/>
	)
}
