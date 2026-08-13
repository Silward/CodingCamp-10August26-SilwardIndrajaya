# Implementation Plan: To-Do Life Dashboard

## Overview

Build a single-page personal productivity dashboard with four panels (Greeting, Focus Timer, Task Manager, Quick Links) using Vanilla HTML, CSS, and JavaScript. All data persists via Local Storage. The app must work via `file://` protocol with no build tools or backend. Implementation follows an incremental approach: foundational structure first, then each module in isolation, then wiring and integration.

## Tasks

- [x] 1. Set up project structure and foundational HTML/CSS
  - [x] 1.1 Create `index.html` with semantic structure for all four panels
    - Create the HTML file at project root with `<!DOCTYPE html>`, proper `<head>` (meta charset, viewport, link to `css/style.css`, script defer to `js/app.js`)
    - Add four main `<section>` elements with IDs: `greeting-panel`, `focus-timer`, `task-manager`, `quick-links`
    - Include accessible landmarks, headings for each section, and ARIA attributes
    - Add all interactive element placeholders (inputs, buttons, lists) with proper labels
    - _Requirements: 10.1, 10.2, 11.1, 11.6, 11.7_

  - [x] 1.2 Create `css/style.css` with layout, responsive design, and accessibility styles
    - Implement CSS custom properties for colors, spacing, and typography
    - Create a 2x2 grid layout (or similar) for desktop viewports
    - Add `@media (max-width: 768px)` query for single-column reflow
    - Set minimum font sizes (14px body, 18px headings), ensure 4.5:1 contrast ratio
    - Style focus indicators for keyboard navigation (`:focus-visible`)
    - Style task completion state (strikethrough + reduced opacity)
    - Style timer states (completion indicator)
    - Style inline error messages
    - _Requirements: 11.1, 11.2, 11.3, 11.5, 11.6_

  - [x] 1.3 Create `js/app.js` with the App namespace skeleton and StorageManager
    - Set up the IIFE or namespace pattern with `App`, `App.StorageManager`, `App.GreetingPanel`, `App.FocusTimer`, `App.TaskManager`, `App.QuickLinks`
    - Implement `StorageManager` with `get(key)`, `set(key, value)`, `remove(key)`, `isValid(key)` methods
    - Implement JSON parse error recovery (return `null` on invalid data)
    - Implement `QuotaExceededError` handling with user-visible warning
    - Define storage keys: `todo-dashboard-tasks`, `todo-dashboard-links`
    - Wire `App.init()` to `DOMContentLoaded` event
    - _Requirements: 8.1, 8.2, 8.3, 10.1_

- [x] 2. Implement Greeting Panel module
  - [x] 2.1 Implement `GreetingPanel` with time, date, and greeting display
    - Implement `init(containerEl)` to render initial time/date/greeting
    - Implement `formatTime(date)` returning `HH:MM AM/PM` (12-hour clock)
    - Implement `formatDate(date)` returning `DayOfWeek, Month Day`
    - Implement `getGreeting(hour)` returning "Good Morning" (5-11), "Good Afternoon" (12-17), "Good Evening" (18-4)
    - Implement `updateDisplay()` called on a 1-second interval, only updating DOM when minute changes
    - Re-evaluate greeting on each minute change
    - _Requirements: 1.1, 1.2, 1.3, 2.1, 2.2, 2.3, 2.4_

  - [ ]* 2.2 Write property tests for time formatting (Property 1)
    - **Property 1: Time formatting correctness**
    - Test `formatTime(date)` produces valid `HH:MM AM/PM` for any Date object
    - Test `formatDate(date)` produces valid day-of-week, month, and day
    - **Validates: Requirements 1.1, 1.2**

  - [ ]* 2.3 Write property tests for greeting logic (Property 2)
    - **Property 2: Greeting maps to correct time period**
    - Test `getGreeting(hour)` for all hours 0-23 returns correct greeting string
    - **Validates: Requirements 2.1, 2.2, 2.3**

