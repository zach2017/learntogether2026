import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, within, cleanup } from '@testing-library/react';
import React from 'react';
import '@testing-library/jest-dom';
import {
  // Atoms
  TextAtom,
  NumberAtom,
  DateAtom,
  ButtonAtom,
  CalculatedAtom,
  HeaderAtom,
  // Molecules
  FilterMolecule,
  CellMolecule,
  PopupMolecule,
  RowActionsMolecule,
  // Organisms
  TableOrganism,
  // Types and Enums
  ColumnType,
  HeadingType,
  ColumnConfig,
  TableConfig,
  PopupConfig,
  ClickConfig,
  // Store functions
  subscribe,
  getSnapshot,
  setEmployees,
  useDemoStore,
} from './table-components'; // Adjust import path as needed

// Mock window.innerWidth for responsive tests
const mockWindowSize = (width: number) => {
  Object.defineProperty(window, 'innerWidth', {
    writable: true,
    configurable: true,
    value: width,
  });
  window.dispatchEvent(new Event('resize'));
};

describe('Atoms', () => {
  describe('TextAtom', () => {
    it('renders text value correctly', () => {
      render(<TextAtom value="Test Text" />);
      expect(screen.getByText('Test Text')).toBeInTheDocument();
    });

    it('handles click when clickable', () => {
      const handleClick = vi.fn();
      render(<TextAtom value="Clickable Text" onClick={handleClick} clickable />);
      
      const element = screen.getByText('Clickable Text');
      fireEvent.click(element);
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('shows underline on hover when clickable', async () => {
      render(<TextAtom value="Hover Text" clickable />);
      const element = screen.getByText('Hover Text');
      
      fireEvent.mouseEnter(element);
      await waitFor(() => {
        expect(element).toHaveStyle({ textDecoration: 'underline' });
      });
      
      fireEvent.mouseLeave(element);
      await waitFor(() => {
        expect(element).not.toHaveStyle({ textDecoration: 'underline' });
      });
    });

    it('does not respond to click when not clickable', () => {
      const handleClick = vi.fn();
      render(<TextAtom value="Non-clickable" onClick={handleClick} />);
      
      fireEvent.click(screen.getByText('Non-clickable'));
      expect(handleClick).toHaveBeenCalledTimes(1); // Still called, but no styling
    });
  });

  describe('NumberAtom', () => {
    it('renders number with default formatting', () => {
      render(<NumberAtom value={1234567} />);
      expect(screen.getByText('1,234,567')).toBeInTheDocument();
    });

    it('applies custom format function', () => {
      const customFormat = (n: number) => `$${n.toFixed(2)}`;
      render(<NumberAtom value={1234.5} format={customFormat} />);
      expect(screen.getByText('$1234.50')).toBeInTheDocument();
    });

    it('handles zero value', () => {
      render(<NumberAtom value={0} />);
      expect(screen.getByText('0')).toBeInTheDocument();
    });

    it('handles negative numbers', () => {
      render(<NumberAtom value={-500} />);
      expect(screen.getByText('-500')).toBeInTheDocument();
    });
  });

  describe('DateAtom', () => {
    it('formats Date object correctly', () => {
      const date = new Date('2024-03-15');
      render(<DateAtom value={date} />);
      expect(screen.getByText(/Mar 15, 2024/)).toBeInTheDocument();
    });

    it('formats date string correctly', () => {
      render(<DateAtom value="2024-12-25" />);
      expect(screen.getByText(/Dec 25, 2024/)).toBeInTheDocument();
    });

    it('handles invalid date gracefully', () => {
      render(<DateAtom value="invalid-date" />);
      expect(screen.getByText(/Invalid Date/)).toBeInTheDocument();
    });
  });

  describe('ButtonAtom', () => {
    it('renders with label and handles click', () => {
      const handleClick = vi.fn();
      render(<ButtonAtom label="Click Me" onClick={handleClick} />);
      
      const button = screen.getByRole('button', { name: 'Click Me' });
      expect(button).toBeInTheDocument();
      
      fireEvent.click(button);
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('renders with different variants', () => {
      const { rerender } = render(<ButtonAtom label="Primary" onClick={() => {}} variant="primary" />);
      expect(screen.getByRole('button')).toHaveStyle({ backgroundColor: '#1976d2' });
      
      rerender(<ButtonAtom label="Secondary" onClick={() => {}} variant="secondary" />);
      expect(screen.getByRole('button')).toHaveStyle({ backgroundColor: '#6c757d' });
      
      rerender(<ButtonAtom label="Danger" onClick={() => {}} variant="danger" />);
      expect(screen.getByRole('button')).toHaveStyle({ backgroundColor: '#dc3545' });
    });

    it('applies hover effect', async () => {
      render(<ButtonAtom label="Hover Me" onClick={() => {}} />);
      const button = screen.getByRole('button');
      
      fireEvent.mouseEnter(button);
      await waitFor(() => {
        expect(button).toHaveStyle({ opacity: '0.9' });
      });
      
      fireEvent.mouseLeave(button);
      await waitFor(() => {
        expect(button).not.toHaveStyle({ opacity: '0.9' });
      });
    });
  });

  describe('CalculatedAtom', () => {
    it('renders calculated value', () => {
      render(<CalculatedAtom value={42} />);
      expect(screen.getByText('42')).toBeInTheDocument();
    });

    it('renders with icon when specified', () => {
      render(<CalculatedAtom value="Result" icon />);
      expect(screen.getByText('📊')).toBeInTheDocument();
      expect(screen.getByText('Result')).toBeInTheDocument();
    });

    it('converts non-string values to string', () => {
      render(<CalculatedAtom value={{ complex: 'object' }} />);
      expect(screen.getByText('[object Object]')).toBeInTheDocument();
    });
  });

  describe('HeaderAtom', () => {
    it('renders with title and correct heading type', () => {
      render(<HeaderAtom title="Primary Header" type={HeadingType.PRIMARY} />);
      const header = screen.getByText('Primary Header');
      expect(header).toBeInTheDocument();
      expect(header).toHaveStyle({ fontSize: '16px', fontWeight: '700' });
    });

    it('renders secondary header', () => {
      render(<HeaderAtom title="Secondary Header" type={HeadingType.SECONDARY} />);
      const header = screen.getByText('Secondary Header');
      expect(header).toHaveStyle({ fontSize: '14px', fontWeight: '600' });
    });

    it('renders tertiary header', () => {
      render(<HeaderAtom title="Tertiary Header" type={HeadingType.TERTIARY} />);
      const header = screen.getByText('Tertiary Header');
      expect(header).toHaveStyle({ fontSize: '12px', fontWeight: '500' });
    });

    it('renders with icon when provided', () => {
      render(<HeaderAtom title="With Icon" type={HeadingType.PRIMARY} icon="🎯" />);
      expect(screen.getByText('🎯')).toBeInTheDocument();
      expect(screen.getByText('With Icon')).toBeInTheDocument();
    });
  });
});

describe('Molecules', () => {
  describe('FilterMolecule', () => {
    it('renders text input for text column type', () => {
      const handleChange = vi.fn();
      render(
        <FilterMolecule
          columnType={ColumnType.TEXT}
          value=""
          onChange={handleChange}
        />
      );
      
      const input = screen.getByPlaceholderText('Filter...');
      expect(input).toHaveAttribute('type', 'text');
      
      fireEvent.change(input, { target: { value: 'test' } });
      expect(handleChange).toHaveBeenCalledWith('test');
    });

    it('renders number input for number column type', () => {
      const handleChange = vi.fn();
      render(
        <FilterMolecule
          columnType={ColumnType.NUMBER}
          value=""
          onChange={handleChange}
        />
      );
      
      const input = screen.getByPlaceholderText('Filter...');
      expect(input).toHaveAttribute('type', 'number');
      
      fireEvent.change(input, { target: { value: '123' } });
      expect(handleChange).toHaveBeenCalledWith(123);
    });

    it('renders date input for date column type', () => {
      render(
        <FilterMolecule
          columnType={ColumnType.DATE}
          value=""
          onChange={() => {}}
        />
      );
      
      const input = screen.getByPlaceholderText('Filter...');
      expect(input).toHaveAttribute('type', 'date');
    });

    it('uses custom placeholder when provided', () => {
      render(
        <FilterMolecule
          columnType={ColumnType.TEXT}
          value=""
          onChange={() => {}}
          placeholder="Custom placeholder"
        />
      );
      
      expect(screen.getByPlaceholderText('Custom placeholder')).toBeInTheDocument();
    });
  });

  describe('CellMolecule', () => {
    const mockRow = { id: 1, name: 'Test', value: 100 };

    it('renders text cell correctly', () => {
      const columnConfig: ColumnConfig = {
        id: 'name',
        header: 'Name',
        type: ColumnType.TEXT,
      };
      
      render(
        <CellMolecule
          value="Test Value"
          columnType={ColumnType.TEXT}
          columnConfig={columnConfig}
          row={mockRow}
        />
      );
      
      expect(screen.getByText('Test Value')).toBeInTheDocument();
    });

    it('handles clickable cell', () => {
      const handleClick = vi.fn();
      const columnConfig: ColumnConfig = {
        id: 'name',
        header: 'Name',
        type: ColumnType.TEXT,
        clickable: {
          enabled: true,
          onClick: handleClick,
        },
      };
      
      render(
        <CellMolecule
          value="Clickable"
          columnType={ColumnType.TEXT}
          columnConfig={columnConfig}
          row={mockRow}
        />
      );
      
      fireEvent.click(screen.getByText('Clickable'));
      expect(handleClick).toHaveBeenCalledWith(mockRow, 'name');
    });

    it('shows tooltip on hover for clickable cells', async () => {
      const columnConfig: ColumnConfig = {
        id: 'name',
        header: 'Name',
        type: ColumnType.TEXT,
        clickable: {
          enabled: true,
          onClick: () => {},
          tooltip: 'Click for details',
        },
      };
      
      render(
        <CellMolecule
          value="Hover me"
          columnType={ColumnType.TEXT}
          columnConfig={columnConfig}
          row={mockRow}
        />
      );
      
      const cell = screen.getByText('Hover me');
      fireEvent.mouseEnter(cell);
      
      await waitFor(() => {
        expect(screen.getByText('Click for details')).toBeInTheDocument();
      });
      
      fireEvent.mouseLeave(cell);
      await waitFor(() => {
        expect(screen.queryByText('Click for details')).not.toBeInTheDocument();
      });
    });

    it('opens popup when configured', async () => {
      const columnConfig: ColumnConfig = {
        id: 'name',
        header: 'Name',
        type: ColumnType.TEXT,
        popup: {
          enabled: true,
          title: 'Details',
          content: (row) => <div>Row ID: {row.id}</div>,
        },
      };
      
      render(
        <CellMolecule
          value="Click me"
          columnType={ColumnType.TEXT}
          columnConfig={columnConfig}
          row={mockRow}
        />
      );
      
      fireEvent.click(screen.getByText('Click me'));
      
      await waitFor(() => {
        expect(screen.getByText('Details')).toBeInTheDocument();
        expect(screen.getByText('Row ID: 1')).toBeInTheDocument();
      });
    });
  });

  describe('PopupMolecule', () => {
    const mockRow = { id: 1, name: 'Test User', email: 'test@example.com' };

    it('renders popup with title and content', () => {
      const config: PopupConfig = {
        enabled: true,
        title: 'User Details',
        content: (row) => <div>Email: {row.email}</div>,
      };
      
      render(
        <PopupMolecule
          config={config}
          row={mockRow}
          onClose={() => {}}
        />
      );
      
      expect(screen.getByText('User Details')).toBeInTheDocument();
      expect(screen.getByText('Email: test@example.com')).toBeInTheDocument();
    });

    it('renders default content when no content function provided', () => {
      const config: PopupConfig = {
        enabled: true,
      };
      
      render(
        <PopupMolecule
          config={config}
          row={mockRow}
          onClose={() => {}}
        />
      );
      
      expect(screen.getByText(/Details/)).toBeInTheDocument();
      expect(screen.getByText(/"id": 1/)).toBeInTheDocument();
    });

    it('renders action buttons', () => {
      const handleAction = vi.fn();
      const config: PopupConfig = {
        enabled: true,
        actions: [
          {
            label: 'Send Email',
            onClick: handleAction,
            variant: 'primary',
          },
        ],
      };
      
      render(
        <PopupMolecule
          config={config}
          row={mockRow}
          onClose={() => {}}
        />
      );
      
      const actionButton = screen.getByRole('button', { name: 'Send Email' });
      expect(actionButton).toBeInTheDocument();
      
      fireEvent.click(actionButton);
      expect(handleAction).toHaveBeenCalledWith(mockRow);
    });

    it('closes popup on overlay click', () => {
      const handleClose = vi.fn();
      const config: PopupConfig = { enabled: true };
      
      const { container } = render(
        <PopupMolecule
          config={config}
          row={mockRow}
          onClose={handleClose}
        />
      );
      
      const overlay = container.firstChild as HTMLElement;
      fireEvent.click(overlay);
      expect(handleClose).toHaveBeenCalledTimes(1);
    });

    it('prevents close when clicking inside popup', () => {
      const handleClose = vi.fn();
      const config: PopupConfig = { enabled: true };
      
      render(
        <PopupMolecule
          config={config}
          row={mockRow}
          onClose={handleClose}
        />
      );
      
      fireEvent.click(screen.getByText(/Details/));
      expect(handleClose).not.toHaveBeenCalled();
    });
  });

  describe('RowActionsMolecule', () => {
    const mockRow = { id: 1, name: 'Test' };

    it('renders all action buttons when handlers provided', () => {
      const handleEdit = vi.fn();
      const handleDelete = vi.fn();
      const handleView = vi.fn();
      
      render(
        <RowActionsMolecule
          row={mockRow}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onView={handleView}
        />
      );
      
      expect(screen.getByTitle('View')).toBeInTheDocument();
      expect(screen.getByTitle('Edit')).toBeInTheDocument();
      expect(screen.getByTitle('Delete')).toBeInTheDocument();
    });

    it('only renders buttons with provided handlers', () => {
      const handleEdit = vi.fn();
      
      render(
        <RowActionsMolecule
          row={mockRow}
          onEdit={handleEdit}
        />
      );
      
      expect(screen.getByTitle('Edit')).toBeInTheDocument();
      expect(screen.queryByTitle('View')).not.toBeInTheDocument();
      expect(screen.queryByTitle('Delete')).not.toBeInTheDocument();
    });

    it('calls correct handler when button clicked', () => {
      const handleEdit = vi.fn();
      const handleDelete = vi.fn();
      const handleView = vi.fn();
      
      render(
        <RowActionsMolecule
          row={mockRow}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onView={handleView}
        />
      );
      
      fireEvent.click(screen.getByTitle('View'));
      expect(handleView).toHaveBeenCalledWith(mockRow);
      expect(handleEdit).not.toHaveBeenCalled();
      expect(handleDelete).not.toHaveBeenCalled();
      
      fireEvent.click(screen.getByTitle('Edit'));
      expect(handleEdit).toHaveBeenCalledWith(mockRow);
      
      fireEvent.click(screen.getByTitle('Delete'));
      expect(handleDelete).toHaveBeenCalledWith(mockRow);
    });
  });
});

describe('Organisms', () => {
  describe('TableOrganism', () => {
    const mockData = [
      { id: 1, name: 'John Doe', age: 30, email: 'john@example.com', salary: 50000 },
      { id: 2, name: 'Jane Smith', age: 25, email: 'jane@example.com', salary: 60000 },
      { id: 3, name: 'Bob Johnson', age: 35, email: 'bob@example.com', salary: 55000 },
    ];

    const columns: ColumnConfig[] = [
      { id: 'name', header: 'Name', type: ColumnType.TEXT, accessor: 'name' },
      { id: 'age', header: 'Age', type: ColumnType.NUMBER, accessor: 'age' },
      { id: 'email', header: 'Email', type: ColumnType.TEXT, accessor: 'email' },
      { id: 'salary', header: 'Salary', type: ColumnType.NUMBER, accessor: 'salary' },
    ];

    beforeEach(() => {
      mockWindowSize(1024); // Set desktop size by default
    });

    afterEach(() => {
      cleanup();
    });

    it('renders table with data', () => {
      render(
        <TableOrganism
          columns={columns}
          data={mockData}
        />
      );
      
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
      expect(screen.getByText('Bob Johnson')).toBeInTheDocument();
    });

    it('renders column headers', () => {
      render(
        <TableOrganism
          columns={columns}
          data={mockData}
        />
      );
      
      expect(screen.getByText('Name')).toBeInTheDocument();
      expect(screen.getByText('Age')).toBeInTheDocument();
      expect(screen.getByText('Email')).toBeInTheDocument();
      expect(screen.getByText('Salary')).toBeInTheDocument();
    });

    it('filters data with global filter', async () => {
      render(
        <TableOrganism
          columns={columns}
          data={mockData}
          enableGlobalFilter={true}
        />
      );
      
      const searchInput = screen.getByPlaceholderText('Search...');
      fireEvent.change(searchInput, { target: { value: 'Jane' } });
      
      await waitFor(() => {
        expect(screen.getByText('Jane Smith')).toBeInTheDocument();
        expect(screen.queryByText('John Doe')).not.toBeInTheDocument();
        expect(screen.queryByText('Bob Johnson')).not.toBeInTheDocument();
      });
    });

    it('sorts data when column header clicked', async () => {
      render(
        <TableOrganism
          columns={columns}
          data={mockData}
        />
      );
      
      const ageHeader = screen.getByText('Age').parentElement!;
      fireEvent.click(ageHeader);
      
      await waitFor(() => {
        const cells = screen.getAllByText(/^\d+$/);
        const ages = cells.filter(cell => ['25', '30', '35'].includes(cell.textContent!));
        expect(ages[0]).toHaveTextContent('25');
        expect(ages[1]).toHaveTextContent('30');
        expect(ages[2]).toHaveTextContent('35');
      });
      
      fireEvent.click(ageHeader);
      
      await waitFor(() => {
        const cells = screen.getAllByText(/^\d+$/);
        const ages = cells.filter(cell => ['25', '30', '35'].includes(cell.textContent!));
        expect(ages[0]).toHaveTextContent('35');
        expect(ages[1]).toHaveTextContent('30');
        expect(ages[2]).toHaveTextContent('25');
      });
    });

    it('renders row actions when enabled', () => {
      const handleEdit = vi.fn();
      const handleDelete = vi.fn();
      
      render(
        <TableOrganism
          columns={columns}
          data={mockData}
          enableRowActions={true}
          onRowEdit={handleEdit}
          onRowDelete={handleDelete}
        />
      );
      
      const editButtons = screen.getAllByTitle('Edit');
      expect(editButtons).toHaveLength(3);
      
      fireEvent.click(editButtons[0]);
      expect(handleEdit).toHaveBeenCalledWith(mockData[0]);
    });

    it('switches to mobile view on small screens', () => {
      mockWindowSize(500);
      
      render(
        <TableOrganism
          columns={columns}
          data={mockData}
          mobileBreakpoint={768}
        />
      );
      
      // In mobile view, data is rendered as cards
      expect(screen.queryByRole('table')).not.toBeInTheDocument();
      
      // Check if mobile cards are rendered
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Age')).toBeInTheDocument(); // Label in mobile view
    });

    it('respects custom mobile breakpoint', () => {
      mockWindowSize(600);
      
      render(
        <TableOrganism
          columns={columns}
          data={mockData}
          mobileBreakpoint={500}
        />
      );
      
      // Should still be in desktop view since width > breakpoint
      expect(screen.getByRole('table')).toBeInTheDocument();
    });

    it('handles calculated columns', () => {
      const calculatedColumns: ColumnConfig[] = [
        ...columns,
        {
          id: 'bonus',
          header: 'Bonus',
          type: ColumnType.CALCULATED,
          calculationFn: (row) => `$${(row.salary * 0.1).toFixed(2)}`,
        },
      ];
      
      render(
        <TableOrganism
          columns={calculatedColumns}
          data={mockData}
        />
      );
      
      expect(screen.getByText('$5000.00')).toBeInTheDocument(); // 10% of 50000
      expect(screen.getByText('$6000.00')).toBeInTheDocument(); // 10% of 60000
    });

    it('handles column-specific filters', async () => {
      const filterableColumns: ColumnConfig[] = columns.map(col => ({
        ...col,
        filterable: true,
      }));
      
      render(
        <TableOrganism
          columns={filterableColumns}
          data={mockData}
        />
      );
      
      // Find the filter input for the name column
      const nameHeader = screen.getByText('Name').parentElement!;
      const nameFilter = within(nameHeader).getByPlaceholderText('Filter...');
      
      fireEvent.change(nameFilter, { target: { value: 'John' } });
      
      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
        expect(screen.queryByText('Jane Smith')).not.toBeInTheDocument();
      });
    });

    it('handles accessor functions', () => {
      const columnsWithAccessor: ColumnConfig[] = [
        {
          id: 'fullInfo',
          header: 'Full Info',
          type: ColumnType.TEXT,
          accessor: (row) => `${row.name} (${row.age})`,
        },
      ];
      
      render(
        <TableOrganism
          columns={columnsWithAccessor}
          data={mockData}
        />
      );
      
      expect(screen.getByText('John Doe (30)')).toBeInTheDocument();
      expect(screen.getByText('Jane Smith (25)')).toBeInTheDocument();
    });
  });
});

describe('Store Functions', () => {
  beforeEach(() => {
    // Reset store to initial state
    setEmployees(() => []);
  });

  describe('Store subscription and state management', () => {
    it('subscribe adds and removes listeners', () => {
      const listener = vi.fn();
      const unsubscribe = subscribe(listener);
      
      setEmployees((list) => [...list, { id: 1, name: 'Test' }] as any);
      expect(listener).toHaveBeenCalledTimes(1);
      
      unsubscribe();
      setEmployees((list) => [...list, { id: 2, name: 'Test2' }] as any);
      expect(listener).toHaveBeenCalledTimes(1); // Still 1, not called after unsubscribe
    });

    it('getSnapshot returns current state', () => {
      setEmployees(() => [
        { id: 1, name: 'Employee 1' },
        { id: 2, name: 'Employee 2' },
      ] as any);
      
      const state = getSnapshot();
      expect(state.employees).toHaveLength(2);
      expect(state.employees[0].name).toBe('Employee 1');
    });

    it('setEmployees updates state and notifies listeners', () => {
      const listener1 = vi.fn();
      const listener2 = vi.fn();
      
      subscribe(listener1);
      subscribe(listener2);
      
      setEmployees((list) => [...list, { id: 1, name: 'New Employee' }] as any);
      
      expect(listener1).toHaveBeenCalledTimes(1);
      expect(listener2).toHaveBeenCalledTimes(1);
      
      const state = getSnapshot();
      expect(state.employees).toHaveLength(1);
      expect(state.employees[0].name).toBe('New Employee');
    });
  });

  describe('useDemoStore hook', () => {
    const TestComponent: React.FC<{ selector: (s: any) => any }> = ({ selector }) => {
      const value = useDemoStore(selector);
      return <div data-testid="value">{JSON.stringify(value)}</div>;
    };

    it('provides selected state', () => {
      setEmployees(() => [
        { id: 1, name: 'John', status: 'Active' },
        { id: 2, name: 'Jane', status: 'Inactive' },
      ] as any);

      render(<TestComponent selector={(s) => s.employees.length} />);
      expect(screen.getByTestId('value')).toHaveTextContent('2');
    });

    it('updates when state changes', async () => {
      setEmployees(() => [{ id: 1, name: 'Initial' }] as any);
      
      render(<TestComponent selector={(s) => s.employees[0]?.name} />);
      expect(screen.getByTestId('value')).toHaveTextContent('"Initial"');
      
      setEmployees(() => [{ id: 1, name: 'Updated' }] as any);
      
      await waitFor(() => {
        expect(screen.getByTestId('value')).toHaveTextContent('"Updated"');
      });
    });

    it('handles complex selectors', () => {
      setEmployees(() => [
        { id: 1, name: 'John', status: 'Active', salary: 50000 },
        { id: 2, name: 'Jane', status: 'Active', salary: 60000 },
        { id: 3, name: 'Bob', status: 'Inactive', salary: 55000 },
      ] as any);

      const ComplexComponent = () => {
        const activeCount = useDemoStore(
          (s) => s.employees.filter((e: any) => e.status === 'Active').length
        );
        const totalSalary = useDemoStore(
          (s) => s.employees.reduce((sum: number, e: any) => sum + e.salary, 0)
        );
        
        return (
          <>
            <div data-testid="active">{activeCount}</div>
            <div data-testid="salary">{totalSalary}</div>
          </>
        );
      };

      render(<ComplexComponent />);
      expect(screen.getByTestId('active')).toHaveTextContent('2');
      expect(screen.getByTestId('salary')).toHaveTextContent('165000');
    });
  });
});

describe('Integration Tests', () => {
  describe('Full table with interactions', () => {
    it('handles complete user workflow', async () => {
      const mockData = [
        { id: 1, name: 'Alice', age: 30, department: 'Engineering' },
        { id: 2, name: 'Bob', age: 25, department: 'Design' },
        { id: 3, name: 'Charlie', age: 35, department: 'Engineering' },
      ];

      const handleEdit = vi.fn();
      const handleDelete = vi.fn();
      
      const columns: ColumnConfig[] = [
        { 
          id: 'name', 
          header: 'Name', 
          type: ColumnType.TEXT, 
          accessor: 'name',
          clickable: {
            enabled: true,
            onClick: (row) => console.log('Clicked:', row.name),
            tooltip: 'Click for details',
          },
        },
        { 
          id: 'age', 
          header: 'Age', 
          type: ColumnType.NUMBER, 
          accessor: 'age',
          sortable: true,
          filterable: true,
        },
        { 
          id: 'department', 
          header: 'Department', 
          type: ColumnType.TEXT, 
          accessor: 'department',
          filterable: true,
        },
      ];

      render(
        <TableOrganism
          columns={columns}
          data={mockData}
          enableGlobalFilter={true}
          enableRowActions={true}
          onRowEdit={handleEdit}
          onRowDelete={handleDelete}
        />
      );

      // Test global filtering
      const searchInput = screen.getByPlaceholderText('Search...');
      fireEvent.change(searchInput, { target: { value: 'Engineering' } });
      
      await waitFor(() => {
        expect(screen.getByText('Alice')).toBeInTheDocument();
        expect(screen.getByText('Charlie')).toBeInTheDocument();
        expect(screen.queryByText('Bob')).not.toBeInTheDocument();
      });

      // Clear global filter
      fireEvent.change(searchInput, { target: { value: '' } });
      
      await waitFor(() => {
        expect(screen.getByText('Bob')).toBeInTheDocument();
      });

      // Test sorting
      const ageHeader = screen.getByText('Age').parentElement!;
      fireEvent.click(ageHeader);
      
      // Test row actions
      const editButtons = screen.getAllByTitle('Edit');
      fireEvent.click(editButtons[0]);
      
      await waitFor(() => {
        expect(handleEdit).toHaveBeenCalled();
      });
    });

    it('handles responsive behavior correctly', async () => {
      const mockData = [
        { id: 1, name: 'Test User', email: 'test@example.com' },
      ];

      const columns: ColumnConfig[] = [
        { id: 'name', header: 'Name', type: ColumnType.TEXT, accessor: 'name' },
        { id: 'email', header: 'Email', type: ColumnType.TEXT, accessor: 'email' },
      ];

      // Start with desktop view
      mockWindowSize(1024);
      
      const { rerender } = render(
        <TableOrganism
          columns={columns}
          data={mockData}
          mobileBreakpoint={768}
        />
      );

      expect(screen.getByRole('table')).toBeInTheDocument();

      // Switch to mobile view
      mockWindowSize(500);
      
      rerender(
        <TableOrganism
          columns={columns}
          data={mockData}
          mobileBreakpoint={768}
        />
      );

      await waitFor(() => {
        expect(screen.queryByRole('table')).not.toBeInTheDocument();
      });
    });
  });
});