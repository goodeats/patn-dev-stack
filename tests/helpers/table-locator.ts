import { expect, type Locator } from '@playwright/test'

/**
 * Locates all table header cells within a specific locator context.
 * @param locator - The Playwright locator to search within.
 * @returns An array of locators for the table header cells.
 */
export async function locateTableHeader(locator: Locator): Promise<Locator[]> {
	return locator.locator('thead').locator('th').all()
}

/**
 * Verifies the headers of a table against an expected list of header names.
 * @param tableLocator - The Playwright locator for the table to check.
 * @param expectedHeaders - An array of strings representing the expected header names.
 * @param opts - Optional configuration object to account for additional columns like selection checkboxes or actions.
 */
export async function verifyTableHeaders(
	tableLocator: Locator,
	expectedHeaders: string[],
	opts: { hasSelectColumn?: boolean; hasActionsColumn?: boolean } = {
		hasSelectColumn: false,
		hasActionsColumn: false,
	},
): Promise<void> {
	const { hasSelectColumn = false, hasActionsColumn = false } = opts
	let offset = 0
	if (hasSelectColumn) offset += 1
	if (hasActionsColumn) offset += 1

	const tableHeaders = await locateTableHeader(tableLocator)
	await expect(tableHeaders).toHaveLength(expectedHeaders.length + offset)

	for (let i = 0; i < expectedHeaders.length; i++) {
		const headerIndex = i + (hasSelectColumn ? 1 : 0)
		const locator = tableHeaders[headerIndex] as Locator
		await expect(locator).toHaveText(expectedHeaders[i]!)
	}
}

/**
 * Locates a table row by its text content within a specific locator context.
 * @param locator - The Playwright locator to search within.
 * @returns A locator for the table rows.
 */
export async function locateTableRows(locator: Locator): Promise<Locator[]> {
	return locator.locator('tbody').locator('tr').all()
}

/**
 * Verifies the data of a specific row in a table against expected cell values.
 * @param tableLocator - The Playwright locator for the table to check.
 * @param rowIndex - The index of the row to verify.
 * @param expectedData - An array of strings representing the expected cell values for the row.
 * @param opts - Optional configuration object to account for additional columns like selection checkboxes.
 */
export async function verifyTableRowData(
	tableLocator: Locator,
	rowIndex: number,
	expectedData: string[],
	opts: { hasSelectColumn?: boolean } = {
		hasSelectColumn: false,
	},
): Promise<void> {
	const { hasSelectColumn = false } = opts
	const rows = await locateTableRows(tableLocator)
	await expect(rows.length).toBeGreaterThan(rowIndex)

	const row = rows[rowIndex] as Locator
	const cells = await row.locator('td').all()

	let startIndex = hasSelectColumn ? 1 : 0
	for (let i = 0; i < expectedData.length; i++) {
		const cellIndex = startIndex + i
		const cell = cells[cellIndex] as Locator
		await expect(cell).toHaveText(expectedData[i]!)
	}
}

/**
 * Verifies the data of multiple rows in a table against expected cell values for each row.
 * @param tableLocator - The Playwright locator for the table to check.
 * @param expectedDataArrays - An array of arrays, where each inner array contains strings representing the expected cell values for a row.
 * @param opts - Optional configuration object to account for additional columns like selection checkboxes.
 */
export async function verifyMultipleTableRowsData(
	tableLocator: Locator,
	expectedDataArrays: string[][],
	opts: { hasSelectColumn?: boolean } = {
		hasSelectColumn: false,
	},
): Promise<void> {
	for (let rowIndex = 0; rowIndex < expectedDataArrays.length; rowIndex++) {
		await verifyTableRowData(
			tableLocator,
			rowIndex,
			expectedDataArrays[rowIndex]!,
			opts,
		)
	}
}
