import React, { useState, useMemo, useCallback } from 'react';

// =============== TYPE DEFINITIONS ===============

export enum ColumnType {
  TEXT = 'text',
  NUMBER = 'number',
  DATE = 'date',
  BUTTON = 'button',
  CALCULATED = 'calculated',
}

export enum HeadingType {
  PRIMARY = 'primary',
  SECONDARY = 'secondary',
  TERTIARY = 'tertiary',
}

export interface PopupConfig {
  enabled: boolean;
  title?: string;
  content?: (row: any) => React.ReactNode;
  actions?: Array<{
    label: string;
    onClick: (row: any) => void;
    variant?: 'primary' | 'secondary' | 'danger';
  }>;
}

export interface ClickConfig {
  enabled: boolean;
  onClick: (row: any, columnId: string) => void;
  tooltip?: string;
}

export interface ColumnConfig<T = any> {
  id: string;
  header: string;
  type: ColumnType;
  headingType?: HeadingType;
  accessor?: keyof T | ((row: T) => any);
  calculationFn?: (row: T) => any;
  clickable?: ClickConfig;
  popup?: PopupConfig;
  filterable?: boolean;
  sortable?: boolean;
  width?: number;
  format?: (value: any) => string;
}

export interface TableConfig<T = any> {
  columns: ColumnConfig<T>[];
  data: T[];
  enableGlobalFilter?: boolean;
  enableColumnActions?: boolean;
  enableRowActions?: boolean;
  onRowEdit?: (row: T) => void;
  onRowDelete?: (row: T) => void;
  onRowView?: (row: T) => void;
}

// =============== STYLES ===============

export const styles = {
  // Atomic components
  text: {
    fontSize: '14px',
    color: '#333',
    margin: 0,
    padding: '4px',
  },
  clickableText: {
    cursor: 'pointer',
    color: '#1976d2',
    textDecoration: 'none',
    transition: 'text-decoration 0.2s',
  },
  number: {
    fontFamily: 'monospace',
    fontSize: '14px',
    color: '#333',
    textAlign: 'right' as const,
    padding: '4px',
  },
  date: {
    fontSize: '14px',
    color: '#555',
    padding: '4px',
  },
  button: {
    padding: '6px 16px',
    borderRadius: '4px',
    border: 'none',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: 500,
    transition: 'background-color 0.3s, transform 0.1s',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonPrimary: {
    backgroundColor: '#1976d2',
    color: 'white',
  },
  buttonSecondary: {
    backgroundColor: '#6c757d',
    color: 'white',
  },
  buttonDanger: {
    backgroundColor: '#dc3545',
    color: 'white',
  },
  calculated: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    color: '#2e7d32',
    fontWeight: 600,
    fontSize: '14px',
  },
  // Headers
  headerPrimary: {
    fontSize: '16px',
    fontWeight: 700,
    color: '#1976d2',
  },
  headerSecondary: {
    fontSize: '14px',
    fontWeight: 600,
    color: '#424242',
  },
  headerTertiary: {
    fontSize: '12px',
    fontWeight: 500,
    color: '#757575',
  },
  headerContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  // Table styles
  table: {
    width: '100%',
    borderCollapse: 'collapse' as const,
    backgroundColor: 'white',
    borderRadius: '8px',
    overflow: 'hidden',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
  },
  th: {
    backgroundColor: '#f5f5f5',
    padding: '12px',
    textAlign: 'left' as const,
    borderBottom: '2px solid #e0e0e0',
    position: 'sticky' as const,
    top: 0,
    zIndex: 10,
  },
  td: {
    padding: '10px 12px',
    borderBottom: '1px solid #e0e0e0',
  },
  tr: {
    transition: 'background-color 0.2s',
  },
  trHover: {
    backgroundColor: '#f8f9fa',
  },
  // Filter styles
  filterInput: {
    width: '100%',
    padding: '6px 8px',
    border: '1px solid #ccc',
    borderRadius: '4px',
    fontSize: '13px',
    marginTop: '4px',
  },
  // Popup styles
  overlay: {
    position: 'fixed' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  popup: {
    backgroundColor: 'white',
    borderRadius: '8px',
    padding: '20px',
    maxWidth: '500px',
    width: '90%',
    maxHeight: '80vh',
    overflow: 'auto',
    boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
  },
  popupTitle: {
    fontSize: '20px',
    fontWeight: 600,
    marginBottom: '16px',
    color: '#333',
  },
  popupContent: {
    marginBottom: '20px',
    color: '#666',
  },
  popupActions: {
    display: 'flex',
    gap: '8px',
    justifyContent: 'flex-end',
  },
  // Icon button styles
  iconButton: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: '4px',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '4px',
    transition: 'background-color 0.2s',
  },
  iconButtonHover: {
    backgroundColor: '#f0f0f0',
  },
  // Container styles
  container: {
    padding: '32px',
    backgroundColor: '#f0f2f5',
    minHeight: '100vh',
  },
  card: {
    backgroundColor: 'white',
    padding: '24px',
    borderRadius: '8px',
    marginBottom: '24px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
  },
  title: {
    fontSize: '28px',
    fontWeight: 700,
    color: '#1976d2',
    marginBottom: '12px',
  },
  subtitle: {
    fontSize: '16px',
    color: '#666',
    marginBottom: '16px',
  },
  chipContainer: {
    display: 'flex',
    gap: '8px',
    flexWrap: 'wrap' as const,
    marginBottom: '16px',
  },
  chip: {
    padding: '4px 12px',
    borderRadius: '16px',
    border: '1px solid',
    fontSize: '12px',
    fontWeight: 500,
  },
  globalFilter: {
    marginBottom: '16px',
    padding: '10px 16px',
    width: '300px',
    border: '1px solid #ccc',
    borderRadius: '4px',
    fontSize: '14px',
  },
};

