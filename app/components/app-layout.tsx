import { useRequestInfo } from '#app/utils/request-info.ts'
import { AppContainer, AppMain } from './app-container'
import { AppSidebar } from './app-sidebar'
import { SidebarProvider } from './ui/sidebar'

export function DashboardLayout({ children }: { children: React.ReactNode }) {
	const requestInfo = useRequestInfo()
	const sidebarState = requestInfo.userPrefs.sidebar
	const defaultOpen = sidebarState === true

	return (
		<AppContainer id="dashboard-container">
			<SidebarProvider
				id="dashboard-sidebar-provider"
				defaultOpen={defaultOpen}
			>
				<AppSidebar id="dashboard-sidebar" />
				{/* children should be wrapped in AppContainerContent */}
				<AppMain id="dashboard-main">{children}</AppMain>
			</SidebarProvider>
		</AppContainer>
	)
}
