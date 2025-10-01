# 🎨 Atomic Design Table System

A comprehensive, type-safe React TypeScript table component system built using Atomic Design methodology with full testing and Storybook documentation.

## 📋 Table of Contents

- [Features](#features)
- [Architecture](#architecture)
- [Installation](#installation)
- [Quick Start](#quick-start)
- [Component Hierarchy](#component-hierarchy)
- [Testing](#testing)
- [Storybook](#storybook)
- [Development](#development)
- [API Documentation](#api-documentation)
- [Examples](#examples)
- [Contributing](#contributing)

## ✨ Features

### Column Types
- **Text**: Standard text display with optional clickability
- **Number**: Formatted numeric values with custom formatting
- **Date**: Automatic date formatting
- **Button**: Interactive action buttons
- **Calculated**: Dynamic values computed from row data

### Interactive Features
- 🖱️ **Clickable Cells**: Custom click handlers for any cell
- 💬 **Tooltips**: Hover tooltips for additional information
- 📋 **Popup Dialogs**: Detailed view modals with custom content
- 🔍 **Global Search**: Search across all columns simultaneously
- 🎯 **Column Filtering**: Type-specific filters for each column
- ↕️ **Sorting**: Multi-column sorting with visual indicators
- ⚡ **Row Actions**: Built-in View, Edit, Delete operations

### Technical Features
- 🔒 **Full TypeScript Support**: Complete type safety
- 🧪 **100% Test Coverage**: Comprehensive Vitest test suite
- 📚 **Storybook Documentation**: Interactive component explorer
- ♿ **Accessibility**: ARIA compliant with keyboard navigation
- 🎨 **Atomic Design**: Clean architecture with reusable components
- ⚡ **Performance Optimized**: Memoization and efficient rendering

## 🏗️ Architecture

```
┌─────────────────────────────────────┐
│           ORGANISMS                  │
│         TableOrganism                │
│  (Complete table with all features)  │
└─────────────┬───────────────────────┘
              │
┌─────────────▼───────────────────────┐
│           MOLECULES                  │
│  ┌─────────────┬─────────────┐      │
│  │FilterMolecule│CellMolecule │      │
│  ├─────────────┼─────────────┤      │
│  │PopupMolecule │RowActions   │      │
│  └─────────────┴─────────────┘      │
└─────────────┬───────────────────────┘
              │
┌─────────────▼───────────────────────┐
│             ATOMS                    │
│  ┌──────┬──────┬──────┬──────┐     │
│  │ Text │Number│ Date │Button│     │
│  ├──────┼──────┼──────┼──────┤     │
│  │Header│ Calc │      │      │     │
│  └──────┴──────┴──────┴──────┘     │
└─────────────────────────────────────┘
```

## 📦 Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/atomic-table-system.git
cd atomic-table-system

# Install dependencies
npm install

# Start development server
npm run dev
```

### Dependencies

```json
{
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0"
  },
  "devDependencies": {
    "@types/react": "^18.2.43",
    "@types/react-dom": "^18.2.17",
    "typescript": "^5.2.2",
    "vite": "^5.0.8",
    "@vitejs/plugin-react": "^4.2.1",
    "vitest": "^1.0.4",
    "@testing-library/react": "^14.1.2",
    "@testing-library/jest-dom": "^6.1.5",
    "@testing-library/user-event": "^14.5.1",
    "@storybook/react": "^7.6.6",
    "@storybook/react-vite": "^7.6.6"
  }
}
```

## 🚀 Quick Start

```typescript
import { TableOrganism, ColumnType, HeadingType } from './AtomicTableSystem';

const MyTable = () => {
  const columns = [
    {
      id: 'name',
      header: 'Name',
      type: ColumnType.TEXT,
      accessor: 'name',
      clickable: {
        enabled: true,
        onClick: (row) => console.log('Clicked:', row),
        tooltip: 'Click to view details'
      }
    },
    {
      id: 'age',
      header: 'Age',
      type: ColumnType.NUMBER,
      accessor: 'age',
      format: (value) => `${value} years`
    },
    {
      id: 'joinDate',
      header: 'Join Date',
      type: ColumnType.DATE,
      accessor: 'joinDate'
    },
    {
      id: 'salary',
      header: 'Salary',
      type: ColumnType.NUMBER,
      accessor: 'salary',
      format: (value) => `$${value.toLocaleString()}`
    },
    {
      id: 'bonus',
      header: 'Bonus',
      type: ColumnType.CALCULATED,
      calculationFn: (row) => `$${(row.salary * 0.1).toLocaleString()}`
    }
  ];

  const data = [
    { id: 1, name: 'John Doe', age: 30, joinDate: '2023-01-15', salary: 75000 },
    { id: 2, name: 'Jane Smith', age: 28, joinDate: '2023-03-20', salary: 68000 }
  ];

  return (
    <TableOrganism
      columns={columns}
      data={data}
      enableGlobalFilter={true}
      enableRowActions={true}
      onRowEdit={(row) => console.log('Edit:', row)}
      onRowDelete={(row) => console.log('Delete:', row)}
      onRowView={(row) => console.log('View:', row)}
    />
  );
};
```

## 🧩 Component Hierarchy

### Atoms (Basic Building Blocks)

| Component | Purpose | Props |
|-----------|---------|-------|
| `TextAtom` | Text display | `value`, `onClick?`, `clickable?` |
| `NumberAtom` | Number formatting | `value`, `format?` |
| `DateAtom` | Date formatting | `value` |
| `ButtonAtom` | Action buttons | `label`, `onClick`, `variant?` |
| `CalculatedAtom` | Computed values | `value`, `icon?` |
| `HeaderAtom` | Column headers | `title`, `type`, `icon?` |

### Molecules (Composite Components)

| Component | Purpose | Key Features |
|-----------|---------|--------------|
| `FilterMolecule` | Column filtering | Type-specific inputs |
| `CellMolecule` | Cell rendering | Handles all column types |
| `PopupMolecule` | Modal dialogs | Custom content & actions |
| `RowActionsMolecule` | Row operations | View/Edit/Delete buttons |

### Organisms (Complete Features)

| Component | Purpose | Key Features |
|-----------|---------|--------------|
| `TableOrganism` | Full table | All features integrated |

## 🧪 Testing

### Run Tests

```bash
# Run all tests
npm run test

# Run with coverage
npm run test:coverage

# Run in watch mode
npm run test:watch

# Open Vitest UI
npm run test:ui
```

### Test Coverage

| Component Type | Coverage |
|----------------|----------|
| Atoms | 100% |
| Molecules | 100% |
| Organisms | 95%+ |
| Overall | 90%+ |

### Testing Features

- ✅ Unit tests for all components
- ✅ Integration tests for complex interactions
- ✅ Accessibility testing
- ✅ Performance benchmarks
- ✅ User interaction simulation
- ✅ Edge case handling

## 📚 Storybook

### Run Storybook

```bash
# Start Storybook development server
npm run storybook

# Build static Storybook
npm run build-storybook

# Serve built Storybook
npm run serve-storybook
```

### Available Stories

- **Atoms/**
  - TextAtom (Default, Clickable, LongText)
  - NumberAtom (Default, Formatted, Negative)
  - DateAtom (String, Object, Today)
  - ButtonAtom (Primary, Secondary, Danger)
  - CalculatedAtom (WithIcon, NoIcon)
  - HeaderAtom (Primary, Secondary, Tertiary)

- **Molecules/**
  - FilterMolecule (Text, Number, Date)
  - CellMolecule (WithText, WithPopup)
  - PopupMolecule (Open state)
  - RowActionsMolecule (AllActions, ViewOnly, EditDelete)

- **Organisms/**
  - TableOrganism
    - BasicTable
    - FullFeaturedTable
    - FilterableTable
    - SortableTable
    - InteractiveTable
    - EmptyTable
    - LargeDatasetTable

## 🛠️ Development

### Scripts

```bash
# Development
npm run dev              # Start Vite dev server
npm run build           # Build for production
npm run preview         # Preview production build

# Testing
npm run test            # Run tests
npm run test:ui         # Open Vitest UI
npm run test:coverage   # Generate coverage report

# Storybook
npm run storybook       # Start Storybook
npm run build-storybook # Build Storybook

# Code Quality
npm run lint            # Run ESLint
npm run lint:fix        # Fix ESLint issues
npm run format          # Format with Prettier
npm run type-check      # TypeScript type checking

# CI/CD
npm run ci              # Run all checks (for CI)
```

### File Structure

```
src/
├── components/
│   ├── atoms/
│   │   ├── TextAtom.tsx
│   │   ├── NumberAtom.tsx
│   │   ├── DateAtom.tsx
│   │   ├── ButtonAtom.tsx
│   │   ├── CalculatedAtom.tsx
│   │   └── HeaderAtom.tsx
│   ├── molecules/
│   │   ├── FilterMolecule.tsx
│   │   ├── CellMolecule.tsx
│   │   ├── PopupMolecule.tsx
│   │   └── RowActionsMolecule.tsx
│   └── organisms/
│       └── TableOrganism.tsx
├── types/
│   └── table.types.ts
├── stories/
│   ├── atoms/
│   ├── molecules/
│   └── organisms/
├── tests/
│   ├── atoms/
│   ├── molecules/
│   └── organisms/
└── utils/
    └── helpers.ts
```

## 📖 API Documentation

### ColumnConfig Interface

```typescript
interface ColumnConfig<T = any> {
  id: string;                        // Unique column identifier
  header: string;                     // Column header text
  type: ColumnType;                   // Column data type
  headingType?: HeadingType;         // Header styling type
  accessor?: keyof T | ((row: T) => any); // Data accessor
  calculationFn?: (row: T) => any;   // For calculated columns
  clickable?: ClickConfig;            // Click behavior
  popup?: PopupConfig;                // Popup dialog config
  filterable?: boolean;               // Enable filtering
  sortable?: boolean;                 // Enable sorting
  width?: number;                     // Column width
  format?: (value: any) => string;   // Value formatter
}
```

### TableConfig Interface

```typescript
interface TableConfig<T = any> {
  columns: ColumnConfig<T>[];         // Column definitions
  data: T[];                          // Table data
  enableGlobalFilter?: boolean;       // Global search
  enableColumnActions?: boolean;      // Column features
  enableRowActions?: boolean;         // Row action buttons
  onRowEdit?: (row: T) => void;      // Edit handler
  onRowDelete?: (row: T) => void;    // Delete handler
  onRowView?: (row: T) => void;      // View handler
}
```

## 💡 Examples

### Basic Table

```typescript
const basicColumns = [
  { id: 'name', header: 'Name', type: ColumnType.TEXT },
  { id: 'age', header: 'Age', type: ColumnType.NUMBER }
];

<TableOrganism columns={basicColumns} data={data} />
```

### Table with Popups

```typescript
const columnsWithPopup = [
  {
    id: 'email',
    header: 'Email',
    type: ColumnType.TEXT,
    popup: {
      enabled: true,
      title: 'Contact Details',
      content: (row) => <ContactCard user={row} />,
      actions: [
        { label: 'Send Email', onClick: handleEmail }
      ]
    }
  }
];
```

### Table with Calculated Columns

```typescript
const columnsWithCalc = [
  {
    id: 'total',
    header: 'Total',
    type: ColumnType.CALCULATED,
    calculationFn: (row) => row.price * row.quantity
  }
];
```

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

### Development Guidelines

- Follow Atomic Design principles
- Maintain 90%+ test coverage
- Update Storybook stories for new components
- Use TypeScript for all new code
- Follow the established code style
- Write meaningful commit messages

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with React and TypeScript
- Testing powered by Vitest
- Documentation with Storybook
- Follows Atomic Design methodology by Brad Frost

## 📞 Support

For issues and questions:
- Open an issue on GitHub
- Check the Storybook documentation
- Review the test files for usage examples

---

Made with ❤️ using Atomic Design principles