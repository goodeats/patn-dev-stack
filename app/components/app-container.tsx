import * as React from 'react'
import { cn } from '#app/utils/misc.tsx'
import { Separator } from './ui/separator'

const AppContainer = React.forwardRef<
	HTMLDivElement,
	React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
	<div
		ref={ref}
		className={cn(
			'bg-background flex max-h-dvh flex-1 flex-col overflow-hidden',
			className,
		)}
		{...props}
	/>
))
AppContainer.displayName = 'AppContainer'

const AppMain = React.forwardRef<
	HTMLDivElement,
	React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
	<div
		ref={ref}
		className={cn(
			'font-poppins bg-background text-foreground flex min-h-screen min-w-0 flex-1 flex-row',
			className,
		)}
		{...props}
	/>
))
AppMain.displayName = 'AppMain'

const AppContainerHeader = React.forwardRef<
	HTMLElement,
	React.HTMLAttributes<HTMLElement> & {
		variant?: 'default' | 'tabbed'
	}
>(({ className, variant = 'default', ...props }, ref) => (
	<header
		ref={ref}
		className={cn(
			'bg-background sticky top-0 flex shrink-0 items-center justify-between gap-2 border-b p-4',
			// tailwind.css
			'titlebar-area-top-safe',
			variant === 'tabbed' && 'flex-col p-0 pt-2',
			className,
		)}
		{...props}
	/>
))
AppContainerHeader.displayName = 'AppContainerHeader'

const AppContainerFooter = React.forwardRef<
	HTMLDivElement,
	React.HTMLAttributes<HTMLDivElement> & {
		variant?: 'default' | 'mobile-nav'
	}
>(({ className, variant = 'default', ...props }, ref) => (
	<footer
		ref={ref}
		className={cn(
			'flex flex-col gap-2 p-2',
			// tailwind.css
			'footer-area-bottom-safe',
			variant === 'mobile-nav' && 'bg-sidebar',
			className,
		)}
		{...props}
	/>
))
AppContainerFooter.displayName = 'AppContainerFooter'

const AppContainerSeparator = React.forwardRef<
	React.ElementRef<typeof Separator>,
	React.ComponentProps<typeof Separator>
>(({ className, ...props }, ref) => (
	<Separator
		ref={ref}
		className={cn('bg-border mx-2 w-auto', className)}
		{...props}
	/>
))
AppContainerSeparator.displayName = 'AppContainerSeparator'

const AppContainerContent = React.forwardRef<
	HTMLDivElement,
	React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
	<div
		ref={ref}
		className={cn(
			'flex min-h-0 flex-1 flex-col gap-2 overflow-auto',
			className,
		)}
		{...props}
	/>
))
AppContainerContent.displayName = 'AppContainerContent'

const AppContainerGroup = React.forwardRef<
	HTMLDivElement,
	React.HTMLAttributes<HTMLDivElement> & {
		variant?: 'scrollable'
	}
>(({ className, variant, ...props }, ref) => (
	<div
		ref={ref}
		className={cn(
			'relative flex w-full min-w-0 flex-col p-2 px-4 md:px-2',
			variant === 'scrollable' && 'md:max-h-screen md:overflow-y-auto',
			className,
		)}
		{...props}
	/>
))
AppContainerGroup.displayName = 'AppContainerGroup'

const AppContainerGroupHeader = React.forwardRef<
	HTMLDivElement,
	React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
	<div
		ref={ref}
		className={cn('mb-2 flex items-center text-base font-medium', className)}
		{...props}
	/>
))
AppContainerGroupHeader.displayName = 'AppContainerGroupHeader'

// good for keeping the content centered and narrow
// good for auth screens
const AppContainerGroupColumn = React.forwardRef<
	HTMLDivElement,
	React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
	<div
		ref={ref}
		className={cn('mx-auto w-full max-w-md px-0 md:px-8', className)}
		{...props}
	/>
))
AppContainerGroupColumn.displayName = 'AppContainerGroupColumn'

const AppContainerList = React.forwardRef<
	HTMLUListElement,
	React.HTMLAttributes<HTMLUListElement>
>(({ className, ...props }, ref) => (
	<ul
		ref={ref}
		data-sidebar="list"
		className={cn(
			'flex w-full min-w-0 flex-col gap-4 overflow-y-auto',
			className,
		)}
		{...props}
	/>
))
AppContainerList.displayName = 'AppContainerList'

const AppContainerListItem = React.forwardRef<
	HTMLLIElement,
	React.HTMLAttributes<HTMLLIElement>
>(({ className, ...props }, ref) => (
	<li
		ref={ref}
		data-sidebar="list-item"
		className={cn('group/list-item relative', className)}
		{...props}
	/>
))
AppContainerListItem.displayName = 'AppContainerListItem'

export {
	AppContainer,
	AppMain,
	AppContainerHeader,
	AppContainerFooter,
	AppContainerSeparator,
	AppContainerContent,
	AppContainerGroup,
	AppContainerGroupHeader,
	AppContainerGroupColumn,
	AppContainerList,
	AppContainerListItem,
}
