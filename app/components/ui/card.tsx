import * as React from 'react'

import { cn } from '#app/utils/misc'

function Card({ className, ...props }: React.ComponentProps<'div'>) {
	return (
		<div
			data-slot="card"
			className={cn(
				'bg-card text-card-foreground flex flex-col gap-6 rounded-xl border py-6 shadow-sm',
				className,
			)}
			{...props}
		/>
	)
}

function CardHeader({ className, ...props }: React.ComponentProps<'div'>) {
	return (
		<div
			data-slot="card-header"
			className={cn(
				'@container/card-header grid auto-rows-min grid-rows-[auto_auto] items-start gap-1.5 px-6 has-data-[slot=card-action]:grid-cols-[1fr_auto] [.border-b]:pb-6',
				className,
			)}
			{...props}
		/>
	)
}

function CardTitle({ className, ...props }: React.ComponentProps<'div'>) {
	return (
		<div
			data-slot="card-title"
			className={cn('leading-none font-semibold', className)}
			{...props}
		/>
	)
}

function CardDescription({ className, ...props }: React.ComponentProps<'div'>) {
	return (
		<div
			data-slot="card-description"
			className={cn('text-muted-foreground text-sm', className)}
			{...props}
		/>
	)
}

function CardAction({ className, ...props }: React.ComponentProps<'div'>) {
	return (
		<div
			data-slot="card-action"
			className={cn(
				'col-start-2 row-span-2 row-start-1 self-start justify-self-end',
				className,
			)}
			{...props}
		/>
	)
}
function CardContent({
	className,
	variant,
	...props
}: React.ComponentProps<'div'> & {
	variant?: 'default' | 'details'
}) {
	return (
		<div
			data-slot="card-content"
			className={cn(
				'px-6',
				variant === 'details' &&
					'flex flex-col gap-4 md:grid md:grid-cols-[minmax(120px,auto)_1fr] md:items-baseline md:gap-x-8 md:gap-y-6',
				className,
			)}
			{...props}
		/>
	)
}

function CardFooter({ className, ...props }: React.ComponentProps<'div'>) {
	return (
		<div
			data-slot="card-footer"
			className={cn('flex items-center px-6 [.border-t]:pt-6', className)}
			{...props}
		/>
	)
}

type DetailsItemProps = {
	label: string
} & React.ComponentProps<'div'>

function CardDetailsItem({ label, className, ...props }: DetailsItemProps) {
	return (
		<>
			<CardDetailsLabel className={className}>{label}</CardDetailsLabel>
			<div data-slot="details-value" {...props} />
		</>
	)
}

function CardDetailsLabel({
	className,
	...props
}: React.ComponentProps<'div'>) {
	return (
		<div
			data-slot="details-label"
			className={cn('text-foreground text-base font-medium', className)}
			{...props}
		/>
	)
}

function CardDetailsValue({
	className,
	variant,
	...props
}: React.ComponentProps<'div'> & {
	variant?: 'default' | 'prose'
}) {
	return (
		<div
			data-slot="details-value"
			className={cn(
				'text-muted-foreground text-sm',
				variant === 'prose' &&
					'prose prose-sm sm:prose-base max-w-none break-words whitespace-pre-wrap',
				className,
			)}
			{...props}
		/>
	)
}

export {
	Card,
	CardHeader,
	CardFooter,
	CardTitle,
	CardAction,
	CardDescription,
	CardContent,
	CardDetailsItem,
	CardDetailsValue,
}
