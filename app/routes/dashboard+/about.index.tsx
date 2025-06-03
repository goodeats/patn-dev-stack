import { invariantResponse } from '@epic-web/invariant'
import { type ColumnDef } from '@tanstack/react-table'
import * as React from 'react'
import {
	type ActionFunctionArgs,
	type LoaderFunctionArgs,
	Form,
	Link,
} from 'react-router'
import {
	DataTable,
	createDataTableSelectColumn,
	DataTableSortHeader,
} from '#app/components/data-table.tsx'
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
import { type Route } from './+types/about.index.ts'

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

export async function action({ request }: ActionFunctionArgs) {
	const userId = await requireUserId(request)
	const formData = await request.formData()
	const intent = formData.get('intent')

	if (intent === 'delete') {
		const aboutId = formData.get('aboutId')
		invariantResponse(typeof aboutId === 'string', 'About ID is required')

		await prisma.aboutMe.deleteMany({
			where: {
				id: aboutId,
				userId,
			},
		})

		return { type: 'success' } as const
	}

	throw new Error(`Invalid intent: ${intent}`)
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
					<DropdownMenuItem asChild>
						<Link to={row.original.id}>Edit</Link>
					</DropdownMenuItem>
					<DropdownMenuSeparator />
					<DropdownMenuItem asChild>
						<Form
							method="post"
							onSubmit={(e) => {
								if (!confirm('Are you sure you want to delete this section?')) {
									e.preventDefault()
								}
							}}
						>
							<input type="hidden" name="aboutId" value={row.original.id} />
							<button
								type="submit"
								name="intent"
								value="delete"
								className="hover:bg-accent hover:text-accent-foreground text-destructive-foreground relative flex w-full cursor-default items-center rounded-sm px-2 py-1.5 text-sm transition-colors outline-none select-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
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

// Default export component, same as original but without AppContainer wrappers
export default function DashboardAboutIndexRoute({
	loaderData,
}: Route.ComponentProps) {
	const { aboutMeData } = loaderData
	const columns = React.useMemo(() => aboutMeColumns(), [])

	return (
		<>
			<h1 className="mb-4 text-2xl font-bold">About Me Sections</h1>
			<DataTable
				columns={columns}
				data={aboutMeData}
				getRowId={(row) => row.id}
				toolbarActions={
					<Button asChild>
						{/* Link to relative path 'new' from /dashboard/about/ */}
						<Link to="new">
							<Icon name="plus" className="mr-2" />
							Create
						</Link>
					</Button>
				}
				filterFields={[
					{ accessorKey: 'content', placeholder: 'Filter content...' },
					{
						accessorKey: 'categoryName',
						placeholder: 'Filter category...',
					},
				]}
			/>
		</>
	)
}

export const meta = () => {
	return [
		{ title: `About Me List | Dashboard | ${APP_NAME}` },
		{
			name: 'description',
			content: `List of 'About Me' sections in the ${APP_NAME} dashboard.`,
		},
	]
}

export function ErrorBoundary() {
	return (
		<GeneralErrorBoundary
			statusHandlers={{
				404: () => <p>No About Me sections found.</p>,
			}}
		/>
	)
}