// =============== ATOMS ===============

// Text Atom
export const TextAtom: React.FC<{ 
  value: string; 
  onClick?: () => void; 
  clickable?: boolean 
}> = ({ value, onClick, clickable }) => {
  const [hover, setHover] = useState(false);
  
  return (
    <span
      style={{
        ...styles.text,
        ...(clickable ? styles.clickableText : {}),
        ...(clickable && hover ? { textDecoration: 'underline' } : {}),
      }}
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      {value}
    </span>
  );
};

// Number Atom
export const NumberAtom: React.FC<{ 
  value: number; 
  format?: (n: number) => string 
}> = ({ value, format }) => (
  <span style={styles.number}>
    {format ? format(value) : value.toLocaleString()}
  </span>
);

// Date Atom
export const DateAtom: React.FC<{ value: string | Date }> = ({ value }) => {
  const formatDate = (date: string | Date) => {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };
  
  return <span style={styles.date}>{formatDate(value)}</span>;
};

// Button Atom
export const ButtonAtom: React.FC<{ 
  label: string; 
  onClick: () => void; 
  variant?: 'primary' | 'secondary' | 'danger' 
}> = ({ label, onClick, variant = 'primary' }) => {
  const [hover, setHover] = useState(false);
  
  const variantStyles = {
    primary: styles.buttonPrimary,
    secondary: styles.buttonSecondary,
    danger: styles.buttonDanger,
  };
  
  return (
    <button
      style={{
        ...styles.button,
        ...variantStyles[variant],
        ...(hover ? { opacity: 0.9, transform: 'translateY(-1px)' } : {}),
      }}
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      {label}
    </button>
  );
};

// Calculated Value Atom
export const CalculatedAtom: React.FC<{ value: any; icon?: boolean }> = ({ value, icon }) => (
  <span style={styles.calculated}>
    {icon && <span>📊</span>}
    {String(value)}
  </span>
);

// Header Atom
export const HeaderAtom: React.FC<{ 
  title: string; 
  type: HeadingType; 
  icon?: string 
}> = ({ title, type, icon }) => {
  const headerStyles = {
    [HeadingType.PRIMARY]: styles.headerPrimary,
    [HeadingType.SECONDARY]: styles.headerSecondary,
    [HeadingType.TERTIARY]: styles.headerTertiary,
  };

  return (
    <div style={styles.headerContainer}>
      {icon && <span>{icon}</span>}
      <span style={headerStyles[type]}>{title}</span>
    </div>
  );
};

