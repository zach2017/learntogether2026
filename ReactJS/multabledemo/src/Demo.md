Of course\! Here is the complete documentation for the `DemoComponent` and all of its sub-components.

I've broken it down by component, following the Atomic Design structure you've implemented. For each component, I'll explain its purpose, the React features it uses (and why), its props, and relevant styling.

-----

## Component Documentation

This application is structured using **Atomic Design principles**, which breaks the UI down into a hierarchy of reusable components:

  * **Atoms:** The smallest, indivisible UI elements (e.g., a button, a text label).
  * **Molecules:** Simple groups of atoms that form a functional unit (e.g., a search input with a button).
  * **Organisms:** Complex UI components composed of molecules and atoms that form a distinct section of an interface (e.g., the main data table).
  * **Templates/Pages:** The final layout that arranges organisms into a complete page (`DemoComponent`).

### Core React Features & Hooks Used

Before diving into the components, here's an overview of the key React hooks used throughout the application and the rationale for their use.

  * **`useState`**

      * **What it does:** Manages simple, local state within a single component.
      * **Why it's used:** It's perfect for managing UI-specific state that doesn't need to be shared, such as a button's hover effect, whether a popup is open, or the current value of a filter input. It's lightweight and ensures that only the component that needs to change will re-render.

  * **`useEffect`**

      * **What it does:** Performs "side effects" in function components. This includes things like fetching data, setting up subscriptions, or manually changing the DOM.
      * **Why it's used:**
          * In `useWindowSize`, it's used to safely add and **remove** an event listener on the `window` object. The cleanup function (the `return` statement) is crucial to prevent memory leaks.
          * In `DemoComponent`, it's used to simulate a WebSocket connection when the component first mounts.

  * **`useMemo`**

      * **What it does:** Memoizes a computed value. It re-runs a function and re-calculates the value *only* when one of its dependencies changes.
      * **Why it's used:** This is a critical performance optimization in `TableOrganism`. The `processedData` (which involves filtering, searching, and sorting) can be computationally expensive. `useMemo` ensures this complex logic only runs when the source `data`, `filters`, `sortConfig`, or `globalFilter` actually change, not on every single re-render.

  * **`useSyncExternalStore`**

      * **What it does:** Allows a component to subscribe to an external data store (a state management system outside of React's own state). It ensures the UI stays in sync with the external data and prevents visual tearing.
      * **Why it's used:** This is the heart of the application's state management. Instead of passing data and update functions down through many layers of props (prop drilling), we create a simple external store. Any component can now use the `useDemoStore` hook to read the latest data and automatically re-render when that data changes. It's a modern, efficient way to handle shared state without pulling in a large library.

-----

### Atoms (Basic Building Blocks)

#### 1\. `TextAtom`

  * **Description:** Renders a simple text `<span>`. It can optionally be made clickable with hover effects.
  * **React Features Used:**
      * `useState`: To track the `hover` state, allowing for dynamic style changes (e.g., adding an underline) on mouse-over for better UX.
  * **Props:**
      * `value: string`: The text to display.
      * `onClick?: () => void`: Optional function to call when clicked.
      * `clickable?: boolean`: If true, applies clickable styles and hover effects.
  * **Styling Example:**
    ```javascript
    // Base style
    text: {
      fontSize: '14px',
      color: '#333',
    },
    // Applied when clickable={true}
    clickableText: {
      cursor: 'pointer',
      color: '#1976d2',
    },
    ```

#### 2\. `NumberAtom`, `DateAtom`, `CalculatedAtom`

  * **Description:** These are simple, stateless components for displaying formatted data.
      * `NumberAtom`: Displays a number, often with locale-specific formatting.
      * `DateAtom`: Formats a date string or object into a readable format.
      * `CalculatedAtom`: Displays a value, typically with a decorative icon.
  * **React Features Used:** None. These are presentational components that just render props.
  * **Props (`NumberAtom`):**
      * `value: number`: The number to display.
      * `format?: (n: number) => string`: An optional function for custom formatting (e.g., adding a currency symbol).

#### 3\. `ButtonAtom`

  * **Description:** Renders a styled, clickable button with different visual variants.
  * **React Features Used:**
      * `useState`: Manages the `hover` state to provide visual feedback (opacity change, slight lift) when the user hovers over the button.
  * **Props:**
      * `label: string`: The text inside the button.
      * `onClick: () => void`: The function to execute on click.
      * `variant?: 'primary' | 'secondary' | 'danger'`: The button's color scheme. Defaults to `primary`.

#### 4\. `HeaderAtom`

  * **Description:** A stateless component for displaying a column header with different heading levels and an optional icon.
  * **React Features Used:** None.
  * **Props:**
      * `title: string`: The header text.
      * `type: HeadingType`: An enum (`'primary'`, `'secondary'`, `'tertiary'`) that determines the font size and weight.
      * `icon?: string`: An optional emoji/icon to display.

-----

### Molecules (Functional Units)

#### 1\. `CellMolecule`

  * **Description:** A "smart cell" that acts as a wrapper for the different atom types. It determines which atom to render based on the `columnType` and attaches functionality like popups and tooltips.
  * **React Features Used:**
      * `useState`: To manage the visibility of the `popupOpen` and `showTooltip` states. This state is local to each cell.
  * **Props:**
      * `value: any`: The data value for the cell.
      * `columnType: ColumnType`: The type of data, used to select the correct atom.
      * `columnConfig: ColumnConfig`: The full configuration object for the column, which contains info about popups, clickability, etc.
      * `row: any`: The entire data object for the row, which is passed to click handlers and popups.

#### 2\. `PopupMolecule`

  * **Description:** Renders a modal/popup dialog over a semi-transparent overlay.
  * **React Features Used:** None. It's a presentational component whose visibility is controlled by its parent (`CellMolecule`).
  * **Props:**
      * `config: PopupConfig`: The configuration object defining the title, content, and actions for the popup.
      * `row: any`: The data for the current row, passed to the content and action functions.
      * `onClose: () => void`: A function to call to close the popup.

#### 3\. `RowActionsMolecule`

  * **Description:** Displays a set of icon buttons (View, Edit, Delete) for performing actions on an entire row.
  * **React Features Used:** None. It simply receives and calls the handler functions passed via props.

#### 4\. `MobileCardMolecule`

  * **Description:** A new component designed specifically for the mobile view. It renders a single row of data in a readable, vertical card format.
  * **React Features Used:** None. It's a presentational component that arranges data.
  * **Styling Example:**
    ```javascript
    mobileCard: {
      backgroundColor: 'white',
      borderRadius: '8px',
      padding: '16px',
      marginBottom: '12px',
      boxShadow: '0 2px 4px rgba(0,0,0,0.08)',
      borderLeft: '4px solid #1976d2', // Accent color
    },
    mobileCardRow: {
      display: 'flex',
      justifyContent: 'space-between',
      padding: '8px 0',
      borderBottom: '1px solid #f0f0f0',
    },
    ```

-----

### Organisms (Major UI Sections)

#### 1\. `TableOrganism`

  * **Description:** The main data-handling component. It is responsible for rendering the entire interactive table, including headers, filters, and data rows. It is also **responsive**, conditionally rendering either a traditional table or a list of mobile cards.
  * **React Features Used:**
      * `useState`: To manage the `filters` object, the `sortConfig`, and the `globalFilter` string.
      * `useMemo`: To efficiently calculate `processedData`. This is a crucial performance optimization that prevents re-filtering and re-sorting the entire dataset on every render.
      * **Custom Hook (`useWindowSize`)**: To get the current window width and determine if the mobile view (`isMobile`) should be rendered.
  * **Conditional Rendering:** The component's return statement uses a ternary operator to switch between the desktop and mobile views:
    ```jsx
    {isMobile ? (
      <MobileCardListOrganism ... />
    ) : (
      <div style={styles.tableContainer}>
        <table ... >...</table>
      </div>
    )}
    ```

#### 2\. `MobileCardListOrganism`

  * **Description:** A simple organism that maps over the data and renders a `MobileCardMolecule` for each item. It serves as the container for the mobile view.
  * **React Features Used:** None.

-----

### Helpers & State Management

#### 1\. `useWindowSize` (Custom Hook)

  * **Description:** A reusable custom hook that reports the current width and height of the browser window.
  * **React Features Used:**
      * `useState`: To store the `[width, height]` of the window.
      * `useEffect`: To add a `resize` event listener when the hook is first used and, critically, to return a cleanup function that removes the listener when the component unmounts. This prevents memory leaks.

#### 2\. The `useSyncExternalStore` Store

  * **Description:** A lightweight, "vanilla" state management solution created to hold the employee data. It exists outside of the React component tree.
      * `demoState`, `listeners`, `emit`: The core store. `demoState` holds the data, `listeners` is a `Set` of all subscribed components' update functions, and `emit` notifies all of them of a change.
      * `subscribe`, `getSnapshot`: These are the two functions required by `useSyncExternalStore`. `subscribe` tells React how to listen for changes, and `getSnapshot` tells React how to get the current data value.
      * `setEmployees`: The "action" function used to update the state. It takes an updater function, modifies the state, and calls `emit()` to trigger UI updates.
      * `useDemoStore` (Custom Hook): The hook that components actually use. It abstracts away the `useSyncExternalStore` logic, making it easy for any component to access the shared state.
  * **Usage Example:**
    ```jsx
    // Any component can get the latest data without props
    const data = useDemoStore(s => s.employees);

    // Any component can update the data
    setEmployees(list => list.filter(d => d.id !== row.id));
    ```

-----

### Page (`DemoComponent`)

  * **Description:** The top-level component that assembles all the organisms and molecules into a full page. It fetches the initial data, defines the master event handlers, and provides the overall layout.
  * **React Features Used:**
      * **Custom Hook (`useDemoStore`)**: Subscribes to the external store to get the `data` to pass into the `TableOrganism`.
      * `useEffect`: Simulates a WebSocket connection on component mount. In a real application, this is where you would initialize connections to external data sources.
  * **Responsibilities:**
      * **Data Hydration:** Provides the initial `jsonData`.
      * **Handler Definition:** Creates the `handleCellClick`, `handleRowEdit`, etc., functions that perform state updates via `setEmployees`.
      * **Layout:** Renders the main page structure, including the title card, the `TableOrganism`, and the features list.
      * **Prop Delegation:** Passes the necessary data and handlers down to the `TableOrganism`.