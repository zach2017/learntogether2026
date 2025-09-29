import React, { useState, useMemo } from 'react';
import { ChevronLeft, Menu, Search, Eye, Edit2, Trash2, ChevronUp, ChevronDown, LayoutDashboard, BarChart3, Users, Settings } from 'lucide-react';

// TypeScript interfaces
interface TableData {
  id: number;
  name: string;
  date: string;
  amount: number;
  status: 'Active' | 'Pending' | 'Completed' | 'Cancelled';
  description: string;
}

type Order = 'asc' | 'desc';
type OrderBy = keyof TableData;

// Static data function
const getStaticData = (): TableData[] => {
  return [
    {
      id: 1,
      name: 'Project Alpha',
      date: '2024-01-15',
      amount: 2500,
      status: 'Active',
      description: 'Initial development phase for new product'
    },
    {
      id: 2,
      name: 'Client Meeting',
      date: '2024-02-20',
      amount: 1200,
      status: 'Completed',
      description: 'Quarterly review meeting with stakeholders'
    },
    {
      id: 3,
      name: 'Research Task',
      date: '2024-03-10',
      amount: 3800,
      status: 'Pending',
      description: 'Market analysis and competitor research'
    },
    {
      id: 4,
      name: 'Beta Testing',
      date: '2024-04-05',
      amount: 750,
      status: 'Active',
      description: 'User acceptance testing and feedback collection'
    },
    {
      id: 5,
      name: 'Documentation',
      date: '2024-05-12',
      amount: 500,
      status: 'Completed',
      description: 'Technical documentation and API guides update'
    },
    {
      id: 6,
      name: 'Security Audit',
      date: '2024-06-18',
      amount: 4200,
      status: 'Cancelled',
      description: 'Annual security assessment and penetration testing'
    },
    {
      id: 7,
      name: 'Feature Release',
      date: '2024-07-22',
      amount: 2100,
      status: 'Active',
      description: 'New feature deployment to production'
    },
    {
      id: 8,
      name: 'Training Session',
      date: '2024-08-30',
      amount: 900,
      status: 'Pending',
      description: 'Team training workshop on new technologies'
    },
    {
      id: 9,
      name: 'Data Migration',
      date: '2024-09-05',
      amount: 3200,
      status: 'Active',
      description: 'Database migration to cloud infrastructure'
    },
    {
      id: 10,
      name: 'UI Redesign',
      date: '2024-10-10',
      amount: 2800,
      status: 'Pending',
      description: 'Complete user interface overhaul'
    }
  ];
};

