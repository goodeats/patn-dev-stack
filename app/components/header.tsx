import { Link } from 'react-router'
import { useOptionalUser } from '#app/utils/user.ts'
import { Logo } from './logo'
import { Button } from './ui/button'
import { UserDropdown } from './user-dropdown'

export function Header() {
	const user = useOptionalUser()

	return (
		<header className="container py-6">
			<nav className="flex flex-wrap items-center justify-between gap-4 sm:flex-nowrap md:gap-8">
				<Logo />
				<div className="flex items-center gap-10">
					{user ? (
						<UserDropdown />
					) : (
						<Button asChild variant="default" size="lg">
							<Link to="/login">Log In</Link>
						</Button>
					)}
				</div>
			</nav>
		</header>
	)
}
