import {
	IconCamera,
	IconChartBar,
	IconDashboard,
	IconDatabase,
	IconFileAi,
	IconFileDescription,
	IconFileWord,
	IconFolder,
	IconHelp,
	IconListDetails,
	IconReport,
	IconSearch,
	IconSettings,
	IconUsers,
} from '@tabler/icons-react'
import * as React from 'react'
import {
	AppContainer,
	AppContainerContent,
	AppMain,
} from '#app/components/app-container'
import { ProjectLink } from '#app/components/external-icon-link.tsx'
import { Logo } from '#app/components/logo.tsx'
import { NavDocuments } from '#app/components/nav-documents'
import { NavMain } from '#app/components/nav-main'
import { NavSecondary } from '#app/components/nav-secondary'
import { NavUser } from '#app/components/nav-user'
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
	user: {
		name: 'shadcn',
		email: 'm@example.com',
		avatar: '/avatars/shadcn.jpg',
	},
	navMain: [
		{
			title: 'Dashboard',
			url: '#',
			icon: IconDashboard,
		},
		{
			title: 'Lifecycle',
			url: '#',
			icon: IconListDetails,
		},
		{
			title: 'Analytics',
			url: '#',
			icon: IconChartBar,
		},
		{
			title: 'Projects',
			url: '#',
			icon: IconFolder,
		},
		{
			title: 'Team',
			url: '#',
			icon: IconUsers,
		},
	],
	navClouds: [
		{
			title: 'Capture',
			icon: IconCamera,
			isActive: true,
			url: '#',
			items: [
				{
					title: 'Active Proposals',
					url: '#',
				},
				{
					title: 'Archived',
					url: '#',
				},
			],
		},
		{
			title: 'Proposal',
			icon: IconFileDescription,
			url: '#',
			items: [
				{
					title: 'Active Proposals',
					url: '#',
				},
				{
					title: 'Archived',
					url: '#',
				},
			],
		},
		{
			title: 'Prompts',
			icon: IconFileAi,
			url: '#',
			items: [
				{
					title: 'Active Proposals',
					url: '#',
				},
				{
					title: 'Archived',
					url: '#',
				},
			],
		},
	],
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
				<NavMain items={data.navMain} />
				<NavDocuments items={data.documents} />
				<NavSecondary items={data.navSecondary} className="mt-auto" />
			</SidebarContent>
			<SidebarFooter>
				<NavUser user={user} />
			</SidebarFooter>
		</Sidebar>
	)
}
