import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';
import {
  TextAtom,
  NumberAtom,
  DateAtom,
  ButtonAtom,
  CalculatedAtom,
  HeaderAtom,
  FilterMolecule,
  CellMolecule,
  PopupMolecule,
  RowActionsMolecule,
  TableOrganism,
  ColumnType,
  HeadingType,
  type ColumnConfig,
} from './Demo';

// =============== ATOM STORIES ===============

// TextAtom Stories
export default {
  title: 'Atoms/TextAtom',
  component: TextAtom,
  tags: ['autodocs'],
  argTypes: {
    value: { control: 'text' },
    clickable: { control: 'boolean' },
  },
} as Meta<typeof TextAtom>;

type TextAtomStory = StoryObj<typeof TextAtom>;

export const Default: TextAtomStory = {
  args: {
    value: 'Regular text value',
    clickable: false,
  },
};

export const Clickable: TextAtomStory = {
  args: {
    value: 'Click me!',
    clickable: true,
    onClick: () => alert('Text clicked!'),
  },
};

export const LongText: TextAtomStory = {
  args: {
    value: 'This is a very long text value that demonstrates how the text atom handles longer content',
    clickable: false,
  },
};

// NumberAtom Stories
const NumberAtomMeta: Meta<typeof NumberAtom> = {
  title: 'Atoms/NumberAtom',
  component: NumberAtom,
  tags: ['autodocs'],
};

export const NumberAtomStories = NumberAtomMeta;

export const SimpleNumber: StoryObj<typeof NumberAtom> = {
  render: () => <NumberAtom value={42} />,
};

export const LargeNumber: StoryObj<typeof NumberAtom> = {
  render: () => <NumberAtom value={1234567} />,
};

export const FormattedCurrency: StoryObj<typeof NumberAtom> = {
  render: () => <NumberAtom value={75000} format={(n) => `$${n.toLocaleString()}`} />,
};

export const FormattedPercentage: StoryObj<typeof NumberAtom> = {
  render: () => <NumberAtom value={0.85} format={(n) => `${(n * 100).toFixed(1)}%`} />,
};

// DateAtom Stories
const DateAtomMeta: Meta<typeof DateAtom> = {
  title: 'Atoms/DateAtom',
  component: DateAtom,
  tags: ['autodocs'],
};

export const DateAtomStories = DateAtomMeta;

export const DateString: StoryObj<typeof DateAtom> = {
  render: () => <DateAtom value="2023-01-15" />,
};

export const DateObject: StoryObj<typeof DateAtom> = {
  render: () => <DateAtom value={new Date('2023-06-20')} />,
};

export const RecentDate: StoryObj<typeof DateAtom> = {
  render: () => <DateAtom value={new Date()} />,
};

// ButtonAtom Stories
const ButtonAtomMeta: Meta<typeof ButtonAtom> = {
  title: 'Atoms/ButtonAtom',
  component: ButtonAtom,
  tags: ['autodocs'],
  argTypes: {
    label: { control: 'text' },
    variant: {
      control: 'select',
      options: ['primary', 'secondary', 'danger'],
    },
  },
};

export const ButtonAtomStories = ButtonAtomMeta;

export const PrimaryButton: StoryObj<typeof ButtonAtom> = {
  args: {
    label: 'Primary Action',
    variant: 'primary',
    onClick: () => alert('Primary clicked!'),
  },
};

export const SecondaryButton: StoryObj<typeof ButtonAtom> = {
  args: {
    label: 'Secondary Action',
    variant: 'secondary',
    onClick: () => alert('Secondary clicked!'),
  },
};

export const DangerButton: StoryObj<typeof ButtonAtom> = {
  args: {
    label: 'Delete',
    variant: 'danger',
    onClick: () => alert('Danger clicked!'),
  },
};

export const LongLabel: StoryObj<typeof ButtonAtom> = {
  args: {
    label: 'Very Long Button Label Text',
    variant: 'primary',
    onClick: () => {},
  },
};

// CalculatedAtom Stories
const CalculatedAtomMeta: Meta<typeof CalculatedAtom> = {
  title: 'Atoms/CalculatedAtom',
  component: CalculatedAtom,
  tags: ['autodocs'],
  argTypes: {
    value: { control: 'text' },
    icon: { control: 'boolean' },
  },
};

export const CalculatedAtomStories = CalculatedAtomMeta;

export const WithIcon: StoryObj<typeof CalculatedAtom> = {
  args: {
    value: '$7,500',
    icon: true,
  },
};

export const WithoutIcon: StoryObj<typeof CalculatedAtom> = {
  args: {
    value: '$7,500',
    icon: false,
  },
};

