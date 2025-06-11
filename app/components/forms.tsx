import { useInputControl } from '@conform-to/react'
import { REGEXP_ONLY_DIGITS_AND_CHARS, type OTPInputProps } from 'input-otp'
import React, { useId } from 'react'
import { Checkbox, type CheckboxProps } from './ui/checkbox.tsx'
import {
	InputOTP,
	InputOTPGroup,
	InputOTPSeparator,
	InputOTPSlot,
} from './ui/input-otp.tsx'
import { Input } from './ui/input.tsx'
import { Label } from './ui/label.tsx'
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from './ui/select.tsx'
import { Switch } from './ui/switch.tsx'
import { Textarea } from './ui/textarea.tsx'

export type ListOfErrors = Array<string | null | undefined> | null | undefined

export function ErrorList({
	id,
	errors,
}: {
	errors?: ListOfErrors
	id?: string
}) {
	const errorsToRender = errors?.filter(Boolean)
	if (!errorsToRender?.length) return null
	return (
		<ul id={id} className="flex flex-col gap-1">
			{errorsToRender.map((e) => (
				<li key={e} className="text-foreground-destructive text-[10px]">
					{e}
				</li>
			))}
		</ul>
	)
}

export function Field({
	labelProps,
	inputProps,
	errors,
	className,
}: {
	labelProps: React.LabelHTMLAttributes<HTMLLabelElement>
	inputProps: React.InputHTMLAttributes<HTMLInputElement>
	errors?: ListOfErrors
	className?: string
}) {
	const fallbackId = useId()
	const id = inputProps.id ?? fallbackId
	const errorId = errors?.length ? `${id}-error` : undefined
	return (
		<div className={className}>
			<Label htmlFor={id} {...labelProps} />
			<Input
				id={id}
				aria-invalid={errorId ? true : undefined}
				aria-describedby={errorId}
				{...inputProps}
			/>
			<div className="min-h-[32px] px-4 pt-1 pb-3">
				{errorId ? <ErrorList id={errorId} errors={errors} /> : null}
			</div>
		</div>
	)
}

export function OTPField({
	labelProps,
	inputProps,
	errors,
	className,
}: {
	labelProps: React.LabelHTMLAttributes<HTMLLabelElement>
	inputProps: Partial<OTPInputProps & { render: never }>
	errors?: ListOfErrors
	className?: string
}) {
	const fallbackId = useId()
	const id = inputProps.id ?? fallbackId
	const errorId = errors?.length ? `${id}-error` : undefined
	return (
		<div className={className}>
			<Label htmlFor={id} {...labelProps} />
			<InputOTP
				pattern={REGEXP_ONLY_DIGITS_AND_CHARS}
				maxLength={6}
				id={id}
				aria-invalid={errorId ? true : undefined}
				aria-describedby={errorId}
				{...inputProps}
			>
				<InputOTPGroup>
					<InputOTPSlot index={0} />
					<InputOTPSlot index={1} />
					<InputOTPSlot index={2} />
				</InputOTPGroup>
				<InputOTPSeparator />
				<InputOTPGroup>
					<InputOTPSlot index={3} />
					<InputOTPSlot index={4} />
					<InputOTPSlot index={5} />
				</InputOTPGroup>
			</InputOTP>
			<div className="min-h-[32px] px-4 pt-1 pb-3">
				{errorId ? <ErrorList id={errorId} errors={errors} /> : null}
			</div>
		</div>
	)
}

export function TextareaField({
	labelProps,
	textareaProps,
	errors,
	className,
}: {
	labelProps: React.LabelHTMLAttributes<HTMLLabelElement>
	textareaProps: React.TextareaHTMLAttributes<HTMLTextAreaElement>
	errors?: ListOfErrors
	className?: string
}) {
	const fallbackId = useId()
	const id = textareaProps.id ?? textareaProps.name ?? fallbackId
	const errorId = errors?.length ? `${id}-error` : undefined
	return (
		<div className={className}>
			<Label htmlFor={id} {...labelProps} />
			<Textarea
				id={id}
				aria-invalid={errorId ? true : undefined}
				aria-describedby={errorId}
				{...textareaProps}
			/>
			<div className="min-h-[32px] px-4 pt-1 pb-3">
				{errorId ? <ErrorList id={errorId} errors={errors} /> : null}
			</div>
		</div>
	)
}

