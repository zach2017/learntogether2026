const FilterMolecule: React.FC<{
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