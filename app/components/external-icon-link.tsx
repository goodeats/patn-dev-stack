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
	iconSize = 'lg',
}: {
	iconLink: Pick<SocialLink, 'href' | 'icon' | 'label' | 'text'>
	iconSize?: 'sm' | 'md' | 'lg'
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
							<Icon name={icon as IconName} size={iconSize} />
							<span className="sr-only">{text}</span>
						</a>
					</Button>
				</TooltipTrigger>
				<TooltipContent>{text}</TooltipContent>
			</Tooltip>
		</TooltipProvider>
	)
}

export function ProjectLink() {
	return (
		<ExternalIconLink
			iconLink={{
				href: 'https://github.com/goodeats/patn-dev-stack',
				label: 'Project Source Code',
				text: 'View Source Code',
				icon: 'github-logo',
			}}
			iconSize="md"
		/>
	)
}
