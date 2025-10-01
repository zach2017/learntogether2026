Of course\! Let's build this powerful, responsive table component from scratch.

This tutorial is designed for a new developer who is comfortable with basic JavaScript. We'll go step-by-step, explaining each new React concept as we introduce it. By the end, you'll not only have a great component but also a solid understanding of modern React development patterns.

### **Our Goal: The Finished Product**

We will build a data table that:

  * Is built with reusable components.
  * Is interactive, with sorting and filtering.
  * Is fully responsive, changing to a "card" view on mobile devices.
  * Uses modern, efficient state management so our app is fast and easy to maintain.

### **Prerequisites**

  * **Node.js and npm:** You need these to run a React development environment. You can get them at [nodejs.org](https://nodejs.org/).
  * **A Code Editor:** Visual Studio Code is a great free option.
  * **Basic JavaScript knowledge:** You should understand variables, functions, arrays, and objects.

-----

### **Step 0: Setting Up Your React Project**

First, we need a blank canvas. Open your terminal or command prompt and run this command:

```bash
npx create-react-app atomic-table-tutorial
```

This creates a new folder with a ready-to-go React project. Navigate into it:

```bash
cd atomic-table-tutorial
```

For this tutorial, we'll put all our code into a single file to keep things simple. Open the `src/` folder and create a new file named `ResponsiveTable.tsx`. We'll write all our code here and import it into `App.tsx`.

-----

### **Step 1: Thinking in Atoms ⚛️ (Our Smallest Building Blocks)**

A powerful way to build UIs is called **Atomic Design**. The idea is to start with the smallest possible pieces, which we call "Atoms." An atom is just one thing, like a label, an input, or a button.

#### **The `TextAtom`**

This is the simplest possible component. It just displays text.

**The Concept: What are `props`?**
Components are like JavaScript functions. They can accept inputs, which we call `props` (short for properties). This is how we pass data to them to make them reusable.

```typescript
// In ResponsiveTable.tsx

import React, { useState } from 'react'; // We need to import React!

// The 'React.FC' part tells TypeScript this is a React Function Component.
// We define our props in an object type.
export const TextAtom: React.FC<{ value: string }> = ({ value }) => {
  return (
    <span>{value}</span>
  );
};
```

#### **The `ButtonAtom`**

Now for something interactive. This atom will be a button that can be clicked.

**The Concept: What is `useState`?**
React components need a way to remember things, like whether a button is being hovered over. `useState` is a **React Hook** that gives our component its own memory.

  * It returns an array with two things: `[the_current_value, a_function_to_update_it]`.
  * When you call the update function, React "re-renders" the component with the new value.

> **Learn More:** [React Docs: `useState` Hook](https://www.google.com/search?q=%5Bhttps://react.dev/reference/react/useState%5D\(https://react.dev/reference/react/useState\))

```typescript
// In ResponsiveTable.tsx...

export const ButtonAtom: React.FC<{
  label: string;
  onClick: () => void; // A function prop!
}> = ({ label, onClick }) => {
  // 1. Call useState to get our state variable and its setter
  const [isHovered, setIsHovered] = useState(false);

  // 2. Define some basic styles
  const style = {
    padding: '8px 16px',
    borderRadius: '4px',
    cursor: 'pointer',
    backgroundColor: isHovered ? '#e0e0e0' : '#f0f0f0', // Style changes on hover!
    border: '1px solid #ccc',
  };

  return (
    <button
      style={style}
      onClick={onClick} // We pass the function prop to the button's onClick
      onMouseEnter={() => setIsHovered(true)} // Use the setter function
      onMouseLeave={() => setIsHovered(false)} // Use the setter again
    >
      {label}
    </button>
  );
};
```

-----

### **Step 2: Making Molecules 🧪 (Combining Atoms)**

Molecules are small, functional groups of atoms. A single cell in our table is a great example. It needs to be "smart" enough to display text, a number, or even a button.

#### **The `CellMolecule`**

This component will decide which Atom to show based on the type of data it receives.

**The Concept: Conditional Rendering**
This is a fancy term for showing different things based on certain conditions. In React, we can use a simple `switch` statement or an `if/else` block right in our component to decide what to render.

```typescript
// In ResponsiveTable.tsx...

// Let's define the types of columns we can have
export enum ColumnType {
  TEXT = 'text',
  BUTTON = 'button',
}

// We'll also need our TextAtom and ButtonAtom from Step 1.

export const CellMolecule: React.FC<{
  value: any;
  columnType: ColumnType;
  row: any; // We'll need the whole row's data later
}> = ({ value, columnType, row }) => {
  // This is conditional rendering!
  switch (columnType) {
    case ColumnType.TEXT:
      return <TextAtom value={value} />;
    case ColumnType.BUTTON:
      return <ButtonAtom label={value} onClick={() => alert(`Clicked on ${row.name}`)} />;
    default:
      return <TextAtom value={String(value)} />;
  }
};
```

-----

### **Step 3: Building the Organism 🧬 (The Table Structure)**

An organism is a larger, more complex part of the UI. Our entire table, with its headers, rows, and data, is an organism.

#### **The `TableOrganism` (Desktop Version)**

Let's build the desktop version first. It will take in `data` and `columns` as props and render a standard HTML table.

**The Concept: Rendering Lists with `.map()`**
A core task in web development is turning an array of data into a list of elements. In React, we use the standard JavaScript `.map()` method to do this. For each item in our data array, we return a React element (`<tr>`). React requires a unique `key` prop for each item in a list to keep track of it efficiently.

**The Concept: Performance with `useMemo`**
What if our table has thousands of rows? Filtering and sorting that data on every single screen update would be very slow. The `useMemo` hook is our solution. It tells React:

> "Only re-run this expensive calculation if one of its dependencies (like the original data or the filter text) has changed."

This is a huge performance win.

> **Learn More:** [React Docs: `useMemo` Hook](https://www.google.com/search?q=%5Bhttps://react.dev/reference/react/useMemo%5D\(https://react.dev/reference/react/useMemo\))

```typescript
// In ResponsiveTable.tsx...
import React, { useState, useMemo } from 'react'; // Add useMemo

// ... a bunch of code from previous steps ...

// This is our main table component!
export const TableOrganism: React.FC<{
  columns: any[];
  data: any[];
}> = ({ columns, data }) => {
  const [globalFilter, setGlobalFilter] = useState('');

  // 1. useMemo will only re-run this code if 'data' or 'globalFilter' changes.
  const processedData = useMemo(() => {
    if (!globalFilter) {
      return data; // No filter? Return the original data.
    }
    return data.filter(row =>
      // Check every value in the row to see if it includes the filter text
      Object.values(row).some(value =>
        String(value).toLowerCase().includes(globalFilter.toLowerCase())
      )
    );
  }, [data, globalFilter]); // These are the dependencies

  return (
    <div>
      <input
        value={globalFilter}
        onChange={e => setGlobalFilter(e.target.value)}
        placeholder="Search table..."
        style={{ marginBottom: '16px', padding: '8px', width: '300px' }}
      />
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            {/* 2. Map over the columns array to create table headers */}
            {columns.map(col => (
              <th key={col.id} style={{ borderBottom: '2px solid black', padding: '8px', textAlign: 'left' }}>
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {/* 3. Map over our PROCESSED data to create the table rows */}
          {processedData.map((row, index) => (
            <tr key={index}>
              {columns.map(col => (
                <td key={col.id} style={{ borderBottom: '1px solid #ccc', padding: '8px' }}>
                  <CellMolecule
                    value={row[col.accessor]} // Get the specific data for this cell
                    columnType={col.type}
                    row={row}
                  />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
```

-----

### **Step 4: Making it Responsive 📱**

A table with many columns looks terrible on a phone. We need to detect the screen size and switch to a completely different layout—a list of cards.

**The Concept: Custom Hooks**
We need to get the window size. This is logic we might want to use in other components, too. So, we'll create a **custom hook**. A custom hook is just a regular JavaScript function whose name starts with `"use"`. It lets us package up and reuse stateful logic.

**The Concept: `useEffect` for Side Effects**
Our component's main job is to render UI. Interacting with things *outside* of the React world, like a browser API (like `window.addEventListener`), is called a "side effect." The `useEffect` hook is the right place for this.

A critical part of `useEffect` is the **cleanup function**. If we add an event listener, we *must* remove it when our component is no longer on the screen to prevent bugs. `useEffect` lets us return a function that does exactly that.

> **Learn More:** [React Docs: `useEffect` Hook](https://www.google.com/search?q=%5Bhttps://react.dev/reference/react/useEffect%5D\(https://react.dev/reference/react/useEffect\))

#### **The `useWindowSize` Hook**

```typescript
// In ResponsiveTable.tsx...
import React, { useState, useEffect } from 'react'; // Add useEffect

const useWindowSize = () => {
  const [size, setSize] = useState([window.innerWidth, window.innerHeight]);

  useEffect(() => {
    // This function will run when the window is resized
    const handleResize = () => {
      setSize([window.innerWidth, window.innerHeight]);
    };

    // 1. The side effect: add the event listener
    window.addEventListener('resize', handleResize);

    // 2. The cleanup function: remove it when the component is done
    return () => window.removeEventListener('resize', handleResize);
  }, []); // The empty array [] means this effect runs only once

  return { width: size[0], height: size[1] };
};
```

#### **Updating `TableOrganism`**

Now we can use our new hook to conditionally render the table or a new mobile view.

```typescript
// In TableOrganism...

// 1. Call our custom hook
const { width } = useWindowSize();
const isMobile = width <= 768; // 768px is a common breakpoint for tablets

// 2. Wrap the return in a conditional check
if (isMobile) {
    return (
      <div>
        {/* We can build a MobileCardListOrganism here later! */}
        <p>Mobile view coming soon!</p>
        {processedData.map(row => (
          <div key={row.id} style={{ padding: '16px', border: '1px solid #ccc', margin: '8px 0'}}>
            <strong>{row.name}</strong>
          </div>
        ))}
      </div>
    );
}

// 3. The original return statement is now the 'else' case
return (
    <div>
        <input ... />
        <table ... > ... </table>
    </div>
);
```

-----

### **Step 5: Global State Without the Headaches**

Imagine our app grows. A chart component and a header component also need to know about the table data. Passing the data down through props (`data -> App -> Header -> UserBadge`) is called **"prop drilling"** and it's a pain.

We need a central "store" for our data that any component can subscribe to.

**The Concept: `useSyncExternalStore`**
This advanced hook is React's built-in way to connect to an external data source. It's perfect for our needs and avoids pulling in a big state management library. It sounds complex, but it only needs two things from us:

1.  A way to `subscribe` to changes.
2.  A way to get the current data (`getSnapshot`).

> **Learn More:** [React Docs: `useSyncExternalStore` Hook](https://www.google.com/search?q=%5Bhttps://react.dev/reference/react/useSyncExternalStore%5D\(https://react.dev/reference/react/useSyncExternalStore\))

#### **Creating Our Store**

This is just plain JavaScript—no React needed here\!

```typescript
// In ResponsiveTable.tsx, outside any component

let employees = [ // Our mock data
  { id: 1, name: 'John Doe', status: 'Active' },
  { id: 2, name: 'Jane Smith', status: 'On Leave' },
];

// A Set is a special array that makes sure each item is unique.
// It will hold the "update" functions for every component that is listening.
const listeners = new Set<() => void>();

// The two functions useSyncExternalStore needs
export const subscribe = (callback: () => void) => {
  listeners.add(callback);
  return () => listeners.delete(callback); // The cleanup function!
};

export const getSnapshot = () => employees;

// Our custom "action" to change the data.
// This is the ONLY function that should ever modify the 'employees' array.
export const setEmployees = (updater: (currentEmployees: any[]) => any[]) => {
  employees = updater(employees); // Update the data
  // Tell all listening components to re-render!
  listeners.forEach(listener => listener());
};
```

#### **Creating Our `useDemoStore` Hook**

To make this easy to use, we wrap it in our own custom hook.

```typescript
// In ResponsiveTable.tsx
import { useSyncExternalStore } from 'react'; // Add this import!

// This is the hook our components will actually use
export function useDemoStore() {
  return useSyncExternalStore(subscribe, getSnapshot);
}
```

-----

### **Step 6: Putting It All Together**

Now we create our final page component. It will use our store and assemble the pieces.

```typescript
// In ResponsiveTable.tsx

// A component that also uses the store!
const ActiveCountChip = () => {
    const currentEmployees = useDemoStore();
    const activeCount = currentEmployees.filter(e => e.status === 'Active').length;
    return <div style={{ fontWeight: 'bold' }}>Active Employees: {activeCount}</div>;
}


// Our main App/Page component
const DemoComponent = () => {
  // 1. Get live data directly from the store! No props needed.
  const data = useDemoStore();

  const handleToggleStatus = () => {
    // 2. Call our setter function to update the global state
    setEmployees(current =>
      current.map(e =>
        e.name === 'John Doe' ? { ...e, status: e.status === 'Active' ? 'On Leave' : 'Active' } : e
      )
    );
  };

  // Define what our columns look like
  const columns = [
    { id: 'name', header: 'Employee Name', accessor: 'name', type: ColumnType.TEXT },
    { id: 'status', header: 'Status', accessor: 'status', type: ColumnType.TEXT },
    { id: 'action', header: 'Quick Action', accessor: 'name', type: ColumnType.BUTTON }
  ];

  return (
    <div style={{ padding: '32px', fontFamily: 'sans-serif' }}>
      <h1>Employee Data Table</h1>
      <p>A tutorial on building a responsive table with modern React.</p>
      
      {/* Both of these components will update when the button is clicked! */}
      <ActiveCountChip />
      <ButtonAtom label="Toggle John's Status" onClick={handleToggleStatus} />
      
      <div style={{ marginTop: '24px' }}>
        <TableOrganism columns={columns} data={data} />
      </div>
    </div>
  );
};

export default DemoComponent;
```

You've done it\! You now have a responsive, interactive, and efficiently managed table component. You've learned some of the most important hooks and patterns in the React ecosystem.

**To run your app, go to your terminal and type `npm start`.**

From here, you can continue to build out the mobile card view, add more column types, or even connect to a real database\!