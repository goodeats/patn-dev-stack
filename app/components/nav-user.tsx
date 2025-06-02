import {
	IconCreditCard,
	IconDotsVertical,
	IconLogout,
	IconNotification,
	IconUserCircle,
} from '@tabler/icons-react'
import { Avatar, AvatarFallback, AvatarImage } from '#app/components/ui/avatar'
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from '#app/components/ui/dropdown-menu'
import {
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	useSidebar,
} from '#app/components/ui/sidebar'
import { getUserImgSrc } from '#app/utils/misc.tsx'

export function NavUser({
	user,
}: {
	user: {
		name: string | null
		email: string
		image: {
			objectKey: string
		} | null
	}
}) {
	const { isMobile } = useSidebar()

	return (
		<SidebarMenu>
			<SidebarMenuItem>
				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<SidebarMenuButton
							size="lg"
							className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
						>
							<Avatar className="h-8 w-8 rounded-lg grayscale">
								<AvatarImage
									src={
										user.image ? getUserImgSrc(user.image.objectKey) : undefined
									}
									alt={user.name ?? user.email}
								/>
								<AvatarFallback className="rounded-lg">
									{user.name
										? user.name.charAt(0).toUpperCase()
										: user.email.charAt(0).toUpperCase()}
								</AvatarFallback>
							</Avatar>
							<div className="grid flex-1 text-left text-sm leading-tight">
								<span className="truncate font-medium">
									{user.name ?? user.email}
								</span>
								<span className="text-muted-foreground truncate text-xs">
									{user.email}
								</span>
							</div>
							<IconDotsVertical className="ml-auto size-4" />
						</SidebarMenuButton>
					</DropdownMenuTrigger>
					<DropdownMenuContent
						className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
						side={isMobile ? 'bottom' : 'right'}
						align="end"
						sideOffset={4}
					>
						<DropdownMenuLabel className="p-0 font-normal">
							<div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
								<Avatar className="h-8 w-8 rounded-lg">
									<AvatarImage
										src={
											user.image
												? getUserImgSrc(user.image.objectKey)
												: undefined
										}
										alt={user.name ?? user.email}
									/>
									<AvatarFallback className="rounded-lg">
										{user.name
											? user.name.charAt(0).toUpperCase()
											: user.email.charAt(0).toUpperCase()}
									</AvatarFallback>
								</Avatar>
								<div className="grid flex-1 text-left text-sm leading-tight">
									<span className="truncate font-medium">
										{user.name ?? user.email}
									</span>
									<span className="text-muted-foreground truncate text-xs">
										{user.email}
									</span>
								</div>
							</div>
						</DropdownMenuLabel>
						<DropdownMenuSeparator />
						<DropdownMenuGroup>
							<DropdownMenuItem>
								<IconUserCircle />
								Account
							</DropdownMenuItem>
							<DropdownMenuItem>
								<IconCreditCard />
								Billing
							</DropdownMenuItem>
							<DropdownMenuItem>
								<IconNotification />
								Notifications
							</DropdownMenuItem>
						</DropdownMenuGroup>
						<DropdownMenuSeparator />
						<DropdownMenuItem>
							<IconLogout />
							Log out
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
			</SidebarMenuItem>
		</SidebarMenu>
	)
}
