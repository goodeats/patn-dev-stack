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
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from '#app/components/ui/dialog.tsx'
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
import { type Route, type Info } from './+types/about.index.ts'
import { handleCategoryAction } from './__about-category-editor.server.tsx'
import { AboutCategoryEditor } from './__about-category-editor.tsx'

export const handle: SEOHandle = {
	getSitemapEntries: () => null,
}

export async function loader({ request }: LoaderFunctionArgs) {
	const userId = await requireUserId(request)
	const aboutMeData = await prisma.aboutMe.findMany({
		where: { userId },
		select: {
			id: true,
			name: true,
			content: true,
			description: true,
			isPublished: true,
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
		orderBy: { createdAt: 'desc' },
	})

	const aboutMeCategoryData = await prisma.aboutMeCategory.findMany({
		select: {
			id: true,
			name: true,
			description: true,
			isPublished: true,
			createdAt: true,
			updatedAt: true,
		},
		orderBy: { createdAt: 'desc' },
	})

	return { aboutMeData, aboutMeCategoryData }
}

type AboutMeDataItem = Info['loaderData']['aboutMeData'][number]
type AboutMeCategoryDataItem = Info['loaderData']['aboutMeCategoryData'][number]

export const DashboardAboutIntent = {
	ABOUT_ME_DELETE: 'about-me-delete',
	ABOUT_ME_CREATE: 'about-me-create',
	ABOUT_ME_UPDATE: 'about-me-update',
	ABOUT_ME_PUBLISH_TOGGLE: 'about-me-publish-toggle',
	CATEGORY_CREATE: 'category-create',
	CATEGORY_UPDATE: 'category-update',
	CATEGORY_DELETE: 'category-delete',
	CATEGORY_PUBLISH_TOGGLE: 'category-publish-toggle',
} as const

export async function action(args: ActionFunctionArgs) {
	const { request } = args
	const userId = await requireUserId(request)
	const formData = await request.formData()
	const intent = formData.get('intent')

	switch (intent) {
		case DashboardAboutIntent.CATEGORY_CREATE:
		case DashboardAboutIntent.CATEGORY_UPDATE:
		case DashboardAboutIntent.CATEGORY_DELETE: {
			return handleCategoryAction(formData)
		}

		case DashboardAboutIntent.ABOUT_ME_DELETE: {
			const aboutId = formData.get('aboutId')
			invariantResponse(typeof aboutId === 'string', 'About ID is required')

			const deleted = await prisma.aboutMe.delete({
				where: { id: aboutId, userId },
			})

			if (!deleted) {
				return redirectWithToast('/dashboard/about', {
					title: 'About Me Section not found',
					description: 'The about me section was not found.',
				})
			}

			return data(
				{ type: 'success', entity: 'aboutMe' },
				{
					status: 200,
					headers: await createToastHeaders({
						title: `${deleted.name} deleted`,
						description: 'The about me section has been deleted successfully.',
						type: 'success',
					}),
				},
			)
		}

		case DashboardAboutIntent.ABOUT_ME_PUBLISH_TOGGLE: {
			const aboutId = formData.get('aboutId')
			const isPublished = formData.get('isPublished') === 'true'

			invariantResponse(typeof aboutId === 'string', 'About ID is required')

			await prisma.aboutMe.updateMany({
				where: {
					id: aboutId,
					userId,
				},
				data: {
					isPublished,
				},
			})

			return {
				type: 'success',
				message: 'Publish status updated for About Me section',
				entity: 'aboutMe',
			} as const
		}

		case DashboardAboutIntent.CATEGORY_PUBLISH_TOGGLE: {
			const categoryId = formData.get('categoryId')
			const isPublished = formData.get('isPublished') === 'true'
			invariantResponse(
				typeof categoryId === 'string',
				'Category ID is required',
			)

			await prisma.aboutMeCategory.update({
				where: { id: categoryId },
				data: { isPublished },
			})
			return {
				type: 'success',
				message: 'Publish status updated for category',
				entity: 'aboutMeCategory',
			} as const
		}

		default: {
			throw new Error(`Invalid intent: ${intent}`)
		}
	}
}

const aboutMeColumns = (): ColumnDef<AboutMeDataItem>[] => [
	createDataTableSelectColumn<AboutMeDataItem>(),
	{
		accessorKey: 'name',
		header: 'Name',
		cell: ({ row }) => (
			<TooltipDataTableRowLink
				to={row.original.id}
				label={row.original.name}
				description={row.original.description}
			/>
		),
	},
	{
		accessorKey: 'content',
		header: 'Content',
		cell: ({ row }) => (
			<div className="max-w-xs truncate">{row.original.content}</div>
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
		id: 'isPublished',
		header: 'Published',
		cell: function IsPublishedCell({ row }) {
			const fetcher = useFetcher()
			const aboutMe = row.original
			const isOptimisticPublished = fetcher.formData
				? fetcher.formData.get('isPublished') === 'true'
				: aboutMe.isPublished

			return (
				<fetcher.Form
					method="post"
					className="flex items-center justify-center"
				>
					<input type="hidden" name="aboutId" value={aboutMe.id} />
					<input
						type="hidden"
						name="intent"
						value={DashboardAboutIntent.ABOUT_ME_PUBLISH_TOGGLE}
					/>
					<Switch
						checked={isOptimisticPublished}
						onCheckedChange={(checked) => {
							const formData = new FormData()
							formData.set(
								'intent',
								DashboardAboutIntent.ABOUT_ME_PUBLISH_TOGGLE,
							)
							formData.set('aboutId', aboutMe.id)
							formData.set('isPublished', String(checked))
							void fetcher.submit(formData, { method: 'post' })
						}}
						aria-label={`Toggle publish status for ${aboutMe.name}`}
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
						<span className="sr-only">Open about section menu</span>
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
								if (
									!confirm(
										'Are you sure you want to delete this About Me section?',
									)
								) {
									e.preventDefault()
								}
							}}
						>
							<input type="hidden" name="aboutId" value={row.original.id} />
							<button
								type="submit"
								name="intent"
								value={DashboardAboutIntent.ABOUT_ME_DELETE}
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

const aboutMeCategoryColumns = (
	onEditCategory: (category: AboutMeCategoryDataItem) => void,
): ColumnDef<AboutMeCategoryDataItem>[] => [
	createDataTableSelectColumn<AboutMeCategoryDataItem>(),
	{
		accessorKey: 'name',
		header: 'Name',
		cell: ({ row }) => (
			<button
				type="button"
				onClick={() => onEditCategory(row.original)}
				className="text-left hover:underline"
			>
				{row.original.name}
			</button>
		),
	},
	{
		accessorKey: 'description',
		header: 'Description',
		cell: ({ row }) => (
			<div className="max-w-xs truncate">{row.original.description}</div>
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
		cell: function IsCategoryPublishedCell({ row }) {
			const fetcher = useFetcher()
			const category = row.original
			const isOptimisticPublished = fetcher.formData
				? fetcher.formData.get('isPublished') === 'true'
				: category.isPublished

			return (
				<fetcher.Form
					method="post"
					className="flex items-center justify-center"
				>
					<input type="hidden" name="categoryId" value={category.id} />
					<input
						type="hidden"
						name="intent"
						value={DashboardAboutIntent.CATEGORY_PUBLISH_TOGGLE}
					/>
					<Switch
						checked={isOptimisticPublished}
						onCheckedChange={(checked) => {
							const formData = new FormData()
							formData.set(
								'intent',
								DashboardAboutIntent.CATEGORY_PUBLISH_TOGGLE,
							)
							formData.set('categoryId', category.id)
							formData.set('isPublished', String(checked))
							void fetcher.submit(formData, { method: 'post' })
						}}
						aria-label={`Toggle publish status for ${category.name}`}
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
						<span className="sr-only">Open about category menu</span>
					</Button>
				</DropdownMenuTrigger>
				<DropdownMenuContent align="end" className="w-[160px]">
					<DropdownMenuItem asChild>
						<button
							type="button"
							onClick={() => onEditCategory(row.original)}
							className="hover:bg-accent hover:text-accent-foreground relative flex w-full cursor-default items-center rounded-sm px-2 py-1.5 text-sm transition-colors outline-none select-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
						>
							Edit
						</button>
					</DropdownMenuItem>
					<DropdownMenuSeparator />
					<DropdownMenuItem asChild>
						<Form
							method="post"
							onSubmit={(e) => {
								if (
									!confirm(
										'Are you sure you want to delete this category? This will also delete all associated About Me sections.',
									)
								) {
									e.preventDefault()
								}
							}}
						>
							<input type="hidden" name="categoryId" value={row.original.id} />
							<button
								type="submit"
								name="intent"
								value={DashboardAboutIntent.CATEGORY_DELETE}
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

export default function DashboardAboutIndexRoute({
	loaderData,
	actionData,
}: Route.ComponentProps) {
	const { aboutMeData, aboutMeCategoryData } = loaderData
	const [categoryDialogOpen, setCategoryDialogOpen] = React.useState(false)
	const [currentCategory, setCurrentCategory] =
		React.useState<AboutMeCategoryDataItem | null>(null)

	const handleEditCategory = React.useCallback(
		(category: AboutMeCategoryDataItem) => {
			setCurrentCategory(category)
			setCategoryDialogOpen(true)
		},
		[],
	)

	const handleCreateCategory = React.useCallback(() => {
		setCurrentCategory(null)
		setCategoryDialogOpen(true)
	}, [])

	const handleCategoryDialogChange = React.useCallback((open: boolean) => {
		setCategoryDialogOpen(open)
		if (!open) {
			setCurrentCategory(null)
		}
	}, [])

	const memoizedAboutMeColumns = React.useMemo(() => aboutMeColumns(), [])
	const memoizedAboutMeCategoryColumns = React.useMemo(
		() => aboutMeCategoryColumns(handleEditCategory),
		[handleEditCategory],
	)

	// Close dialog on successful action
	React.useEffect(() => {
		if (
			actionData &&
			'type' in actionData &&
			actionData.type === 'success' &&
			'entity' in actionData &&
			actionData.entity === 'aboutMeCategory'
		) {
			setCategoryDialogOpen(false)
			setCurrentCategory(null)
		}
	}, [actionData])

	return (
		<AppContainerContent id="about-me-content" className="container space-y-8">
			<AppContainerGroup className="px-0">
				<BackLink label="Back to Dashboard" className="self-start" />
			</AppContainerGroup>

			<AppContainerGroup className="px-0">
				<h1 className="text-2xl font-bold">About Me</h1>
			</AppContainerGroup>

			<AppContainerGroup id="about-me-sections" className="px-0">
				<h1 className="text-xl font-bold">About Me Sections</h1>
				<DataTable
					columns={memoizedAboutMeColumns}
					data={aboutMeData}
					getRowId={(row) => row.id}
					toolbarActions={<NewLink />}
					filterFields={[
						{ accessorKey: 'content', placeholder: 'Filter content...' },
						{
							accessorKey: 'categoryName',
							placeholder: 'Filter category...',
						},
					]}
				/>
			</AppContainerGroup>

			<AppContainerGroup id="about-me-categories" className="px-0">
				<h1 className="text-xl font-bold">About Me Categories</h1>
				<DataTable
					columns={memoizedAboutMeCategoryColumns}
					data={aboutMeCategoryData}
					getRowId={(row) => row.id}
					toolbarActions={
						<Button onClick={handleCreateCategory}>
							<Icon name="plus" className="mr-2" />
							New
						</Button>
					}
					filterFields={[
						{ accessorKey: 'name', placeholder: 'Filter name...' },
						{
							accessorKey: 'description',
							placeholder: 'Filter description...',
						},
					]}
				/>
			</AppContainerGroup>

			<Dialog
				open={categoryDialogOpen}
				onOpenChange={handleCategoryDialogChange}
			>
				<DialogContent className="max-w-2xl">
					<DialogHeader>
						<DialogTitle>
							{currentCategory?.id ? 'Edit Category' : 'Create Category'}
						</DialogTitle>
					</DialogHeader>
					<AboutCategoryEditor
						category={currentCategory}
						actionData={
							actionData && 'result' in actionData ? actionData : undefined
						}
						onClose={() => handleCategoryDialogChange(false)}
					/>
				</DialogContent>
			</Dialog>
		</AppContainerContent>
	)
}

export const meta = () => {
	return [
		{ title: `About Info | Dashboard | ${APP_NAME}` },
		{
			name: 'description',
			content: `Manage 'About Me' sections and categories in the ${APP_NAME} dashboard.`,
		},
	]
}

export function ErrorBoundary() {
	return (
		<GeneralErrorBoundary
			statusHandlers={{
				404: () => <p>No About Me sections or categories found.</p>,
			}}
		/>
	)
}
