import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';
import {
  ColumnType,
  HeadingType,
  type ColumnConfig,
} from './Demo';

// Import all components (you'll need to export these from your main file)
import { TextAtom } from './Demo';
import { NumberAtom } from './Demo';
import { DateAtom } from './Demo';
import { ButtonAtom } from './Demo';
import { CalculatedAtom } from './Demo';
import { HeaderAtom } from './Demo';
import { FilterMolecule } from './Demo';
import { CellMolecule } from './Demo';
import { PopupMolecule } from './Demo';
import { RowActionsMolecule } from './Demo';
import { TableOrganism } from './Demo';
import DemoComponent from './Demo';

// =============== ATOM STORIES ===============

// TextAtom Stories
const TextAtomMeta: Meta<typeof TextAtom> = {
  title: 'Atoms/TextAtom',
  component: TextAtom,
  tags: ['autodocs'],
  argTypes: {
    value: { control: 'text' },
    clickable: { control: 'boolean' },
  },
};

export default TextAtomMeta;

type TextAtomStory = StoryObj<typeof TextAtom>;

export const TextDefault: TextAtomStory = {
  args: {
    value: 'Regular text value',
    clickable: false,
  },
};

export const TextClickable: TextAtomStory = {
  args: {
    value: 'Click me!',
    clickable: true,
    onClick: () => alert('Text clicked!'),
  },
};

export const TextLong: TextAtomStory = {
  args: {
    value: 'This is a very long text value that demonstrates how the text atom handles longer content',
    clickable: false,
  },
};

// NumberAtom Stories
export const NumberAtomMeta: Meta<typeof NumberAtom> = {
  title: 'Atoms/NumberAtom',
  component: NumberAtom,
  tags: ['autodocs'],
};

export const NumberSimple: StoryObj<typeof NumberAtom> = {
  render: () => <NumberAtom value={42} />,
};

export const NumberLarge: StoryObj<typeof NumberAtom> = {
  render: () => <NumberAtom value={1234567} />,
};

export const NumberCurrency: StoryObj<typeof NumberAtom> = {
  render: () => <NumberAtom value={75000} format={(n) => `$${n.toLocaleString()}`} />,
};

export const NumberPercentage: StoryObj<typeof NumberAtom> = {
  render: () => <NumberAtom value={0.85} format={(n) => `${(n * 100).toFixed(1)}%`} />,
};

export const NumberDecimal: StoryObj<typeof NumberAtom> = {
  render: () => <NumberAtom value={3.14159} format={(n) => n.toFixed(2)} />,
};

// DateAtom Stories
export const DateAtomMeta: Meta<typeof DateAtom> = {
  title: 'Atoms/DateAtom',
  component: DateAtom,
  tags: ['autodocs'],
};

export const DateString: StoryObj<typeof DateAtom> = {
  render: () => <DateAtom value="2023-01-15" />,
};

export const DateObject: StoryObj<typeof DateAtom> = {
  render: () => <DateAtom value={new Date('2023-06-20')} />,
};

export const DateRecent: StoryObj<typeof DateAtom> = {
  render: () => <DateAtom value={new Date()} />,
};

export const DateOld: StoryObj<typeof DateAtom> = {
  render: () => <DateAtom value="2020-03-15" />,
};

