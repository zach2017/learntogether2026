import React, { useState, useMemo, useCallback, useSyncExternalStore, useEffect } from 'react';

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
  mobileBreakpoint?: number; // New: Optional breakpoint for mobile view
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
  tableContainer: {
    overflowX: 'auto' as const,
    WebkitOverflowScrolling: 'touch',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse' as const,
    backgroundColor: 'white',
    borderRadius: '8px',
    overflow: 'hidden',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    minWidth: '600px', // Ensures table content doesn't get too cramped before scrolling
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
    padding: '16px', // Adjusted for better mobile padding
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
    width: '100%',
    maxWidth: '400px',
    border: '1px solid #ccc',
    borderRadius: '4px',
    fontSize: '14px',
    boxSizing: 'border-box' as const,
  },
  // New Mobile View Styles
  mobileCard: {
    backgroundColor: 'white',
    borderRadius: '8px',
    padding: '16px',
    marginBottom: '12px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.08)',
    borderLeft: '4px solid #1976d2',
  },
  mobileCardHeader: {
    fontSize: '18px',
    fontWeight: 600,
    marginBottom: '12px',
    color: '#333',
  },
  mobileCardRow: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '8px 0',
    borderBottom: '1px solid #f0f0f0',
  },
  mobileCardLabel: {
    fontWeight: 500,
    color: '#555',
    fontSize: '14px',
  },
  mobileCardValue: {
    textAlign: 'right' as const,
  },
  mobileCardActions: {
    display: 'flex',
    gap: '8px',
    justifyContent: 'flex-end',
    marginTop: '12px',
    paddingTop: '8px',
    borderTop: '1px solid #f0f0f0',
  },
};

// =============== ATOMS ===============

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

export const NumberAtom: React.FC<{ 
  value: number; 
  format?: (n: number) => string 
}> = ({ value, format }) => (
  <span style={styles.number}>
    {format ? format(value) : value.toLocaleString()}
  </span>
);

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

export const CalculatedAtom: React.FC<{ value: any; icon?: boolean }> = ({ value, icon }) => (
  <span style={styles.calculated}>
    {icon && <span>📊</span>}
    {String(value)}
  </span>
);

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

// New MobileCardMolecule
const MobileCardMolecule: React.FC<{
  row: any;
  columns: ColumnConfig[];
  onRowEdit?: (row: any) => void;
  onRowDelete?: (row: any) => void;
  onRowView?: (row: any) => void;
}> = ({ row, columns, onRowEdit, onRowDelete, onRowView }) => {
  const primaryColumn = columns[0]; // Assume first column is the primary display
  const primaryValue = row[primaryColumn.accessor as string] || row[primaryColumn.id];

  return (
    <div style={styles.mobileCard}>
      <div style={styles.mobileCardHeader}>{primaryValue}</div>
      {columns.map(column => {
        // Don't repeat the primary header in the body
        if (column.id === primaryColumn.id) return null; 
        
        const value = column.type === ColumnType.CALCULATED && column.calculationFn
          ? column.calculationFn(row)
          : column.accessor
            ? typeof column.accessor === 'function'
              ? column.accessor(row)
              : row[column.accessor as string]
            : row[column.id];

        // Don't render empty rows
        if (value === null || value === undefined) return null;

        return (
          <div key={column.id} style={styles.mobileCardRow}>
            <span style={styles.mobileCardLabel}>{column.header}</span>
            <div style={styles.mobileCardValue}>
              <CellMolecule
                value={value}
                columnType={column.type}
                columnConfig={column}
                row={row}
              />
            </div>
          </div>
        );
      })}
      {(onRowEdit || onRowDelete || onRowView) && (
        <div style={styles.mobileCardActions}>
          <RowActionsMolecule
            row={row}
            onEdit={onRowEdit}
            onDelete={onRowDelete}
            onView={onRowView}
          />
        </div>
      )}
    </div>
  );
};


// =============== ORGANISMS ===============