// =============== MOLECULES ===============

// Filter Molecule
export const FilterMolecule: React.FC<{
  columnType: ColumnType;
  value: any;
  onChange: (value: any) => void;
  placeholder?: string;
}> = ({ columnType, value, onChange, placeholder = 'Filter...' }) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (columnType === ColumnType.NUMBER) {
      onChange(val ? Number(val) : '');
    } else {
      onChange(val);
    }
  };

  return (
    <input
      type={columnType === ColumnType.NUMBER ? 'number' : 
            columnType === ColumnType.DATE ? 'date' : 'text'}
      style={styles.filterInput}
      value={value || ''}
      onChange={handleChange}
      placeholder={placeholder}
    />
  );
};

// Cell Molecule
export const CellMolecule: React.FC<{
  value: any;
  columnType: ColumnType;
  columnConfig: ColumnConfig;
  row: any;
}> = ({ value, columnType, columnConfig, row }) => {
  const [popupOpen, setPopupOpen] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);

  const handleClick = () => {
    if (columnConfig.clickable?.enabled) {
      columnConfig.clickable.onClick(row, columnConfig.id);
    }
    if (columnConfig.popup?.enabled) {
      setPopupOpen(true);
    }
  };

   const renderCell = () => {
    switch (columnType) {
      case ColumnType.TEXT:
        return (
          <TextAtom
            value={value || ''}
            onClick={handleClick}
            clickable={columnConfig.clickable?.enabled}
          />
        );
      case ColumnType.NUMBER:
        return <NumberAtom value={value} format={columnConfig.format} />;
      case ColumnType.DATE:
        return <DateAtom value={value} />;
      case ColumnType.BUTTON:
        return (
          <ButtonAtom 
            label={value || 'Action'} 
            onClick={handleClick} 
          />
        );
      case ColumnType.CALCULATED:
        return <CalculatedAtom value={value} icon />;
      default:
        return <TextAtom value={String(value)} />;
    }
  };

  return (
    <div style={{ position: 'relative' }}>
      <div
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
      >
        {renderCell()}
      </div>
      
      {showTooltip && columnConfig.clickable?.tooltip && (
        <div style={{
          position: 'absolute',
          bottom: '100%',
          left: '50%',
          transform: 'translateX(-50%)',
          backgroundColor: '#333',
          color: 'white',
          padding: '4px 8px',
          borderRadius: '4px',
          fontSize: '12px',
          whiteSpace: 'nowrap',
          zIndex: 100,
          marginBottom: '4px',
        }}>
          {columnConfig.clickable.tooltip}
        </div>
      )}
      
      {popupOpen && columnConfig.popup && (
        <PopupMolecule
          config={columnConfig.popup}
          row={row}
          onClose={() => setPopupOpen(false)}
        />
      )}
    </div>
  );
};

// Popup Molecule
export const PopupMolecule: React.FC<{
  config: PopupConfig;
  row: any;
  onClose: () => void;
}> = ({ config, row, onClose }) => (
  <div style={styles.overlay} onClick={onClose}>
    <div style={styles.popup} onClick={(e) => e.stopPropagation()}>
      <h2 style={styles.popupTitle}>{config.title || 'Details'}</h2>
      <div style={styles.popupContent}>
        {config.content ? config.content(row) : (
          <pre style={{ fontSize: '12px' }}>
            {JSON.stringify(row, null, 2)}
          </pre>
        )}
      </div>
      <div style={styles.popupActions}>
        {config.actions?.map((action, index) => (
          <ButtonAtom
            key={index}
            label={action.label}
            onClick={() => {
              action.onClick(row);
              onClose();
            }}
            variant={action.variant}
          />
        ))}
        <ButtonAtom label="Close" onClick={onClose} variant="secondary" />
      </div>
    </div>
  </div>
);