// ButtonAtom Stories
export const ButtonAtomMeta: Meta<typeof ButtonAtom> = {
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

export const ButtonPrimary: StoryObj<typeof ButtonAtom> = {
  args: {
    label: 'Primary Action',
    variant: 'primary',
    onClick: () => alert('Primary clicked!'),
  },
};

export const ButtonSecondary: StoryObj<typeof ButtonAtom> = {
  args: {
    label: 'Secondary Action',
    variant: 'secondary',
    onClick: () => alert('Secondary clicked!'),
  },
};

export const ButtonDanger: StoryObj<typeof ButtonAtom> = {
  args: {
    label: 'Delete',
    variant: 'danger',
    onClick: () => alert('Danger clicked!'),
  },
};

export const ButtonLongLabel: StoryObj<typeof ButtonAtom> = {
  args: {
    label: 'Very Long Button Label Text',
    variant: 'primary',
    onClick: () => {},
  },
};

export const ButtonShortLabel: StoryObj<typeof ButtonAtom> = {
  args: {
    label: 'OK',
    variant: 'primary',
    onClick: () => {},
  },
};

// CalculatedAtom Stories
export const CalculatedAtomMeta: Meta<typeof CalculatedAtom> = {
  title: 'Atoms/CalculatedAtom',
  component: CalculatedAtom,
  tags: ['autodocs'],
  argTypes: {
    value: { control: 'text' },
    icon: { control: 'boolean' },
  },
};

export const CalculatedWithIcon: StoryObj<typeof CalculatedAtom> = {
  args: {
    value: '$7,500',
    icon: true,
  },
};

export const CalculatedWithoutIcon: StoryObj<typeof CalculatedAtom> = {
  args: {
    value: '$7,500',
    icon: false,
  },
};

export const CalculatedComplex: StoryObj<typeof CalculatedAtom> = {
  args: {
    value: '23.4% growth',
    icon: true,
  },
};

export const CalculatedNegative: StoryObj<typeof CalculatedAtom> = {
  args: {
    value: '-$1,250',
    icon: true,
  },
};

// HeaderAtom Stories
export const HeaderAtomMeta: Meta<typeof HeaderAtom> = {
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

export const HeaderPrimary: StoryObj<typeof HeaderAtom> = {
  args: {
    title: 'Primary Header',
    type: HeadingType.PRIMARY,
    icon: '👤',
  },
};

export const HeaderSecondary: StoryObj<typeof HeaderAtom> = {
  args: {
    title: 'Secondary Header',
    type: HeadingType.SECONDARY,
    icon: '📊',
  },
};

export const HeaderTertiary: StoryObj<typeof HeaderAtom> = {
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

export const HeaderLongTitle: StoryObj<typeof HeaderAtom> = {
  args: {
    title: 'Very Long Header Title That Spans Multiple Words',
    type: HeadingType.PRIMARY,
    icon: '📋',
  },
};

// =============== MOLECULE STORIES ===============

// FilterMolecule Stories
export const FilterMoleculeMeta: Meta<typeof FilterMolecule> = {
  title: 'Molecules/FilterMolecule',
  component: FilterMolecule,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: 'Input filter component that adapts to different column types (text, number, date)',
      },
    },
  },
};

export const FilterText: StoryObj<typeof FilterMolecule> = {
  name: 'Text Filter',
  render: () => {
    const [value, setValue] = React.useState('');
    return (
      <div style={{ padding: '20px' }}>
        <p style={{ marginBottom: '8px', color: '#666' }}>Current value: "{value}"</p>
        <FilterMolecule
          columnType={ColumnType.TEXT}
          value={value}
          onChange={setValue}
          placeholder="Filter by name..."
        />
      </div>
    );
  },
};

export const FilterNumber: StoryObj<typeof FilterMolecule> = {
  name: 'Number Filter',
  render: () => {
    const [value, setValue] = React.useState('');
    return (
      <div style={{ padding: '20px' }}>
        <p style={{ marginBottom: '8px', color: '#666' }}>Current value: {value || 'empty'}</p>
        <FilterMolecule
          columnType={ColumnType.NUMBER}
          value={value}
          onChange={setValue}
          placeholder="Filter by age..."
        />
      </div>
    );
  },
};

export const FilterDate: StoryObj<typeof FilterMolecule> = {
  name: 'Date Filter',
  render: () => {
    const [value, setValue] = React.useState('');
    return (
      <div style={{ padding: '20px' }}>
        <p style={{ marginBottom: '8px', color: '#666' }}>Current value: {value || 'empty'}</p>
        <FilterMolecule
          columnType={ColumnType.DATE}
          value={value}
          onChange={setValue}
        />
      </div>
    );
  },
};

