# E2E Test Plan: About Me & About Me Categories

## I. About Me Sections Tests (New and Enhancements)

1.  **Test: Create Section - Verify View page redirect, then navigate to Edit page**
    *   **Purpose**: To ensure the correct redirection flow after creating a section and verify data on both view and edit pages.
    *   **Steps**:
        1.  Navigate to `/dashboard/about`.
        2.  Click "Create" link to go to `/dashboard/about/new`.
        3.  Fill out the section form (Name, Content, Description, select a seeded "Professional" category).
        4.  Click "Create Section" (or "Create About Me") button.
        5.  **Assert**: Page URL is now `/dashboard/about/{new_section_id}` (the view page).
        6.  **Assert**: The view page correctly displays the created section\'s name, content, description, and category name using non-editable elements.
        7.  Click the "Edit" link/button on the view page (usually part of `EntityDetailsLinks`).
        8.  **Assert**: Page URL is now `/dashboard/about/{new_section_id}/edit`.
        9.  **Assert**: The edit form fields (Name, Content, Description, Category select, Published toggle) are correctly pre-filled with the section\'s data.
        10. (Cleanup: Delete the created section, e.g., by navigating back to the list and using the row menu delete).

2.  **Test: Toggle "Published" status for an About Me Section from the list page**
    *   **Purpose**: To verify the functionality and persistence of the "Published" toggle switch for sections.
    *   **Steps**:
        1.  Ensure an "About Me Section" exists (create one if necessary, assume it defaults to "Published").
        2.  Navigate to `/dashboard/about`.
        3.  Locate the section in the "About Me Sections" table.
        4.  Observe its current "Published" switch state.
        5.  Click the switch to change its state (e.g., from Published to Unpublished).
        6.  **Assert**: The switch visually reflects the new state optimistically.
        7.  Reload the page.
        8.  **Assert**: The switch maintains the new state (verifying backend persistence).
        9.  Click the switch again to revert to the original state.
        10. **Assert**: The switch reflects the original state.
        11. Reload the page.
        12. **Assert**: The switch maintains the original state.
        13. (Cleanup: Delete the test section).

3.  **Test: Validation for About Me Section Creation and Editing**
    *   **Purpose**: To ensure input validation errors are displayed correctly.
    *   **Steps (Creation - on `/dashboard/about/new`):**
        1.  Attempt to submit the form with an empty "Name" field.
        2.  **Assert**: An error message related to the "Name" field is displayed.
        3.  Fill in the "Name". Attempt to submit with an empty "Content" field.
        4.  **Assert**: An error message related to the "Content" field is displayed.
        5.  Fill in "Content". Attempt to submit without selecting a "Category".
        6.  **Assert**: An error message related to the "Category" field is displayed.
    *   **Steps (Editing - on `/dashboard/about/{id}/edit`):**
        1.  Navigate to the edit page of an existing section.
        2.  Clear the "Name" field and attempt to save changes.
        3.  **Assert**: An error message related to the "Name" field is displayed.
        4.  Restore "Name". Clear the "Content" field and attempt to save changes.
        5.  **Assert**: An error message related to the "Content" field is displayed.

4.  **Test: Delete About Me Section from its Edit Page**
    *   **Purpose**: To verify that a section can be deleted directly from its edit page.
    *   **Steps**:
        1.  Create a new "About Me Section".
        2.  Navigate to its edit page (`/dashboard/about/{section_id}/edit`).
        3.  Click the "Delete" button on the edit form.
        4.  Accept the confirmation dialog (if any).
        5.  **Assert**: Page redirects to `/dashboard/about`.
        6.  **Assert**: The deleted section is no longer visible in the "About Me Sections" list.

5.  **Test: Filtering About Me Sections on the list page**
    *   **Purpose**: To verify the table filtering functionality.
    *   **Steps**:
        1.  Create at least two distinct "About Me Sections" with different content and assigned to different categories (e.g., SectionA in CatX, SectionB in CatY).
        2.  Navigate to `/dashboard/about`.
        3.  Use the "Filter content..." input: type a unique part of SectionA\'s content.
        4.  **Assert**: Only SectionA is visible in the table; SectionB is not.
        5.  Clear content filter. Use the "Filter category..." input: type/select CatX\'s name.
        6.  **Assert**: Only SectionA (or sections in CatX) is visible.
        7.  (Cleanup: Delete test sections).

## II. About Me Categories Tests (New and Enhancements)

