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
import { type Route, type Info } from './+types/skills.index.ts'
import { handleCategoryAction } from './__skill-category-editor.server.tsx'
import { SkillCategoryEditor } from './__skill-category-editor.tsx'

export const handle: SEOHandle = {
	getSitemapEntries: () => null,
}

export async function loader({ request }: LoaderFunctionArgs) {
	const userId = await requireUserId(request)
	const skillsData = await prisma.skill.findMany({
		where: { userId },
		select: {
			id: true,
			name: true,
			description: true,
			isPublished: true,
			createdAt: true,
			updatedAt: true,
			userId: true,
			skillCategory: {
				select: {
					id: true,
					name: true,
				},
			},
		},
		orderBy: { createdAt: 'desc' },
	})

	const skillCategoryData = await prisma.skillCategory.findMany({
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

	return data({ skillsData, skillCategoryData })
}

type SkillDataItem = Info['loaderData']['skillsData'][number]
type SkillCategoryDataItem = Info['loaderData']['skillCategoryData'][number]

export const DashboardSkillsIntent = {
	SKILL_CREATE: 'skill-create',
	SKILL_UPDATE: 'skill-update',
	SKILL_DELETE: 'skill-delete',
	SKILL_PUBLISH_TOGGLE: 'skill-publish-toggle',
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

	console.log(
		'formData',
		Array.from(formData.entries()).map(([key, value]) => ({ [key]: value })),
	)

	switch (intent) {
		case DashboardSkillsIntent.CATEGORY_CREATE:
		case DashboardSkillsIntent.CATEGORY_UPDATE:
		case DashboardSkillsIntent.CATEGORY_DELETE:
			return handleCategoryAction(formData)

		case DashboardSkillsIntent.SKILL_DELETE: {
			const skillId = formData.get('skillId')
			invariantResponse(typeof skillId === 'string', 'Skill ID is required')

			const deleted = await prisma.skill.delete({
				where: { id: skillId, userId },
			})
			if (!deleted) {
				return redirectWithToast('/dashboard/skills', {
					title: 'Skill not found',
					description: 'The skill was not found.',
				})
			}

			return data(
				{ type: 'success', entity: 'skill' },
				{
					status: 200,
					headers: await createToastHeaders({
						title: `${deleted.name} deleted`,
						description: 'The skill has been deleted successfully.',
						type: 'success',
					}),
				},
			)
		}

		case DashboardSkillsIntent.SKILL_PUBLISH_TOGGLE: {
			const skillId = formData.get('skillId')
			const isPublished = formData.get('isPublished') === 'true'
			invariantResponse(typeof skillId === 'string', 'Skill ID is required')

			await prisma.skill.updateMany({
				where: { id: skillId, userId },
				data: { isPublished },
			})

			return data({
				type: 'success',
				message: 'Publish status updated for skill',
				entity: 'skill',
			})
		}

		case DashboardSkillsIntent.CATEGORY_PUBLISH_TOGGLE: {
			const categoryId = formData.get('categoryId')
			const isPublished = formData.get('isPublished') === 'true'
			invariantResponse(
				typeof categoryId === 'string',
				'Category ID is required',
			)

			await prisma.skillCategory.update({
				where: { id: categoryId },
				data: { isPublished },
			})
			return data({
				type: 'success',
				message: 'Publish status updated for category',
				entity: 'skillCategory',
			})
		}

		default: {
			throw new Error(`Invalid intent: ${intent}`)
		}
	}
}

const skillColumns = (): ColumnDef<SkillDataItem>[] => [
	createDataTableSelectColumn<SkillDataItem>(),
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
		accessorKey: 'skillCategory.name',
		id: 'categoryName',
		header: 'Category',
		cell: ({ row }) => row.original.skillCategory.name,
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
			const skill = row.original
			const isOptimisticPublished = fetcher.formData
				? fetcher.formData.get('isPublished') === 'true'
				: skill.isPublished

			return (
				<fetcher.Form
					method="post"
					className="flex items-center justify-center"
				>
					<input type="hidden" name="skillId" value={skill.id} />
					<input
						type="hidden"
						name="intent"
						value={DashboardSkillsIntent.SKILL_PUBLISH_TOGGLE}
					/>
					<Switch
						checked={isOptimisticPublished}
						onCheckedChange={(checked) => {
							const formData = new FormData()
							formData.set('intent', DashboardSkillsIntent.SKILL_PUBLISH_TOGGLE)
							formData.set('skillId', skill.id)
							formData.set('isPublished', String(checked))
							void fetcher.submit(formData, { method: 'post' })
						}}
						aria-label={`Toggle publish status for ${skill.name}`}
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
						<span className="sr-only">Open skill menu</span>
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
								if (!confirm('Are you sure you want to delete this skill?')) {
									e.preventDefault()
								}
							}}
						>
							<input type="hidden" name="skillId" value={row.original.id} />
							<button
								type="submit"
								name="intent"
								value={DashboardSkillsIntent.SKILL_DELETE}
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

const skillCategoryColumns = (
	onEditCategory: (category: SkillCategoryDataItem) => void,
): ColumnDef<SkillCategoryDataItem>[] => [
	createDataTableSelectColumn<SkillCategoryDataItem>(),
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
						value={DashboardSkillsIntent.CATEGORY_PUBLISH_TOGGLE}
					/>
					<Switch
						checked={isOptimisticPublished}
						onCheckedChange={(checked) => {
							const formData = new FormData()
							formData.set(
								'intent',
								DashboardSkillsIntent.CATEGORY_PUBLISH_TOGGLE,
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
						<span className="sr-only">Open skill category menu</span>
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
										'Are you sure you want to delete this category? This will also delete all associated skills.',
									)
								) {
									e.preventDefault()
								}
							}}
						>
							<input type="hidden" name="id" value={row.original.id} />
							<button
								type="submit"
								name="intent"
								value={DashboardSkillsIntent.CATEGORY_DELETE}
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

export default function DashboardSkillsIndexRoute({
	loaderData,
	actionData,
}: Route.ComponentProps) {
	const { skillsData, skillCategoryData } = loaderData
	const [categoryDialogOpen, setCategoryDialogOpen] = React.useState(false)
	const [currentCategory, setCurrentCategory] =
		React.useState<SkillCategoryDataItem | null>(null)

	const handleEditCategory = React.useCallback(
		(category: SkillCategoryDataItem) => {
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

	const memoizedSkillColumns = React.useMemo(() => skillColumns(), [])
	const memoizedSkillCategoryColumns = React.useMemo(
		() => skillCategoryColumns(handleEditCategory),
		[handleEditCategory],
	)

	// Close dialog on successful action
	React.useEffect(() => {
		if (
			actionData &&
			'type' in actionData &&
			actionData.type === 'success' &&
			'entity' in actionData &&
			actionData.entity === 'skillCategory'
		) {
			setCategoryDialogOpen(false)
			setCurrentCategory(null)
		}
	}, [actionData])

	return (
		<AppContainerContent id="skills-content" className="container space-y-8">
			<AppContainerGroup className="px-0">
				<BackLink label="Back to Dashboard" className="self-start" />
			</AppContainerGroup>

			<AppContainerGroup className="px-0">
				<h1 className="text-2xl font-bold">Skills</h1>
			</AppContainerGroup>

			<AppContainerGroup id="skills-list" className="px-0">
				<h1 className="text-xl font-bold">Skills List</h1>
				<DataTable
					columns={memoizedSkillColumns}
					data={skillsData}
					getRowId={(row) => row.id}
					toolbarActions={<NewLink />}
					filterFields={[
						{ accessorKey: 'name', placeholder: 'Filter name...' },
						{
							accessorKey: 'categoryName',
							placeholder: 'Filter category...',
						},
					]}
				/>
			</AppContainerGroup>

			<AppContainerGroup id="skill-categories" className="px-0">
				<h1 className="text-xl font-bold">Skill Categories</h1>
				<DataTable
					columns={memoizedSkillCategoryColumns}
					data={skillCategoryData}
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
					<SkillCategoryEditor
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
		{ title: `Skills Info | Dashboard | ${APP_NAME}` },
		{
			name: 'description',
			content: `Manage skills and categories in the ${APP_NAME} dashboard.`,
		},
	]
}

export function ErrorBoundary() {
	return (
		<GeneralErrorBoundary
			statusHandlers={{
				404: () => <p>No skills or categories found.</p>,
			}}
		/>
	)
}