// New MobileCardListOrganism
const MobileCardListOrganism = <T extends Record<string, any>>({
  columns,
  data,
  onRowEdit,
  onRowDelete,
  onRowView,
}: TableConfig<T>) => {
  return (
    <div>
      {data.map((row, index) => (
        <MobileCardMolecule
          key={index}
          row={row}
          columns={columns}
          onRowEdit={onRowEdit}
          onRowDelete={onRowDelete}
          onRowView={onRowView}
        />
      ))}
    </div>
  );
};


export const TableOrganism = <T extends Record<string, any>>({
  columns,
  data,
  enableGlobalFilter = true,
  enableRowActions = false,
  onRowEdit,
  onRowDelete,
  onRowView,
  mobileBreakpoint = 768, // Default mobile breakpoint
}: TableConfig<T>) => {
  const [filters, setFilters] = useState<Record<string, any>>({});
  const [sortConfig, setSortConfig] = useState<{
    key: string | null;
    direction: 'asc' | 'desc';
  }>({ key: null, direction: 'asc' });
  const [globalFilter, setGlobalFilter] = useState('');

  // Responsive Hook
  const { width } = useWindowSize();
  const isMobile = width <= mobileBreakpoint;

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

    // Apply column filters (only for desktop view for simplicity)
    if (!isMobile) {
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
    }

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
  }, [data, filters, sortConfig, globalFilter, columns, isMobile]);

  return (
    <div>
      {enableGlobalFilter && (
        <input
          type="text"
          style={styles.globalFilter}
          placeholder="Search..."
          value={globalFilter}
          onChange={(e) => setGlobalFilter(e.target.value)}
        />
      )}
      
      {isMobile ? (
        <MobileCardListOrganism
            columns={columns}
            data={processedData}
            onRowEdit={onRowEdit}
            onRowDelete={onRowDelete}
            onRowView={onRowView}
        />
      ) : (
        <div style={styles.tableContainer}>
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
      )}
    </div>
  );
};

// =============== HELPER FUNCTIONS ===============

