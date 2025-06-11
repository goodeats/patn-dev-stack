import { Link, type LinkProps } from 'react-router'
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from '#app/components/ui/tooltip.tsx'
import { cn } from '#app/utils/misc.tsx'

interface TooltipLinkProps extends LinkProps {
	label: string
	description?: string | null
}

export const TooltipDataTableRowLink = ({
	to,
	label,
	description,
	className,
}: TooltipLinkProps) => {
	return (
		<TooltipProvider>
			<Tooltip>
				<TooltipTrigger asChild>
					<Link to={to} className={cn('hover:underline', className)}>
						{label}
					</Link>
				</TooltipTrigger>
				{description && (
					<TooltipContent>
						<p className="max-w-xs break-words">{description}</p>
					</TooltipContent>
				)}
			</Tooltip>
		</TooltipProvider>
	)
}