1.  **Test: Toggle "Published" status for an About Me Category from the list page**
    *   **Purpose**: To verify the "Published" toggle for categories.
    *   **Steps**:
        1.  Create a new "About Me Category" via the dialog (assume it defaults to "Published").
        2.  On `/dashboard/about`, locate the category in the "About Me Categories" table.
        3.  Click its "Published" switch to unpublish.
        4.  **Assert**: Switch reflects unpublished state.
        5.  Reload page.
        6.  **Assert**: Switch remains unpublished.
        7.  Click switch to publish.
        8.  **Assert**: Switch reflects published state.
        9.  Reload page.
        10. **Assert**: Switch remains published.
        11. (Cleanup: Delete test category).

2.  **Test: Validation for About Me Category Creation (Dialog)**
    *   **Purpose**: To ensure validation within the category creation dialog.
    *   **Steps**:
        1.  On `/dashboard/about`, click the "Create" button in the "About Me Categories" section to open the dialog.
        2.  Attempt to submit the dialog form with an empty "Name" field.
        3.  **Assert**: An error message for the "Name" field is displayed *within the dialog*.
        4.  **Assert**: The dialog remains open.
        5.  Close the dialog.

3.  **Test: Deletion of an About Me Category also deletes its associated About Me Sections**
    *   **Purpose**: To verify the cascading delete behavior as implied by the UI confirmation message.
    *   **Steps**:
        1.  Create a new category, e.g., "CategoryToDelete".
        2.  Create a new "About Me Section", e.g., "SectionInDeletedCategory", and assign it to "CategoryToDelete".
        3.  Verify both "CategoryToDelete" and "SectionInDeletedCategory" are visible in their respective lists on `/dashboard/about`.
        4.  In the "About Me Categories" table, find "CategoryToDelete" and use its row menu to click "Delete".
        5.  Accept the confirmation dialog (which warns about deleting associated sections).
        6.  **Assert**: "CategoryToDelete" is no longer visible in the categories list.
        7.  **Assert**: "SectionInDeletedCategory" is no longer visible in the "About Me Sections" list.

4.  **Test: Filtering About Me Categories on the list page**
    *   **Purpose**: To verify category table filtering.
    *   **Steps**:
        1.  Create at least two distinct categories with different names and descriptions.
        2.  Navigate to `/dashboard/about`.
        3.  Use the "Filter name..." input: type a unique part of one category\'s name.
        4.  **Assert**: Only that category is visible.
        5.  Clear name filter. Use "Filter description...": type unique part of another category\'s description.
        6.  **Assert**: Only that category is visible.
        7.  (Cleanup: Delete test categories).

## III. Interaction and Edge Case Tests

1.  **Test: Non-published categories are not available for selection when creating/editing sections**
    *   **Purpose**: To ensure that only published categories are offered in the dropdowns for sections.
    *   **Steps**:
        1.  Create a category "PublishedCat" and ensure it\'s published.
        2.  Create a category "UnpublishedCat", then unpublish it using its toggle on the `/dashboard/about` list page.
        3.  Navigate to `/dashboard/about/new` (Create Section page).
        4.  Inspect the "Category" dropdown.
        5.  **Assert**: "PublishedCat" is an option.
        6.  **Assert**: "UnpublishedCat" is *not* an option.
        7.  Create a new section and assign it to "PublishedCat". Navigate to this section\'s edit page.
        8.  Inspect the "Category" dropdown.
        9.  **Assert**: "PublishedCat" is selected and an option.
        10. **Assert**: "UnpublishedCat" is *not* an option.
        11. (Cleanup: Delete test categories and section).

2.  **Test: Editing a section whose assigned category becomes unpublished**
    *   **Purpose**: To check how the UI handles a section assigned to a category that is later unpublished.
    *   **Steps**:
        1.  Create a category "CatX" (published).
        2.  Create a section "SectionY" and assign it to "CatX".
        3.  Go to `/dashboard/about` and unpublish "CatX" using its toggle.
        4.  Navigate to edit "SectionY" (`/dashboard/about/{sectionY_id}/edit`).
        5.  **Observe and Assert**:
            *   The "Category" select field should still display "CatX" as the selected category (e.g., its name).
            *   The dropdown options for the "Category" field should *not* list "CatX" (as it\'s unpublished).
            *   Attempt to save the section *without changing the category*.
            *   **Assert**: The save is successful, and "SectionY" remains associated with "CatX" (its `aboutMeCategoryId` should still point to CatX\'s ID).
        6.  (Optional: Re-publish CatX, revisit edit page for SectionY, CatX should now be in options again).
        7.  (Cleanup: Delete "SectionY" and "CatX").