export const FilterWithState: StoryObj<typeof FilterMolecule> = {
  name: 'Filter with Pre-filled Value',
  render: () => {
    const [value, setValue] = React.useState('John');
    return (
      <div style={{ padding: '20px' }}>
        <p style={{ marginBottom: '8px', color: '#666' }}>Current value: "{value}"</p>
        <FilterMolecule
          columnType={ColumnType.TEXT}
          value={value}
          onChange={setValue}
          placeholder="Search..."
        />
        <button 
          onClick={() => setValue('')}
          style={{ marginTop: '8px', padding: '4px 12px', cursor: 'pointer' }}
        >
          Clear
        </button>
      </div>
    );
  },
};

// CellMolecule Stories
export const CellMoleculeMeta: Meta<typeof CellMolecule> = {
  title: 'Molecules/CellMolecule',
  component: CellMolecule,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: 'Universal cell component that renders different types of content based on column type',
      },
    },
  },
};

export const CellText: StoryObj<typeof CellMolecule> = {
  name: 'Text Cell',
  render: () => (
    <div style={{ padding: '20px' }}>
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
    </div>
  ),
};

export const CellNumber: StoryObj<typeof CellMolecule> = {
  name: 'Number Cell',
  render: () => (
    <div style={{ padding: '20px' }}>
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
    </div>
  ),
};

export const CellDate: StoryObj<typeof CellMolecule> = {
  name: 'Date Cell',
  render: () => (
    <div style={{ padding: '20px' }}>
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
    </div>
  ),
};

export const CellClickable: StoryObj<typeof CellMolecule> = {
  name: 'Clickable Cell with Tooltip',
  render: () => (
    <div style={{ padding: '20px' }}>
      <p style={{ marginBottom: '12px', color: '#666' }}>Hover over the cell to see tooltip</p>
      <CellMolecule
        value="John Doe"
        columnType={ColumnType.TEXT}
        columnConfig={{
          id: 'name',
          header: 'Name',
          type: ColumnType.TEXT,
          clickable: {
            enabled: true,
            onClick: (row) => alert(`Clicked on ${row.name}`),
            tooltip: 'Click to view profile',
          },
        }}
        row={{ name: 'John Doe' }}
      />
    </div>
  ),
};

export const CellWithPopup: StoryObj<typeof CellMolecule> = {
  name: 'Cell with Popup',
  render: () => (
    <div style={{ padding: '20px' }}>
      <p style={{ marginBottom: '12px', color: '#666' }}>Click the cell to open popup</p>
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
            content: (row) => (
              <div>
                <p><strong>Email:</strong> {row.email}</p>
                <p><strong>Department:</strong> Engineering</p>
                <p><strong>Status:</strong> Active</p>
              </div>
            ),
            actions: [
              {
                label: 'Send Email',
                onClick: (row) => alert(`Sending email to ${row.email}`),
                variant: 'primary',
              },
            ],
          },
        }}
        row={{ email: 'john@example.com' }}
      />
    </div>
  ),
};

export const CellButton: StoryObj<typeof CellMolecule> = {
  name: 'Button Cell',
  render: () => (
    <div style={{ padding: '20px' }}>
      <CellMolecule
        value="Send Message"
        columnType={ColumnType.BUTTON}
        columnConfig={{
          id: 'action',
          header: 'Action',
          type: ColumnType.BUTTON,
          clickable: {
            enabled: true,
            onClick: () => alert('Message sent!'),
          },
        }}
        row={{ name: 'John Doe' }}
      />
    </div>
  ),
};

export const CellCalculated: StoryObj<typeof CellMolecule> = {
  name: 'Calculated Cell',
  render: () => (
    <div style={{ padding: '20px' }}>
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
    </div>
  ),
};

// PopupMolecule Stories
export const PopupMoleculeMeta: Meta<typeof PopupMolecule> = {
  title: 'Molecules/PopupMolecule',
  component: PopupMolecule,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: 'Modal popup component with configurable content and actions',
      },
    },
  },
};

