# About Me Dashboard Route & Editor Structure

This document describes the organization and relationships of the About Me dashboard feature in the codebase.

---

## Route File Overview

```bash
app/routes/dashboard+/
├── about.index.tsx
├── about.new.tsx
├── about.$aboutId.tsx
├── about.$aboutId_.edit.tsx
├── __about-editor.tsx
├── __about-editor.server.tsx
├── __about-category-editor.tsx
├── __about-category-editor.server.tsx
```

---

### 1. List Page: `about.index.tsx`

- **Purpose:** Main dashboard for About Me sections and categories.
- **Features:**
  - Lists all About Me sections and categories for the user.
  - Provides filtering and sorting.
  - Opens the category editor dialog for create/edit.
- **Data Loading:** Loader fetches all sections and categories.
- **Actions:** Handles category CRUD via `handleCategoryAction` (imported from `__about-category-editor.server.tsx`).

#### Data Table Features

The About Me dashboard list page displays two data tables:

- **About Me Sections Table**
- **About Me Categories Table**

Both tables are built with the following interactive features:

##### About Me Sections Table

- **Filtering:**
  - By content
  - By category
- **Switch Form:**
  - Toggle published status for each section using a switch component. This submits a form to update the status immediately.
- **Menu-Driven Actions:**
  - Edit: Navigates to the edit page for the selected section.
  - Delete: Submits a form to delete the section, with a confirmation prompt.
- **Row Link:**
  - The section name is a link to the details page for that section.

##### About Me Categories Table

- **Filtering:**
  - By name
  - By description
- **Switch Form:**
  - Toggle published status for each category using a switch component. This submits a form to update the status immediately.
- **Menu-Driven Actions:**
  - Edit: Opens a dialog for editing the selected category.
  - Delete: Submits a form to delete the category, with a confirmation prompt.
- **Dialog-Driven Editing:**
  - Creating or editing a category opens a modal dialog with the category editor form.

##### Data Table Features Summary

| Table                    | Filtering Fields         | Switch (Publish) | Menu Actions (Edit/Delete) | Edit Method         |
|-------------------------|-------------------------|------------------|---------------------------|---------------------|
| About Me Sections       | Content, Category       | Yes              | Edit (link), Delete       | Edit page           |
| About Me Categories     | Name, Description       | Yes              | Edit (dialog), Delete     | Dialog (modal form) |

These features provide a rich, interactive experience for managing both About Me sections and their categories directly from the dashboard list page.

---

### 2. Create Page: `about.new.tsx`

- **Purpose:** Create a new About Me section.
- **Features:** Renders the `AboutEditor` form with empty/default values.
- **Data Loading:** Loader fetches all published categories for selection.
- **Actions:** Uses `action` from `__about-editor.server.tsx` for create.

---

### 3. Details Page: `about.$aboutId.tsx`

- **Purpose:** Read-only details for a single About Me section.
- **Features:** Displays all fields for the section, including category and status.
- **Data Loading:** Loader fetches the section by ID for the current user.

---

### 4. Edit Page: `about.$aboutId_.edit.tsx`

- **Purpose:** Edit an existing About Me section.
- **Features:** Renders the `AboutEditor` form pre-filled with section data.
- **Data Loading:** Loader fetches the section and all published categories.
- **Actions:** Uses `action` from `__about-editor.server.tsx` for update/delete.

---

### 5. Shared Editor Components

#### `__about-editor.tsx`

- **Purpose:** React component for the About Me section editor form.
- **Usage:** Used by both `about.new.tsx` and `about.$aboutId_.edit.tsx`.
- **Features:** Handles form state, validation, and submission for create/update/delete.

#### `__about-editor.server.tsx`

- **Purpose:** Server action handler for About Me section create, update, and delete.
- **Usage:** Exported as `action` in both new and edit routes.

#### `__about-category-editor.tsx`

- **Purpose:** React component for the About Me category editor dialog.
- **Usage:** Used in `about.index.tsx` for category create/edit.
- **Features:** Handles form state, validation, and submission for category CRUD.

#### `__about-category-editor.server.tsx`

- **Purpose:** Server action handler for About Me category create, update, and delete.
- **Usage:** Used in `about.index.tsx` via `handleCategoryAction`.

---

## Data Flow Diagram

```mermaid
flowchart TD
  subgraph UI
    A1[about.index.tsx] -- open dialog --> C1[__about-category-editor.tsx]
    A2[about.new.tsx] -- render --> B1[__about-editor.tsx]
    A3[about.$aboutId_.edit.tsx] -- render --> B1
    A4[about.$aboutId.tsx] -- display --> [Details View]
  end

  subgraph Server
    B2[__about-editor.server.tsx]
    C2[__about-category-editor.server.tsx]
  end

  B1 -- submit form --> B2
  C1 -- submit form --> C2
  A2 -- action --> B2
  A3 -- action --> B2
  A1 -- action --> C2
```

---

## Best Practices

- **Colocation:** Editor components and server logic are colocated with route files for maintainability.
- **Reusability:** Shared editor components are used across new/edit pages and dialogs.
- **Type Safety:** Types are imported from `+types` files for strong typing (not shown in this tree).
- **Separation of Concerns:** UI, data loading, and server actions are clearly separated.

---

## Summary Table

| File                          | Purpose                                 | UI/Server | Used By                        |
|-------------------------------|-----------------------------------------|-----------|-------------------------------|
| about.index.tsx               | List sections & categories              | UI        | Entry point                   |
| about.new.tsx                 | Create new section                      | UI        | Entry point                   |
| about.$aboutId.tsx            | Section details (read-only)             | UI        | Entry point                   |
| about.$aboutId_.edit.tsx      | Edit section                            | UI        | Entry point                   |
| __about-editor.tsx            | Section editor form                     | UI        | new, edit routes              |
| __about-editor.server.tsx     | Section create/update/delete handler     | Server    | new, edit routes              |
| __about-category-editor.tsx   | Category editor dialog                  | UI        | index route                   |
| __about-category-editor.server.tsx | Category CRUD handler               | Server    | index route                   |

---

## Notes

- All About Me section and category CRUD operations are handled via forms and server actions, not client-side state.
- The structure supports easy extension for new features (e.g., more fields, validation, or additional routes).

---

Golden Rules Applied 🫡
