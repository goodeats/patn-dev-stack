import { type Icon as IconNode } from '@tabler/icons-react'
import { type IconName } from '@/icon-name'

// https://reactrouter.com/api/components/NavLink
export type DynamicNavLink = {
	to: string
	label: string
	iconName?: IconName
	icon?: IconNode
	end?: boolean
	// nested nav links
	items?: DynamicNavLink[]
}
