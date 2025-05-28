import { Button } from './ui/button'

interface NavLinkProps {
	href: string
	children: React.ReactNode
}

function NavLink({ href, children }: NavLinkProps) {
	const handleClick = (e: React.MouseEvent) => {
		e.preventDefault()
		document
			.getElementById(href.slice(1))
			?.scrollIntoView({ behavior: 'smooth' })
	}

	return (
		<Button asChild variant="ghost" size="sm">
			<a href={href} onClick={handleClick}>
				{children}
			</a>
		</Button>
	)
}

const navItems = [
	{ href: '#about', label: 'About' },
	{ href: '#skills', label: 'Skills' },
	{ href: '#projects', label: 'Projects' },
	{ href: '#contact', label: 'Contact' },
]

export function NavLinks() {
	return (
		<nav className="flex items-center gap-4">
			{navItems.map(({ href, label }) => (
				<NavLink key={href} href={href}>
					{label}
				</NavLink>
			))}
		</nav>
	)
}