// New: A hook to get window size
const useWindowSize = () => {
  const [size, setSize] = useState([window.innerWidth, window.innerHeight]);
  useEffect(() => {
    const handleResize = () => {
      setSize([window.innerWidth, window.innerHeight]);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  return { width: size[0], height: size[1] };
};


const buildColumnsFromJSON = (
  jsonColumns: any[],
  handlers: {
    handleCellClick: (row: any, columnId: string) => void;
  }
): ColumnConfig[] => {
  return jsonColumns.map((col) => {
    const columnConfig: ColumnConfig = {
      id: col.id,
      header: col.header,
      type: col.type as ColumnType,
      headingType: col.headingType ? col.headingType as HeadingType : HeadingType.SECONDARY,
      accessor: col.accessor,
      width: col.width,
    };

    // Handle clickable configuration
    if (col.clickable?.enabled) {
      columnConfig.clickable = {
        enabled: true,
        onClick: handlers.handleCellClick,
        tooltip: col.clickable.tooltip,
      };
    }

    // Handle popup configuration
    if (col.popup?.enabled) {
      columnConfig.popup = {
        enabled: true,
        title: col.popup.title,
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
      };
    }

    // Handle format types
    if (col.formatType === 'currency') {
      columnConfig.format = (value) => `$${Number(value).toLocaleString()}`;
    }

    // Handle calculated columns
    if (col.type === 'calculated' && col.calculationType === 'salaryBonus') {
      columnConfig.calculationFn = (row) => `$${(row.salary * 0.1).toLocaleString()}`;
    }

    // Handle button columns
    if (col.type === 'button') {
      columnConfig.accessor = () => col.buttonLabel || 'Action';
    }

    return columnConfig;
  });
};

// =============== DEMO COMPONENT ===============
 const jsonData = {
    "pageConfig": {
      "title": "Atomic Design Table System Demo",
      "subtitle": "This demo showcases a table built using Atomic Design principles. It demonstrates various column types, filtering, sorting, clickable cells, and popup dialogs.",
      "chipColors": {
        "Text Columns": "#1976d2",
        "Number Columns": "#9c27b0",
        "Date Columns": "#2e7d32",
        "Button Columns": "#ed6c02",
        "Calculated Columns": "#0288d1"
      },
      "features": [
        { "title": "Atomic Design Structure", "description": "Components built from atoms → molecules → organisms" },
        { "title": "Fully Responsive", "description": "Switches to a card view on mobile and supports horizontal scrolling on tablets." },
        { "title": "State Management", "description": "Uses `useSyncExternalStore` for reactive, prop-drilling-free state." },
        { "title": "Interactive Features", "description": "Clickable cells with tooltips and popup dialogs" },
        { "title": "Filtering & Sorting", "description": "Global search works on all devices; column filters and sorting are available on desktop." },
        { "title": "Row Actions", "description": "View, Edit, and Delete operations available on all views." },
      ]
    },
    "tableConfig": { "enableGlobalFilter": true, "enableRowActions": true },
    "columns": [
      { "id": "name", "header": "Employee Name", "type": "text", "headingType": "primary", "accessor": "name", "clickable": { "enabled": true, "tooltip": "Click to view profile" } },
      { "id": "age", "header": "Age", "type": "number", "headingType": "secondary", "accessor": "age", "width": 100 },
      { "id": "email", "header": "Email", "type": "text", "headingType": "secondary", "accessor": "email", "popup": { "enabled": true, "title": "Contact Information" } },
      { "id": "joinDate", "header": "Join Date", "type": "date", "headingType": "secondary", "accessor": "joinDate" },
      { "id": "salary", "header": "Salary", "type": "number", "headingType": "primary", "accessor": "salary", "formatType": "currency" },
      { "id": "annualBonus", "header": "Annual Bonus (10%)", "type": "calculated", "headingType": "tertiary", "calculationType": "salaryBonus" },
      { "id": "status", "header": "Status", "type": "text", "accessor": "status" },
      { "id": "action", "header": "Quick Action", "type": "button", "buttonLabel": "Message", "clickable": { "enabled": true } }
    ],
    "employees": [
      { "id": 1, "name": "John Doe", "age": 32, "email": "john@example.com", "joinDate": "2023-01-15", "salary": 75000, "department": "Engineering", "status": "Active" },
      { "id": 2, "name": "Jane Smith", "age": 28, "email": "jane@example.com", "joinDate": "2023-03-20", "salary": 68000, "department": "Design", "status": "Active" },
      { "id": 3, "name": "Bob Johnson", "age": 45, "email": "bob@example.com", "joinDate": "2022-11-10", "salary": 92000, "department": "Management", "status": "On Leave" },
      { "id": 4, "name": "Alice Brown", "age": 35, "email": "alice@example.com", "joinDate": "2023-06-05", "salary": 78000, "department": "Engineering", "status": "Active" },
      { "id": 5, "name": "Charlie Wilson", "age": 29, "email": "charlie@example.com", "joinDate": "2023-09-12", "salary": 65000, "department": "Marketing", "status": "Active" }
    ]
  };
  
// =============== REAL-TIME STORE (no prop drilling) ===============
type Employee = typeof jsonData.employees[number];

type DemoState = { employees: Employee[] };

// initialize with your demo data
let demoState: DemoState = { employees: jsonData.employees };

const listeners = new Set<() => void>();
const emit = () => listeners.forEach(l => l());

export const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

export const getSnapshot = () => demoState;

// Single setter—call from anywhere (buttons, websockets, timers…)
export const setEmployees = (updater: (list: Employee[]) => Employee[]) => {
  demoState = { employees: updater(demoState.employees) };
  emit();
};

// Hook any component can use to read live state (and auto re-render)
export function useDemoStore<T>(selector: (s: DemoState) => T) {
  return useSyncExternalStore(subscribe, () => selector(getSnapshot()));
}

  
const DemoComponent: React.FC = () => {
  // Mock WebSocket updates
 useEffect(() => {
    console.log("Mock WebSocket connection initialized. State changes will be simulated via UI buttons.");
    // In a real app, you would have WebSocket logic here:
    // const ws = new WebSocket('ws://localhost:3001'); 
    // ws.onmessage = (e) => {
    //   const incoming = JSON.parse(e.data) as Partial<Employee> & { id: number };
    //   setEmployees(list =>
    //     list.map(emp => (emp.id === incoming.id ? { ...emp, ...incoming } : emp))
    //   );
    // };
    // return () => ws.close();
}, []);


   const data = useDemoStore(s => s.employees);

  // Event handlers
  const handleCellClick = (row: any, columnId: string) => {
    console.log(`Clicked on ${columnId} for row:`, row);
    alert(`You clicked on ${row.name}'s ${columnId}`);
  };

  const handleRowEdit = (row: any) => {
    console.log('Edit row:', row);
    alert(`Editing ${row.name}`);
    // Example edit: give +$500 raise
    setEmployees(list =>
      list.map(e => (e.id === row.id ? { ...e, salary: e.salary + 500 } : e))
    );
  };

  const handleRowDelete = (row: any) => {
    console.log('Delete row:', row);
    if (confirm(`Are you sure you want to delete ${row.name}?`)) {
      setEmployees(list => list.filter(d => d.id !== row.id));
    }
  };

  const handleRowView = (row: any) => {
    console.log('View row:', row);
    alert(`Viewing details for ${row.name}`);
  };

  // Build columns from JSON
  const columns = buildColumnsFromJSON(jsonData.columns, { handleCellClick });

  // --- Extra: a small component that also “listens” to changes
  const ActiveCountChip: React.FC = () => {
    const active = useDemoStore(s => s.employees.filter(e => e.status === 'Active').length);
    return (
      <span
        style={{
          ...styles.chip,
          borderColor: '#2e7d32',
          color: '#2e7d32',
          backgroundColor: '#2e7d3210',
        }}
      >
        Active Employees: {active}
      </span>
    );
  };


  
  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>{jsonData.pageConfig.title}</h1>
        <p style={styles.subtitle}>{jsonData.pageConfig.subtitle}</p>
        <div style={styles.chipContainer}>
          {Object.entries(jsonData.pageConfig.chipColors).map(([label, color]) => (
            <span
              key={label}
              style={{
                ...styles.chip,
                borderColor: color as string,
                color: color as string,
                backgroundColor: `${color}10`,
              }}
            >
              {label}
            </span>
          ))}
          {/* Live badge that updates whenever the table data changes */}
          <ActiveCountChip />
        </div>

        {/* DEMO: Toggle data button (flip John’s status) */}
        <ButtonAtom
          label="Toggle John Doe Status"
          onClick={() => {
            setEmployees(list =>
              list.map(e =>
                e.name === 'John Doe'
                  ? { ...e, status: e.status === 'Active' ? 'On Leave' : 'Active' }
                  : e
              )
            );
          }}
          variant="primary"
        />

        {/* DEMO: Randomize all salaries to see calculated column update */}
        <div style={{ marginTop: 8 }}>
          <ButtonAtom
            label="Randomize Salaries"
            onClick={() => {
              setEmployees(list =>
                list.map(e => ({ ...e, salary: Math.round(60000 + Math.random() * 40000) }))
              );
            }}
            variant="secondary"
          />
        </div>
      </div>

      <TableOrganism
        columns={columns}
        data={data}
        enableGlobalFilter={jsonData.tableConfig.enableGlobalFilter}
        enableRowActions={jsonData.tableConfig.enableRowActions}
        onRowEdit={handleRowEdit}
        onRowDelete={handleRowDelete}
        onRowView={handleRowView}
      />

      <div style={{ ...styles.card, marginTop: '24px' }}>
        <h2 style={{ fontSize: '20px', marginBottom: '12px' }}>Features Demonstrated:</h2>
        <ul style={{ lineHeight: 1.8, color: '#555', paddingLeft: '20px' }}>
          {jsonData.pageConfig.features.map((feature, index) => (
            <li key={index}>
              <strong>{feature.title}:</strong> {feature.description}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default DemoComponent;