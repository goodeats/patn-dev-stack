import {
	closestCenter,
	DndContext,
	KeyboardSensor,
	MouseSensor,
	TouchSensor,
	useSensor,
	useSensors,
	type DragEndEvent,
	type UniqueIdentifier,
} from '@dnd-kit/core'
import { restrictToVerticalAxis } from '@dnd-kit/modifiers'
import {
	arrayMove,
	SortableContext,
	useSortable,
	verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import {
	IconCaretDown,
	IconCaretUp,
	IconChevronDown,
	IconChevronLeft,
	IconChevronRight,
	IconChevronsLeft,
	IconChevronsRight,
	IconGripVertical,
	IconSelector, // For 'caret-sort'
} from '@tabler/icons-react'
import {
	type Column,
	type ColumnDef,
	type ColumnFiltersState,
	flexRender,
	getCoreRowModel,
	getFacetedRowModel,
	getFacetedUniqueValues,
	getFilteredRowModel,
	getPaginationRowModel,
	getSortedRowModel,
	type OnChangeFn,
	type PaginationState,
	type Row,
	type SortingState,
	type Table as TanstackTable,
	useReactTable,
	type VisibilityState,
} from '@tanstack/react-table'
import * as React from 'react'

import { Button } from '#app/components/ui/button'
import { Checkbox } from '#app/components/ui/checkbox'
import {
	DropdownMenu,
	DropdownMenuCheckboxItem,
	DropdownMenuContent,
	DropdownMenuTrigger,
} from '#app/components/ui/dropdown-menu'
import { Input } from '#app/components/ui/input'
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '#app/components/ui/table'
import { cn } from '#app/utils/misc.tsx'
// Icon component is kept for general use, e.g. in toolbarActions
// import { Icon } from './icon'
import { Label } from './ui/label'
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from './ui/select'

// Props definition
export interface DataTableProps<TData, TValue> {
	columns: ColumnDef<TData, TValue>[]
	data: TData[]
	setData?: React.Dispatch<React.SetStateAction<TData[]>> // Required if enableDragAndDrop is true
	enableDragAndDrop?: boolean
	getRowId?: (originalRow: TData, index: number, parent?: Row<TData>) => string // Important for dnd-kit and stable row identity

	// Pagination
	pageCount?: number // Total number of pages. If undefined, calculated from data length and pageSize
	pageSize?: number // Rows per page
	pageIndex?: number // Current page index (0-based)
	onPaginationChange?: OnChangeFn<PaginationState> // Callback for pagination state changes

	// Filtering
	filterFields?: Array<{
		accessorKey: Extract<keyof TData, string>
		placeholder?: string
	}> // Fields to generate filter inputs for
	initialColumnVisibility?: VisibilityState

	// UI Customization
	uiOptions?: {
		noHeader?: boolean
		noFooter?: boolean
		noColumnVisibilityToggle?: boolean
		noGlobalFilter?: boolean // Note: Global filter not implemented in this version, column filters via filterFields
		noPagination?: boolean
	}

	// Additional elements
	toolbarActions?: React.ReactNode // e.g., Add button
	tableClassName?: string
	headerClassName?: string
	bodyClassName?: string
	rowClassName?: string | ((row: Row<TData>) => string)
	cellClassName?: string | ((cell: any) => string) // TanStack Table Cell type is complex
}

// Helper: Drag Handle Column Cell (if drag and drop enabled)
// Users can define this themselves in their columns or use this helper
export function createDragHandleCell<TData>(
	idAccessor: (data: TData) => UniqueIdentifier,
) {
	return ({ row }: { row: Row<TData> }) => {
		const {
			attributes,
			listeners,
			setNodeRef,
			transform,
			transition,
			isDragging,
		} = useSortable({
			id: idAccessor(row.original),
		})

		// Style for the handle itself, if needed, or apply to button
		return (
			<Button
				ref={setNodeRef}
				{...attributes}
				{...listeners}
				variant="ghost"
				size="icon"
				className={cn(
					'text-muted-foreground size-7 cursor-grab hover:bg-transparent',
					isDragging && 'cursor-grabbing',
				)}
				style={{
					transform: CSS.Transform.toString(transform),
					transition,
					// Ensure the handle is on top while dragging if it's part of a cell that might get obscured
					zIndex: isDragging ? 1 : undefined,
				}}
			>
				<IconGripVertical className="text-muted-foreground size-4" />
				<span className="sr-only">Drag to reorder</span>
			</Button>
		)
	}
}

// Helper: Draggable Row (Internal or can be exposed if needed)
interface DraggableRowProps<TData> {
	row: Row<TData>
	getRowId: (originalRow: TData) => UniqueIdentifier
	className?: string | ((row: Row<TData>) => string)
	cellClassName?: string | ((cell: any) => string)
}

function DraggableRow<TData>({
	row,
	getRowId,
	className,
	cellClassName,
}: DraggableRowProps<TData>) {
	const { transform, transition, setNodeRef, isDragging } = useSortable({
		id: getRowId(row.original),
	})

	const rowSpecificClassName =
		typeof className === 'function' ? className(row) : className

	return (
		<TableRow
			ref={setNodeRef}
			data-state={row.getIsSelected() && 'selected'}
			data-dragging={isDragging}
			className={cn(
				'relative z-0 data-[dragging=true]:z-10 data-[dragging=true]:opacity-80',
				rowSpecificClassName,
			)}
			style={{
				transform: CSS.Transform.toString(transform),
				transition: transition,
			}}
		>
			{row.getVisibleCells().map((cell) => {
				const cellSpecificClassName =
					typeof cellClassName === 'function'
						? cellClassName(cell)
						: cellClassName
				return (
					<TableCell key={cell.id} className={cn(cellSpecificClassName)}>
						{flexRender(cell.column.columnDef.cell, cell.getContext())}
					</TableCell>
				)
			})}
		</TableRow>
	)
}

// Helper: Sortable Header
export function DataTableSortHeader<TData, TValue>({
	column,
	children,
	className,
}: {
	column: Column<TData, TValue>
	children: React.ReactNode
	className?: string
}) {
	const sorted = column.getIsSorted()
	let SortIconComponent
	if (sorted === 'asc') {
		SortIconComponent = IconCaretUp
	} else if (sorted === 'desc') {
		SortIconComponent = IconCaretDown
	} else {
		SortIconComponent = IconSelector
	}

	return (
		<Button
			variant="ghost"
			size="sm"
			onClick={() => column.toggleSorting(sorted === 'asc')}
			className={cn('px-2 py-1', className)}
		>
			{children}
			<SortIconComponent className="ml-2 size-4" />
		</Button>
	)
}

// Helper: Select Column
export function createDataTableSelectColumn<TData>(): ColumnDef<TData, any> {
	return {
		id: 'select',
		header: ({ table }) => (
			<div className="flex items-center justify-center">
				<Checkbox
					checked={
						table.getIsAllPageRowsSelected() ||
						(table.getIsSomePageRowsSelected() && 'indeterminate')
					}
					onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
					aria-label="Select all"
					className="translate-y-[2px]"
				/>
			</div>
		),
		cell: ({ row }) => (
			<div className="flex items-center justify-center">
				<Checkbox
					checked={row.getIsSelected()}
					onCheckedChange={(value) => row.toggleSelected(!!value)}
					aria-label="Select row"
					className="translate-y-[2px]"
				/>
			</div>
		),
		enableSorting: false,
		enableHiding: false,
		size: 40, // Example fixed size
	}
}

// Helper: Filtered Results Count
export function DataTableFilteredResults<TData>({
	table,
}: {
	table: TanstackTable<TData>
}) {
	return (
		<div className="text-muted-foreground flex-1 text-sm">
			{table.getFilteredSelectedRowModel().rows.length > 0
				? `${table.getFilteredSelectedRowModel().rows.length} of `
				: ''}
			{table.getFilteredRowModel().rows.length} row(s)
			{table.getFilteredSelectedRowModel().rows.length > 0 ? ' selected' : ''}.
		</div>
	)
}

// Helper: Pagination Buttons
export function DataTablePagination<TData>({
	table,
}: {
	table: TanstackTable<TData>
}) {
	return (
		<div className="flex items-center gap-2">
			<Button
				variant="outline"
				size="sm"
				onClick={() => table.setPageIndex(0)}
				disabled={!table.getCanPreviousPage()}
				className="hidden lg:flex"
			>
				<IconChevronsLeft className="mr-1 size-4" /> First
			</Button>
			<Button
				variant="outline"
				size="sm"
				onClick={() => table.previousPage()}
				disabled={!table.getCanPreviousPage()}
			>
				<IconChevronLeft className="mr-1 size-4" /> Previous
			</Button>
			<div className="flex items-center justify-center text-sm font-medium">
				Page {table.getState().pagination.pageIndex + 1} of{' '}
				{table.getPageCount()}
			</div>
			<Button
				variant="outline"
				size="sm"
				onClick={() => table.nextPage()}
				disabled={!table.getCanNextPage()}
			>
				Next <IconChevronRight className="ml-1 size-4" />
			</Button>
			<Button
				variant="outline"
				size="sm"
				onClick={() => table.setPageIndex(table.getPageCount() - 1)}
				disabled={!table.getCanNextPage()}
				className="hidden lg:flex"
			>
				Last <IconChevronsRight className="ml-1 size-4" />
			</Button>
		</div>
	)
}

export function DataTableRowsPerPage<TData>({
	table,
}: {
	table: TanstackTable<TData>
}) {
	return (
		<div className="flex items-center gap-2">
			<Label htmlFor="rows-per-page" className="text-sm font-medium">
				Rows per page
			</Label>
			<Select
				value={`${table.getState().pagination.pageSize}`}
				onValueChange={(value) => {
					table.setPageSize(Number(value))
				}}
			>
				<SelectTrigger size="sm" className="w-20" id="rows-per-page">
					<SelectValue placeholder={table.getState().pagination.pageSize} />
				</SelectTrigger>
				<SelectContent side="top">
					{[10, 20, 30, 40, 50, 100].map((pageSize) => (
						<SelectItem key={pageSize} value={`${pageSize}`}>
							{pageSize}
						</SelectItem>
					))}
				</SelectContent>
			</Select>
		</div>
	)
}

// Helper: Column Visibility Toggle
export function DataTableColumnVisibilityToggle<TData>({
	table,
}: {
	table: TanstackTable<TData>
}) {
	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button variant="outline" className="ml-auto">
					Columns <IconChevronDown className="ml-2 size-4" />
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end">
				{table
					.getAllColumns()
					.filter((column) => column.getCanHide())
					.map((column) => {
						return (
							<DropdownMenuCheckboxItem
								key={column.id}
								className="capitalize"
								checked={column.getIsVisible()}
								onCheckedChange={(value) => column.toggleVisibility(!!value)}
							>
								{column.id}
							</DropdownMenuCheckboxItem>
						)
					})}
			</DropdownMenuContent>
		</DropdownMenu>
	)
}