export const ComplexCalculation: StoryObj<typeof CalculatedAtom> = {
  args: {
    value: '23.4% growth',
    icon: true,
  },
};

// HeaderAtom Stories
const HeaderAtomMeta: Meta<typeof HeaderAtom> = {
  title: 'Atoms/HeaderAtom',
  component: HeaderAtom,
  tags: ['autodocs'],
  argTypes: {
    title: { control: 'text' },
    type: {
      control: 'select',
      options: [HeadingType.PRIMARY, HeadingType.SECONDARY, HeadingType.TERTIARY],
    },
    icon: { control: 'text' },
  },
};

export const HeaderAtomStories = HeaderAtomMeta;

export const PrimaryHeader: StoryObj<typeof HeaderAtom> = {
  args: {
    title: 'Primary Header',
    type: HeadingType.PRIMARY,
    icon: '👤',
  },
};

export const SecondaryHeader: StoryObj<typeof HeaderAtom> = {
  args: {
    title: 'Secondary Header',
    type: HeadingType.SECONDARY,
    icon: '📊',
  },
};

export const TertiaryHeader: StoryObj<typeof HeaderAtom> = {
  args: {
    title: 'Tertiary Header',
    type: HeadingType.TERTIARY,
    icon: '📝',
  },
};

export const HeaderNoIcon: StoryObj<typeof HeaderAtom> = {
  args: {
    title: 'Header Without Icon',
    type: HeadingType.PRIMARY,
  },
};

// =============== MOLECULE STORIES ===============

// FilterMolecule Stories
const FilterMoleculeMeta: Meta<typeof FilterMolecule> = {
  title: 'Molecules/FilterMolecule',
  component: FilterMolecule,
  tags: ['autodocs'],
};

export const FilterMoleculeStories = FilterMoleculeMeta;

export const TextFilter: StoryObj<typeof FilterMolecule> = {
  render: () => {
    const [value, setValue] = React.useState('');
    return (
      <FilterMolecule
        columnType={ColumnType.TEXT}
        value={value}
        onChange={setValue}
        placeholder="Filter by name..."
      />
    );
  },
};

export const NumberFilter: StoryObj<typeof FilterMolecule> = {
  render: () => {
    const [value, setValue] = React.useState('');
    return (
      <FilterMolecule
        columnType={ColumnType.NUMBER}
        value={value}
        onChange={setValue}
        placeholder="Filter by age..."
      />
    );
  },
};

export const DateFilter: StoryObj<typeof FilterMolecule> = {
  render: () => {
    const [value, setValue] = React.useState('');
    return (
      <FilterMolecule
        columnType={ColumnType.DATE}
        value={value}
        onChange={setValue}
      />
    );
  },
};

// CellMolecule Stories
const CellMoleculeMeta: Meta<typeof CellMolecule> = {
  title: 'Molecules/CellMolecule',
  component: CellMolecule,
  tags: ['autodocs'],
};

export const CellMoleculeStories = CellMoleculeMeta;

export const TextCell: StoryObj<typeof CellMolecule> = {
  render: () => (
    <CellMolecule
      value="John Doe"
      columnType={ColumnType.TEXT}
      columnConfig={{
        id: 'name',
        header: 'Name',
        type: ColumnType.TEXT,
      }}
      row={{ name: 'John Doe' }}
    />
  ),
};

export const NumberCell: StoryObj<typeof CellMolecule> = {
  render: () => (
    <CellMolecule
      value={75000}
      columnType={ColumnType.NUMBER}
      columnConfig={{
        id: 'salary',
        header: 'Salary',
        type: ColumnType.NUMBER,
        format: (value) => `$${value.toLocaleString()}`,
      }}
      row={{ salary: 75000 }}
    />
  ),
};

export const DateCell: StoryObj<typeof CellMolecule> = {
  render: () => (
    <CellMolecule
      value="2023-01-15"
      columnType={ColumnType.DATE}
      columnConfig={{
        id: 'joinDate',
        header: 'Join Date',
        type: ColumnType.DATE,
      }}
      row={{ joinDate: '2023-01-15' }}
    />
  ),
};

export const ClickableCell: StoryObj<typeof CellMolecule> = {
  render: () => (
    <CellMolecule
      value="John Doe"
      columnType={ColumnType.TEXT}
      columnConfig={{
        id: 'name',
        header: 'Name',
        type: ColumnType.TEXT,
        clickable: {
          enabled: true,
          onClick: () => alert('Cell clicked!'),
          tooltip: 'Click to view profile',
        },
      }}
      row={{ name: 'John Doe' }}
    />
  ),
};