export const PopupSimple: StoryObj<typeof PopupMolecule> = {
  name: 'Simple Popup',
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
  name: 'Popup with Multiple Actions',
  render: () => (
    <PopupMolecule
      config={{
        enabled: true,
        title: 'Confirm Action',
        content: () => (
          <div>
            <p>Are you sure you want to proceed with this action?</p>
            <p style={{ color: '#666', fontSize: '14px', marginTop: '12px' }}>
              This will update the employee's status in the system.
            </p>
          </div>
        ),
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

export const PopupDanger: StoryObj<typeof PopupMolecule> = {
  name: 'Popup with Danger Action',
  render: () => (
    <PopupMolecule
      config={{
        enabled: true,
        title: 'Delete Employee',
        content: (row) => (
          <div>
            <p>Are you sure you want to delete <strong>{row.name}</strong>?</p>
            <p style={{ color: '#dc3545', marginTop: '8px' }}>
              ⚠️ This action cannot be undone.
            </p>
          </div>
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

export const PopupLongContent: StoryObj<typeof PopupMolecule> = {
  name: 'Popup with Long Content',
  render: () => (
    <PopupMolecule
      config={{
        enabled: true,
        title: 'Employee Full Profile',
        content: (row) => (
          <div style={{ lineHeight: 1.8 }}>
            <h3 style={{ marginTop: 0 }}>Personal Information</h3>
            <p><strong>Name:</strong> {row.name}</p>
            <p><strong>Email:</strong> {row.email}</p>
            <p><strong>Department:</strong> {row.department}</p>
            
            <h3>Work Information</h3>
            <p><strong>Position:</strong> Senior Developer</p>
            <p><strong>Manager:</strong> Jane Smith</p>
            <p><strong>Office:</strong> Building A, Floor 3</p>
            
            <h3>Performance Metrics</h3>
            <p><strong>Projects Completed:</strong> 24</p>
            <p><strong>Average Rating:</strong> 4.8/5.0</p>
            <p><strong>Team Satisfaction:</strong> 95%</p>
          </div>
        ),
        actions: [
          {
            label: 'Edit Profile',
            onClick: () => alert('Edit mode activated'),
            variant: 'primary',
          },
          {
            label: 'View Reports',
            onClick: () => alert('Opening reports'),
            variant: 'secondary',
          },
        ],
      }}
      row={{
        name: 'John Doe',
        email: 'john@example.com',
        department: 'Engineering',
      }}
      onClose={() => {}}
    />
  ),
};

// RowActionsMolecule Stories
export const RowActionsMoleculeMeta: Meta<typeof RowActionsMolecule> = {
  title: 'Molecules/RowActionsMolecule',
  component: RowActionsMolecule,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: 'Action buttons for table rows (View, Edit, Delete)',
      },
    },
  },
};

export const RowActionsAll: StoryObj<typeof RowActionsMolecule> = {
  name: 'All Actions',
  render: () => (
    <div style={{ padding: '20px' }}>
      <RowActionsMolecule
        row={{ id: 1, name: 'John Doe' }}
        onView={(row) => alert(`Viewing ${row.name}`)}
        onEdit={(row) => alert(`Editing ${row.name}`)}
        onDelete={(row) => alert(`Deleting ${row.name}`)}
      />
    </div>
  ),
};

export const RowActionsViewEdit: StoryObj<typeof RowActionsMolecule> = {
  name: 'View and Edit Only',
  render: () => (
    <div style={{ padding: '20px' }}>
      <RowActionsMolecule
        row={{ id: 1, name: 'John Doe' }}
        onView={(row) => alert(`Viewing ${row.name}`)}
        onEdit={(row) => alert(`Editing ${row.name}`)}
      />
    </div>
  ),
};

export const RowActionsDeleteOnly: StoryObj<typeof RowActionsMolecule> = {
  name: 'Delete Only',
  render: () => (
    <div style={{ padding: '20px' }}>
      <RowActionsMolecule
        row={{ id: 1, name: 'John Doe' }}
        onDelete={(row) => alert(`Deleting ${row.name}`)}
      />
    </div>
  ),
};

export const RowActionsViewOnly: StoryObj<typeof RowActionsMolecule> = {
  name: 'View Only',
  render: () => (
    <div style={{ padding: '20px' }}>
      <RowActionsMolecule
        row={{ id: 1, name: 'John Doe' }}
        onView={(row) => alert(`Viewing ${row.name}`)}
      />
    </div>
  ),
};

// =============== ORGANISM STORIES ===============

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

export const TableOrganismMeta: Meta<typeof TableOrganism> = {
  title: 'Organisms/TableOrganism',
  component: TableOrganism,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: 'Complete table component with filtering, sorting, and row actions',
      },
    },
  },
};

export const TableBasic: StoryObj<typeof TableOrganism> = {
  name: 'Basic Table',
  render: () => (
    <TableOrganism
      columns={basicColumns}
      data={sampleData}
      enableGlobalFilter={false}
      enableRowActions={false}
    />
  ),
};

export const TableWithGlobalFilter: StoryObj<typeof TableOrganism> = {
  name: 'With Global Filter',
  render: () => (
    <TableOrganism
      columns={basicColumns}
      data={sampleData}
      enableGlobalFilter={true}
      enableRowActions={false}
    />
  ),
};

export const TableWithRowActions: StoryObj<typeof TableOrganism> = {
  name: 'With Row Actions',
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
  {
    id: 'status',
    header: 'Status',
    type: ColumnType.TEXT,
    accessor: 'status',
  },
];

export const TableFullFeatured: StoryObj<typeof TableOrganism> = {
  name: 'Full Featured Table',
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

export const TableEmpty: StoryObj<typeof TableOrganism> = {
  name: 'Empty Table',
  render: () => (
    <div>
      <p style={{ marginBottom: '16px', color: '#666' }}>
        Example of table with no data
      </p>
      <TableOrganism
        columns={basicColumns}
        data={[]}
        enableGlobalFilter={true}
        enableRowActions={false}
      />
    </div>
  ),
};

export const TableSingleRow: StoryObj<typeof TableOrganism> = {
  name: 'Single Row',
  render: () => (
    <TableOrganism
      columns={basicColumns}
      data={[sampleData[0]]}
      enableGlobalFilter={false}
      enableRowActions={true}
      onRowView={(row) => alert(`Viewing ${row.name}`)}
      onRowEdit={(row) => alert(`Editing ${row.name}`)}
      onRowDelete={(row) => alert(`Deleting ${row.name}`)}
    />
  ),
};

export const TableLargeDataset: StoryObj<typeof TableOrganism> = {
  name: 'Large Dataset (50 rows)',
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

export const TableWithButtonColumn: StoryObj<typeof TableOrganism> = {
  name: 'With Button Column',
  render: () => {
    const columnsWithButton: ColumnConfig[] = [
      ...basicColumns,
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

    return (
      <TableOrganism
        columns={columnsWithButton}
        data={sampleData}
        enableGlobalFilter={false}
        enableRowActions={false}
      />
    );
  },
};

// =============== PAGE STORIES ===============

export const DemoMeta: Meta<typeof DemoComponent> = {
  title: 'Pages/DemoPage',
  component: DemoComponent,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'Complete demo page showcasing all table features and capabilities',
      },
    },
  },
};

export const FullDemo: StoryObj<typeof DemoComponent> = {
  name: 'Complete Demo Page',
  render: () => <DemoComponent />,
};

export const DemoInteractive: StoryObj<typeof DemoComponent> = {
  name: 'Interactive Demo',
  render: () => (
    <div>
      <div style={{ 
        padding: '16px', 
        backgroundColor: '#e3f2fd', 
        borderRadius: '4px',
        marginBottom: '16px'
      }}>
        <h3 style={{ margin: '0 0 8px 0', color: '#1976d2' }}>Interactive Demo Guide</h3>
        <ul style={{ margin: 0, paddingLeft: '20px' }}>
          <li>Click on employee names to trigger alerts</li>
          <li>Click on email addresses to open popup dialogs</li>
          <li>Use column filters to narrow down results</li>
          <li>Click column headers to sort data</li>
          <li>Try the global search to filter across all columns</li>
          <li>Use row action buttons (view, edit, delete)</li>
        </ul>
      </div>
      <DemoComponent />
    </div>
  ),
};