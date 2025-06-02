import { Link } from 'react-router'
import { useRootLoaderData } from '#app/root.tsx'
import { ThemeSwitch } from '#app/routes/resources+/theme-switch.tsx'
import { Logo } from './logo'
import { Button } from './ui/button'

export function Header() {
	const { user, requestInfo } = useRootLoaderData()

	return (
		<header className="absolute inset-x-0 top-0 z-50 py-6">
			<nav className="container flex flex-wrap items-center justify-between gap-4 sm:flex-nowrap md:gap-8">
				<Logo />
				<div className="flex items-center gap-4">
					<ThemeSwitch userPreference={requestInfo.userPrefs.theme} />
					{user && (
						<Button variant="default" asChild>
							<Link id="header-user-button" to="/dashboard">
								{user?.name}
							</Link>
						</Button>
					)}
				</div>
			</nav>
		</header>
	)
}