export function CheckboxField({
	labelProps,
	buttonProps,
	errors,
	className,
}: {
	labelProps: React.ComponentProps<'label'>
	buttonProps: CheckboxProps & {
		name: string
		form: string
		value?: string
	}
	errors?: ListOfErrors
	className?: string
}) {
	const { key, defaultChecked, ...checkboxProps } = buttonProps
	const fallbackId = useId()
	const checkedValue = buttonProps.value ?? 'on'
	const input = useInputControl({
		key,
		name: buttonProps.name,
		formId: buttonProps.form,
		initialValue: defaultChecked ? checkedValue : undefined,
	})
	const id = buttonProps.id ?? fallbackId
	const errorId = errors?.length ? `${id}-error` : undefined

	return (
		<div className={className}>
			<div className="flex gap-2">
				<Checkbox
					{...checkboxProps}
					id={id}
					aria-invalid={errorId ? true : undefined}
					aria-describedby={errorId}
					checked={input.value === checkedValue}
					onCheckedChange={(state) => {
						input.change(state.valueOf() ? checkedValue : '')
						buttonProps.onCheckedChange?.(state)
					}}
					onFocus={(event) => {
						input.focus()
						buttonProps.onFocus?.(event)
					}}
					onBlur={(event) => {
						input.blur()
						buttonProps.onBlur?.(event)
					}}
					type="button"
				/>
				<label
					htmlFor={id}
					{...labelProps}
					className="text-body-xs text-muted-foreground self-center"
				/>
			</div>
			<div className="px-4 pt-1 pb-3">
				{errorId ? <ErrorList id={errorId} errors={errors} /> : null}
			</div>
		</div>
	)
}

export function SwitchField({
	labelProps,
	switchProps,
	errors,
	className,
}: {
	labelProps: React.ComponentProps<'label'>
	switchProps: React.ComponentProps<typeof Switch> & {
		name: string
		form: string
		value?: string
		key?: string
		defaultChecked?: boolean
	}
	errors?: ListOfErrors
	className?: string
}) {
	const { key, defaultChecked, ...restSwitchProps } = switchProps
	const fallbackId = useId()
	const checkedValue = switchProps.value ?? 'on'
	const input = useInputControl({
		key,
		name: switchProps.name,
		formId: switchProps.form,
		initialValue: defaultChecked ? checkedValue : undefined,
	})
	const id = switchProps.id ?? fallbackId
	const errorId = errors?.length ? `${id}-error` : undefined

	return (
		<div className={className}>
			<div className="flex items-center gap-3">
				<Switch
					{...restSwitchProps}
					id={id}
					aria-invalid={errorId ? true : undefined}
					aria-describedby={errorId}
					checked={input.value === checkedValue}
					onCheckedChange={(checked) => {
						input.change(checked ? checkedValue : '')
						switchProps.onCheckedChange?.(checked)
					}}
					onFocus={(event) => {
						input.focus()
						switchProps.onFocus?.(event)
					}}
					onBlur={(event) => {
						input.blur()
						switchProps.onBlur?.(event)
					}}
					type="button"
				/>
				<label
					htmlFor={id}
					{...labelProps}
					className="text-body-xs text-muted-foreground cursor-pointer"
				/>
			</div>
			<div className="px-4 pt-1 pb-3">
				{errorId ? <ErrorList id={errorId} errors={errors} /> : null}
			</div>
		</div>
	)
}

export function ToggleField({
	labelProps,
	buttonProps,
	errors,
	className,
	variant = 'checkbox',
}: {
	labelProps: React.ComponentProps<'label'>
	buttonProps: (CheckboxProps | React.ComponentProps<typeof Switch>) & {
		name: string
		form: string
		value?: string
		key?: string
		defaultChecked?: boolean
	}
	errors?: ListOfErrors
	className?: string
	variant?: 'checkbox' | 'switch'
}) {
	if (variant === 'switch') {
		return (
			<SwitchField
				labelProps={labelProps}
				switchProps={
					buttonProps as React.ComponentProps<typeof Switch> & {
						name: string
						form: string
						value?: string
						key?: string
						defaultChecked?: boolean
					}
				}
				errors={errors}
				className={className}
			/>
		)
	}

	// Fallback to checkbox
	return (
		<CheckboxField
			labelProps={labelProps}
			buttonProps={
				buttonProps as CheckboxProps & {
					name: string
					form: string
					value?: string
				}
			}
			errors={errors}
			className={className}
		/>
	)
}

export function SelectField({
	labelProps,
	selectProps,
	options,
	errors,
	className,
	placeholder,
}: {
	labelProps: React.LabelHTMLAttributes<HTMLLabelElement>
	selectProps: React.ComponentProps<typeof Select> & {
		id?: string
		name: string
	}
	options: Array<{ value: string; label: string }>
	errors?: ListOfErrors
	className?: string
	placeholder?: string
}) {
	const fallbackId = useId()
	const id = selectProps.id ?? fallbackId
	const errorId = errors?.length ? `${id}-error` : undefined

	return (
		<div className={className}>
			<Label htmlFor={id} {...labelProps} />
			<Select {...selectProps} name={selectProps.name}>
				<SelectTrigger id={id}>
					<SelectValue placeholder={placeholder} />
				</SelectTrigger>
				<SelectContent>
					{options.map((option) => (
						<SelectItem key={option.value} value={option.value}>
							{option.label}
						</SelectItem>
					))}
				</SelectContent>
			</Select>
			<div className="min-h-[32px] px-4 pt-1 pb-3">
				{errorId ? <ErrorList id={errorId} errors={errors} /> : null}
			</div>
		</div>
	)
}