export const CellWithPopup: StoryObj<typeof CellMolecule> = {
  render: () => (
    <CellMolecule
      value="john@example.com"
      columnType={ColumnType.TEXT}
      columnConfig={{
        id: 'email',
        header: 'Email',
        type: ColumnType.TEXT,
        popup: {
          enabled: true,
          title: 'Contact Details',
          content: (row) => <div><p>Email: {row.email}</p></div>,
        },
      }}
      row={{ email: 'john@example.com' }}
    />
  ),
};

export const ButtonCell: StoryObj<typeof CellMolecule> = {
  render: () => (
    <CellMolecule
      value="Send Message"
      columnType={ColumnType.BUTTON}
      columnConfig={{
        id: 'action',
        header: 'Action',
        type: ColumnType.BUTTON,
        clickable: {
          enabled: true,
          onClick: () => alert('Button clicked!'),
        },
      }}
      row={{}}
    />
  ),
};

export const CalculatedCell: StoryObj<typeof CellMolecule> = {
  render: () => (
    <CellMolecule
      value="$7,500"
      columnType={ColumnType.CALCULATED}
      columnConfig={{
        id: 'bonus',
        header: 'Bonus',
        type: ColumnType.CALCULATED,
      }}
      row={{ salary: 75000 }}
    />
  ),
};

// PopupMolecule Stories
const PopupMoleculeMeta: Meta<typeof PopupMolecule> = {
  title: 'Molecules/PopupMolecule',
  component: PopupMolecule,
  tags: ['autodocs'],
};

export const PopupMoleculeStories = PopupMoleculeMeta;

export const SimplePopup: StoryObj<typeof PopupMolecule> = {
  render: () => (
    <PopupMolecule
      config={{
        enabled: true,
        title: 'Employee Details',
        content: (row) => (
          <div>
            <p><strong>Name:</strong> {row.name}</p>
            <p><strong>Email:</strong> {row.email}</p>
            <p><strong>Department:</strong> {row.department}</p>
          </div>
        ),
      }}
      row={{
        name: 'John Doe',
        email: 'john@example.com',
        department: 'Engineering',
      }}
      onClose={() => alert('Popup closed')}
    />
  ),
};

export const PopupWithActions: StoryObj<typeof PopupMolecule> = {
  render: () => (
    <PopupMolecule
      config={{
        enabled: true,
        title: 'Confirm Action',
        content: () => <p>Are you sure you want to proceed with this action?</p>,
        actions: [
          {
            label: 'Confirm',
            onClick: () => alert('Confirmed!'),
            variant: 'primary',
          },
          {
            label: 'Cancel',
            onClick: () => alert('Cancelled'),
            variant: 'secondary',
          },
        ],
      }}
      row={{}}
      onClose={() => {}}
    />
  ),
};

export const PopupWithDangerAction: StoryObj<typeof PopupMolecule> = {
  render: () => (
    <PopupMolecule
      config={{
        enabled: true,
        title: 'Delete Employee',
        content: (row) => (
          <p>Are you sure you want to delete <strong>{row.name}</strong>? This action cannot be undone.</p>
        ),
        actions: [
          {
            label: 'Delete',
            onClick: () => alert('Deleted!'),
            variant: 'danger',
          },
        ],
      }}
      row={{ name: 'John Doe' }}
      onClose={() => {}}
    />
  ),
};

// RowActionsMolecule Stories
const RowActionsMoleculeMeta: Meta<typeof RowActionsMolecule> = {
  title: 'Molecules/RowActionsMolecule',
  component: RowActionsMolecule,
  tags: ['autodocs'],
};

export const RowActionsMoleculeStories = RowActionsMoleculeMeta;

export const AllActions: StoryObj<typeof RowActionsMolecule> = {
  render: () => (
    <RowActionsMolecule
      row={{ id: 1, name: 'John Doe' }}
      onView={(row) => alert(`Viewing ${row.name}`)}
      onEdit={(row) => alert(`Editing ${row.name}`)}
      onDelete={(row) => alert(`Deleting ${row.name}`)}
    />
  ),
};

export const ViewAndEdit: StoryObj<typeof RowActionsMolecule> = {
  render: () => (
    <RowActionsMolecule
      row={{ id: 1, name: 'John Doe' }}
      onView={(row) => alert(`Viewing ${row.name}`)}
      onEdit={(row) => alert(`Editing ${row.name}`)}
    />
  ),
};

export const OnlyDelete: StoryObj<typeof RowActionsMolecule> = {
  render: () => (
    <RowActionsMolecule
      row={{ id: 1, name: 'John Doe' }}
      onDelete={(row) => alert(`Deleting ${row.name}`)}
    />
  ),
};

// =============== ORGANISM STORIES ===============

