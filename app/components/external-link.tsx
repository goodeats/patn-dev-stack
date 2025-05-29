import { cn } from '#app/utils/misc.tsx'
import { Button, type ButtonVariant, buttonVariants } from './ui/button'
import { Icon } from './ui/icon'

interface ExternalLinkProps extends ButtonVariant {
	href: string
	children: React.ReactNode
	className?: string
	ariaLabel: string
}

export const ExternalLink = ({
	href,
	children,
	variant = 'default',
	className,
	ariaLabel,
	...props
}: ExternalLinkProps) => {
	return (
		<Button
			className={cn(buttonVariants({ variant }), className)}
			asChild
			{...props}
		>
			<a
				href={href}
				target="_blank"
				rel="noopener noreferrer"
				aria-label={ariaLabel}
				tabIndex={0}
				className="flex items-center gap-2"
			>
				{children}
				<Icon name="external-link" />
			</a>
		</Button>
	)
}
