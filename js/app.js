/**
 * To-Do Life Dashboard
 * A single-page personal productivity hub with Greeting, Focus Timer,
 * Task Manager, and Quick Links panels.
 *
 * Architecture: Single-file IIFE with namespace pattern.
 * All modules are organized under the App namespace.
 */
(function () {
  'use strict';

  // =========================================================================
  // STORAGE MANAGER
  // =========================================================================

  /**
   * StorageManager - Thin wrapper around localStorage providing JSON
   * serialization/deserialization, error recovery, and quota handling.
   */
  const StorageManager = {
    KEYS: {
      TASKS: 'todo-dashboard-tasks',
      LINKS: 'todo-dashboard-links',
      NAME: 'todo-dashboard-name',
      THEME: 'todo-dashboard-theme'
    },

    /**
     * Retrieve and parse a value from localStorage.
     * Returns null if the key doesn't exist, data is invalid JSON,
     * or the parsed value is not an array.
     * On corruption, resets the key to an empty array.
     * @param {string} key - The localStorage key to retrieve
     * @returns {Array|null} Parsed array or null on failure
     */
    get(key) {
      try {
        const raw = localStorage.getItem(key);
        if (raw === null) {
          return null;
        }
        const parsed = JSON.parse(raw);
        if (!Array.isArray(parsed)) {
          console.warn(
            '[StorageManager] Corrupted data for key "' + key + '": value is not an array. Resetting.'
          );
          this.set(key, []);
          return [];
        }
        return parsed;
      } catch (e) {
        console.warn(
          '[StorageManager] Failed to parse data for key "' + key + '". Resetting.',
          e
        );
        // Reset corrupted key to empty array
        try {
          localStorage.setItem(key, JSON.stringify([]));
        } catch (writeErr) {
          // If we can't even write, storage is likely unavailable
          this._showStorageWarning();
        }
        return [];
      }
    },

    /**
     * Serialize a value to JSON and store it in localStorage.
     * Handles QuotaExceededError with a user-visible warning.
     * @param {string} key - The localStorage key
     * @param {*} value - The value to serialize and store
     * @returns {boolean} true if successful, false otherwise
     */
    set(key, value) {
      try {
        localStorage.setItem(key, JSON.stringify(value));
        return true;
      } catch (e) {
        if (e.name === 'QuotaExceededError' || e.code === 22 || e.code === 1014) {
          this._showQuotaError();
        } else {
          this._showStorageWarning();
        }
        console.error('[StorageManager] Failed to write key "' + key + '":', e);
        return false;
      }
    },

    /**
     * Remove a key from localStorage.
     * @param {string} key - The localStorage key to remove
     */
    remove(key) {
      try {
        localStorage.removeItem(key);
      } catch (e) {
        console.error('[StorageManager] Failed to remove key "' + key + '":', e);
      }
    },

    /**
     * Check if stored value for a key is valid (exists and is a JSON array).
     * @param {string} key - The localStorage key to validate
     * @returns {boolean} true if the value is a valid JSON array
     */
    isValid(key) {
      try {
        const raw = localStorage.getItem(key);
        if (raw === null) {
          return false;
        }
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed);
      } catch (e) {
        return false;
      }
    },

    /**
     * Retrieve a raw string value from localStorage.
     * @param {string} key
     * @returns {string|null}
     */
    getString(key) {
      try {
        return localStorage.getItem(key);
      } catch (e) {
        return null;
      }
    },

    /**
     * Store a raw string value in localStorage.
     * @param {string} key
     * @param {string} value
     * @returns {boolean}
     */
    setString(key, value) {
      try {
        localStorage.setItem(key, value);
        return true;
      } catch (e) {
        if (e.name === 'QuotaExceededError' || e.code === 22 || e.code === 1014) {
          this._showQuotaError();
        }
        return false;
      }
    },

    /**
     * Display a non-blocking warning banner when storage is unavailable.
     * @private
     */
    _showStorageWarning() {
      this._showBanner(
        "Storage unavailable \u2014 changes won't persist across sessions",
        'storage-warning'
      );
    },

    /**
     * Display an inline error when storage quota is exceeded.
     * @private
     */
    _showQuotaError() {
      this._showBanner(
        'Storage full \u2014 please delete some items',
        'storage-quota-error'
      );
    },

    /**
     * Show a non-blocking banner message at the top of the page.
     * Reuses existing banner if one with the same ID already exists.
     * @private
     * @param {string} message - The message to display
     * @param {string} id - Unique ID for the banner element
     */
    _showBanner(message, id) {
      if (document.getElementById(id)) {
        return; // Banner already visible
      }
      var banner = document.createElement('div');
      banner.id = id;
      banner.className = 'storage-banner';
      banner.setAttribute('role', 'alert');
      banner.textContent = message;
      document.body.insertBefore(banner, document.body.firstChild);
    }
  };

  // =========================================================================
  // THEME MANAGER
  // =========================================================================

  /**
   * ThemeManager - Manages light/dark theme state, applies CSS via data-theme
   * attribute on <html>, persists preference to localStorage, and handles the
   * toggle control with appropriate icon display.
   */
  const ThemeManager = {
    STORAGE_KEY: 'todo-dashboard-theme',
    THEMES: { LIGHT: 'light', DARK: 'dark' },
    _currentTheme: 'dark',
    _toggleBtn: null,

    /**
     * Initialize ThemeManager. Reads persisted theme (already applied by
     * inline script), binds toggle button event, and sets initial icon.
     * @param {HTMLElement} toggleBtn - The theme toggle button element
     */
    init(toggleBtn) {
      this._toggleBtn = toggleBtn;

      // Read persisted theme (inline script already applied it to prevent flash)
      var stored = StorageManager.getString(StorageManager.KEYS.THEME);
      if (stored === 'light' || stored === 'dark') {
        this._currentTheme = stored;
      } else {
        this._currentTheme = 'dark';
      }

      // Bind click event
      this._toggleBtn.addEventListener('click', () => this.toggle());

      // Set initial icon and aria-pressed state
      this._updateIcon();
    },

    /**
     * Toggle between light and dark themes.
     * Updates DOM, persists to localStorage, and updates button icon.
     */
    toggle() {
      this._currentTheme = (this._currentTheme === 'dark') ? 'light' : 'dark';
      this.applyTheme(this._currentTheme);
      StorageManager.setString(StorageManager.KEYS.THEME, this._currentTheme);
      this._updateIcon();
    },

    /**
     * Apply a theme by setting data-theme attribute on <html>.
     * @param {string} theme - 'light' or 'dark'
     */
    applyTheme(theme) {
      document.documentElement.setAttribute('data-theme', theme);
    },

    /**
     * Update the toggle button icon based on current theme.
     * Sun icon (☼) when light mode active, Moon icon (☽) when dark mode active.
     * Also updates aria-pressed attribute for accessibility.
     * @private
     */
    _updateIcon() {
      if (!this._toggleBtn) return;
      var iconEl = this._toggleBtn.querySelector('.theme-icon');
      if (iconEl) {
        // Sun icon when light, Moon icon when dark
        iconEl.innerHTML = (this._currentTheme === 'light') ? '&#9788;' : '&#9790;';
      }
      // Update aria-pressed: true when light (toggle is "on"), false when dark
      this._toggleBtn.setAttribute('aria-pressed', this._currentTheme === 'light' ? 'true' : 'false');
    }
  };

  // =========================================================================
  // GREETING PANEL
  // =========================================================================

  /**
   * GreetingPanel - Displays current time, date, and time-based greeting.
   * Displays current time (12-hour HH:MM AM/PM), date (DayOfWeek, Month Day),
   * and a time-based greeting message. Updates every second but only
   * writes to the DOM when the displayed minute changes.
   */
  const GreetingPanel = {
    _timeEl: null,
    _dateEl: null,
    _greetingEl: null,
    _nameInputEl: null,
    _storedName: '',
    _lastMinute: null,
    _intervalId: null,

    /**
     * Initialize the greeting panel.
     * Finds DOM elements, loads stored name, binds name input events,
     * renders the initial display, and starts the 1-second update interval.
     * @param {HTMLElement} containerEl - The greeting panel section element
     */
    init(containerEl) {
      this._timeEl = containerEl.querySelector('#current-time');
      this._dateEl = containerEl.querySelector('#current-date');
      this._greetingEl = containerEl.querySelector('#greeting-message');
      this._nameInputEl = containerEl.querySelector('#name-input');

      // Load stored name and bind name input events
      this._loadName();
      this._bindNameEvents();

      // Render immediately on init
      this.updateDisplay();

      // Start 1-second interval for checking time changes
      this._intervalId = setInterval(this.updateDisplay.bind(this), 1000);
    },

    /**
     * Update the displayed time, date, and greeting.
     * Only writes to the DOM when the minute has changed since the last update.
     */
    updateDisplay() {
      var now = new Date();
      var currentMinute = now.getHours() * 60 + now.getMinutes();

      // Only update DOM when the minute changes (or on first render)
      if (this._lastMinute === currentMinute) {
        return;
      }

      this._lastMinute = currentMinute;

      if (this._timeEl) {
        this._timeEl.textContent = this.formatTime(now);
      }
      if (this._dateEl) {
        this._dateEl.textContent = this.formatDate(now);
      }
      if (this._greetingEl) {
        this._greetingEl.textContent = this.getGreeting(now.getHours());
      }
    },

    /**
     * Format a Date object into a 12-hour time string.
     * @param {Date} date - The date to format
     * @returns {string} Time in "H:MM AM/PM" format (e.g., "2:30 PM")
     */
    formatTime(date) {
      var hours = date.getHours();
      var minutes = date.getMinutes();
      var ampm = hours >= 12 ? 'PM' : 'AM';

      // Convert to 12-hour format
      var displayHours = hours % 12;
      if (displayHours === 0) {
        displayHours = 12;
      }

      // Zero-pad minutes
      var displayMinutes = minutes < 10 ? '0' + minutes : String(minutes);

      return displayHours + ':' + displayMinutes + ' ' + ampm;
    },

    /**
     * Format a Date object into a full date string.
     * @param {Date} date - The date to format
     * @returns {string} Date in "DayOfWeek, Month Day" format (e.g., "Monday, January 5")
     */
    formatDate(date) {
      var days = [
        'Sunday', 'Monday', 'Tuesday', 'Wednesday',
        'Thursday', 'Friday', 'Saturday'
      ];
      var months = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
      ];

      var dayName = days[date.getDay()];
      var monthName = months[date.getMonth()];
      var dayOfMonth = date.getDate();

      return dayName + ', ' + monthName + ' ' + dayOfMonth;
    },

    /**
     * Get a greeting string based on the hour of the day.
     * @param {number} hour - Hour in 24-hour format (0-23)
     * @returns {string} "Good Morning" (5-11), "Good Afternoon" (12-17), "Good Evening" (18-23, 0-4)
     */
    getGreeting(hour) {
      var base;
      if (hour >= 5 && hour <= 11) {
        base = 'Good Morning';
      } else if (hour >= 12 && hour <= 17) {
        base = 'Good Afternoon';
      } else {
        base = 'Good Evening';
      }
      if (this._storedName) {
        return base + ', ' + this._storedName;
      }
      return base;
    },

    /**
     * Load saved name from localStorage.
     * Populates _storedName and pre-fills the input field.
     */
    _loadName() {
      var stored = StorageManager.getString(StorageManager.KEYS.NAME);
      if (stored !== null && stored.trim().length > 0) {
        this._storedName = stored.trim();
        if (this._nameInputEl) {
          this._nameInputEl.value = this._storedName;
        }
      } else {
        this._storedName = '';
      }
    },

    /**
     * Bind blur and Enter key events on the name input to persist the name value.
     */
    _bindNameEvents() {
      if (!this._nameInputEl) return;

      this._nameInputEl.addEventListener('blur', () => {
        this._saveName();
      });

      this._nameInputEl.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          this._saveName();
          this._nameInputEl.blur();
        }
      });
    },

    /**
     * Validate and save the name from the input field.
     * Trims value, treats whitespace-only as empty.
     * Max 50 characters (enforced by maxlength attribute + JS truncation as safety net).
     * Updates _storedName and refreshes the greeting display.
     */
    _saveName() {
      if (!this._nameInputEl) return;
      var value = this._nameInputEl.value.trim();

      if (value.length === 0) {
        // Empty or whitespace-only: remove from storage
        this._storedName = '';
        StorageManager.remove(StorageManager.KEYS.NAME);
      } else {
        // Valid name (maxlength=50 enforced by HTML, truncate as safety net)
        this._storedName = value.substring(0, 50);
        StorageManager.setString(StorageManager.KEYS.NAME, this._storedName);
      }

      // Force greeting update by resetting minute tracker
      this._lastMinute = null;
      this.updateDisplay();
    }
  };

  // =========================================================================
  // FOCUS TIMER
  // =========================================================================

  /**
   * FocusTimer - 25-minute Pomodoro countdown timer with start/stop/reset.
   * Uses drift correction via Date.now() comparison and handles tab
   * visibility changes to maintain accuracy.
   */
  const FocusTimer = {
    DURATION: 1500, // 25 minutes in seconds
    state: 'idle',  // idle | running | paused | completed
    remainingMs: 1500 * 1000, // Milliseconds remaining
    lastTickTime: 0,          // Date.now() of last tick for drift correction
    intervalId: null,
    displayEl: null,
    startBtn: null,
    stopBtn: null,
    resetBtn: null,

    /**
     * Initialize the FocusTimer module.
     * Binds to existing DOM elements and sets up event listeners.
     * @param {HTMLElement} containerEl - The #focus-timer section element
     */
    init(containerEl) {
      this.displayEl = containerEl.querySelector('#timer-display');
      this.startBtn = containerEl.querySelector('#timer-start');
      this.stopBtn = containerEl.querySelector('#timer-stop');
      this.resetBtn = containerEl.querySelector('#timer-reset');

      // Set initial display
      this.displayEl.textContent = this.formatTime(this.DURATION);

      // Bind button events
      this.startBtn.addEventListener('click', () => this.start());
      this.stopBtn.addEventListener('click', () => this.stop());
      this.resetBtn.addEventListener('click', () => this.reset());

      // Handle visibility change for drift correction when tab is inactive
      document.addEventListener('visibilitychange', () => this._onVisibilityChange());

      // Set initial button states
      this._updateButtons();
    },

    /**
     * Format total seconds into a zero-padded MM:SS string.
     * @param {number} totalSeconds - Seconds to format (0-5999)
     * @returns {string} Formatted time string (e.g., "25:00")
     */
    formatTime(totalSeconds) {
      var minutes = Math.floor(totalSeconds / 60);
      var seconds = totalSeconds % 60;
      var mm = minutes < 10 ? '0' + minutes : '' + minutes;
      var ss = seconds < 10 ? '0' + seconds : '' + seconds;
      return mm + ':' + ss;
    },

    /**
     * Start or resume the countdown timer.
     * Transitions: idle → running, paused → running
     */
    start() {
      if (this.state === 'running' || this.state === 'completed') {
        return;
      }

      this.state = 'running';
      this.lastTickTime = Date.now();
      this._updateButtons();

      // Remove completion indicator if restarting
      if (this.displayEl.classList.contains('timer-completed')) {
        this.displayEl.classList.remove('timer-completed');
      }

      this.intervalId = setInterval(() => this.tick(), 1000);
    },

    /**
     * Pause the countdown timer.
     * Transition: running → paused
     */
    stop() {
      if (this.state !== 'running') {
        return;
      }

      this.state = 'paused';
      clearInterval(this.intervalId);
      this.intervalId = null;
      this._updateButtons();
    },

    /**
     * Reset the timer to its initial 25:00 state.
     * Transition: any → idle
     */
    reset() {
      if (this.state === 'idle') {
        return;
      }

      clearInterval(this.intervalId);
      this.intervalId = null;
      this.state = 'idle';
      this.remainingMs = this.DURATION * 1000;
      this.lastTickTime = 0;

      // Update display
      this.displayEl.textContent = this.formatTime(this.DURATION);
      this.displayEl.classList.remove('timer-completed');
      this._updateButtons();
    },

    /**
     * Called each second by setInterval. Uses drift correction by comparing
     * actual elapsed time via Date.now() against expected elapsed time.
     */
    tick() {
      var now = Date.now();
      var elapsed = now - this.lastTickTime;
      this.lastTickTime = now;

      this.remainingMs -= elapsed;

      if (this.remainingMs <= 0) {
        this.remainingMs = 0;
        this.onComplete();
        return;
      }

      // Convert remaining ms to whole seconds for display
      var remainingSeconds = Math.round(this.remainingMs / 1000);
      this.displayEl.textContent = this.formatTime(remainingSeconds);
    },

    /**
     * Handle timer reaching 00:00.
     * Transitions to completed state and applies visual indicator.
     */
    onComplete() {
      clearInterval(this.intervalId);
      this.intervalId = null;
      this.state = 'completed';
      this.remainingMs = 0;

      this.displayEl.textContent = this.formatTime(0);
      this.displayEl.classList.add('timer-completed');
      this._updateButtons();
    },

    /**
     * Handle visibility change event. When the tab becomes visible again,
     * recalculate remaining time based on actual elapsed time to correct
     * for any drift that occurred while the tab was inactive.
     * @private
     */
    _onVisibilityChange() {
      if (document.visibilityState === 'visible' && this.state === 'running') {
        var now = Date.now();
        var elapsed = now - this.lastTickTime;
        this.lastTickTime = now;
        this.remainingMs -= elapsed;

        if (this.remainingMs <= 0) {
          this.remainingMs = 0;
          this.onComplete();
        } else {
          var remainingSeconds = Math.round(this.remainingMs / 1000);
          this.displayEl.textContent = this.formatTime(remainingSeconds);
        }
      }
    },

    /**
     * Update button enabled/disabled states based on current timer state.
     * Follows the state matrix defined in the design document.
     * @private
     */
    _updateButtons() {
      switch (this.state) {
        case 'idle':
          this.startBtn.disabled = false;
          this.stopBtn.disabled = true;
          this.resetBtn.disabled = true;
          break;
        case 'running':
          this.startBtn.disabled = true;
          this.stopBtn.disabled = false;
          this.resetBtn.disabled = false;
          break;
        case 'paused':
          this.startBtn.disabled = false;
          this.stopBtn.disabled = true;
          this.resetBtn.disabled = false;
          break;
        case 'completed':
          this.startBtn.disabled = true;
          this.stopBtn.disabled = true;
          this.resetBtn.disabled = false;
          break;
      }
    }
  };

  // =========================================================================
  // TASK MANAGER
  // =========================================================================

  /**
   * TaskManager - CRUD to-do list with Local Storage persistence.
   * Provides add, render, and persistence functionality.
   */
  const TaskManager = {
    tasks: [],
    _containerEl: null,
    _formEl: null,
    _inputEl: null,
    _errorEl: null,
    _listEl: null,

    /**
     * Initialize the TaskManager module.
     * Loads existing tasks from StorageManager, binds DOM elements, and renders.
     * @param {HTMLElement} containerEl - The #task-manager section element
     */
    init(containerEl) {
      this._containerEl = containerEl;
      this._formEl = containerEl.querySelector('#task-form');
      this._inputEl = containerEl.querySelector('#task-input');
      this._errorEl = containerEl.querySelector('#task-error');
      this._listEl = containerEl.querySelector('#task-list');

      // Load tasks from Local Storage
      var stored = StorageManager.get(StorageManager.KEYS.TASKS);
      if (stored === null) {
        this.tasks = [];
        StorageManager.set(StorageManager.KEYS.TASKS, []);
      } else {
        this.tasks = stored;
      }

      // Render existing tasks
      this.renderAll();

      // Bind form submission
      this._formEl.addEventListener('submit', (e) => {
        e.preventDefault();
        var text = this._inputEl.value;
        this.addTask(text);
      });

      // Clear error on input
      this._inputEl.addEventListener('input', () => {
        this._clearError();
      });

      // Event delegation for click on checkbox (toggle) and delete button
      this._listEl.addEventListener('click', (e) => {
        var target = e.target;

        if (target.classList.contains('task-checkbox')) {
          var li = target.closest('[data-task-id]');
          if (li) {
            this.toggleComplete(li.getAttribute('data-task-id'));
          }
        } else if (target.classList.contains('task-delete')) {
          var li = target.closest('[data-task-id]');
          if (li) {
            this.deleteTask(li.getAttribute('data-task-id'));
          }
        }
      });

      // Event delegation for double-click to edit task text
      this._listEl.addEventListener('dblclick', (e) => {
        var textSpan = e.target.closest('.task-text');
        if (!textSpan) {
          return;
        }
        var taskEl = textSpan.closest('li[data-task-id]');
        if (!taskEl) {
          return;
        }
        var taskId = taskEl.getAttribute('data-task-id');
        var task = this.tasks.find(function (t) { return t.id === taskId; });
        if (task) {
          this.startEditing(taskEl, task);
        }
      });
    },

    /**
     * Validate task text for adding or editing.
     * @param {string} text - The raw task text to validate
     * @returns {{valid: boolean, error: string|null}} Validation result
     */
    validateTaskText(text) {
      // Check empty or whitespace-only
      if (!text || text.trim().length === 0) {
        return { valid: false, error: null }; // Silent rejection per requirement 4.3
      }
      // Check length exceeds 256 characters
      if (text.length > 256) {
        return { valid: false, error: 'Task must be 256 characters or fewer' };
      }
      return { valid: true, error: null };
    },

    /**
     * Check if a task with the given text already exists in the task list.
     * Comparison is trimmed and case-insensitive.
     * Checks against both completed and incomplete tasks.
     * @param {string} text - The task text to check
     * @param {string|null} excludeId - Task ID to exclude (for edit operations)
     * @returns {boolean} true if a duplicate exists
     */
    isDuplicate(text, excludeId) {
      var normalizedNew = text.trim().toLowerCase();
      if (normalizedNew.length === 0) return false;
      for (var i = 0; i < this.tasks.length; i++) {
        if (excludeId && this.tasks[i].id === excludeId) continue;
        if (this.tasks[i].text.trim().toLowerCase() === normalizedNew) {
          return true;
        }
      }
      return false;
    },

    /**
     * Add a new task to the list after validation.
     * Generates a unique ID, appends to the task list, persists to storage,
     * clears the input field, and renders the new task.
     * @param {string} text - The raw task text from the input field
     * @returns {boolean} true if task was added successfully, false otherwise
     */
    addTask(text) {
      var validation = this.validateTaskText(text);

      if (!validation.valid) {
        if (validation.error) {
          this._showError(validation.error);
        }
        return false;
      }

      // Duplicate check
      if (this.isDuplicate(text, null)) {
        this._showError('This task already exists');
        return false;
      }

      // Clear any previous error
      this._clearError();

      // Create task object
      var task = {
        id: 'task_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7),
        text: text.trim(),
        completed: false,
        createdAt: Date.now()
      };

      // Add to in-memory array
      this.tasks.push(task);

      // Persist to Local Storage
      StorageManager.set(StorageManager.KEYS.TASKS, this.tasks);

      // Render the new task in the DOM
      var taskEl = this.renderTask(task);
      this._listEl.appendChild(taskEl);

      // Clear input field
      this._inputEl.value = '';

      return true;
    },

    /**
     * Create a DOM element for a single task.
     * Creates an <li> with checkbox, text span, and delete button.
     * @param {Object} task - The task object {id, text, completed, createdAt}
     * @returns {HTMLLIElement} The constructed list item element
     */
    renderTask(task) {
      var li = document.createElement('li');
      li.setAttribute('data-task-id', task.id);
      if (task.completed) {
        li.classList.add('task-completed');
      }

      // Checkbox
      var checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.checked = task.completed;
      checkbox.className = 'task-checkbox';
      checkbox.setAttribute('aria-label', 'Mark "' + task.text + '" as ' + (task.completed ? 'incomplete' : 'complete'));

      // Text span
      var textSpan = document.createElement('span');
      textSpan.className = 'task-text';
      textSpan.textContent = task.text;

      // Delete button
      var deleteBtn = document.createElement('button');
      deleteBtn.type = 'button';
      deleteBtn.className = 'task-delete';
      deleteBtn.textContent = 'Delete';
      deleteBtn.setAttribute('aria-label', 'Delete task "' + task.text + '"');

      li.appendChild(checkbox);
      li.appendChild(textSpan);
      li.appendChild(deleteBtn);

      return li;
    },

    /**
     * Render all tasks from the in-memory array.
     * Clears the existing list and re-renders each task.
     */
    renderAll() {
      this._listEl.innerHTML = '';
      for (var i = 0; i < this.tasks.length; i++) {
        var taskEl = this.renderTask(this.tasks[i]);
        this._listEl.appendChild(taskEl);
      }
    },

    /**
     * Display an inline error message.
     * @private
     * @param {string} message - The error message to display
     */
    _showError(message) {
      if (this._errorEl) {
        this._errorEl.textContent = message;
      }
    },

    /**
     * Clear the inline error message.
     * @private
     */
    _clearError() {
      if (this._errorEl) {
        this._errorEl.textContent = '';
      }
    },

    /**
     * Enter inline edit mode for a task.
     * Replaces the text span with an input field pre-filled with the current task text.
     * @param {HTMLLIElement} taskEl - The task's <li> DOM element
     * @param {Object} task - The task data object {id, text, completed, createdAt}
     */
    startEditing(taskEl, task) {
      // Prevent multiple edit inputs on the same task
      if (taskEl.querySelector('.task-edit-input')) {
        return;
      }

      var textSpan = taskEl.querySelector('.task-text');
      if (!textSpan) {
        return;
      }

      // Clear any previous duplicate error when starting a new edit
      this._clearError();

      // Create input field pre-filled with current text
      var input = document.createElement('input');
      input.type = 'text';
      input.className = 'task-edit-input';
      input.value = task.text;
      input.setAttribute('aria-label', 'Edit task text');

      // Replace text span with input
      textSpan.style.display = 'none';
      taskEl.insertBefore(input, textSpan.nextSibling);

      // Focus the input and select all text
      input.focus();
      input.select();

      // Flag to prevent double-commit from blur firing after Enter
      var committed = false;

      // Clear error when user modifies inline edit input (Req 3.7)
      input.addEventListener('input', () => {
        this._clearError();
      });

      // Handle Enter key to commit edit
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          if (!committed) {
            committed = true;
            this.commitEdit(task.id, input.value, taskEl, textSpan, input);
          }
        } else if (e.key === 'Escape') {
          // Discard changes and revert to original text
          committed = true;
          input.remove();
          textSpan.style.display = '';
        }
      });

      // Handle blur (focus loss) to commit edit
      input.addEventListener('blur', () => {
        if (!committed) {
          committed = true;
          this.commitEdit(task.id, input.value, taskEl, textSpan, input);
        }
      });
    },

    /**
     * Commit an edit to a task. Validates new text: if valid, updates the task;
     * if invalid (empty/whitespace), retains the original text.
     * @param {string} taskId - The ID of the task being edited
     * @param {string} newText - The new text from the edit input
     * @param {HTMLLIElement} taskEl - The task's <li> DOM element
     * @param {HTMLElement} textSpan - The original text span element
     * @param {HTMLInputElement} inputEl - The edit input element to remove
     */
    commitEdit(taskId, newText, taskEl, textSpan, inputEl) {
      // Remove the input element
      inputEl.remove();
      textSpan.style.display = '';

      // Validate the new text
      var validation = this.validateTaskText(newText);

      if (validation.valid) {
        // Duplicate check for edits (exclude current task from comparison)
        if (this.isDuplicate(newText, taskId)) {
          this._showError('This task already exists');
          return;
        }
        // Update the task in memory
        this.editTask(taskId, newText.trim());
        // Update the DOM
        textSpan.textContent = newText.trim();
      }
      // If invalid (empty/whitespace/too long), retain original text — no change needed
    },

    /**
     * Update a task's text in the in-memory array and persist to Local Storage.
     * @param {string} taskId - The ID of the task to update
     * @param {string} newText - The new trimmed task text
     */
    editTask(taskId, newText) {
      for (var i = 0; i < this.tasks.length; i++) {
        if (this.tasks[i].id === taskId) {
          this.tasks[i].text = newText;
          break;
        }
      }
      // Persist updated tasks to Local Storage
      StorageManager.set(StorageManager.KEYS.TASKS, this.tasks);
    },

    /**
     * Toggle a task's completion state.
     * Flips the completed boolean, updates the DOM (class and checkbox), and persists.
     * @param {string} taskId - The ID of the task to toggle
     */
    toggleComplete(taskId) {
      var task = null;
      for (var i = 0; i < this.tasks.length; i++) {
        if (this.tasks[i].id === taskId) {
          task = this.tasks[i];
          break;
        }
      }
      if (!task) {
        return;
      }

      // Toggle the completed state
      task.completed = !task.completed;

      // Update the DOM
      var li = this._listEl.querySelector('[data-task-id="' + taskId + '"]');
      if (li) {
        if (task.completed) {
          li.classList.add('task-completed');
        } else {
          li.classList.remove('task-completed');
        }

        // Update checkbox state
        var checkbox = li.querySelector('.task-checkbox');
        if (checkbox) {
          checkbox.checked = task.completed;
          checkbox.setAttribute('aria-label', 'Mark "' + task.text + '" as ' + (task.completed ? 'incomplete' : 'complete'));
        }
      }

      // Persist to Local Storage
      StorageManager.set(StorageManager.KEYS.TASKS, this.tasks);
    },

    /**
     * Delete a task from the list.
     * Removes from the in-memory array, the DOM, and persists the change.
     * @param {string} taskId - The ID of the task to delete
     */
    deleteTask(taskId) {
      // Remove from in-memory array
      this.tasks = this.tasks.filter(function (t) {
        return t.id !== taskId;
      });

      // Remove from the DOM
      var li = this._listEl.querySelector('[data-task-id="' + taskId + '"]');
      if (li) {
        this._listEl.removeChild(li);
      }

      // Persist to Local Storage
      StorageManager.set(StorageManager.KEYS.TASKS, this.tasks);
    }
  };

  // =========================================================================
  // QUICK LINKS
  // =========================================================================

  /**
   * QuickLinks - Bookmarked URL buttons with Local Storage persistence.
   * Manages a list of up to 20 quick-access links that open in new tabs.
   */
  const QuickLinks = {
    MAX_LINKS: 20,
    links: [],
    _formEl: null,
    _urlInput: null,
    _labelInput: null,
    _urlError: null,
    _labelError: null,
    _limitError: null,
    _listEl: null,

    /**
     * Initialize the QuickLinks module.
     * Loads links from LocalStorage, renders them, and sets up form listeners.
     * @param {HTMLElement} containerEl - The #quick-links section element
     */
    init(containerEl) {
      this._formEl = containerEl.querySelector('#link-form');
      this._urlInput = containerEl.querySelector('#link-url-input');
      this._labelInput = containerEl.querySelector('#link-label-input');
      this._urlError = containerEl.querySelector('#link-url-error');
      this._labelError = containerEl.querySelector('#link-label-error');
      this._limitError = containerEl.querySelector('#link-limit-error');
      this._listEl = containerEl.querySelector('#link-list');

      // Load links from storage
      var stored = StorageManager.get(StorageManager.KEYS.LINKS);
      this.links = Array.isArray(stored) ? stored : [];

      // Render existing links
      this.renderAll();

      // Bind form submission
      this._formEl.addEventListener('submit', (e) => {
        e.preventDefault();
        this._clearErrors();
        var url = this._urlInput.value;
        var label = this._labelInput.value;
        this.addLink(url, label);
      });

      // Clear errors on input
      this._urlInput.addEventListener('input', () => {
        this._urlError.textContent = '';
      });
      this._labelInput.addEventListener('input', () => {
        this._labelError.textContent = '';
      });
    },

    /**
     * Validate a link's URL and label.
     * @param {string} url - The URL to validate
     * @param {string} label - The label to validate
     * @returns {{valid: boolean, errors: string[]}} Validation result with error messages
     */
    validateLink(url, label) {
      var errors = [];

      // URL validation
      if (!url || (!url.startsWith('http://') && !url.startsWith('https://'))) {
        errors.push('URL must start with http:// or https://');
      } else if (url.length > 2048) {
        errors.push('URL must be 2048 characters or fewer');
      }

      // Label validation (trim before checking)
      var trimmedLabel = (label || '').trim();
      if (trimmedLabel.length === 0) {
        errors.push('Label is required');
      } else if (trimmedLabel.length > 50) {
        errors.push('Label must be 50 characters or fewer');
      }

      return {
        valid: errors.length === 0,
        errors: errors
      };
    },

    /**
     * Add a new quick link after validation.
     * @param {string} url - The URL for the link
     * @param {string} label - The display label for the link
     * @returns {boolean} true if link was added successfully
     */
    addLink(url, label) {
      // Check max links limit first
      if (this.links.length >= this.MAX_LINKS) {
        this._limitError.textContent = 'Maximum of 20 quick links reached';
        return false;
      }

      // Validate input
      var validation = this.validateLink(url, label);
      if (!validation.valid) {
        this._showValidationErrors(validation.errors);
        return false;
      }

      // Create the link object
      var link = {
        id: 'link_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7),
        url: url,
        label: (label || '').trim(),
        createdAt: Date.now()
      };

      // Add to list
      this.links.push(link);

      // Persist to Local Storage
      StorageManager.set(StorageManager.KEYS.LINKS, this.links);

      // Render the new link
      this.renderLink(link);

      // Clear input fields
      this._urlInput.value = '';
      this._labelInput.value = '';

      return true;
    },

    /**
     * Delete a link by its ID.
     * Removes from the in-memory array, the DOM, and Local Storage.
     * @param {string} linkId - The ID of the link to delete
     */
    deleteLink(linkId) {
      // Remove from array
      this.links = this.links.filter(function (link) {
        return link.id !== linkId;
      });

      // Remove from DOM
      var linkEl = this._listEl.querySelector('[data-link-id="' + linkId + '"]');
      if (linkEl) {
        this._listEl.removeChild(linkEl);
      }

      // Persist to Local Storage
      StorageManager.set(StorageManager.KEYS.LINKS, this.links);
    },

    /**
     * Render a single link as a clickable button in the list.
     * Creates a div[role="listitem"] containing an anchor and delete button.
     * @param {object} link - The link object to render
     * @returns {HTMLElement} The created wrapper element
     */
    renderLink(link) {
      var wrapper = document.createElement('div');
      wrapper.className = 'quick-link-item';
      wrapper.setAttribute('role', 'listitem');
      wrapper.setAttribute('data-link-id', link.id);

      // Create the clickable link/button
      var anchor = document.createElement('a');
      anchor.className = 'quick-link-btn';
      anchor.href = link.url;
      anchor.target = '_blank';
      anchor.rel = 'noopener noreferrer';
      anchor.textContent = link.label;
      anchor.setAttribute('aria-label', 'Open ' + link.label + ' in new tab');

      // Create delete button
      var deleteBtn = document.createElement('button');
      deleteBtn.className = 'link-delete';
      deleteBtn.type = 'button';
      deleteBtn.textContent = '\u00D7';
      deleteBtn.setAttribute('aria-label', 'Delete link ' + link.label);
      deleteBtn.addEventListener('click', () => {
        this.deleteLink(link.id);
      });

      wrapper.appendChild(anchor);
      wrapper.appendChild(deleteBtn);
      this._listEl.appendChild(wrapper);

      return wrapper;
    },

    /**
     * Render all links from the in-memory array.
     * Clears the list container and re-renders each link.
     */
    renderAll() {
      this._listEl.innerHTML = '';
      for (var i = 0; i < this.links.length; i++) {
        this.renderLink(this.links[i]);
      }
    },

    /**
     * Show validation error messages in the appropriate error elements.
     * @private
     * @param {string[]} errors - Array of error messages
     */
    _showValidationErrors(errors) {
      for (var i = 0; i < errors.length; i++) {
        var error = errors[i];
        if (error.indexOf('URL') !== -1) {
          this._urlError.textContent = error;
        } else if (error.indexOf('Label') !== -1 || error === 'Label is required') {
          this._labelError.textContent = error;
        }
      }
    },

    /**
     * Clear all error messages.
     * @private
     */
    _clearErrors() {
      this._urlError.textContent = '';
      this._labelError.textContent = '';
      this._limitError.textContent = '';
    }
  };

  // =========================================================================
  // APP INITIALIZATION
  // =========================================================================

  /**
   * App - Main application entry point. Initializes all modules.
   */
  const App = {
    StorageManager: StorageManager,
    ThemeManager: ThemeManager,
    GreetingPanel: GreetingPanel,
    FocusTimer: FocusTimer,
    TaskManager: TaskManager,
    QuickLinks: QuickLinks,

    /**
     * Initialize the application. Called on DOMContentLoaded.
     * Detects localStorage availability and initializes each module
     * with its container element.
     */
    init() {
      // Check localStorage availability
      if (!this._isStorageAvailable()) {
        StorageManager._showStorageWarning();
      }

      // Initialize each module with its container element
      var greetingEl = document.getElementById('greeting-panel');
      var timerEl = document.getElementById('focus-timer');
      var taskEl = document.getElementById('task-manager');
      var linksEl = document.getElementById('quick-links');
      var themeToggleBtn = document.getElementById('theme-toggle');

      if (greetingEl) GreetingPanel.init(greetingEl);
      if (themeToggleBtn) ThemeManager.init(themeToggleBtn);
      if (timerEl) FocusTimer.init(timerEl);
      if (taskEl) TaskManager.init(taskEl);
      if (linksEl) QuickLinks.init(linksEl);
    },

    /**
     * Test if localStorage is available and functional.
     * @private
     * @returns {boolean} true if localStorage works
     */
    _isStorageAvailable() {
      try {
        var testKey = '__storage_test__';
        localStorage.setItem(testKey, '1');
        localStorage.removeItem(testKey);
        return true;
      } catch (e) {
        return false;
      }
    }
  };

  // Expose App to global scope for testing and debugging
  window.App = App;

  // Wire initialization to DOMContentLoaded
  document.addEventListener('DOMContentLoaded', function () {
    App.init();
  });
})();
