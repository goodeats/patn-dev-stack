# Playwright Test Suite Architecture

This document outlines the architecture and conventions for our Playwright End-to-End (E2E) test suite. It serves as a guide for both human developers and as a **cursor rule for LLM assistants** to ensure that new tests and Page Object Models (POMs) adhere to our established patterns.

## Guiding Principles

1. **Separation of Concerns**: Test files (`*.test.ts`) should describe *user stories* and *workflows*, not implementation details. The "how" of an interaction belongs in a Page Object Model.
2. **Composition over Inheritance (for Pages)**: A main page POM (like `DashboardAboutPage`) *composes* smaller component POMs (like `AboutMeSectionsTable`). It acts as an orchestrator.
3. **Inheritance for Patterns**: We use abstract base classes to define and reuse common *interaction patterns* (e.g., how to interact with a menu-driven table vs. a dialog-driven table).
4. **Fluent API**: Methods that transition the user to a new state (like clicking "Edit") should return an instance of the POM for that new state. This creates a highly readable, chainable API in our tests (e.g., `const editor = await table.edit('Item');`).
5. **Single Responsibility**: Each class should have one primary reason to change. A table POM handles table interactions. An editor POM handles form interactions. A page POM handles page-level navigation and component composition.

---

## Directory Structure

All Page Object Models are located in `tests/e2e/poms/`.

```bash
tests/e2e/poms/
├── base/                  # Abstract base classes defining patterns. CRITICAL FOR REUSE.
│   ├── base-data-table.pom.ts
│   ├── base-details-page.pom.ts
│   ├── base-editor.pom.ts
│   ├── base-list-page.pom.ts
│   ├── base-route.pom.ts
│   ├── dialog-driven-data-table.pom.ts
│   └── menu-driven-data-table.pom.ts
│
└── dashboard/             # Concrete POMs for specific features.
    └── about/
        ├── dashboard-about-category-editor-dialog.pom.ts
        ├── dashboard-about-data-tables.pom.ts
        ├── dashboard-about-details-page.pom.ts
        ├── dashboard-about-me-editor-page.pom.ts
        └── dashboard-about-page.pom.ts
```

---

## Core Abstractions (The `base/` Directory)

**LLM ASSISTANT RULE:** When creating a new POM for a page, table, or editor, it **MUST** extend one of these base classes. Do not create flat, monolithic POMs.

### 1. Route POMs (`base-route.pom.ts`)

- **`BaseRoutePOM`**: The absolute root for any POM representing a full URL route.
  - **`BaseListPagePOM`**: Extends `BaseRoutePOM`. For index/list pages (e.g., `/dashboard/about`). It standardizes the "Create New Item" flow.
  - **`BaseDetailsPagePOM`**: Extends `BaseRoutePOM`. For detail view pages (e.g., `/dashboard/about/some-id`). It standardizes the "Back" and "Edit" link interactions.

### 2. Data Table POMs (`base-data-table.pom.ts`, etc.)

- **`BaseDataTablePOM`**: The root for all data tables. Handles locating rows, cells, and verifying data. It has **no** user interaction logic (`edit`/`delete`).
  - **`MenuDrivenDataTablePOM`**: Extends `BaseDataTablePOM`. For tables where `edit` and `delete` actions are inside a dropdown menu.
  - **`DialogDrivenDataTablePOM`**: Extends `BaseDataTablePOM`. For tables where `edit` is triggered by a direct click on the item's name (opening a dialog) and `delete` is in a menu.

### 3. Editor POMs (`editor.pom.ts`)

- **`IEditorPOM`**: An interface contract that all editors must fulfill.
- **`BaseEditorPOM`**: The root for all form editors. Handles locating common fields (`name`, `description`, buttons).
  - **`BasePageEditorPOM`**: Extends `BaseEditorPOM`. For editors that are their own full page.
  - **`BaseDialogEditorPOM`**: Extends `BaseEditorPOM`. For editors that appear in a modal dialog.

---

## Creating New Feature Tests (e.g., for "Projects")

**LLM ASSISTANT RULE:** Follow this checklist when adding tests for a new CRUD feature like "Projects".

1. **Create the List Page POM:**
    - Create `dashboard/project/dashboard-project-page.pom.ts`.
    - It **MUST** extend `BaseListPagePOM`.
    - It will compose instances of `ProjectsTable` and `ProjectCategoriesTable`.

2. **Create the Data Table POMs:**
    - Create `dashboard/project/dashboard-project-data-tables.pom.ts`.
    - `ProjectsTable` **MUST** extend `MenuDrivenDataTablePOM`. It will define its specific `expectedHeaders`, `menuName`, and filter locators.
    - `ProjectCategoriesTable` **MUST** extend `DialogDrivenDataTablePOM`. It will define its `expectedHeaders` and `menuName`.

3. **Create the Editor POMs:**
    - Create `dashboard/project/dashboard-project-editor-page.pom.ts`. It **MUST** extend `BasePageEditorPOM`. It will define its specific form fields (e.g., `liveDemoUrlInput`) and override `fillForm`.
    - Create `dashboard/project/dashboard-project-category-editor-dialog.pom.ts`. It **MUST** extend `BaseDialogEditorPOM`.

4. **Create the Details Page POM:**
    - Create `dashboard/project/dashboard-project-details-page.pom.ts`.
    - It **MUST** extend `BaseDetailsPagePOM`.
    - It must implement the `goto(itemId)` method and provide a typed `edit()` method that returns the `DashboardProjectEditorPage`.

5. **Write the Test File:**
    - Create `tests/e2e/project-crud.test.ts`.
    - The test should instantiate `DashboardProjectPage` and `DashboardProjectDetailsPage`.
    - All interactions must flow through the POMs. Use the fluent API: `const editor = await projectPage.projectsTable.edit('My Project');`.
    - Focus the test on asserting user-facing outcomes, not on how locators are found.

By adhering to this structure, we ensure our test suite remains maintainable, readable, and scalable for years to come.
