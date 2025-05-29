import { cn } from '#app/utils/misc.tsx'
import { Card, CardDescription, CardHeader, CardTitle } from './ui/card'

export const MarketingCard = ({
	title,
	description,
	children,
	className,
}: {
	title: string
	description?: string
	children: React.ReactNode
	className?: string
}) => {
	return (
		<Card
			className={cn(
				'border-muted transform transition duration-300 hover:scale-105',
				className,
			)}
		>
			<CardHeader>
				<CardTitle className="text-primary">{title}</CardTitle>
				{description && <CardDescription>{description}</CardDescription>}
			</CardHeader>
			{children}
		</Card>
	)
}
