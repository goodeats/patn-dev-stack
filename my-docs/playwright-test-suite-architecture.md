# Playwright Test Suite Architecture

This document summarizes the architecture and conventions for the Playwright End-to-End (E2E) test suite, ensuring maintainable, scalable, and readable tests.

---

## Guiding Principles

1. **Separation of Concerns:** Test files (`*.test.ts`) describe user stories and workflows. Implementation details (locators, interactions) belong in Page Object Models (POMs).
2. **Composition over Inheritance (for Pages & Tables):** Main page POMs compose smaller component POMs. Data tables use mixins to compose features.
3. **Inheritance for Patterns:** Abstract base classes define and reuse common interaction patterns (e.g., menu-driven, dialog-driven tables).
4. **Fluent API:** Methods that transition state (e.g., `edit`) return the new POM instance for chaining.
5. **Single Responsibility:** Each class has one primary reason to change (table POM for table, editor POM for form, page POM for navigation).

---

## Directory Structure

All POMs are located in `tests/poms/`.

```bash
poms/
├── base/
│   ├── data-table.pom.ts
│   ├── editor.pom.ts
│   ├── page-details.pom.ts
│   └── page.pom.ts
└── dashboard/
    ├── about-data-tables.pom.ts
    ├── about-details-page.pom.ts
    ├── about-editors.pom.ts
    └── about-list-page.pom.ts
```

---

## Composable Data Table POMs

- **Always** use the mixin-based approach from `base/data-table.pom.ts` for new data table POMs.
- **Never** create flat, monolithic table POMs.
- Compose your table POM from these mixins as needed:
  - `MenuDriven`: Row menu actions (edit/delete via dropdown menu)
  - `DialogDriven`: Dialog-opening behavior (clicking a row name opens an editor dialog)
  - `Switchable`: Row-level toggle switches (publish/unpublish)
  - `Filterable`: Column filters (filter by name, category)

**Example:**

```ts
import { MenuDriven, Switchable, Filterable, DialogDriven, MixinBase } from '../base/data-table.pom'
import { MyEditorDialogPOM } from './my-editors.pom'

const MyComposableTable = Filterable(
  Switchable(
    MenuDriven<MyEditorDialogPOM>()(MixinBase)
  )
)

export class MyTablePOM extends MyComposableTable {
  readonly menuName = 'Open my item menu'
  readonly expectedHeaders = ['Name', 'Description', 'Status']

  constructor(page, container) {
    super(page, container)
    this.switchName = /toggle publish/i
    this.addFilters([
      { name: 'name', placeholder: 'Filter name...' },
      { name: 'description', placeholder: 'Filter description...' },
    ])
  }

  // Implement required abstract methods (e.g., edit)
  async edit(name: string): Promise<MyEditorDialogPOM> {
    await this.clickEditButton(name)
    return new MyEditorDialogPOM(this.page)
  }
}
```

- Mixins can be combined in any order.
- Extend and override methods as needed for custom behavior.

---

## Base Classes vs. Mixins

- **Base Classes** (e.g., `BaseRoutePOM`, `BaseEditorPOM`) provide core structure for pages and editors.
- **Mixins** (from `base/data-table.pom.ts`) are for composing data table features. Always use mixins for tables.
- **Rule:** For a new CRUD feature, always start with the base class for the page/editor, and compose your table POM from mixins.

---

## Checklist for New CRUD Features

1. **Create the List Page POM:**
    - E.g. `dashboard/project/dashboard-project-page.pom.ts`.
    - **MUST** extend `BaseListPagePOM`.
    - Compose instances of your table POMs.
2. **Create the Data Table POMs:**
    - E.g. `dashboard/project/dashboard-project-data-tables.pom.ts`.
    - Compose each table POM from the required mixins.
    - Implement required methods (e.g., `edit`, `delete`, `filterByX`).
3. **Create the Editor POMs:**
    - E.g. `dashboard/project/dashboard-project-editor-page.pom.ts` (extends `BasePageEditorPOM`).
    - E.g. `dashboard/project/dashboard-project-category-editor-dialog.pom.ts` (extends `BaseDialogEditorPOM`).
4. **Create the Details Page POM:**
    - E.g. `dashboard/project/dashboard-project-details-page.pom.ts` (extends `BaseDetailsPagePOM`).
    - Implement the `goto(itemId)` method and provide a typed `edit()` method.
5. **Write the Test File:**
    - E.g. `tests/e2e/project-crud.test.ts`.
    - Instantiate your page and table POMs.
    - All interactions must flow through the POMs. Use the fluent API.
    - Focus the test on asserting user-facing outcomes, not on how locators are found.

---

## Test Utility Patterns

### Select Field Validation

```ts
// select
await page.getByRole('combobox', { name: 'Category' }).click()
await page.getByRole('option', { name: categoryToSelect }).click()

// validate
const categoryValue = await page
  .getByRole('combobox', { name: 'Category' })
  .textContent()
await expect(categoryValue).toBe(category.name)

// for validating errors
const categoryError = page
  .getByRole('combobox', { name: 'Category' })
  .locator('xpath=./following-sibling::div')
await expect(categoryError).toHaveText('Category is required')
```

### Error Validation

- Use `.getByRole('alert')` or specific error locators to assert error messages.
- Always check that errors are visible and have the correct text.

### Dialog Handling

- When opening dialogs, always `await dialog.waitUntilVisible()` before interacting.
- To close dialogs, prefer clicking outside or using the dialog's close button.

---

## LLM Assistant Rules (for Cursor)

- **Always** use the mixin-based approach for new data table POMs.
- **Never** create flat, monolithic POMs for tables.
- **Always** extend the appropriate base class for pages and editors.
- **Always** use the test utility patterns for select fields, error validation, and dialog handling.
- **Always** provide a fluent, chainable API for test interactions.
- **Checklist:** Follow the steps above for new CRUD features.

By adhering to this structure, we ensure our test suite remains maintainable, readable, and scalable for years to come.

Golden Rules Applied 🫡

---

## Test Data Setup for Models

To ensure reliable and isolated E2E tests, this codebase uses model-specific test setup helpers and Playwright fixtures for preparing and cleaning up test data.

### Model Setup Helpers

- All model setup helpers are defined in `tests/models/` (e.g., `about-test-setup.ts`, `user-test-setup.ts`).
- Each helper provides functions like `getOrInsertAboutMe`, `getOrInsertAboutMeCategory`, and `createAboutMeData` for generating and inserting test data using Prisma.

### Playwright Fixtures for Test Data

- The helpers are exposed as Playwright fixtures in `tests/playwright-utils.ts`.
- Example fixtures:
  - `insertNewAboutMeCategory(options)`
  - `insertNewAboutMe(options)`
  - `insertNewUser(options)`
- These fixtures:
  - Insert the required test data before the test runs.
  - Automatically clean up (delete) the data after the test completes.

#### Example Usage in a Test

```ts
test('can create and display an About Me section', async ({ insertNewUser, insertNewAboutMeCategory, insertNewAboutMe, page }) => {
  const user = await insertNewUser()
  const category = await insertNewAboutMeCategory({ name: 'Professional' })
  const aboutMe = await insertNewAboutMe({ userId: user.id, aboutMeCategoryId: category.id })

  await page.goto('/dashboard/about')
  await expect(page.getByText(aboutMe.name)).toBeVisible()
})
```

- The fixtures ensure that each test runs with its own isolated data, and no leftover data pollutes other tests.

#### Reference

- Model setup helpers: `tests/models/`
- Playwright fixtures: `tests/playwright-utils.ts`

Golden Rules Applied 🫡
