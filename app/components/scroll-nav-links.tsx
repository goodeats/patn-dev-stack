import { Button } from './ui/button'

interface ScrollNavLinkProps {
	href: string
	children: React.ReactNode
	className?: string
}

function ScrollNavLink({ href, children, className }: ScrollNavLinkProps) {
	const handleClick = (e: React.MouseEvent) => {
		e.preventDefault()
		document
			.getElementById(href.slice(1))
			?.scrollIntoView({ behavior: 'smooth' })
	}

	return (
		<Button asChild variant="ghost" size="sm" className={className}>
			<a href={href} onClick={handleClick}>
				{children}
			</a>
		</Button>
	)
}

type ScrollNavLinkItem = {
	href: string
	label: string
}

export function ScrollNavLinks({
	navItems,
}: {
	navItems: ScrollNavLinkItem[]
}) {
	return (
		<nav className="flex items-center gap-4">
			{navItems.map(({ href, label }) => (
				<ScrollNavLink
					key={href}
					href={href}
					className="text-primary hover:text-primary/80 hover:bg-primary/10"
				>
					{label}
				</ScrollNavLink>
			))}
		</nav>
	)
}