// Helper: Individual Column Filters
export function DataTableColumnFilters<TData>({
	table,
	filterFields,
}: {
	table: TanstackTable<TData>
	filterFields: Array<{
		accessorKey: Extract<keyof TData, string>
		placeholder?: string
	}>
}) {
	return (
		<>
			{filterFields.map(({ accessorKey, placeholder }) => (
				<Input
					key={accessorKey}
					placeholder={placeholder || `Filter ${accessorKey}...`}
					value={
						(table.getColumn(accessorKey)?.getFilterValue() as string) ?? ''
					}
					onChange={(event) =>
						table.getColumn(accessorKey)?.setFilterValue(event.target.value)
					}
					className="h-8 max-w-sm"
				/>
			))}
		</>
	)
}

// Main DataTable Component
export function DataTable<TData, TValue>({
	columns,
	data: tableData,
	setData, // For drag and drop
	enableDragAndDrop = false,
	getRowId: customGetRowId,
	pageCount: controlledPageCount,
	pageSize: initialPageSize = 10,
	pageIndex: initialPageIndex = 0,
	onPaginationChange: controlledOnPaginationChange,
	filterFields = [],
	initialColumnVisibility = {},
	uiOptions = {},
	toolbarActions,
	tableClassName,
	headerClassName,
	bodyClassName,
	rowClassName,
	cellClassName,
}: DataTableProps<TData, TValue>) {
	const [sorting, setSorting] = React.useState<SortingState>([])
	const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
		[],
	)
	const [columnVisibility, setColumnVisibility] =
		React.useState<VisibilityState>(initialColumnVisibility)
	const [rowSelection, setRowSelection] = React.useState({})

	const [internalData, setInternalData] = React.useState(tableData)
	React.useEffect(() => {
		setInternalData(tableData)
	}, [tableData])

	const dataToUse = enableDragAndDrop && setData ? tableData : internalData
	const setInternalOrExternalData =
		enableDragAndDrop && setData ? setData : setInternalData

	const defaultGetRowId = React.useCallback(
		(row: TData, index: number) => (row as any).id ?? index.toString(),
		[],
	)
	const getRowId = customGetRowId || defaultGetRowId

	const [{ pageIndex, pageSize }, _setPagination] =
		React.useState<PaginationState>({
			pageIndex: initialPageIndex,
			pageSize: initialPageSize,
		})

	const pagination = React.useMemo(
		() => ({
			pageIndex,
			pageSize,
		}),
		[pageIndex, pageSize],
	)

	const setPagination: OnChangeFn<PaginationState> = (updater) => {
		const newState =
			typeof updater === 'function' ? updater(pagination) : updater
		_setPagination(newState)
		if (controlledOnPaginationChange) {
			controlledOnPaginationChange(newState)
		}
	}

	const tablePageCount =
		controlledPageCount ?? Math.ceil(dataToUse.length / pageSize)

	const table = useReactTable({
		data: dataToUse,
		columns,
		pageCount: tablePageCount,
		state: {
			sorting,
			columnVisibility,
			rowSelection,
			columnFilters,
			pagination,
		},
		enableRowSelection: true,
		manualPagination:
			controlledOnPaginationChange !== undefined ||
			controlledPageCount !== undefined,
		onPaginationChange: setPagination,
		onRowSelectionChange: setRowSelection,
		onSortingChange: setSorting,
		onColumnFiltersChange: setColumnFilters,
		onColumnVisibilityChange: setColumnVisibility,
		getCoreRowModel: getCoreRowModel(),
		getFilteredRowModel: getFilteredRowModel(),
		getPaginationRowModel: getPaginationRowModel(),
		getSortedRowModel: getSortedRowModel(),
		getFacetedRowModel: getFacetedRowModel(),
		getFacetedUniqueValues: getFacetedUniqueValues(),
		getRowId: getRowId as (
			originalRow: TData,
			index: number,
			parent?: Row<TData>,
		) => string, // Ensure type matches
	})

	// Drag and Drop setup
	const sensors = useSensors(
		useSensor(MouseSensor, {}),
		useSensor(TouchSensor, {}),
		useSensor(KeyboardSensor, {}),
	)

	const dataIds = React.useMemo<UniqueIdentifier[]>(
		() =>
			enableDragAndDrop
				? dataToUse.map((originalRow) => getRowId(originalRow, 0, undefined))
				: [], // Index and parent are not strictly needed if getRowId only uses originalRow
		[dataToUse, enableDragAndDrop, getRowId],
	)

	function handleDragEnd(event: DragEndEvent) {
		const { active, over } = event
		if (active && over && active.id !== over.id && setInternalOrExternalData) {
			setInternalOrExternalData((currentData) => {
				const oldIndex = currentData.findIndex(
					(item) => getRowId(item, 0, undefined) === active.id,
				)
				const newIndex = currentData.findIndex(
					(item) => getRowId(item, 0, undefined) === over.id,
				)
				if (oldIndex === -1 || newIndex === -1) return currentData // Should not happen if IDs are correct
				return arrayMove(currentData, oldIndex, newIndex)
			})
		}
	}

	const tableContent = (
		<Table className={cn(tableClassName)}>
			{!uiOptions.noHeader && (
				<TableHeader className={cn(headerClassName)}>
					{table.getHeaderGroups().map((headerGroup) => (
						<TableRow key={headerGroup.id}>
							{headerGroup.headers.map((header) => (
								<TableHead
									key={header.id}
									colSpan={header.colSpan}
									style={{
										width:
											header.getSize() !== 150 ? header.getSize() : undefined,
									}}
								>
									{header.isPlaceholder
										? null
										: flexRender(
												header.column.columnDef.header,
												header.getContext(),
											)}
								</TableHead>
							))}
						</TableRow>
					))}
				</TableHeader>
			)}
			<TableBody className={cn(bodyClassName)}>
				{table.getRowModel().rows?.length ? (
					table.getRowModel().rows.map((row) =>
						enableDragAndDrop ? (
							<DraggableRow
								key={row.id}
								row={row}
								getRowId={(original) => getRowId(original, 0, undefined)}
								className={rowClassName}
								cellClassName={cellClassName}
							/>
						) : (
							<TableRow
								key={row.id}
								data-state={row.getIsSelected() && 'selected'}
								className={cn(
									typeof rowClassName === 'function'
										? rowClassName(row)
										: rowClassName,
								)}
							>
								{row.getVisibleCells().map((cell) => {
									const cellSpecificClassName =
										typeof cellClassName === 'function'
											? cellClassName(cell)
											: cellClassName
									return (
										<TableCell
											key={cell.id}
											className={cn(cellSpecificClassName)}
											style={{
												width:
													cell.column.getSize() !== 150
														? cell.column.getSize()
														: undefined,
											}}
										>
											{flexRender(
												cell.column.columnDef.cell,
												cell.getContext(),
											)}
										</TableCell>
									)
								})}
							</TableRow>
						),
					)
				) : (
					<TableRow>
						<TableCell colSpan={columns.length} className="h-24 text-center">
							No results.
						</TableCell>
					</TableRow>
				)}
			</TableBody>
		</Table>
	)

	return (
		<div className="flex w-full flex-col gap-4">
			{(filterFields.length > 0 ||
				!uiOptions.noColumnVisibilityToggle ||
				toolbarActions) && (
				<div className="flex items-center gap-2 py-2">
					{filterFields.length > 0 && !uiOptions.noGlobalFilter && (
						<DataTableColumnFilters table={table} filterFields={filterFields} />
					)}
					<div className="ml-auto flex items-center gap-2">
						{toolbarActions}
						{!uiOptions.noColumnVisibilityToggle && (
							<DataTableColumnVisibilityToggle table={table} />
						)}
					</div>
				</div>
			)}

			<div className="overflow-hidden rounded-md border">
				{enableDragAndDrop && setData ? (
					<DndContext
						sensors={sensors}
						collisionDetection={closestCenter}
						onDragEnd={handleDragEnd}
						modifiers={[restrictToVerticalAxis]}
					>
						<SortableContext
							items={dataIds}
							strategy={verticalListSortingStrategy}
						>
							{tableContent}
						</SortableContext>
					</DndContext>
				) : (
					tableContent
				)}
			</div>

			{!uiOptions.noFooter && !uiOptions.noPagination && (
				<div className="flex flex-col items-center justify-between gap-4 px-2 py-2 md:flex-row">
					<DataTableFilteredResults table={table} />
					<div className="flex flex-col items-center gap-4 sm:flex-row sm:gap-6 lg:gap-8">
						<DataTableRowsPerPage table={table} />
						<DataTablePagination table={table} />
					</div>
				</div>
			)}
		</div>
	)
}
