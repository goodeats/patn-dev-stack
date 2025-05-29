import { useRootLoaderData } from '#app/root.tsx'
import { ThemeSwitch } from '#app/routes/resources+/theme-switch.tsx'
import { Logo } from './logo'

export function Header() {
	const { requestInfo } = useRootLoaderData()

	return (
		<header className="container py-6">
			<nav className="flex flex-wrap items-center justify-between gap-4 sm:flex-nowrap md:gap-8">
				<Logo />
				<div className="flex items-center gap-10">
					<ThemeSwitch userPreference={requestInfo.userPrefs.theme} />
				</div>
			</nav>
		</header>
	)
}