// TableOrganism Stories
const TableOrganismMeta: Meta<typeof TableOrganism> = {
  title: 'Organisms/TableOrganism',
  component: TableOrganism,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
  },
};

export const TableOrganismStories = TableOrganismMeta;

const sampleData = [
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
];

const basicColumns: ColumnConfig[] = [
  {
    id: 'name',
    header: 'Name',
    type: ColumnType.TEXT,
    headingType: HeadingType.PRIMARY,
    accessor: 'name',
  },
  {
    id: 'age',
    header: 'Age',
    type: ColumnType.NUMBER,
    accessor: 'age',
  },
  {
    id: 'email',
    header: 'Email',
    type: ColumnType.TEXT,
    accessor: 'email',
  },
  {
    id: 'department',
    header: 'Department',
    type: ColumnType.TEXT,
    accessor: 'department',
  },
];

export const BasicTable: StoryObj<typeof TableOrganism> = {
  render: () => (
    <TableOrganism
      columns={basicColumns}
      data={sampleData}
      enableGlobalFilter={false}
      enableRowActions={false}
    />
  ),
};

export const WithGlobalFilter: StoryObj<typeof TableOrganism> = {
  render: () => (
    <TableOrganism
      columns={basicColumns}
      data={sampleData}
      enableGlobalFilter={true}
      enableRowActions={false}
    />
  ),
};

export const WithRowActions: StoryObj<typeof TableOrganism> = {
  render: () => (
    <TableOrganism
      columns={basicColumns}
      data={sampleData}
      enableGlobalFilter={true}
      enableRowActions={true}
      onRowView={(row) => alert(`Viewing ${row.name}`)}
      onRowEdit={(row) => alert(`Editing ${row.name}`)}
      onRowDelete={(row) => alert(`Deleting ${row.name}`)}
    />
  ),
};

const advancedColumns: ColumnConfig[] = [
  {
    id: 'name',
    header: 'Employee Name',
    type: ColumnType.TEXT,
    headingType: HeadingType.PRIMARY,
    accessor: 'name',
    clickable: {
      enabled: true,
      onClick: (row) => alert(`Clicked ${row.name}`),
      tooltip: 'Click to view profile',
    },
  },
  {
    id: 'age',
    header: 'Age',
    type: ColumnType.NUMBER,
    accessor: 'age',
    width: 100,
  },
  {
    id: 'email',
    header: 'Email',
    type: ColumnType.TEXT,
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
          onClick: (row) => alert(`Emailing ${row.email}`),
          variant: 'primary',
        },
      ],
    },
  },
  {
    id: 'joinDate',
    header: 'Join Date',
    type: ColumnType.DATE,
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
    id: 'bonus',
    header: 'Annual Bonus (10%)',
    type: ColumnType.CALCULATED,
    headingType: HeadingType.TERTIARY,
    calculationFn: (row) => `$${(row.salary * 0.1).toLocaleString()}`,
  },
];

export const FullFeaturedTable: StoryObj<typeof TableOrganism> = {
  render: () => (
    <TableOrganism
      columns={advancedColumns}
      data={sampleData}
      enableGlobalFilter={true}
      enableRowActions={true}
      onRowView={(row) => alert(`Viewing ${row.name}`)}
      onRowEdit={(row) => alert(`Editing ${row.name}`)}
      onRowDelete={(row) => alert(`Deleting ${row.name}`)}
    />
  ),
};

export const EmptyTable: StoryObj<typeof TableOrganism> = {
  render: () => (
    <TableOrganism
      columns={basicColumns}
      data={[]}
      enableGlobalFilter={true}
      enableRowActions={false}
    />
  ),
};

export const LargeDataset: StoryObj<typeof TableOrganism> = {
  render: () => {
    const largeData = Array.from({ length: 50 }, (_, i) => ({
      id: i + 1,
      name: `Employee ${i + 1}`,
      age: 25 + (i % 30),
      email: `employee${i + 1}@example.com`,
      joinDate: `2023-${String((i % 12) + 1).padStart(2, '0')}-15`,
      salary: 50000 + (i * 1000),
      department: ['Engineering', 'Design', 'Marketing', 'Sales'][i % 4],
      status: i % 5 === 0 ? 'On Leave' : 'Active',
    }));

    return (
      <TableOrganism
        columns={advancedColumns}
        data={largeData}
        enableGlobalFilter={true}
        enableRowActions={true}
        onRowView={(row) => alert(`Viewing ${row.name}`)}
        onRowEdit={(row) => alert(`Editing ${row.name}`)}
        onRowDelete={(row) => alert(`Deleting ${row.name}`)}
      />
    );
  },
};