// Sidebar component
const Sidebar: React.FC<{ open: boolean; onClose: () => void }> = ({ open, onClose }) => {
  const menuItems = [
    { text: 'Dashboard', icon: LayoutDashboard },
    { text: 'Analytics', icon: BarChart3 },
    { text: 'Users', icon: Users },
    { text: 'Settings', icon: Settings }
  ];

  return (
    <>
      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity"
          onClick={onClose}
        />
      )}
      
      {/* Sidebar */}
      <div
        className={`fixed left-0 top-0 h-full w-64 bg-white shadow-2xl z-50 transform transition-transform duration-300 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold text-gray-800">Menu</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
        </div>
        
        <nav className="mt-4">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.text}
                onClick={() => {
                  console.log(`Clicked ${item.text}`);
                  onClose();
                }}
                className="w-full flex items-center px-4 py-3 hover:bg-blue-50 transition-colors group"
              >
                <Icon className="w-5 h-5 mr-3 text-gray-600 group-hover:text-blue-600" />
                <span className="text-gray-700 group-hover:text-blue-600">{item.text}</span>
              </button>
            );
          })}
        </nav>
      </div>
    </>
  );
};

// Header component
const Header: React.FC<{ onMenuClick: () => void }> = ({ onMenuClick }) => {
  return (
    <header className="bg-blue-600 text-white shadow-md">
      <div className="px-4 py-4 flex items-center justify-between">
        <div className="flex items-center">
          <button
            onClick={onMenuClick}
            className="p-2 hover:bg-blue-700 rounded-lg transition-colors mr-4"
          >
            <Menu className="w-6 h-6" />
          </button>
          <h1 className="text-xl font-semibold">Dashboard Application</h1>
        </div>
        <div className="text-sm">
          Welcome, User
        </div>
      </div>
    </header>
  );
};

// Body component with table
const Body: React.FC = () => {
  const [data] = useState<TableData[]>(getStaticData());
  const [order, setOrder] = useState<Order>('asc');
  const [orderBy, setOrderBy] = useState<OrderBy>('name');
  const [currentPage, setCurrentPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');

  const handleSort = (property: OrderBy) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const filteredAndSortedData = useMemo(() => {
    let filtered = data;
    
    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter((item) =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Apply status filter
    if (statusFilter !== 'All') {
      filtered = filtered.filter((item) => item.status === statusFilter);
    }
    
    // Apply sorting
    const comparator = (a: TableData, b: TableData) => {
      const aValue = a[orderBy];
      const bValue = b[orderBy];
      
      if (bValue < aValue) {
        return order === 'asc' ? 1 : -1;
      }
      if (bValue > aValue) {
        return order === 'asc' ? -1 : 1;
      }
      return 0;
    };
    
    return filtered.sort(comparator);
  }, [data, searchTerm, statusFilter, order, orderBy]);

  const totalPages = Math.ceil(filteredAndSortedData.length / rowsPerPage);
  const paginatedData = filteredAndSortedData.slice(
    currentPage * rowsPerPage,
    currentPage * rowsPerPage + rowsPerPage
  );

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active':
        return 'bg-green-100 text-green-800';
      case 'Pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'Completed':
        return 'bg-blue-100 text-blue-800';
      case 'Cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const SortIcon: React.FC<{ column: OrderBy }> = ({ column }) => {
    if (orderBy !== column) {
      return <div className="w-4 h-4" />;
    }
    return order === 'asc' ? 
      <ChevronUp className="w-4 h-4" /> : 
      <ChevronDown className="w-4 h-4" />;
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Data Table</h2>
        
        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search by name or description..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div>
            <select
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="All">All Status</option>
              <option value="Active">Active</option>
              <option value="Pending">Pending</option>
              <option value="Completed">Completed</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>
          
          <div>
            <select
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={rowsPerPage}
              onChange={(e) => {
                setRowsPerPage(Number(e.target.value));
                setCurrentPage(0);
              }}
            >
              <option value={5}>5 rows</option>
              <option value={10}>10 rows</option>
              <option value={25}>25 rows</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b-2 border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left">
                  <button
                    onClick={() => handleSort('name')}
                    className="flex items-center space-x-1 font-semibold text-gray-700 hover:text-gray-900"
                  >
                    <span>Name (Text)</span>
                    <SortIcon column="name" />
                  </button>
                </th>
                <th className="px-4 py-3 text-left">
                  <button
                    onClick={() => handleSort('date')}
                    className="flex items-center space-x-1 font-semibold text-gray-700 hover:text-gray-900"
                  >
                    <span>Date</span>
                    <SortIcon column="date" />
                  </button>
                </th>
                <th className="px-4 py-3 text-left">
                  <button
                    onClick={() => handleSort('amount')}
                    className="flex items-center space-x-1 font-semibold text-gray-700 hover:text-gray-900"
                  >
                    <span>Amount (Number)</span>
                    <SortIcon column="amount" />
                  </button>
                </th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">Status</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">Description</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">Actions (Buttons)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {paginatedData.map((row) => (
                <tr key={row.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 text-gray-800 font-medium">{row.name}</td>
                  <td className="px-4 py-3 text-gray-600">{formatDate(row.date)}</td>
                  <td className="px-4 py-3 text-gray-800 font-semibold">
                    ${row.amount.toLocaleString()}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(row.status)}`}>
                      {row.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-600 text-sm">{row.description}</td>
                  <td className="px-4 py-3">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => console.log('View', row.id)}
                        className="p-1 hover:bg-blue-100 rounded text-blue-600 transition-colors"
                        title="View"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => console.log('Edit', row.id)}
                        className="p-1 hover:bg-green-100 rounded text-green-600 transition-colors"
                        title="Edit"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => console.log('Delete', row.id)}
                        className="p-1 hover:bg-red-100 rounded text-red-600 transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between mt-6 pt-4 border-t">
          <div className="text-sm text-gray-600">
            Showing {currentPage * rowsPerPage + 1} to{' '}
            {Math.min((currentPage + 1) * rowsPerPage, filteredAndSortedData.length)} of{' '}
            {filteredAndSortedData.length} results
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
              disabled={currentPage === 0}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Previous
            </button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const pageNumber = Math.max(0, Math.min(currentPage - 2, totalPages - 5)) + i;
              if (pageNumber >= totalPages) return null;
              return (
                <button
                  key={pageNumber}
                  onClick={() => setCurrentPage(pageNumber)}
                  className={`px-3 py-2 rounded-lg transition-colors ${
                    currentPage === pageNumber
                      ? 'bg-blue-600 text-white'
                      : 'border border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {pageNumber + 1}
                </button>
              );
            }).filter(Boolean)}
            <button
              onClick={() => setCurrentPage(Math.min(totalPages - 1, currentPage + 1))}
              disabled={currentPage >= totalPages - 1}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Main Container component
const MainContainer: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-100">
      <Header onMenuClick={() => setSidebarOpen(true)} />
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <main className="pb-8">
        <Body />
      </main>
    </div>
  );
};

export default MainContainer;