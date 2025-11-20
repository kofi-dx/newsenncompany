/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
// app/manager/team/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';

interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  address: string;
  jobTitle: string;
  department: string;
  employmentType: string;
  startDate: string;
  workLocation: string;
  reportingManager: string;
  role: string;
  permissions: string[];
  tools: string[];
  securityLevel: string;
  baseSalary: number;
  payFrequency: string;
  currency: string;
  status: 'active' | 'inactive' | 'suspended' | 'pending';
  businessId?: string;
  managerId: string;
  lastLogin?: any;
  createdAt: any;
  updatedAt: any;
}

export default function ManagerTeam() {
  const { user } = useAuth();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDepartment, setFilterDepartment] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [updating, setUpdating] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  useEffect(() => {
    fetchTeamMembers();
  }, [user]);

  const fetchTeamMembers = async () => {
    if (!user) return;

    try {
      const employeesQuery = query(
        collection(db, 'users'),
        where('managerId', '==', user.id)
      );
      const snapshot = await getDocs(employeesQuery);
      const employeesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Employee[];
      
      setEmployees(employeesData);
    } catch (error) {
      console.error('Error fetching team members:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (employeeId: string, newStatus: Employee['status']) => {
    setUpdating(employeeId);
    try {
      await updateDoc(doc(db, 'users', employeeId), {
        status: newStatus,
        updatedAt: new Date()
      });
      
      await fetchTeamMembers();
      setShowDetails(false);
    } catch (error) {
      console.error('Error updating employee status:', error);
      alert('Error updating employee status. Please try again.');
    } finally {
      setUpdating(null);
    }
  };

  const viewDetails = (employee: Employee) => {
    setSelectedEmployee(employee);
    setShowDetails(true);
  };

  // Filter employees based on search and filters
  const filteredEmployees = employees.filter(employee => {
    const matchesSearch = 
      employee.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.jobTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.businessId?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesDepartment = filterDepartment === 'all' || employee.department === filterDepartment;
    const matchesStatus = filterStatus === 'all' || employee.status === filterStatus;

    return matchesSearch && matchesDepartment && matchesStatus;
  });

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatLastLogin = (lastLogin: any) => {
    if (!lastLogin) return 'Never';
    
    const lastLoginDate = lastLogin.toDate();
    const now = new Date();
    const diffMs = now.getTime() - lastLoginDate.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return lastLoginDate.toLocaleDateString();
  };

  const getStatusColor = (status: Employee['status']) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 border-green-200';
      case 'inactive': return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'suspended': return 'bg-red-100 text-red-800 border-red-200';
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: Employee['status']) => {
    switch (status) {
      case 'active': return '🟢';
      case 'inactive': return '⚪';
      case 'suspended': return '🔴';
      case 'pending': return '🟡';
      default: return '⚪';
    }
  };

  const getDepartments = () => {
    const departments = new Set(employees.map(emp => emp.department));
    return ['all', ...Array.from(departments)].filter(dept => dept);
  };

  const getStatusCounts = () => {
    return {
      active: employees.filter(emp => emp.status === 'active').length,
      inactive: employees.filter(emp => emp.status === 'inactive').length,
      suspended: employees.filter(emp => emp.status === 'suspended').length,
      pending: employees.filter(emp => emp.status === 'pending').length,
      total: employees.length
    };
  };

  const getEmployeeInitials = (employee: Employee) => {
    return `${employee.firstName[0]}${employee.lastName[0]}`.toUpperCase();
  };

  const statusCounts = getStatusCounts();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
        <span className="ml-3 text-gray-600">Loading team members...</span>
      </div>
    );
  }

  return (
    <div className="px-2 sm:px-4 lg:px-0">
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Team Management</h1>
            <p className="text-gray-600 mt-2 text-sm sm:text-base">
              Manage and view your {employees.length} team member{employees.length !== 1 ? 's' : ''}
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            {/* View Mode Toggle */}
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  viewMode === 'grid' 
                    ? 'bg-white text-gray-900 shadow-sm' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Grid
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  viewMode === 'list' 
                    ? 'bg-white text-gray-900 shadow-sm' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                List
              </button>
            </div>
            <Link
              href="/manager/create-employee"
              className="bg-green-600 text-white px-4 sm:px-6 py-3 rounded-lg hover:bg-green-700 inline-flex items-center justify-center transition-colors"
            >
              <span className="mr-2">+</span> Add Employee
            </Link>
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4 mb-6">
        <div className="bg-white p-3 sm:p-4 rounded-lg border shadow-sm">
          <div className="text-xl sm:text-2xl font-bold text-gray-900">{statusCounts.total}</div>
          <div className="text-xs sm:text-sm text-gray-600">Total</div>
        </div>
        <div className="bg-green-50 p-3 sm:p-4 rounded-lg border border-green-200">
          <div className="text-xl sm:text-2xl font-bold text-green-600">{statusCounts.active}</div>
          <div className="text-xs sm:text-sm text-green-700">Active</div>
        </div>
        <div className="bg-yellow-50 p-3 sm:p-4 rounded-lg border border-yellow-200">
          <div className="text-xl sm:text-2xl font-bold text-yellow-600">{statusCounts.pending}</div>
          <div className="text-xs sm:text-sm text-yellow-700">Pending</div>
        </div>
        <div className="bg-gray-50 p-3 sm:p-4 rounded-lg border border-gray-200">
          <div className="text-xl sm:text-2xl font-bold text-gray-600">{statusCounts.inactive}</div>
          <div className="text-xs sm:text-sm text-gray-700">Inactive</div>
        </div>
        <div className="bg-red-50 p-3 sm:p-4 rounded-lg border border-red-200">
          <div className="text-xl sm:text-2xl font-bold text-red-600">{statusCounts.suspended}</div>
          <div className="text-xs sm:text-sm text-red-700">Suspended</div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-lg shadow-sm border p-4 sm:p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">Search Employees</label>
            <input
              type="text"
              placeholder="Search by name, email, position..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Department</label>
            <select
              value={filterDepartment}
              onChange={(e) => setFilterDepartment(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors"
            >
              <option value="all">All Departments</option>
              {getDepartments().filter(dept => dept !== 'all').map(dept => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="suspended">Suspended</option>
              <option value="pending">Pending</option>
            </select>
          </div>
        </div>
        <div className="flex justify-between items-center mt-4 pt-4 border-t">
          <span className="text-sm text-gray-600">
            Showing {filteredEmployees.length} of {employees.length} employees
          </span>
          <button
            onClick={() => {
              setSearchTerm('');
              setFilterDepartment('all');
              setFilterStatus('all');
            }}
            className="text-gray-600 hover:text-gray-800 text-sm font-medium transition-colors"
          >
            Clear Filters
          </button>
        </div>
      </div>

      {/* Employee Details Modal */}
      {showDetails && selectedEmployee && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 sm:p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[95vh] overflow-y-auto">
            <div className="p-4 sm:p-6">
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                    {getEmployeeInitials(selectedEmployee)}
                  </div>
                  <div className="ml-4">
                    <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
                      {selectedEmployee.firstName} {selectedEmployee.lastName}
                    </h2>
                    <p className="text-gray-600">{selectedEmployee.jobTitle}</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowDetails(false)}
                  className="text-gray-500 hover:text-gray-700 text-2xl transition-colors"
                >
                  ✕
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Personal Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Personal Information</h3>
                  <div className="space-y-3">
                    <InfoRow label="Business ID" value={selectedEmployee.businessId || 'Not assigned'} />
                    <InfoRow label="Email" value={selectedEmployee.email} />
                    <InfoRow label="Phone" value={selectedEmployee.phone || 'Not provided'} />
                    <InfoRow label="Date of Birth" value={formatDate(selectedEmployee.dateOfBirth)} />
                    <InfoRow label="Address" value={selectedEmployee.address || 'Not provided'} />
                  </div>
                </div>

                {/* Employment Details */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Employment Details</h3>
                  <div className="space-y-3">
                    <InfoRow label="Job Title" value={selectedEmployee.jobTitle} />
                    <InfoRow label="Department" value={selectedEmployee.department} />
                    <InfoRow label="Employment Type" value={selectedEmployee.employmentType} />
                    <InfoRow label="Start Date" value={formatDate(selectedEmployee.startDate)} />
                    <InfoRow label="Work Location" value={selectedEmployee.workLocation || 'Not specified'} />
                    <InfoRow label="Last Login" value={formatLastLogin(selectedEmployee.lastLogin)} />
                  </div>
                </div>

                {/* Access & Permissions */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Access & Permissions</h3>
                  <div className="space-y-3">
                    <InfoRow label="Role" value={selectedEmployee.role} />
                    <InfoRow label="Security Level" value={selectedEmployee.securityLevel} />
                    <div>
                      <label className="text-sm font-medium text-gray-600">Permissions</label>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {selectedEmployee.permissions?.length > 0 ? (
                          selectedEmployee.permissions.map(permission => (
                            <span key={permission} className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                              {permission.replace('_', ' ')}
                            </span>
                          ))
                        ) : (
                          <span className="text-gray-500 text-sm">No permissions assigned</span>
                        )}
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Tools Access</label>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {selectedEmployee.tools?.length > 0 ? (
                          selectedEmployee.tools.map(tool => (
                            <span key={tool} className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded">
                              {tool}
                            </span>
                          ))
                        ) : (
                          <span className="text-gray-500 text-sm">No tools assigned</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Compensation & Status */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Compensation & Status</h3>
                  <div className="space-y-3">
                    <InfoRow 
                      label="Base Salary" 
                      value={formatCurrency(selectedEmployee.baseSalary, selectedEmployee.currency)} 
                    />
                    <InfoRow label="Pay Frequency" value={selectedEmployee.payFrequency} />
                    <InfoRow label="Currency" value={selectedEmployee.currency} />
                    <div>
                      <label className="text-sm font-medium text-gray-600">Status</label>
                      <div className="mt-1">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(selectedEmployee.status)}`}>
                          {getStatusIcon(selectedEmployee.status)} {selectedEmployee.status}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Status Management */}
              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Manage Status</h3>
                <div className="flex flex-wrap gap-2">
                  {['active', 'inactive', 'suspended'].map(status => (
                    <button
                      key={status}
                      onClick={() => handleStatusUpdate(selectedEmployee.id, status as Employee['status'])}
                      disabled={updating === selectedEmployee.id || selectedEmployee.status === status}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        selectedEmployee.status === status
                          ? 'bg-green-600 text-white'
                          : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                      } disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      {updating === selectedEmployee.id ? 'Updating...' : `Set ${status}`}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex justify-end mt-6 pt-6 border-t">
                <button
                  onClick={() => setShowDetails(false)}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Employees Grid/List View */}
      {filteredEmployees.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border p-8 text-center text-gray-500">
          <div className="text-6xl mb-4">👥</div>
          <p className="text-lg font-medium">
            {employees.length === 0 ? 'No team members yet' : 'No employees match your filters'}
          </p>
          <p className="text-sm mt-2">
            {employees.length === 0 
              ? 'Start by adding your first team member' 
              : 'Try adjusting your search or filters'
            }
          </p>
          {employees.length === 0 && (
            <Link
              href="/manager/create-employee"
              className="mt-4 bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 inline-block transition-colors"
            >
              Add First Employee
            </Link>
          )}
        </div>
      ) : viewMode === 'grid' ? (
        // Grid View
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
          {filteredEmployees.map((employee) => (
            <div key={employee.id} className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow">
              <div className="p-4 sm:p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                      {getEmployeeInitials(employee)}
                    </div>
                    <div className="ml-3">
                      <h3 className="font-semibold text-gray-900">
                        {employee.firstName} {employee.lastName}
                      </h3>
                      <p className="text-sm text-gray-600">{employee.jobTitle}</p>
                    </div>
                  </div>
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(employee.status)}`}>
                    {getStatusIcon(employee.status)}
                  </span>
                </div>
                
                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex items-center">
                    <span className="w-20 text-gray-500">Email:</span>
                    <span className="truncate">{employee.email}</span>
                  </div>
                  <div className="flex items-center">
                    <span className="w-20 text-gray-500">Dept:</span>
                    <span>{employee.department}</span>
                  </div>
                  <div className="flex items-center">
                    <span className="w-20 text-gray-500">Last Login:</span>
                    <span>{formatLastLogin(employee.lastLogin)}</span>
                  </div>
                </div>

                <div className="flex space-x-2 mt-4 pt-4 border-t">
                  <button
                    onClick={() => viewDetails(employee)}
                    className="flex-1 bg-blue-600 text-white px-3 py-2 rounded text-sm hover:bg-blue-700 transition-colors"
                  >
                    View Details
                  </button>
                  <button
                    onClick={() => handleStatusUpdate(
                      employee.id, 
                      employee.status === 'active' ? 'inactive' : 'active'
                    )}
                    disabled={updating === employee.id}
                    className="flex-1 bg-green-600 text-white px-3 py-2 rounded text-sm hover:bg-green-700 disabled:opacity-50 transition-colors"
                  >
                    {updating === employee.id ? '...' : employee.status === 'active' ? 'Deactivate' : 'Activate'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        // List View
        <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="text-left p-4 font-semibold text-gray-700">Employee</th>
                  <th className="text-left p-4 font-semibold text-gray-700 hidden md:table-cell">Position</th>
                  <th className="text-left p-4 font-semibold text-gray-700 hidden lg:table-cell">Department</th>
                  <th className="text-left p-4 font-semibold text-gray-700">Status</th>
                  <th className="text-left p-4 font-semibold text-gray-700 hidden sm:table-cell">Last Login</th>
                  <th className="text-left p-4 font-semibold text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredEmployees.map((employee) => (
                  <tr key={employee.id} className="border-b hover:bg-gray-50 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-sm mr-3">
                          {getEmployeeInitials(employee)}
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">
                            {employee.firstName} {employee.lastName}
                          </div>
                          <div className="text-sm text-gray-500 md:hidden">{employee.jobTitle}</div>
                          <div className="text-xs text-gray-400 mt-1">{employee.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 hidden md:table-cell">
                      <div className="text-gray-900 font-medium">{employee.jobTitle}</div>
                      <div className="text-sm text-gray-500">{employee.employmentType}</div>
                    </td>
                    <td className="p-4 hidden lg:table-cell">
                      <div className="text-gray-900">{employee.department}</div>
                    </td>
                    <td className="p-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(employee.status)}`}>
                        {getStatusIcon(employee.status)} <span className="hidden sm:inline ml-1">{employee.status}</span>
                      </span>
                    </td>
                    <td className="p-4 text-gray-600 text-sm hidden sm:table-cell">
                      {formatLastLogin(employee.lastLogin)}
                    </td>
                    <td className="p-4">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => viewDetails(employee)}
                          className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition-colors"
                        >
                          View
                        </button>
                        <button
                          onClick={() => handleStatusUpdate(
                            employee.id, 
                            employee.status === 'active' ? 'inactive' : 'active'
                          )}
                          disabled={updating === employee.id}
                          className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700 disabled:opacity-50 transition-colors"
                        >
                          {updating === employee.id ? '...' : employee.status === 'active' ? 'Deactivate' : 'Activate'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// Helper component for info rows in modal
const InfoRow = ({ label, value }: { label: string; value: string }) => (
  <div>
    <label className="text-sm font-medium text-gray-600">{label}</label>
    <p className="text-gray-900 mt-1">{value || 'Not provided'}</p>
  </div>
);