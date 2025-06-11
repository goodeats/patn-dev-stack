import { NavLink, type NavLinkRenderProps } from 'react-router'
import {
	SidebarGroup,
	SidebarGroupContent,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
} from '#app/components/ui/sidebar'
import { type DynamicNavLink } from './nav-links'
import { Icon } from './ui/icon'

export function SidebarNavGroup({ items }: { items: DynamicNavLink[] }) {
	return (
		<SidebarGroup>
			<SidebarGroupContent className="flex flex-col gap-2">
				<SidebarMenu>
					{items.map((item) => (
						<SidebarMenuItem key={item.label}>
							<NavLink
								to={item.to}
								end={item.end}
								prefetch="intent"
								className="focus-visible:ring-ring block rounded-md focus-visible:ring-2 focus-visible:outline-none"
							>
								{({ isActive, isPending }: NavLinkRenderProps) => (
									<SidebarMenuButton
										tooltip={item.label}
										isActive={isActive || isPending}
									>
										{item.iconName && <Icon name={item.iconName} />}
										{item.icon && <item.icon />}
										<span>{item.label}</span>
									</SidebarMenuButton>
								)}
							</NavLink>
						</SidebarMenuItem>
					))}
				</SidebarMenu>
			</SidebarGroupContent>
		</SidebarGroup>
	)
}