- [x] 3. Implement Focus Timer module
  - [x] 3.1 Implement `FocusTimer` with state machine and countdown logic
    - Implement `init(containerEl)` to render timer display (25:00) and three buttons (Start, Stop, Reset)
    - Implement state machine: idle → running → paused → completed with proper transitions
    - Implement `start()`, `stop()`, `reset()`, `tick()`, `onComplete()` methods
    - Implement `formatTime(totalSeconds)` returning zero-padded `MM:SS`
    - Use `setInterval` with drift correction via `Date.now()` comparison
    - Handle visibility change (tab becoming inactive) by recalculating remaining time
    - Implement button enable/disable logic per state matrix
    - Apply visual completion indicator when timer reaches 00:00
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8_

  - [ ]* 3.2 Write property tests for timer display formatting (Property 3)
    - **Property 3: Timer display formatting**
    - Test `formatTime(totalSeconds)` produces correct MM:SS for any integer 0-5999
    - **Validates: Requirements 3.1**

  - [ ]* 3.3 Write property tests for button state consistency (Property 4)
    - **Property 4: Button state consistency with timer state**
    - Test that each timer state maps to correct enabled/disabled for all three buttons
    - **Validates: Requirements 3.3, 3.5, 3.7**

- [x] 4. Checkpoint - Verify Greeting and Timer
  - Ensure all tests pass, ask the user if questions arise.

- [x] 5. Implement Task Manager module
  - [x] 5.1 Implement `TaskManager` with add, render, and persistence
    - Implement `init(containerEl)` to load tasks from StorageManager and render them
    - Implement `addTask(text)` with validation (non-empty, non-whitespace, ≤256 chars)
    - Implement `validateTaskText(text)` returning `{valid, error}`
    - Implement `renderTask(task)` creating DOM element with checkbox, text, delete button
    - Implement `renderAll()` to render full list from state
    - Generate unique IDs using `task_${Date.now()}_${Math.random().toString(36).slice(2,7)}`
    - Clear input field on successful add
    - Display inline error for text exceeding 256 characters
    - Persist to Local Storage on every add
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 8.1, 8.2_

  - [x] 5.2 Implement task editing (inline edit on double-click)
    - Implement `startEditing(taskEl, task)` to replace text with pre-filled input field
    - Implement `commitEdit(taskId, newText)` on Enter or blur with validation
    - Discard changes on Escape key press
    - Retain original text if new text is empty/whitespace-only
    - Persist updated text to Local Storage
    - _Requirements: 5.1, 5.2, 5.3, 5.4_

  - [x] 5.3 Implement task completion toggle and deletion
    - Implement `toggleComplete(taskId)` toggling `completed` boolean
    - Apply/remove strikethrough and reduced opacity CSS classes
    - Implement `deleteTask(taskId)` removing from array and DOM
    - Persist changes to Local Storage after toggle and delete
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 7.1, 7.2_

  - [ ]* 5.4 Write property tests for task addition (Properties 5, 6)
    - **Property 5: Valid task addition**
    - Test that valid text increases list length by 1, new task is last, completed is false, input cleared
    - **Property 6: Task validation rejects invalid input**
    - Test that empty/whitespace/over-256-char text does not modify list or storage
    - **Validates: Requirements 4.1, 4.3, 4.4, 4.5, 4.6**

  - [ ]* 5.5 Write property tests for task persistence and editing (Properties 7, 8)
    - **Property 7: Task persistence round-trip**
    - Test that task operations produce storage-deserializable data preserving all fields and order
    - **Property 8: Invalid edit preserves original task text**
    - Test that empty/whitespace edit commits leave task text unchanged
    - **Validates: Requirements 4.2, 5.2, 5.3, 6.3, 7.2, 8.1, 8.2**

  - [ ]* 5.6 Write property tests for completion toggle and deletion (Properties 9, 10)
    - **Property 9: Completion toggle is an involution**
    - Test that double-toggling returns task to original state
    - **Property 10: Task deletion reduces list size**
    - Test that deletion reduces length by 1, removes correct task, preserves order of others
    - **Validates: Requirements 6.1, 6.2, 6.4, 7.1, 7.2**

- [x] 6. Checkpoint - Verify Task Manager
  - Ensure all tests pass, ask the user if questions arise.

