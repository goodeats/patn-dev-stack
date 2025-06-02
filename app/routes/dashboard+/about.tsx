import { type ColumnDef } from '@tanstack/react-table'
import * as React from 'react'
import { type LoaderFunctionArgs } from 'react-router'
import {
	AppContainerContent,
	AppContainerGroup,
} from '#app/components/app-container.tsx'
import {
	DataTable,
	createDataTableSelectColumn,
	DataTableSortHeader,
} from '#app/components/data-table-generic.tsx'
import { GeneralErrorBoundary } from '#app/components/error-boundary.tsx'
import { Button } from '#app/components/ui/button.tsx'
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from '#app/components/ui/dropdown-menu.tsx'
import { Icon } from '#app/components/ui/icon.tsx'
import { APP_NAME } from '#app/utils/app-name.ts'
import { requireUserId } from '#app/utils/auth.server.ts'
import { prisma } from '#app/utils/db.server.ts'
import { type Route } from './+types/about.ts'

type AboutMeDataItem = {
	id: string
	content: string
	description: string | null
	createdAt: Date
	updatedAt: Date
	userId: string
	aboutMeCategory: {
		id: string
		name: string
	}
}

export async function loader({ request }: LoaderFunctionArgs) {
	const userId = await requireUserId(request)
	const aboutMeData = await prisma.aboutMe.findMany({
		where: { userId },
		select: {
			id: true,
			content: true,
			description: true,
			createdAt: true,
			updatedAt: true,
			userId: true,
			aboutMeCategory: {
				select: {
					id: true,
					name: true,
				},
			},
		},
		orderBy: { updatedAt: 'desc' },
	})

	return { aboutMeData }
}

const aboutMeColumns = (): ColumnDef<AboutMeDataItem>[] => [
	createDataTableSelectColumn<AboutMeDataItem>(),
	{
		accessorKey: 'content',
		header: 'Content',
		cell: ({ row }) => (
			<div className="max-w-xs truncate">{row.original.content}</div>
		),
	},
	{
		accessorKey: 'description',
		header: 'Description',
		cell: ({ row }) => (
			<div className="max-w-xs truncate">
				{row.original.description ?? 'N/A'}
			</div>
		),
	},
	{
		accessorKey: 'aboutMeCategory.name',
		id: 'categoryName',
		header: 'Category',
		cell: ({ row }) => row.original.aboutMeCategory.name,
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
		id: 'actions',
		cell: ({ row }) => (
			<DropdownMenu>
				<DropdownMenuTrigger asChild>
					<Button
						variant="ghost"
						className="data-[state=open]:bg-muted flex size-8 p-0"
					>
						<Icon name="dots-horizontal" className="size-4" />
						<span className="sr-only">Open menu</span>
					</Button>
				</DropdownMenuTrigger>
				<DropdownMenuContent align="end" className="w-[160px]">
					<DropdownMenuItem>Edit</DropdownMenuItem>
					<DropdownMenuItem>Make a copy</DropdownMenuItem>
					<DropdownMenuItem>Favorite</DropdownMenuItem>
					<DropdownMenuSeparator />
					<DropdownMenuItem className="text-destructive-foreground bg-destructive">
						Delete
					</DropdownMenuItem>
				</DropdownMenuContent>
			</DropdownMenu>
		),
	},
]

export default function DashboardAboutRoute({
	loaderData,
}: Route.ComponentProps) {
	const { aboutMeData } = loaderData

	const columns = React.useMemo(() => aboutMeColumns(), [])

	return (
		<AppContainerContent id="about-content" className="container py-6">
			<AppContainerGroup>
				<h1 className="mb-4 text-2xl font-bold">About Me Sections</h1>
				<DataTable
					columns={columns}
					data={aboutMeData}
					getRowId={(row) => row.id}
					toolbarActions={
						<Button>
							<Icon name="plus" className="mr-2" /> Add Section
						</Button>
					}
					filterFields={[
						{ accessorKey: 'content', placeholder: 'Filter content...' },
						{
							accessorKey: 'aboutMeCategory',
							placeholder: 'Filter by category name...',
						},
					]}
				/>
			</AppContainerGroup>
		</AppContainerContent>
	)
}

export const meta: Route.MetaFunction = () => {
	return [
		{ title: `About | Dashboard | ${APP_NAME}` },
		{
			name: 'description',
			content: `About Dashboard on ${APP_NAME}`,
		},
	]
}

export function ErrorBoundary() {
	return (
		<GeneralErrorBoundary
			statusHandlers={{
				404: () => <p>User or About Me data not found.</p>,
			}}
		/>
	)
}
