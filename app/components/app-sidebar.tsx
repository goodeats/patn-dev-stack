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
	IconInnerShadowTop,
	IconListDetails,
	IconReport,
	IconSearch,
	IconSettings,
	IconUsers,
} from '@tabler/icons-react'
import * as React from 'react'

import { NavDocuments } from '#app/components/nav-documents'
import { NavMain } from '#app/components/nav-main'
import { NavSecondary } from '#app/components/nav-secondary'
import { NavUser } from '#app/components/nav-user'
import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarHeader,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	SidebarTrigger,
	useSidebar,
} from '#app/components/ui/sidebar'
import { Logo } from './logo'

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

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
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
				<NavUser user={data.user} />
			</SidebarFooter>
		</Sidebar>
	)
}
