import { Link, type LinkProps } from 'react-router'
import { Button } from '#app/components/ui/button.tsx'
import { Icon } from '#app/components/ui/icon.tsx'
import { type IconName } from '@/icon-name'

// https://reactrouter.com/api/components/Link

// Base interface for all link button props
interface BaseLinkButtonProps extends LinkProps {
	label?: string
	className?: string
	size?: 'default' | 'sm' | 'lg' | 'icon'
	variant?:
		| 'default'
		| 'destructive'
		| 'outline'
		| 'secondary'
		| 'ghost'
		| 'link'
	iconName?: IconName
}

// Generic LinkButton component
const LinkButton = ({
	label,
	to,
	relative,
	prefetch,
	className,
	size = 'sm',
	variant = 'outline',
	iconName,
}: BaseLinkButtonProps) => {
	return (
		<Button variant={variant} size={size} className={className} asChild>
			<Link to={to} relative={relative} prefetch={prefetch}>
				{iconName && <Icon name={iconName} className="mr-2" />}
				{label}
			</Link>
		</Button>
	)
}

// Convenience components with specific defaults
export const BackLink = ({
	label = 'Back to List',
	to = '..',
	relative = 'path',
	variant = 'ghost',
	...props
}: Omit<BaseLinkButtonProps, 'to'> & { to?: string }) => {
	return (
		<LinkButton
			label={label}
			to={to}
			relative={relative}
			variant={variant}
			iconName="arrow-left"
			{...props}
		/>
	)
}

export const EditLink = ({
	label = 'Edit',
	to = 'edit',
	variant = 'outline',
	...props
}: Omit<BaseLinkButtonProps, 'to'> & { to?: string }) => {
	return (
		<LinkButton
			label={label}
			to={to}
			variant={variant}
			iconName="pencil-1"
			{...props}
		/>
	)
}