// Row Actions Molecule
export const RowActionsMolecule: React.FC<{
  row: any;
  onEdit?: (row: any) => void;
  onDelete?: (row: any) => void;
  onView?: (row: any) => void;
}> = ({ row, onEdit, onDelete, onView }) => (
  <div style={{ display: 'flex', gap: '4px' }}>
    {onView && (
      <button
        style={styles.iconButton}
        onClick={() => onView(row)}
        title="View"
      >
        👁️
      </button>
    )}
    {onEdit && (
      <button
        style={styles.iconButton}
        onClick={() => onEdit(row)}
        title="Edit"
      >
        ✏️
      </button>
    )}
    {onDelete && (
      <button
        style={styles.iconButton}
        onClick={() => onDelete(row)}
        title="Delete"
      >
        🗑️
      </button>
    )}
  </div>
);

// =============== ORGANISMS ===============

// Table Organism
export const TableOrganism = <T extends Record<string, any>>({
  columns,
  data,
  enableGlobalFilter = true,
  enableRowActions = false,
  onRowEdit,
  onRowDelete,
  onRowView,
}: TableConfig<T>) => {
  const [filters, setFilters] = useState<Record<string, any>>({});
  const [sortConfig, setSortConfig] = useState<{
    key: string | null;
    direction: 'asc' | 'desc';
  }>({ key: null, direction: 'asc' });
  const [globalFilter, setGlobalFilter] = useState('');

  const getColumnIcon = (type: ColumnType): string => {
    const icons = {
      [ColumnType.TEXT]: '📝',
      [ColumnType.NUMBER]: '🔢',
      [ColumnType.DATE]: '📅',
      [ColumnType.BUTTON]: '🔘',
      [ColumnType.CALCULATED]: '📊',
    };
    return icons[type];
  };

  const handleSort = (columnId: string) => {
    setSortConfig((prev) => ({
      key: columnId,
      direction: prev.key === columnId && prev.direction === 'asc' ? 'desc' : 'asc',
    }));
  };

  const processedData = useMemo(() => {
    let filtered = [...data];

    // Apply column filters
    Object.entries(filters).forEach(([columnId, filterValue]) => {
      if (filterValue !== '' && filterValue != null) {
        const column = columns.find(col => col.id === columnId);
        if (column) {
          filtered = filtered.filter(row => {
            const value = column.accessor
              ? typeof column.accessor === 'function'
                ? column.accessor(row)
                : row[column.accessor as string]
              : column.type === ColumnType.CALCULATED && column.calculationFn
                ? column.calculationFn(row)
                : row[columnId];

            if (column.type === ColumnType.NUMBER) {
              return Number(value) === Number(filterValue);
            }
            
            const stringValue = String(value).toLowerCase();
            const stringFilter = String(filterValue).toLowerCase();
            return stringValue.includes(stringFilter);
          });
        }
      }
    });

    // Apply global filter
    if (globalFilter) {
      const searchTerm = globalFilter.toLowerCase();
      filtered = filtered.filter(row => {
        return Object.values(row).some(value => 
          String(value).toLowerCase().includes(searchTerm)
        );
      });
    }

    // Apply sorting
    if (sortConfig.key) {
      const column = columns.find(col => col.id === sortConfig.key);
      filtered.sort((a, b) => {
        const aValue = column?.accessor
          ? typeof column.accessor === 'function'
            ? column.accessor(a)
            : a[column.accessor as string]
          : a[sortConfig.key!];
        const bValue = column?.accessor
          ? typeof column.accessor === 'function'
            ? column.accessor(b)
            : b[column.accessor as string]
          : b[sortConfig.key!];

        if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return filtered;
  }, [data, filters, sortConfig, globalFilter, columns]);

  return (
    <div>
      {enableGlobalFilter && (
        <input
          type="text"
          style={styles.globalFilter}
          placeholder="Search all columns..."
          value={globalFilter}
          onChange={(e) => setGlobalFilter(e.target.value)}
        />
      )}
      
      <table style={styles.table}>
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column.id} style={{ ...styles.th, width: column.width }}>
                <div>
                  <div 
                    style={{ cursor: column.sortable !== false ? 'pointer' : 'default' }}
                    onClick={() => column.sortable !== false && handleSort(column.id)}
                  >
                    <HeaderAtom
                      title={column.header}
                      type={column.headingType || HeadingType.SECONDARY}
                      icon={getColumnIcon(column.type)}
                    />
                    {sortConfig.key === column.id && (
                      <span style={{ marginLeft: '4px' }}>
                        {sortConfig.direction === 'asc' ? '▲' : '▼'}
                      </span>
                    )}
                  </div>
                  {column.filterable !== false && (
                    <FilterMolecule
                      columnType={column.type}
                      value={filters[column.id]}
                      onChange={(value) => 
                        setFilters(prev => ({ ...prev, [column.id]: value }))
                      }
                    />
                  )}
                </div>
              </th>
            ))}
            {enableRowActions && <th style={styles.th}>Actions</th>}
          </tr>
        </thead>
        <tbody>
          {processedData.map((row, index) => (
            <tr 
              key={index} 
              style={styles.tr}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8f9fa'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = ''}
            >
              {columns.map((column) => {
                const value = column.type === ColumnType.CALCULATED && column.calculationFn
                  ? column.calculationFn(row)
                  : column.accessor
                    ? typeof column.accessor === 'function'
                      ? column.accessor(row)
                      : row[column.accessor as string]
                    : row[column.id];

                return (
                  <td key={column.id} style={styles.td}>
                    <CellMolecule
                      value={value}
                      columnType={column.type}
                      columnConfig={column}
                      row={row}
                    />
                  </td>
                );
              })}
              {enableRowActions && (
                <td style={styles.td}>
                  <RowActionsMolecule
                    row={row}
                    onEdit={onRowEdit}
                    onDelete={onRowDelete}
                    onView={onRowView}
                  />
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// =============== DEMO COMPONENT ===============

export const DemoComponent: React.FC = () => {
  const [data, setData] = useState([
    {
      id: 1,
      name: 'John Doe',
      age: 32,
      email: 'john@example.com',
      joinDate: '2023-01-15',
      salary: 75000,
      department: 'Engineering',
      status: 'Active',
    },
    {
      id: 2,
      name: 'Jane Smith',
      age: 28,
      email: 'jane@example.com',
      joinDate: '2023-03-20',
      salary: 68000,
      department: 'Design',
      status: 'Active',
    },
    {
      id: 3,
      name: 'Bob Johnson',
      age: 45,
      email: 'bob@example.com',
      joinDate: '2022-11-10',
      salary: 92000,
      department: 'Management',
      status: 'On Leave',
    },
    {
      id: 4,
      name: 'Alice Brown',
      age: 35,
      email: 'alice@example.com',
      joinDate: '2023-06-05',
      salary: 78000,
      department: 'Engineering',
      status: 'Active',
    },
    {
      id: 5,
      name: 'Charlie Wilson',
      age: 29,
      email: 'charlie@example.com',
      joinDate: '2023-09-12',
      salary: 65000,
      department: 'Marketing',
      status: 'Active',
    },
  ]);

  const handleCellClick = (row: any, columnId: string) => {
    console.log(`Clicked on ${columnId} for row:`, row);
    alert(`You clicked on ${row.name}'s ${columnId}`);
  };

  const handleRowEdit = (row: any) => {
    console.log('Edit row:', row);
    alert(`Editing ${row.name}`);
  };

  const handleRowDelete = (row: any) => {
    console.log('Delete row:', row);
    if (confirm(`Are you sure you want to delete ${row.name}?`)) {
      setData(data.filter((d) => d.id !== row.id));
    }
  };

  const handleRowView = (row: any) => {
    console.log('View row:', row);
    alert(`Viewing details for ${row.name}`);
  };

  const columns: ColumnConfig[] = [
    {
      id: 'name',
      header: 'Employee Name',
      type: ColumnType.TEXT,
      headingType: HeadingType.PRIMARY,
      accessor: 'name',
      clickable: {
        enabled: true,
        onClick: handleCellClick,
        tooltip: 'Click to view profile',
      },
    },
    {
      id: 'age',
      header: 'Age',
      type: ColumnType.NUMBER,
      headingType: HeadingType.SECONDARY,
      accessor: 'age',
      width: 100,
    },
    {
      id: 'email',
      header: 'Email',
      type: ColumnType.TEXT,
      headingType: HeadingType.SECONDARY,
      accessor: 'email',
      popup: {
        enabled: true,
        title: 'Contact Information',
        content: (row) => (
          <div>
            <p><strong>Email:</strong> {row.email}</p>
            <p><strong>Department:</strong> {row.department}</p>
            <p><strong>Status:</strong> {row.status}</p>
          </div>
        ),
        actions: [
          {
            label: 'Send Email',
            onClick: (row) => console.log('Send email to:', row.email),
            variant: 'primary',
          },
        ],
      },
    },
    {
      id: 'joinDate',
      header: 'Join Date',
      type: ColumnType.DATE,
      headingType: HeadingType.SECONDARY,
      accessor: 'joinDate',
    },
    {
      id: 'salary',
      header: 'Salary',
      type: ColumnType.NUMBER,
      headingType: HeadingType.PRIMARY,
      accessor: 'salary',
      format: (value) => `$${value.toLocaleString()}`,
    },
    {
      id: 'annualBonus',
      header: 'Annual Bonus (10%)',
      type: ColumnType.CALCULATED,
      headingType: HeadingType.TERTIARY,
      calculationFn: (row) => `$${(row.salary * 0.1).toLocaleString()}`,
    },
    {
      id: 'status',
      header: 'Status',
      type: ColumnType.TEXT,
      accessor: 'status',
    },
    {
      id: 'action',
      header: 'Quick Action',
      type: ColumnType.BUTTON,
      accessor: () => 'Message',
      clickable: {
        enabled: true,
        onClick: (row) => alert(`Sending message to ${row.name}`),
      },
    },
  ];

  const chipColors = {
    'Text Columns': '#1976d2',
    'Number Columns': '#9c27b0',
    'Date Columns': '#2e7d32',
    'Button Columns': '#ed6c02',
    'Calculated Columns': '#0288d1',
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>Atomic Design Table System Demo</h1>
        <p style={styles.subtitle}>
          This demo showcases a table built using Atomic Design principles. 
          It demonstrates various column types, filtering, sorting, clickable cells, and popup dialogs.
        </p>
        <div style={styles.chipContainer}>
          {Object.entries(chipColors).map(([label, color]) => (
            <span 
              key={label}
              style={{ 
                ...styles.chip, 
                borderColor: color,
                color: color,
                backgroundColor: `${color}10`
              }}
            >
              {label}
            </span>
          ))}
        </div>
      </div>

      <TableOrganism
        columns={columns}
        data={data}
        enableGlobalFilter={true}
        enableRowActions={true}
        onRowEdit={handleRowEdit}
        onRowDelete={handleRowDelete}
        onRowView={handleRowView}
      />

      <div style={styles.card}>
        <h2 style={{ fontSize: '20px', marginBottom: '12px' }}>Features Demonstrated:</h2>
        <ul style={{ lineHeight: 1.8, color: '#555' }}>
          <li><strong>Atomic Design Structure:</strong> Components built from atoms → molecules → organisms</li>
          <li><strong>Column Types:</strong> Text, Number, Date, Button, and Calculated columns</li>
          <li><strong>Interactive Features:</strong> Clickable cells with tooltips and popup dialogs</li>
          <li><strong>Filtering:</strong> Type-specific filters for each column</li>
          <li><strong>Sorting:</strong> Click column headers to sort (ascending/descending)</li>
          <li><strong>Row Actions:</strong> View, Edit, and Delete operations</li>
          <li><strong>Heading Types:</strong> Primary, Secondary, and Tertiary headers with icons</li>
          <li><strong>Global Search:</strong> Search across all columns simultaneously</li>
        </ul>
      </div>
    </div>
  );
};

export default DemoComponent;