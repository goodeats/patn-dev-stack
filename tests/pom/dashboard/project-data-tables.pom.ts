import { type Locator, type Page } from '@playwright/test'
import {
	MenuDriven,
	Filterable,
	Switchable,
	MixinBase,
} from '../base/data-table.pom'
import { DashboardProjectEditorPOM } from './project-editors.pom'

const ProjectsComposableTable = Filterable(
	Switchable(MenuDriven<DashboardProjectEditorPOM>()(MixinBase)),
)

export class ProjectsTablePOM extends ProjectsComposableTable {
	// --- Required abstract members ---
	readonly menuName = 'Open project menu'
	readonly expectedHeaders: string[] = [
		'Title',
		'Live Demo',
		'Source Code',
		'Skills',
		'Created At',
		'Updated At',
		'Published',
	]

	constructor(page: Page, container: Locator) {
		super(page, container)
		this.switchName = /toggle publish/i
		this.addFilters([
			{ name: 'title', placeholder: 'Filter title...' },
			{ name: 'liveDemoUrl', placeholder: 'Filter live demo...' },
			{ name: 'sourceCodeUrl', placeholder: 'Filter source code...' },
		])
	}

	// --- MenuDriven mixin implementation ---
	/**
	 * Edit a project by title (from MenuDriven mixin)
	 */
	async edit(title: string): Promise<DashboardProjectEditorPOM> {
		await this.clickEditButton(title)
		return new DashboardProjectEditorPOM(this.page)
	}

	// --- Switchable mixin extensions ---
	/**
	 * Publish a project by setting its switch to true
	 */
	async publish(title: string): Promise<void> {
		await this.setSwitchState(title, true)
	}

	/**
	 * Unpublish a project by setting its switch to false
	 */
	async unpublish(title: string): Promise<void> {
		await this.setSwitchState(title, false)
	}

	// --- Filterable mixin extensions ---
	/**
	 * Filter projects by title
	 */
	async filterByTitle(title: string): Promise<void> {
		await this.filterBy('title', title)
	}

	/**
	 * Clear the title filter
	 */
	async clearTitleFilter(): Promise<void> {
		await this.clearFilter('title')
	}

	/**
	 * Filter projects by live demo URL
	 */
	async filterByLiveDemo(url: string): Promise<void> {
		await this.filterBy('liveDemoUrl', url)
	}

	/**
	 * Clear the live demo URL filter
	 */
	async clearLiveDemoFilter(): Promise<void> {
		await this.clearFilter('liveDemoUrl')
	}

	/**
	 * Filter projects by source code URL
	 */
	async filterBySourceCode(url: string): Promise<void> {
		await this.filterBy('sourceCodeUrl', url)
	}

	/**
	 * Clear the source code URL filter
	 */
	async clearSourceCodeFilter(): Promise<void> {
		await this.clearFilter('sourceCodeUrl')
	}

	// --- Custom methods ---
	/**
	 * Verify table headers with appropriate options
	 */
	override async verifyHeaders(): Promise<void> {
		await super.verifyHeaders(this.expectedHeaders, {
			hasSelectColumn: true,
			hasActionsColumn: true,
		})
	}

	/**
	 * Verify table data with appropriate options
	 */
	override async verifyData(data: string[][]): Promise<void> {
		await super.verifyData(data, { hasSelectColumn: true })
	}
}
