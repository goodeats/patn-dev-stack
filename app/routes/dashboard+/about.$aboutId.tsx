import { invariantResponse } from '@epic-web/invariant'
import {
	type ActionFunctionArgs,
	type LoaderFunctionArgs,
	redirect,
	Form,
	Link,
	useNavigation,
} from 'react-router'
import {
	AppContainerContent,
	AppContainerGroup,
} from '#app/components/app-container.tsx'
import { GeneralErrorBoundary } from '#app/components/error-boundary.tsx'
import { Button } from '#app/components/ui/button.tsx'
import { Icon } from '#app/components/ui/icon.tsx'
import { Input } from '#app/components/ui/input.tsx'
import { Label } from '#app/components/ui/label.tsx'
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '#app/components/ui/select.tsx'
import { Textarea } from '#app/components/ui/textarea.tsx'
import { APP_NAME } from '#app/utils/app-name.ts'
import { requireUserId } from '#app/utils/auth.server.ts'
import { prisma } from '#app/utils/db.server.ts'
import { type Route } from './+types/about.$aboutId.ts'

export async function loader({ request, params }: LoaderFunctionArgs) {
	const userId = await requireUserId(request)
	const { aboutId } = params

	invariantResponse(aboutId, 'About ID is required')

	const aboutMe = await prisma.aboutMe.findFirst({
		where: {
			id: aboutId,
			userId,
		},
		select: {
			id: true,
			name: true,
			content: true,
			description: true,
			isPublished: true,
			aboutMeCategoryId: true,
			aboutMeCategory: {
				select: {
					id: true,
					name: true,
				},
			},
		},
	})

	invariantResponse(aboutMe, 'About Me item not found', { status: 404 })

	const categories = await prisma.aboutMeCategory.findMany({
		where: { isPublished: true },
		select: {
			id: true,
			name: true,
		},
		orderBy: { name: 'asc' },
	})

	console.log('about.$aboutId server')

	return { aboutMe, categories }
}

export async function action({ request, params }: ActionFunctionArgs) {
	const userId = await requireUserId(request)
	const { aboutId } = params

	invariantResponse(aboutId, 'About ID is required')

	const formData = await request.formData()
	const intent = formData.get('intent')

	if (intent === 'delete') {
		await prisma.aboutMe.deleteMany({
			where: {
				id: aboutId,
				userId,
			},
		})

		return redirect('/dashboard/about')
	}

	if (intent === 'update') {
		const name = formData.get('name')
		const content = formData.get('content')
		const description = formData.get('description')
		const aboutMeCategoryId = formData.get('aboutMeCategoryId')
		const isPublished = formData.get('isPublished') === 'true'

		invariantResponse(typeof name === 'string', 'Name is required')
		invariantResponse(typeof content === 'string', 'Content is required')
		invariantResponse(
			typeof aboutMeCategoryId === 'string',
			'Category is required',
		)

		await prisma.aboutMe.updateMany({
			where: {
				id: aboutId,
				userId,
			},
			data: {
				name,
				content,
				description: typeof description === 'string' ? description : null,
				aboutMeCategoryId,
				isPublished,
			},
		})

		return null
	}

	throw new Error(`Invalid intent: ${intent}`)
}

export default function DashboardAboutDetailsRoute({
	loaderData,
}: Route.ComponentProps) {
	const { aboutMe, categories } = loaderData
	const navigation = useNavigation()
	const isSubmitting = navigation.state !== 'idle'

	console.log('about.$aboutId client')

	return (
		<AppContainerContent id="about-details-content" className="container py-6">
			<AppContainerGroup>
				<div className="mb-6 flex items-center justify-between">
					<h1 className="text-2xl font-bold">Edit About Me Section</h1>
					<Link to="/dashboard/about">
						<Button variant="ghost" size="sm">
							<Icon name="arrow-left" className="mr-2" />
							Back to List
						</Button>
					</Link>
				</div>

				<Form method="post" className="space-y-6">
					<div className="space-y-4">
						<div>
							<Label htmlFor="name">Name</Label>
							<Input
								id="name"
								name="name"
								defaultValue={aboutMe.name}
								required
								disabled={isSubmitting}
							/>
						</div>

						<div>
							<Label htmlFor="content">Content</Label>
							<Textarea
								id="content"
								name="content"
								defaultValue={aboutMe.content}
								required
								disabled={isSubmitting}
								rows={6}
							/>
						</div>

						<div>
							<Label htmlFor="description">Description (Optional)</Label>
							<Input
								id="description"
								name="description"
								defaultValue={aboutMe.description || ''}
								disabled={isSubmitting}
							/>
						</div>

						<div>
							<Label htmlFor="aboutMeCategoryId">Category</Label>
							<Select
								name="aboutMeCategoryId"
								defaultValue={aboutMe.aboutMeCategoryId}
								disabled={isSubmitting}
							>
								<SelectTrigger>
									<SelectValue placeholder="Select a category" />
								</SelectTrigger>
								<SelectContent>
									{categories.map((category) => (
										<SelectItem key={category.id} value={category.id}>
											{category.name}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>

						<div className="flex items-center space-x-2">
							<input
								type="checkbox"
								id="isPublished"
								name="isPublished"
								value="true"
								defaultChecked={aboutMe.isPublished}
								disabled={isSubmitting}
								className="size-4"
							/>
							<Label htmlFor="isPublished">Published</Label>
						</div>
					</div>

					<div className="flex gap-4">
						<Button
							type="submit"
							name="intent"
							value="update"
							disabled={isSubmitting}
						>
							{isSubmitting ? 'Saving...' : 'Save Changes'}
						</Button>

						<Button
							type="submit"
							name="intent"
							value="delete"
							variant="destructive"
							disabled={isSubmitting}
							onClick={(e) => {
								if (!confirm('Are you sure you want to delete this section?')) {
									e.preventDefault()
								}
							}}
						>
							Delete
						</Button>
					</div>
				</Form>
			</AppContainerGroup>
		</AppContainerContent>
	)
}

export const meta: Route.MetaFunction = ({ data }) => {
	const aboutMeName = data?.aboutMe?.name ?? 'About Me'
	return [
		{ title: `Edit ${aboutMeName} | Dashboard | ${APP_NAME}` },
		{
			name: 'description',
			content: `Edit ${aboutMeName} on ${APP_NAME}`,
		},
	]
}

export function ErrorBoundary() {
	return (
		<GeneralErrorBoundary
			statusHandlers={{
				404: () => <p>About Me item not found.</p>,
			}}
		/>
	)
}
