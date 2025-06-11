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
import { ExternalIconLink } from '#app/components/external-icon-link.tsx'
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
import { type Route, type Info } from './+types/contacts.index.ts'

export const handle: SEOHandle = {
	getSitemapEntries: () => null,
}

export async function loader({ request }: LoaderFunctionArgs) {
	const userId = await requireUserId(request)
	const contactsData = await prisma.socialLink.findMany({
		where: { userId },
		select: {
			id: true,
			href: true,
			icon: true,
			label: true,
			text: true,
			isPublished: true,
			createdAt: true,
			updatedAt: true,
			userId: true,
		},
		orderBy: { createdAt: 'desc' },
	})

	return data({ contactsData })
}

type ContactDataItem = Info['loaderData']['contactsData'][number]

export const DashboardContactIntent = {
	CONTACT_CREATE: 'contact-create',
	CONTACT_UPDATE: 'contact-update',
	CONTACT_DELETE: 'contact-delete',
	CONTACT_PUBLISH_TOGGLE: 'contact-publish-toggle',
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
		case DashboardContactIntent.CONTACT_DELETE: {
			const contactId = formData.get('contactId')
			invariantResponse(typeof contactId === 'string', 'Contact ID is required')

			const deleted = await prisma.socialLink.delete({
				where: { id: contactId, userId },
			})
			if (!deleted) {
				return redirectWithToast('/dashboard/contact', {
					title: 'Contact not found',
					description: 'The contact was not found.',
				})
			}

			return data(
				{ type: 'success', entity: 'contact' },
				{
					status: 200,
					headers: await createToastHeaders({
						title: `${deleted.text} deleted`,
						description: 'The contact has been deleted successfully.',
						type: 'success',
					}),
				},
			)
		}

		case DashboardContactIntent.CONTACT_PUBLISH_TOGGLE: {
			const contactId = formData.get('contactId')
			const isPublished = formData.get('isPublished') === 'true'
			invariantResponse(typeof contactId === 'string', 'Contact ID is required')

			await prisma.socialLink.updateMany({
				where: { id: contactId, userId },
				data: { isPublished },
			})

			return data({
				type: 'success',
				message: 'Publish status updated for contact',
				entity: 'contact',
			})
		}

		default: {
			throw new Error(`Invalid intent: ${intent}`)
		}
	}
}

const contactColumns = (): ColumnDef<ContactDataItem>[] => [
	createDataTableSelectColumn<ContactDataItem>(),
	{
		accessorKey: 'text',
		header: 'Name',
		cell: ({ row }) => (
			<TooltipDataTableRowLink
				to={row.original.id}
				label={row.original.text}
				description={row.original.label}
			/>
		),
	},
	{
		accessorKey: 'href',
		id: 'href',
		header: 'URL',
		cell: ({ row }) => <ExternalIconLink iconLink={row.original} />,
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
			const contact = row.original
			const isOptimisticPublished = fetcher.formData
				? fetcher.formData.get('isPublished') === 'true'
				: contact.isPublished

			return (
				<fetcher.Form
					method="post"
					className="flex items-center justify-center"
				>
					<input type="hidden" name="contactId" value={contact.id} />
					<input
						type="hidden"
						name="intent"
						value={DashboardContactIntent.CONTACT_PUBLISH_TOGGLE}
					/>
					<Switch
						checked={isOptimisticPublished}
						onCheckedChange={(checked) => {
							const formData = new FormData()
							formData.set(
								'intent',
								DashboardContactIntent.CONTACT_PUBLISH_TOGGLE,
							)
							formData.set('contactId', contact.id)
							formData.set('isPublished', String(checked))
							void fetcher.submit(formData, { method: 'post' })
						}}
						aria-label={`Toggle publish status for ${contact.text}`}
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
						<span className="sr-only">Open contact menu</span>
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
								if (!confirm('Are you sure you want to delete this contact?')) {
									e.preventDefault()
								}
							}}
						>
							<input type="hidden" name="contactId" value={row.original.id} />
							<button
								type="submit"
								name="intent"
								value={DashboardContactIntent.CONTACT_DELETE}
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

export default function DashboardContactIndexRoute({
	loaderData,
}: Route.ComponentProps) {
	const { contactsData } = loaderData

	const memoizedContactColumns = React.useMemo(() => contactColumns(), [])

	return (
		<AppContainerContent id="skills-content" className="container space-y-8">
			<AppContainerGroup className="px-0">
				<BackLink label="Back to Dashboard" className="self-start" />
			</AppContainerGroup>

			<AppContainerGroup className="px-0">
				<h1 className="text-2xl font-bold">Contacts</h1>
			</AppContainerGroup>

			<AppContainerGroup id="skills-list" className="px-0">
				<h1 className="text-xl font-bold">Contacts List</h1>
				<DataTable
					columns={memoizedContactColumns}
					data={contactsData}
					getRowId={(row) => row.id}
					toolbarActions={<NewLink />}
					filterFields={[
						{ accessorKey: 'text', placeholder: 'Filter name...' },
						{
							accessorKey: 'href',
							placeholder: 'Filter URL...',
						},
					]}
				/>
			</AppContainerGroup>
		</AppContainerContent>
	)
}

export const meta = () => {
	return [
		{ title: `Contacts Info | Dashboard | ${APP_NAME}` },
		{
			name: 'description',
			content: `Manage contacts in the ${APP_NAME} dashboard.`,
		},
	]
}

export function ErrorBoundary() {
	return (
		<GeneralErrorBoundary
			statusHandlers={{
				404: () => <p>No contacts found.</p>,
			}}
		/>
	)
}