- [x] 7. Implement Quick Links module
  - [x] 7.1 Implement `QuickLinks` with add, render, delete, and persistence
    - Implement `init(containerEl)` to load links from StorageManager and render them
    - Implement `addLink(url, label)` with validation (URL starts with http(s)://, ≤2048 chars; label 1-50 chars trimmed; max 20 links)
    - Implement `validateLink(url, label)` returning `{valid, errors[]}`
    - Implement `renderLink(link)` creating a clickable button that opens URL in new tab
    - Implement `deleteLink(linkId)` removing from array, DOM, and Local Storage
    - Implement `renderAll()` to render full list from state
    - Display inline error messages for each invalid field
    - Display max-links-reached message when at 20
    - Persist to Local Storage on add and delete
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6, 9.7_

  - [ ]* 7.2 Write property tests for link addition and validation (Properties 11, 12)
    - **Property 11: Valid link addition and persistence round-trip**
    - Test that valid URL + label adds link, persists, and survives reload
    - **Property 12: Link validation rejects invalid input**
    - Test that invalid URL/label does not modify list or storage
    - **Validates: Requirements 9.1, 9.3, 9.4, 9.6**

  - [ ]* 7.3 Write property tests for link deletion (Property 13)
    - **Property 13: Link deletion removes from list and storage**
    - Test that deleting a link removes it from display and storage, preserving others' order
    - **Validates: Requirements 9.5**

- [x] 8. Implement error handling and storage recovery
  - [x] 8.1 Implement corrupted storage recovery and storage-unavailable warning
    - In `StorageManager.get()`, if JSON.parse fails or result is not an array, reset key to `[]` and return empty array
    - Detect `localStorage` unavailability (private browsing) and display non-blocking warning banner
    - Handle `QuotaExceededError` on write with inline error message
    - Log warnings to console for corrupted data
    - _Requirements: 8.3, 11.3_

  - [ ]* 8.2 Write property test for corrupted storage recovery (Property 14)
    - **Property 14: Corrupted storage recovery**
    - Test that any non-JSON or non-array value triggers recovery to empty list
    - **Validates: Requirements 8.3**

- [x] 9. Wire everything together and finalize
  - [x] 9.1 Complete `App.init()` to initialize all modules and handle load performance
    - Call each module's `init()` with the correct container element
    - Ensure all content renders and becomes interactive within 1 second
    - Ensure all interactive elements respond within 100ms
    - Verify no console errors on load via `file://` protocol
    - _Requirements: 10.2, 11.3, 11.4_

  - [x] 9.2 Finalize keyboard navigation and ARIA accessibility
    - Ensure all interactive elements are reachable via Tab/Shift+Tab
    - Ensure Enter and Space activate buttons, checkboxes, and links
    - Verify visible focus indicators on all focused elements
    - Add `aria-describedby` to error messages linked to their inputs
    - Add accessible names to all controls via labels or `aria-label`
    - _Requirements: 11.6, 11.7_

  - [ ]* 9.3 Write integration/smoke tests
    - Test that app loads without console errors
    - Test all four panels render on initial load
    - Test localStorage round-trip across simulated reload
    - Test responsive layout at 768px viewport width
    - _Requirements: 10.2, 10.3, 11.1, 11.5_

- [x] 10. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties from the design document
- Unit tests validate specific examples and edge cases
- The app uses a single `js/app.js` file with namespace pattern — all module implementations go in this file
- The app uses a single `css/style.css` file for all styling
- No build tools, no npm packages in the production app (test dependencies are separate)
- All test files go in a `tests/` directory and run via Node.js (not bundled with the app)

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "1.3"] },
    { "id": 1, "tasks": ["1.2"] },
    { "id": 2, "tasks": ["2.1", "3.1"] },
    { "id": 3, "tasks": ["2.2", "2.3", "3.2", "3.3"] },
    { "id": 4, "tasks": ["5.1", "7.1", "8.1"] },
    { "id": 5, "tasks": ["5.2", "5.3", "5.4", "7.2", "8.2"] },
    { "id": 6, "tasks": ["5.5", "5.6", "7.3"] },
    { "id": 7, "tasks": ["9.1"] },
    { "id": 8, "tasks": ["9.2"] },
    { "id": 9, "tasks": ["9.3"] }
  ]
}
```
