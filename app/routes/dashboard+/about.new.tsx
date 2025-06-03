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
import { type Route } from './+types/about.new.ts'

export async function loader({ request }: LoaderFunctionArgs) {
	await requireUserId(request)

	const categories = await prisma.aboutMeCategory.findMany({
		where: { isPublished: true },
		select: {
			id: true,
			name: true,
		},
		orderBy: { name: 'asc' },
	})

	return { categories }
}

export async function action({ request }: ActionFunctionArgs) {
	const userId = await requireUserId(request)

	const formData = await request.formData()
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

	const aboutMe = await prisma.aboutMe.create({
		data: {
			name,
			content,
			description: typeof description === 'string' ? description : null,
			aboutMeCategoryId,
			isPublished,
			userId,
		},
		select: { id: true },
	})

	return redirect(`/dashboard/about/${aboutMe.id}`)
}

export default function DashboardAboutNewRoute({
	loaderData,
}: Route.ComponentProps) {
	const { categories } = loaderData
	const navigation = useNavigation()
	const isSubmitting = navigation.state !== 'idle'

	return (
		<AppContainerContent id="about-new-content" className="container py-6">
			<AppContainerGroup>
				<div className="mb-6 flex items-center justify-between">
					<h1 className="text-2xl font-bold">Create About Me Section</h1>
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
								required
								disabled={isSubmitting}
								placeholder="Enter a name for this section"
							/>
						</div>

						<div>
							<Label htmlFor="content">Content</Label>
							<Textarea
								id="content"
								name="content"
								required
								disabled={isSubmitting}
								rows={6}
								placeholder="Enter the content for this section"
							/>
						</div>

						<div>
							<Label htmlFor="description">Description (Optional)</Label>
							<Input
								id="description"
								name="description"
								disabled={isSubmitting}
								placeholder="Brief description of this section"
							/>
						</div>

						<div>
							<Label htmlFor="aboutMeCategoryId">Category</Label>
							<Select name="aboutMeCategoryId" disabled={isSubmitting} required>
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
								defaultChecked={true}
								disabled={isSubmitting}
								className="size-4"
							/>
							<Label htmlFor="isPublished">Published</Label>
						</div>
					</div>

					<div className="flex gap-4">
						<Button type="submit" disabled={isSubmitting}>
							{isSubmitting ? 'Creating...' : 'Create Section'}
						</Button>

						<Link to="/dashboard/about">
							<Button type="button" variant="outline" disabled={isSubmitting}>
								Cancel
							</Button>
						</Link>
					</div>
				</Form>
			</AppContainerGroup>
		</AppContainerContent>
	)
}

export const meta: Route.MetaFunction = () => {
	return [
		{ title: `Create About Me | Dashboard | ${APP_NAME}` },
		{
			name: 'description',
			content: `Create a new About Me section on ${APP_NAME}`,
		},
	]
}

export function ErrorBoundary() {
	return <GeneralErrorBoundary />
}
