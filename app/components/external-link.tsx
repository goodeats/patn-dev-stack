import { cn } from '#app/utils/misc.tsx'
import { Button, type ButtonVariant, buttonVariants } from './ui/button'
import { Icon } from './ui/icon'

interface ExternalLinkProps {
	href: string
	children: React.ReactNode
	className?: string
	ariaLabel: string
}

interface ExternalLinkButtonProps extends ButtonVariant, ExternalLinkProps {}

export const ExternalLinkButton = ({
	href,
	children,
	variant = 'default',
	className,
	ariaLabel,
	...props
}: ExternalLinkButtonProps) => {
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

export const ExternalLink = ({
	href,
	children,
	className,
	ariaLabel,
}: ExternalLinkProps) => {
	return (
		<a
			href={href}
			target="_blank"
			rel="noopener noreferrer"
			aria-label={ariaLabel}
			tabIndex={0}
			className={cn('flex items-center gap-2', className)}
		>
			{children}
			<Icon name="external-link" />
		</a>
	)
}
