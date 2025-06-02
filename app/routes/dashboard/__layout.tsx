import {
	IconDashboard,
	IconDatabase,
	IconFileWord,
	IconFolder,
	IconHelp,
	IconListDetails,
	IconReport,
	IconSearch,
	IconSettings,
	IconAddressBook,
} from '@tabler/icons-react'
import * as React from 'react'
import {
	AppContainer,
	AppContainerContent,
	AppMain,
} from '#app/components/app-container'
import { ProjectLink } from '#app/components/external-icon-link.tsx'
import { Logo } from '#app/components/logo.tsx'
import { type DynamicNavLink } from '#app/components/nav-links.tsx'
import { SidebarNavGroup } from '#app/components/sidebar-nav-group.tsx'
import { SidebarNavItems } from '#app/components/sidebar-nav-items.tsx'
import { SidebarNavUser } from '#app/components/sidebar-nav-user.tsx'
import { Separator } from '#app/components/ui/separator'
import {
	SidebarProvider,
	SidebarTrigger,
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarHeader,
} from '#app/components/ui/sidebar'
import { useRootLoaderData } from '#app/root.tsx'
import { ThemeSwitch } from '#app/routes/resources+/theme-switch.tsx'
import { useRequestInfo } from '#app/utils/request-info.ts'
import { type Info as userInfo } from './+types/route.ts'

export function DashboardLayout({
	user,
	children,
}: {
	user: userInfo['loaderData']['user']
	children: React.ReactNode
}) {
	const requestInfo = useRequestInfo()
	const sidebarState = requestInfo.userPrefs.sidebar
	const defaultOpen = sidebarState === true

	return (
		<AppContainer id="dashboard-container">
			<SidebarProvider defaultOpen={defaultOpen}>
				<DashboardSidebar id="dashboard-sidebar" user={user} />
				<AppMain id="dashboard-main">
					<AppContainerContent>
						<DashboardHeader />
						{/* children should be wrapped in AppContainerContent */}
						{children}
					</AppContainerContent>
				</AppMain>
			</SidebarProvider>
		</AppContainer>
	)
}

export function DashboardHeader() {
	const { requestInfo } = useRootLoaderData()
	return (
		<header id="dashboard-header" className="w-full border-b px-4 py-1.5">
			<nav className="flex flex-wrap items-center justify-between gap-4 sm:flex-nowrap md:gap-8">
				<div className="flex items-center gap-2">
					<SidebarTrigger id="dashboard-sidebar-trigger" />
					<Separator
						orientation="vertical"
						className="mx-2 data-[orientation=vertical]:h-4"
					/>
					<h1 className="text-base font-medium">Dashboard</h1>
				</div>

				<div className="flex items-center gap-2">
					<ThemeSwitch userPreference={requestInfo.userPrefs.theme} />
					<ProjectLink />
				</div>
			</nav>
		</header>
	)
}

const data = {
	navSecondary: [
		{
			title: 'Settings',
			url: '#',
			icon: IconSettings,
		},
		{
			title: 'Get Help',
			url: '#',
			icon: IconHelp,
		},
		{
			title: 'Search',
			url: '#',
			icon: IconSearch,
		},
	],
	documents: [
		{
			name: 'Data Library',
			url: '#',
			icon: IconDatabase,
		},
		{
			name: 'Reports',
			url: '#',
			icon: IconReport,
		},
		{
			name: 'Word Assistant',
			url: '#',
			icon: IconFileWord,
		},
	],
}

const navMain: DynamicNavLink[] = [
	{
		label: 'Dashboard',
		to: '.',
		icon: IconDashboard,
	},
	{
		label: 'About',
		to: 'about',
		icon: IconListDetails,
	},
	{
		label: 'Projects',
		to: 'projects',
		icon: IconFolder,
	},
	{
		label: 'Contact',
		to: 'contact',
		icon: IconAddressBook,
	},
]

export function DashboardSidebar({
	user,
	...props
}: React.ComponentProps<typeof Sidebar> & {
	user: userInfo['loaderData']['user']
}) {
	return (
		<Sidebar collapsible="icon" {...props}>
			<SidebarHeader>
				<Logo />
			</SidebarHeader>
			<SidebarContent>
				<SidebarNavGroup items={navMain} />
				<SidebarNavItems items={data.navSecondary} className="mt-auto" />
			</SidebarContent>
			<SidebarFooter>
				<SidebarNavUser user={user} />
			</SidebarFooter>
		</Sidebar>
	)
}
