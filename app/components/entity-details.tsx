import { BackLink, EditLink } from '#app/components/button-links.tsx'
import {
	Card,
	CardTitle,
	CardDescription,
	CardHeader,
	CardContent,
	CardDetailsList,
} from './ui/card'

interface EntityDetailsProps {
	backLabel?: string
	editLabel?: string
	backTo?: string
	editTo?: string
}

export const EntityDetailsLinks = ({
	backLabel = 'Back to List',
	editLabel = 'Edit',
	backTo = '..',
	editTo = 'edit',
}: EntityDetailsProps) => {
	return (
		<div className="flex items-center justify-between">
			<BackLink label={backLabel} to={backTo} />
			<EditLink label={editLabel} to={editTo} />
		</div>
	)
}

interface EntityDetailsCardProps {
	title?: string
	description?: string | null
	children: React.ReactNode
	className?: string
}

export const EntityDetailsCard = ({
	title,
	description,
	children,
	className,
	...props
}: React.ComponentProps<'div'> & EntityDetailsCardProps) => {
	const titleElement = title ? (
		<CardTitle className="text-2xl">{title}</CardTitle>
	) : null

	const descriptionElement = description ? (
		<CardDescription>{description}</CardDescription>
	) : null

	const headerElement =
		titleElement || descriptionElement ? (
			<CardHeader>
				{titleElement}
				{descriptionElement}
			</CardHeader>
		) : null

	return (
		<Card className={className} {...props}>
			{headerElement}
			<CardContent>
				<CardDetailsList>{children}</CardDetailsList>
			</CardContent>
		</Card>
	)
}
