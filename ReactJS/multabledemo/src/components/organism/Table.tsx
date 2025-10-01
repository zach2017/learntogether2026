
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