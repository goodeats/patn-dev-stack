import { Button } from '#app/components/ui/button'
import { Separator } from '#app/components/ui/separator'
import { SidebarTrigger } from '#app/components/ui/sidebar'

export function DashboardHeader() {
	return (
		<header className="debug-border-green container w-full border-b py-1.5">
			<nav className="flex flex-wrap items-center justify-between gap-4 sm:flex-nowrap md:gap-8">
				<div className="flex items-center gap-2">
					<SidebarTrigger className="" />
					<Separator
						orientation="vertical"
						className="mx-2 data-[orientation=vertical]:h-4"
					/>
					<h1 className="text-base font-medium">Dashboard</h1>
				</div>

				<div className="flex items-center gap-2">
					<Button variant="ghost" asChild size="sm" className="hidden sm:flex">
						<a
							href="https://github.com/shadcn-ui/ui/tree/main/apps/v4/app/(examples)/dashboard"
							rel="noopener noreferrer"
							target="_blank"
							className="dark:text-foreground"
						>
							GitHub
						</a>
					</Button>
				</div>
			</nav>
		</header>
	)
}

export function DashboardHeaderOld() {
	return (
		<header className="flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
			<div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
				<SidebarTrigger className="-ml-1" />
				<Separator
					orientation="vertical"
					className="mx-2 data-[orientation=vertical]:h-4"
				/>
				<h1 className="text-base font-medium">Documents</h1>
				<div className="ml-auto flex items-center gap-2">
					<Button variant="ghost" asChild size="sm" className="hidden sm:flex">
						<a
							href="https://github.com/shadcn-ui/ui/tree/main/apps/v4/app/(examples)/dashboard"
							rel="noopener noreferrer"
							target="_blank"
							className="dark:text-foreground"
						>
							GitHub
						</a>
					</Button>
				</div>
			</div>
		</header>
	)
}
