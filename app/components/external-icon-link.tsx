import { type SocialLink } from '@prisma/client'
import { Button } from './ui/button'
import { Icon, type IconName } from './ui/icon'
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from './ui/tooltip'

export function ExternalIconLink({
	iconLink,
}: {
	iconLink: Pick<SocialLink, 'href' | 'icon' | 'label' | 'text'>
}) {
	const { href, label, text, icon } = iconLink

	return (
		<TooltipProvider>
			<Tooltip>
				<TooltipTrigger asChild>
					<Button
						variant="ghost"
						size="icon"
						asChild
						className="hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground transition-colors"
					>
						<a
							href={href}
							target={href.startsWith('mailto:') ? undefined : '_blank'}
							rel={
								href.startsWith('mailto:') ? undefined : 'noopener noreferrer'
							}
							aria-label={label}
							tabIndex={0}
						>
							<Icon name={icon as IconName} size="lg" />
							<span className="sr-only">{text}</span>
						</a>
					</Button>
				</TooltipTrigger>
				<TooltipContent>{text}</TooltipContent>
			</Tooltip>
		</TooltipProvider>
	)
}
