import { type Icon as IconNode } from '@tabler/icons-react'
import { Link } from 'react-router'
import { Button } from '#app/components/ui/button.tsx'
import { Icon } from '#app/components/ui/icon.tsx'
import { type IconName } from '@/icon-name'

// https://reactrouter.com/api/components/Link
export interface BackLinkProps {
	label?: string
	to?: string
	relative?: 'route' | 'path'
	className?: string
	size?: 'default' | 'sm' | 'lg' | 'icon'
	variant?:
		| 'default'
		| 'destructive'
		| 'outline'
		| 'secondary'
		| 'ghost'
		| 'link'
}

export interface EditLinkProps {
	label?: string
	to?: string
	className?: string
	size?: 'default' | 'sm' | 'lg' | 'icon'
	variant?:
		| 'default'
		| 'destructive'
		| 'outline'
		| 'secondary'
		| 'ghost'
		| 'link'
}

export const BackLink = ({
	label = 'Back to List',
	to = '..',
	relative = 'path',
	className,
	size = 'sm',
	variant = 'ghost',
}: BackLinkProps) => {
	return (
		<Button variant={variant} size={size} className={className} asChild>
			<Link to={to} relative={relative}>
				<Icon name="arrow-left" className="mr-2" />
				{label}
			</Link>
		</Button>
	)
}

export const EditLink = ({
	label = 'Edit',
	to = 'edit',
	className,
	size = 'sm',
	variant = 'outline',
}: EditLinkProps) => {
	return (
		<Button variant={variant} size={size} className={className} asChild>
			<Link to={to}>
				<Icon name="pencil-1" className="mr-2" />
				{label}
			</Link>
		</Button>
	)
}
