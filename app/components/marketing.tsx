import { useFadeInOnScroll } from '#app/hooks/use-fade-in-on-scroll.ts'
import { cn } from '#app/utils/misc.tsx'
import { Card, CardDescription, CardHeader, CardTitle } from './ui/card'

export const MarketingSection = ({
	sectionId,
	children,
	className,
}: {
	sectionId: string
	children: React.ReactNode
	className?: string
}) => {
	const { ref, isVisible } = useFadeInOnScroll()
	return (
		<section
			ref={ref}
			id={sectionId}
			className={cn('bg-muted px-4 py-20', className)}
		>
			<div
				className={`container px-4 text-center sm:px-8 ${isVisible ? 'animate-fade-in-up' : 'opacity-0'}`}
			>
				{children}
			</div>
		</section>
	)
}

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
