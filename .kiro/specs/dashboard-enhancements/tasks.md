# Implementation Plan: Dashboard Enhancements

## Overview

This plan implements three enhancements to the To-Do Life Dashboard: personalized name entry in the greeting panel, light/dark mode toggle with persistence, and duplicate task prevention. The implementation follows a dependency-driven order: HTML structure first (DOM elements), then CSS theming, then JavaScript module implementations, ending with integration wiring.

## Tasks

- [x] 1. HTML structure changes (index.html)
  - [x] 1.1 Add theme flash prevention inline script and theme toggle button to index.html
    - Add inline `<script>` in `<head>` before the CSS `<link>` tag that reads `todo-dashboard-theme` from localStorage and sets `data-theme` attribute on `<html>`
    - Default to `data-theme="dark"` if no stored value or localStorage unavailable
    - Add `<button id="theme-toggle">` with moon icon in the `<header>` element, with `aria-label="Toggle light/dark theme"` and `aria-pressed="false"`
    - _Requirements: 2.1, 2.4, 2.5, 2.6, 2.8_

  - [x] 1.2 Add name input field to greeting panel section in index.html
    - Add a `<div class="name-input-wrapper">` after `#greeting-message`
    - Include a `<label for="name-input" class="sr-only">Your name</label>`
    - Include `<input type="text" id="name-input" placeholder="Enter your name..." maxlength="50" aria-label="Enter your name for personalized greeting">`
    - _Requirements: 1.1, 1.6_

- [x] 2. CSS theme and component styles (css/style.css)
  - [x] 2.1 Add light theme CSS custom property overrides
    - Add `html[data-theme="light"]` selector block that overrides all `--color-*` custom properties with light theme values as specified in the design document
    - Light theme colors: `--color-bg: #f0f2f5`, `--color-surface: #ffffff`, `--color-surface-alt: #e8ecf0`, `--color-text: #1a1a2e`, `--color-text-muted: #5a5a6e`, `--color-border: #d1d5db`, etc.
    - Ensure WCAG AA 4.5:1 contrast ratios are maintained
    - _Requirements: 2.7, 2.9, 2.10_

  - [x] 2.2 Add theme toggle button styles and name input styles
    - Style `#theme-toggle` button in the header (positioned to the right of the heading, no background, icon-sized)
    - Style `.name-input-wrapper` for the greeting panel name input (centered, appropriate spacing)
    - Style the `.theme-icon` span for sun/moon icon display
    - _Requirements: 2.1, 2.8, 1.1_

- [x] 3. StorageManager enhancements (js/app.js)
  - [x] 3.1 Add getString and setString methods to StorageManager and new KEYS
    - Add `NAME: 'todo-dashboard-name'` and `THEME: 'todo-dashboard-theme'` to `StorageManager.KEYS`
    - Implement `getString(key)` method that returns raw string from localStorage (returns null on error)
    - Implement `setString(key, value)` method that stores raw string, handles QuotaExceededError with `_showQuotaError()`
    - _Requirements: 1.2, 2.3, 2.6_

- [x] 4. Implement ThemeManager module (js/app.js)
  - [x] 4.1 Create ThemeManager module with init, toggle, applyTheme, and _updateIcon methods
    - Add `ThemeManager` object in `js/app.js` between `StorageManager` and `GreetingPanel` sections
    - Implement `init(toggleBtn)`: read persisted theme from StorageManager, bind click event to toggle button, call `_updateIcon()`
    - Implement `toggle()`: switch between 'light' and 'dark', call `applyTheme()`, persist to StorageManager, update button icon and `aria-pressed` attribute
    - Implement `applyTheme(theme)`: set `document.documentElement.setAttribute('data-theme', theme)`
    - Implement `_updateIcon()`: show sun (☀) when light active, moon (☽) when dark active
    - _Requirements: 2.1, 2.2, 2.3, 2.5, 2.8, 2.9, 2.10_

  - [ ]* 4.2 Write property tests for ThemeManager
    - **Property 7: Theme toggle is an involution (round-trip)**
    - **Property 8: Theme persistence round-trip**
    - **Validates: Requirements 2.2, 2.3, 2.4**

- [x] 5. Checkpoint - Ensure theme toggle works
  - Ensure all tests pass, ask the user if questions arise.

