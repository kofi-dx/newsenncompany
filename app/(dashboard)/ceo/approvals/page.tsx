/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
// app/ceo/employee-approvals/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, doc, updateDoc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { useAuth } from '@/contexts/AuthContext';

interface EmployeeRequest {
  id: string;
  userId: string;
  
  // Personal Info
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  address: string;
  
  // Employment Details
  jobTitle: string;
  department: string;
  employmentType: string;
  startDate: string;
  workLocation: string;
  reportingManager: string;
  
  // Access & Permissions
  role: string;
  permissions: string[];
  tools: string[];
  securityLevel: string;
  
  // Compensation
  baseSalary: number;
  payFrequency: string;
  currency: string;
  
  // Request Details
  status: 'pending' | 'approved' | 'rejected';
  managerId: string;
  managerName: string;
  createdAt: Date;
  requestedBy: string;
  requestedByName: string;
  businessId?: string;
  approvedBy?: string;
  approvedAt?: Date;
}

export default function EmployeeApprovals() {
  const { user } = useAuth();
  const [requests, setRequests] = useState<EmployeeRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [selectedRequest, setSelectedRequest] = useState<EmployeeRequest | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [filter, setFilter] = useState<'all' | 'content' | 'full-time' | 'high-salary'>('all');

  useEffect(() => {
    fetchPendingRequests();
  }, []);

  const fetchPendingRequests = async () => {
    try {
      console.log('🔍 Fetching pending employee requests...');
      const q = query(
        collection(db, 'employeeRequests'),
        where('status', '==', 'pending')
      );
      const snapshot = await getDocs(q);
      const requestsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as EmployeeRequest[];
      
      console.log(`📋 Found ${requestsData.length} pending requests`);
      setRequests(requestsData);
    } catch (error) {
      console.error('❌ Error fetching employee requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateBusinessId = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = 'EMP-';
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
      if (i === 3) result += '-';
    }
    return result;
  };

  const handleApprove = async (requestId: string, requestData: EmployeeRequest) => {
    if (!user) {
      alert('User not authenticated');
      return;
    }
    
    setProcessing(requestId);
    console.log(`🔄 Approving employee: ${requestData.firstName} ${requestData.lastName}`);
    
    try {
      const businessId = generateBusinessId();
      console.log(`📝 Generated Business ID: ${businessId}`);

      // Step 1: Update employee request status
      console.log('📤 Updating employee request document...');
      await updateDoc(doc(db, 'employeeRequests', requestId), {
        status: 'approved',
        businessId,
        approvedBy: user.id,
        approvedAt: new Date()
      });
      console.log('✅ Employee request updated successfully');

      // Step 2: Check if user document exists and update/create it
      console.log(`🔍 Checking user document for ID: ${requestData.userId}`);
      
      try {
        // Try to update existing user document
        console.log('📤 Attempting to update existing user document...');
        await updateDoc(doc(db, 'users', requestData.userId), {
          // Personal Info
          firstName: requestData.firstName,
          lastName: requestData.lastName,
          email: requestData.email,
          phone: requestData.phone,
          dateOfBirth: requestData.dateOfBirth,
          address: requestData.address,
          
          // Employment Details
          jobTitle: requestData.jobTitle,
          department: requestData.department,
          employmentType: requestData.employmentType,
          startDate: requestData.startDate,
          workLocation: requestData.workLocation,
          reportingManager: requestData.reportingManager,
          
          // Access & Permissions
          role: 'employee',
          permissions: requestData.permissions,
          tools: requestData.tools,
          securityLevel: requestData.securityLevel,
          
          // Compensation
          baseSalary: requestData.baseSalary,
          payFrequency: requestData.payFrequency,
          currency: requestData.currency,
          
          // System
          status: 'active',
          businessId,
          managerId: requestData.managerId,
          emailVerified: true,
          createdBy: requestData.requestedBy,
          updatedAt: new Date()
        });
        console.log('✅ User document updated successfully');
      } catch (updateError: any) {
        console.log('⚠️ Update failed, trying to create new user document...', updateError.message);
        
        // If update fails, create a new user document
        await setDoc(doc(db, 'users', requestData.userId), {
          id: requestData.userId,
          // Personal Info
          firstName: requestData.firstName,
          lastName: requestData.lastName,
          email: requestData.email,
          phone: requestData.phone,
          dateOfBirth: requestData.dateOfBirth,
          address: requestData.address,
          
          // Employment Details
          jobTitle: requestData.jobTitle,
          department: requestData.department,
          employmentType: requestData.employmentType,
          startDate: requestData.startDate,
          workLocation: requestData.workLocation,
          reportingManager: requestData.reportingManager,
          
          // Access & Permissions
          role: 'employee',
          permissions: requestData.permissions,
          tools: requestData.tools,
          securityLevel: requestData.securityLevel,
          
          // Compensation
          baseSalary: requestData.baseSalary,
          payFrequency: requestData.payFrequency,
          currency: requestData.currency,
          
          // System
          status: 'active',
          businessId,
          managerId: requestData.managerId,
          emailVerified: true,
          createdBy: requestData.requestedBy,
          createdAt: new Date(),
          updatedAt: new Date()
        });
        console.log('✅ New user document created successfully');
      }

      // Step 3: Refresh the list
      await fetchPendingRequests();
      setShowDetails(false);
      
      console.log('🎉 Employee approval completed successfully');
      alert(`Employee ${requestData.firstName} ${requestData.lastName} approved successfully! Business ID: ${businessId}`);
      
    } catch (error: any) {
      console.error('❌ Error approving employee:', error);
      console.error('Error details:', {
        message: error.message,
        code: error.code,
        stack: error.stack
      });
      alert(`Error approving employee: ${error.message}. Please check the console for details.`);
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async (requestId: string, employeeName: string) => {
    if (!user) return;
    
    setProcessing(requestId);
    console.log(`🔄 Rejecting employee: ${employeeName}`);
    
    try {
      // Update employee request status
      await updateDoc(doc(db, 'employeeRequests', requestId), {
        status: 'rejected',
        approvedBy: user.id,
        approvedAt: new Date()
      });

      // Update user document to suspended if it exists
      const request = requests.find(r => r.id === requestId);
      if (request) {
        try {
          await updateDoc(doc(db, 'users', request.userId), {
            status: 'suspended',
            updatedAt: new Date()
          });
          console.log('✅ User status updated to suspended');
        } catch (userError) {
          console.log('⚠️ Could not update user document, might not exist');
        }
      }

      await fetchPendingRequests();
      setShowDetails(false);
      console.log('✅ Employee rejection completed');
      alert(`Employee ${employeeName} rejected.`);
    } catch (error: any) {
      console.error('❌ Error rejecting employee:', error);
      alert(`Error rejecting employee: ${error.message}`);
    } finally {
      setProcessing(null);
    }
  };

  const viewDetails = (request: EmployeeRequest) => {
    setSelectedRequest(request);
    setShowDetails(true);
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Not provided';
    return new Date(dateString).toLocaleDateString();
  };

  const filteredRequests = requests.filter(request => {
    switch (filter) {
      case 'content':
        return request.department === 'Content Creation';
      case 'full-time':
        return request.employmentType === 'Full-time';
      case 'high-salary':
        return request.baseSalary > 50000;
      default:
        return true;
    }
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading employee approvals...</p>
          <p className="text-sm text-gray-500 mt-1">Fetching pending requests...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Employee Approvals</h1>
          <p className="text-gray-600 mt-2 text-sm sm:text-base">
            Review and approve employee accounts with complete details
          </p>
        </div>
        <div className="mt-4 lg:mt-0">
          <div className="flex flex-wrap gap-2">
            <span className="bg-blue-100 text-blue-800 text-sm px-3 py-1 rounded-full">
              {requests.length} Pending
            </span>
            <span className="bg-green-100 text-green-800 text-sm px-3 py-1 rounded-full">
              {requests.filter(r => r.department === 'Content Creation').length} Content
            </span>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-xl border border-blue-200">
          <div className="text-2xl font-bold text-blue-600">{requests.length}</div>
          <div className="text-sm text-blue-800 font-medium">Pending Approvals</div>
        </div>
        <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-xl border border-green-200">
          <div className="text-2xl font-bold text-green-600">
            {requests.filter(r => r.department === 'Content Creation').length}
          </div>
          <div className="text-sm text-green-800 font-medium">Content Team</div>
        </div>
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-xl border border-purple-200">
          <div className="text-2xl font-bold text-purple-600">
            {requests.filter(r => r.employmentType === 'Full-time').length}
          </div>
          <div className="text-sm text-purple-800 font-medium">Full-time</div>
        </div>
        <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-4 rounded-xl border border-orange-200">
          <div className="text-2xl font-bold text-orange-600">
            {Math.round(requests.reduce((sum, r) => sum + r.baseSalary, 0) / requests.length) || 0}
          </div>
          <div className="text-sm text-orange-800 font-medium">Avg Salary</div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-800">Filter Requests</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All Requests
            </button>
            <button
              onClick={() => setFilter('content')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === 'content'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Content Team
            </button>
            <button
              onClick={() => setFilter('full-time')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === 'full-time'
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Full-time
            </button>
            <button
              onClick={() => setFilter('high-salary')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === 'high-salary'
                  ? 'bg-orange-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              High Salary
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {filteredRequests.length === 0 ? (
          <div className="p-8 text-center">
            <div className="text-6xl mb-4">✅</div>
            <p className="text-lg font-semibold text-gray-900">No pending approvals</p>
            <p className="text-gray-600 mt-2">
              {filter === 'all' 
                ? "All employee requests have been processed" 
                : `No ${filter} requests found`}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            {/* Mobile Cards */}
            <div className="lg:hidden space-y-4 p-4">
              {filteredRequests.map((request) => (
                <div key={request.id} className="border border-gray-200 rounded-lg p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        {request.firstName} {request.lastName}
                      </h3>
                      <p className="text-sm text-gray-500">{request.email}</p>
                    </div>
                    <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full">
                      Pending
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600">Position</p>
                      <p className="font-medium">{request.jobTitle}</p>
                      <p className="text-gray-500 text-xs">{request.department}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Salary</p>
                      <p className="font-medium text-green-600">
                        {formatCurrency(request.baseSalary, request.currency)}
                      </p>
                    </div>
                  </div>

                  <div className="flex space-x-2 pt-2">
                    <button
                      onClick={() => viewDetails(request)}
                      className="flex-1 bg-blue-600 text-white py-2 px-3 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                    >
                      View
                    </button>
                    <button
                      onClick={() => handleApprove(request.id, request)}
                      disabled={processing === request.id}
                      className="flex-1 bg-green-600 text-white py-2 px-3 rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50 transition-colors"
                    >
                      {processing === request.id ? '...' : 'Approve'}
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop Table */}
            <table className="min-w-full hidden lg:table">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="text-left p-4 font-semibold text-gray-700">Employee Details</th>
                  <th className="text-left p-4 font-semibold text-gray-700">Position</th>
                  <th className="text-left p-4 font-semibold text-gray-700">Compensation</th>
                  <th className="text-left p-4 font-semibold text-gray-700">Requested By</th>
                  <th className="text-left p-4 font-semibold text-gray-700">Date</th>
                  <th className="text-left p-4 font-semibold text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredRequests.map((request) => (
                  <tr key={request.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                    <td className="p-4">
                      <div>
                        <div className="font-semibold text-gray-900">
                          {request.firstName} {request.lastName}
                        </div>
                        <div className="text-sm text-gray-500">{request.email}</div>
                        <div className="text-xs text-gray-400 font-mono mt-1">
                          ID: {request.userId.slice(0, 8)}...
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="font-medium text-gray-900">{request.jobTitle}</div>
                      <div className="text-sm text-gray-500">{request.department}</div>
                      <div className="text-xs text-gray-400">{request.employmentType}</div>
                    </td>
                    <td className="p-4">
                      <div className="text-green-600 font-semibold">
                        {formatCurrency(request.baseSalary, request.currency)}
                      </div>
                      <div className="text-sm text-gray-500">{request.payFrequency}</div>
                    </td>
                    <td className="p-4">
                      <div className="text-gray-900 font-medium">{request.managerName}</div>
                      <div className="text-xs text-gray-500">Manager</div>
                    </td>
                    <td className="p-4 text-gray-600">
                      {new Date(request.createdAt).toLocaleDateString()}
                    </td>
                    <td className="p-4">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => viewDetails(request)}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                        >
                          Details
                        </button>
                        <button
                          onClick={() => handleApprove(request.id, request)}
                          disabled={processing === request.id}
                          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors text-sm font-medium"
                        >
                          {processing === request.id ? '...' : 'Approve'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Employee Details Modal */}
      {showDetails && selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
                  Employee Details - {selectedRequest.firstName} {selectedRequest.lastName}
                </h2>
                <button
                  onClick={() => setShowDetails(false)}
                  className="text-gray-500 hover:text-gray-700 text-2xl p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  ✕
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Personal Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Personal Information</h3>
                  <div className="space-y-3">
                    {[
                      { label: 'Full Name', value: `${selectedRequest.firstName} ${selectedRequest.lastName}` },
                      { label: 'Email', value: selectedRequest.email },
                      { label: 'Phone', value: selectedRequest.phone || 'Not provided' },
                      { label: 'Date of Birth', value: formatDate(selectedRequest.dateOfBirth) },
                      { label: 'Address', value: selectedRequest.address || 'Not provided' }
                    ].map((item, index) => (
                      <div key={index}>
                        <label className="text-sm font-medium text-gray-600 block mb-1">{item.label}</label>
                        <p className="text-gray-900">{item.value}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Employment Details */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Employment Details</h3>
                  <div className="space-y-3">
                    {[
                      { label: 'Job Title', value: selectedRequest.jobTitle },
                      { label: 'Department', value: selectedRequest.department },
                      { label: 'Employment Type', value: selectedRequest.employmentType },
                      { label: 'Start Date', value: formatDate(selectedRequest.startDate) },
                      { label: 'Work Location', value: selectedRequest.workLocation || 'Not specified' },
                      { label: 'Reporting Manager', value: selectedRequest.reportingManager }
                    ].map((item, index) => (
                      <div key={index}>
                        <label className="text-sm font-medium text-gray-600 block mb-1">{item.label}</label>
                        <p className="text-gray-900">{item.value}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Access & Permissions */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Access & Permissions</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-gray-600 block mb-1">Role</label>
                      <p className="text-gray-900">{selectedRequest.role}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600 block mb-1">Security Level</label>
                      <p className="text-gray-900">{selectedRequest.securityLevel}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600 block mb-1">Permissions</label>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {selectedRequest.permissions.map(permission => (
                          <span key={permission} className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                            {permission.replace('_', ' ')}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600 block mb-1">Tools Access</label>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {selectedRequest.tools.map(tool => (
                          <span key={tool} className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded">
                            {tool}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Compensation */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Compensation</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-gray-600 block mb-1">Base Salary</label>
                      <p className="text-gray-900 text-xl font-semibold">
                        {formatCurrency(selectedRequest.baseSalary, selectedRequest.currency)}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600 block mb-1">Pay Frequency</label>
                      <p className="text-gray-900">{selectedRequest.payFrequency}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600 block mb-1">Currency</label>
                      <p className="text-gray-900">{selectedRequest.currency}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Request Information */}
              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Request Information</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                  <div>
                    <label className="font-medium text-gray-600">Requested By</label>
                    <p className="text-gray-900">{selectedRequest.managerName}</p>
                  </div>
                  <div>
                    <label className="font-medium text-gray-600">Request Date</label>
                    <p className="text-gray-900">{new Date(selectedRequest.createdAt).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <label className="font-medium text-gray-600">User ID</label>
                    <p className="text-gray-900 font-mono text-xs">{selectedRequest.userId}</p>
                  </div>
                  <div>
                    <label className="font-medium text-gray-600">Manager ID</label>
                    <p className="text-gray-900 font-mono text-xs">{selectedRequest.managerId}</p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-4 mt-6 pt-6 border-t">
                <button
                  onClick={() => setShowDetails(false)}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  Close
                </button>
                <button
                  onClick={() => handleReject(selectedRequest.id, `${selectedRequest.firstName} ${selectedRequest.lastName}`)}
                  disabled={processing === selectedRequest.id}
                  className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors font-medium"
                >
                  {processing === selectedRequest.id ? 'Rejecting...' : 'Reject Request'}
                </button>
                <button
                  onClick={() => handleApprove(selectedRequest.id, selectedRequest)}
                  disabled={processing === selectedRequest.id}
                  className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors font-medium"
                >
                  {processing === selectedRequest.id ? 'Approving...' : 'Approve Employee'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}