import { useRootLoaderData } from '#app/root.tsx'
import { ThemeSwitch } from '#app/routes/resources+/theme-switch.tsx'
import { Logo } from './logo'

export function Header() {
	const { user, requestInfo } = useRootLoaderData()

	return (
		<header className="container py-6">
			<nav className="flex flex-wrap items-center justify-between gap-4 sm:flex-nowrap md:gap-8">
				<Logo />
				<div className="flex items-center gap-10">
					<ThemeSwitch userPreference={requestInfo.userPrefs.theme} />
					<span className="text-primary">{user?.name}</span>
				</div>
			</nav>
		</header>
	)
}

export function HeaderMarketing() {
	const { requestInfo } = useRootLoaderData()

	return (
		<header className="absolute inset-x-0 top-0 z-50 py-6">
			<nav className="container flex flex-wrap items-center justify-between gap-4 sm:flex-nowrap md:gap-8">
				<Logo />
				<div className="flex items-center gap-10">
					<ThemeSwitch userPreference={requestInfo.userPrefs.theme} />
				</div>
			</nav>
		</header>
	)
}