- [x] 6. Enhance GreetingPanel with name input logic (js/app.js)
  - [x] 6.1 Add name input properties and methods to GreetingPanel
    - Add `_nameInputEl` and `_storedName` properties
    - Implement `_loadName()`: read stored name via `StorageManager.getString(StorageManager.KEYS.NAME)`, set `_storedName` and pre-fill input
    - Implement `_bindNameEvents()`: bind `blur` and `Enter` keydown events on `#name-input` to call `_saveName()`
    - Implement `_saveName()`: trim input value, treat whitespace-only as empty, store via `StorageManager.setString()` or remove key if empty, update `_storedName`, call `updateDisplay()`
    - Modify `init()`: query `#name-input`, call `_loadName()` and `_bindNameEvents()`
    - _Requirements: 1.1, 1.2, 1.3, 1.6, 1.7_

  - [x] 6.2 Modify getGreeting to include personalized name
    - Update `getGreeting(hour)` to append `, {name}` when `this._storedName` is non-empty
    - Return base greeting without suffix when name is empty
    - _Requirements: 1.4, 1.5_

  - [ ]* 6.3 Write property tests for GreetingPanel name logic
    - **Property 1: Greeting format with name**
    - **Property 2: Greeting format without name**
    - **Property 3: Name persistence round-trip**
    - **Validates: Requirements 1.2, 1.3, 1.4, 1.5, 1.6**

- [x] 7. Add duplicate task prevention to TaskManager (js/app.js)
  - [x] 7.1 Implement isDuplicate method on TaskManager
    - Add `isDuplicate(text, excludeId)` method that trims and lowercases input text, iterates over `this.tasks`, skips task with `excludeId`, returns `true` if normalized texts match
    - Return `false` for empty/whitespace-only input
    - _Requirements: 3.1, 3.5_

  - [x] 7.2 Integrate isDuplicate into addTask method
    - After `validateTaskText()` passes, call `this.isDuplicate(text, null)`
    - If duplicate found, call `this._showError('This task already exists')` and return `false`
    - Do not clear the input field on duplicate rejection (let user modify)
    - _Requirements: 3.1, 3.2, 3.3, 3.4_

  - [x] 7.3 Integrate isDuplicate into commitEdit method
    - After `validateTaskText()` passes in `commitEdit()`, call `this.isDuplicate(newText, taskId)`
    - If duplicate found, call `this._showError('This task already exists')` and return without updating
    - Retain original task text on duplicate rejection
    - _Requirements: 3.6, 3.7_

  - [ ]* 7.4 Write property tests for duplicate detection
    - **Property 4: Duplicate detection symmetry**
    - **Property 5: Duplicate detection is case-insensitive and trim-insensitive**
    - **Property 6: Duplicate detection excludes self on edit**
    - **Validates: Requirements 3.1, 3.2, 3.5, 3.6**

- [x] 8. Wire ThemeManager into App initialization (js/app.js)
  - [x] 8.1 Update App.init() to initialize ThemeManager
    - Add `ThemeManager` to the `App` namespace object
    - In `App.init()`, query `#theme-toggle` button element
    - Call `ThemeManager.init(toggleBtn)` after the greeting panel and before task manager init
    - _Requirements: 2.1, 2.2, 4.1, 4.2, 4.3, 4.4_

- [x] 9. Final checkpoint - Ensure all features work together
  - Ensure all tests pass, ask the user if questions arise.
  - Verify theme toggle switches colors across all panels
  - Verify name input persists and personalizes greeting
  - Verify duplicate task prevention on add and edit
  - Verify existing features (timer, tasks, links) still work correctly
  - Verify no theme flash on page load with stored preference

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties from the design document
- Unit tests validate specific examples and edge cases
- The application uses vanilla JavaScript with an IIFE namespace pattern — no frameworks or build tools
- All changes stay within the existing three files: `index.html`, `css/style.css`, `js/app.js`

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "1.2"] },
    { "id": 1, "tasks": ["2.1", "2.2", "3.1"] },
    { "id": 2, "tasks": ["4.1", "6.1", "7.1"] },
    { "id": 3, "tasks": ["4.2", "6.2", "7.2", "7.3"] },
    { "id": 4, "tasks": ["6.3", "7.4", "8.1"] },
    { "id": 5, "tasks": ["5.2"] }
  ]
}
```
