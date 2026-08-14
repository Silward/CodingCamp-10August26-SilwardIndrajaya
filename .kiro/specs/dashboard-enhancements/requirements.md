# Requirements Document

## Introduction

This document specifies three enhancements to the existing To-Do Life Dashboard: personalized greeting with user name, light/dark mode toggle with persistence, and duplicate task prevention. All enhancements integrate into the existing single-file IIFE architecture (StorageManager, GreetingPanel, FocusTimer, TaskManager, QuickLinks) without introducing frameworks or build tools.

## Glossary

- **Dashboard**: The To-Do Life Dashboard single-page application served via file:// protocol
- **GreetingPanel**: The existing module that displays current time, date, and time-based greeting message
- **TaskManager**: The existing module that manages CRUD operations for to-do tasks
- **StorageManager**: The existing localStorage wrapper module providing get/set/remove/isValid methods
- **Theme**: The visual color scheme applied to the entire Dashboard (light or dark)
- **Name_Input**: The inline text input element where the user enters their display name
- **Theme_Toggle**: The button or control that switches between light and dark themes
- **Duplicate_Task**: A task whose trimmed text matches an existing task's trimmed text using case-insensitive comparison

## Requirements

### Requirement 1: Personalized Name Entry

**User Story:** As a user, I want to enter my name into the greeting panel, so that the dashboard greets me personally.

#### Acceptance Criteria

1. THE GreetingPanel SHALL display a Name_Input field within the greeting panel section that allows the user to type their display name
2. WHEN the user enters text into the Name_Input and the field loses focus or the user presses Enter, THE GreetingPanel SHALL save the trimmed name value to localStorage via StorageManager using a dedicated storage key
3. WHEN the Dashboard loads and a saved name exists in localStorage, THE GreetingPanel SHALL pre-fill the Name_Input with the stored name
4. WHEN a non-empty name is stored, THE GreetingPanel SHALL display the greeting in the format "Good Morning, {name}" between 05:00–11:59 local time, "Good Afternoon, {name}" between 12:00–17:59 local time, or "Good Evening, {name}" between 18:00–04:59 local time
5. WHEN the stored name is empty or no name is stored, THE GreetingPanel SHALL display the greeting without a name suffix using the same time-of-day rules (e.g., "Good Morning")
6. THE Name_Input SHALL accept a maximum of 50 characters, and IF the input contains only whitespace characters, THEN THE GreetingPanel SHALL treat it as an empty value
7. IF the user clears the Name_Input and commits the change, THEN THE GreetingPanel SHALL remove the name from localStorage and revert the greeting to the default format without a name

### Requirement 2: Light / Dark Mode Toggle

**User Story:** As a user, I want to switch between light and dark color themes, so that I can use the dashboard comfortably in different lighting conditions.

#### Acceptance Criteria

1. THE Dashboard SHALL display a Theme_Toggle control in the page header that is operable via mouse click, keyboard activation (Enter or Space), and touch input
2. WHEN the user activates the Theme_Toggle, THE Dashboard SHALL apply the selected theme's color scheme to all panels, text, inputs, buttons, and backgrounds across the entire page within 100 milliseconds of activation
3. WHEN the user activates the Theme_Toggle, THE Dashboard SHALL persist the theme preference to localStorage via StorageManager using the key 'todo-dashboard-theme'
4. WHEN the Dashboard loads and a saved theme preference exists in localStorage, THE Dashboard SHALL apply the saved theme before the first contentful paint so that no frame of the incorrect theme is rendered
5. WHEN the Dashboard loads and no saved theme preference exists, THE Dashboard SHALL default to the dark theme
6. IF localStorage is unavailable or a read/write operation throws an error, THEN THE Dashboard SHALL fall back to the dark theme and continue operating without persisting the preference
7. THE light theme SHALL maintain a minimum WCAG AA contrast ratio of 4.5:1 for all text against its background
8. THE Theme_Toggle SHALL display a sun icon when light mode is active and a moon icon when dark mode is active to indicate the current theme state
9. WHILE the light theme is active, THE Dashboard SHALL apply light-colored backgrounds and dark text to all panel surfaces, inputs, and interactive elements using CSS custom properties that override the dark theme defaults
10. WHILE the dark theme is active, THE Dashboard SHALL retain the existing dark color scheme (--color-bg: #1a1a2e, --color-surface: #16213e, --color-text: #eaeaea) without any visual changes from the current design

### Requirement 3: Prevent Duplicate Tasks

**User Story:** As a user, I want to be prevented from adding a duplicate task, so that my task list stays clean and free of accidental repetitions.

#### Acceptance Criteria

1. WHEN the user submits a new task via the task form, THE TaskManager SHALL compare the trimmed, case-insensitive text of the new task against all existing tasks in the current task list
2. IF a task with matching trimmed, case-insensitive text already exists in the task list, THEN THE TaskManager SHALL reject the submission and not add the task
3. IF a duplicate task submission is rejected, THEN THE TaskManager SHALL display an inline error message "This task already exists" in the existing task-error element
4. WHEN the user modifies the task input text after a duplicate rejection, THE TaskManager SHALL clear the duplicate error message from the task-error element
5. THE TaskManager SHALL compare against both completed and incomplete tasks in the current list when performing duplicate checks
6. WHEN a task is edited via inline editing and the new text matches another existing task (case-insensitive, trimmed), THE TaskManager SHALL reject the edit, retain the original task text, and display an inline error message indicating the task already exists
7. WHEN the user modifies the inline edit input text after an inline edit duplicate rejection, THE TaskManager SHALL clear the inline edit duplicate error message

### Requirement 4: Non-Regression of Existing Features

**User Story:** As a user, I want all existing dashboard features to continue working correctly after the enhancements are applied, so that I do not lose any functionality.

#### Acceptance Criteria

1. THE Dashboard SHALL preserve all existing GreetingPanel functionality: time display (12-hour HH:MM AM/PM), date display (DayOfWeek, Month Day), and time-based greeting updates
2. THE Dashboard SHALL preserve all existing FocusTimer functionality: start, stop, reset controls, 25-minute countdown displaying remaining minutes and seconds, drift correction maintaining accuracy within 1 second of real elapsed time, and a visual completion indicator displayed when the countdown reaches 00:00
3. THE Dashboard SHALL preserve all existing TaskManager functionality: add, edit (double-click inline), toggle completion (checkbox), delete, validation (reject empty or whitespace-only input, reject input exceeding 256 characters), and localStorage persistence
4. THE Dashboard SHALL preserve all existing QuickLinks functionality: add link with URL validation (reject empty URL and empty label), delete link, open in new tab, and localStorage persistence with 20-link limit
5. THE Dashboard SHALL maintain the existing responsive layout behavior (2-column grid above 768px, single column at or below 768px)
6. THE Dashboard SHALL render all panels, respond to all user interactions, and persist data to localStorage when opened via file:// protocol without a web server
7. WHEN enhancements are applied, THE Dashboard SHALL preserve any existing user data previously stored in localStorage by the TaskManager and QuickLinks modules
