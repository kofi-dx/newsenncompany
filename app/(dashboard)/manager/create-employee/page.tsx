/* eslint-disable @typescript-eslint/no-explicit-any */
// app/manager/create-employee/page.tsx (FIXED VERSION)
'use client';

import { useState } from 'react';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from '@/lib/firebase/config';
import { collection, addDoc, query, where, getDocs } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

// Define types for our form data
interface EmployeeFormData {
  personalInfo: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    dateOfBirth: string;
    address: string;
  };
  employment: {
    jobTitle: string;
    department: string;
    employmentType: string;
    startDate: string;
    workLocation: string;
    reportingManager: string;
  };
  access: {
    role: string;
    permissions: string[];
    tools: string[];
    securityLevel: string;
  };
  compensation: {
    baseSalary: number;
    payFrequency: string;
    currency: string;
  };
  account: {
    password: string;
    confirmPassword: string;
  };
}

// Predefined options (same as before)
const DEPARTMENTS = [
  'Content Creation',
  'Marketing',
  'Sales',
  'Operations',
  'Customer Support',
  'Technology',
  'Human Resources',
  'Finance'
];

const EMPLOYMENT_TYPES = [
  'Full-time',
  'Part-time',
  'Contract',
  'Intern'
];

const WORK_LOCATIONS = [
  'Remote',
  'Office',
  'Hybrid'
];

const ROLES = [
  'Content Writer',
  'Social Media Manager',
  'Sales Representative',
  'Operations Coordinator',
  'Support Specialist',
  'Developer',
  'Designer',
  'Analyst'
];

const PERMISSIONS = [
  'view_articles',
  'create_articles',
  'edit_articles',
  'publish_articles',
  'view_analytics',
  'manage_social',
  'manage_promotions',
  'view_reports',
  'manage_users'
];

const TOOLS = [
  'Content Management System',
  'Analytics Dashboard',
  'Social Media Scheduler',
  'Email Marketing',
  'Project Management',
  'CRM System',
  'Design Tools',
  'Development Environment'
];

const SECURITY_LEVELS = [
  'Basic',
  'Standard',
  'Elevated',
  'Admin'
];

const PAY_FREQUENCIES = [
  'Monthly',
  'Bi-weekly',
  'Weekly'
];

const CURRENCIES = [
  'USD',
  'GHS'
];

export default function CreateEmployee() {
  const { user } = useAuth();
  const [formData, setFormData] = useState<EmployeeFormData>({
    personalInfo: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      dateOfBirth: '',
      address: ''
    },
    employment: {
      jobTitle: '',
      department: '',
      employmentType: '',
      startDate: '',
      workLocation: '',
      reportingManager: user?.name || ''
    },
    access: {
      role: '',
      permissions: [],
      tools: [],
      securityLevel: 'Basic'
    },
    compensation: {
      baseSalary: 0,
      payFrequency: 'Monthly',
      currency: 'USD'
    },
    account: {
      password: '',
      confirmPassword: ''
    }
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [currentStep, setCurrentStep] = useState(1);

  const router = useRouter();

  const handleInputChange = (section: keyof EmployeeFormData, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
  };

  const handleArrayToggle = (section: keyof EmployeeFormData, field: string, value: string) => {
    setFormData(prev => {
      const currentArray = (prev[section] as any)[field] as string[];
      const updatedArray = currentArray.includes(value)
        ? currentArray.filter(item => item !== value)
        : [...currentArray, value];
      
      return {
        ...prev,
        [section]: {
          ...prev[section],
          [field]: updatedArray
        }
      };
    });
  };

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1: // Personal Info
        const { personalInfo } = formData;
        if (!personalInfo.firstName || !personalInfo.lastName || !personalInfo.email || !personalInfo.phone) {
          setError('Please fill in all required personal information');
          return false;
        }
        if (!/\S+@\S+\.\S+/.test(personalInfo.email)) {
          setError('Please enter a valid email address');
          return false;
        }
        return true;

      case 2: // Employment
        const { employment } = formData;
        if (!employment.jobTitle || !employment.department || !employment.employmentType || !employment.startDate) {
          setError('Please fill in all required employment details');
          return false;
        }
        return true;

      case 3: // Access & Compensation
        const { access, compensation } = formData;
        if (!access.role || access.permissions.length === 0 || compensation.baseSalary <= 0) {
          setError('Please fill in all required access and compensation details');
          return false;
        }
        return true;

      case 4: // Account
        const { account } = formData;
        if (account.password.length < 8) {
          setError('Password must be at least 8 characters');
          return false;
        }
        if (account.password !== account.confirmPassword) {
          setError('Passwords do not match');
          return false;
        }
        return true;

      default:
        return true;
    }
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setError('');
      setCurrentStep(prev => prev + 1);
    }
  };

  const prevStep = () => {
    setError('');
    setCurrentStep(prev => prev - 1);
  };

  const handleCreateEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateStep(4)) return;

    setLoading(true);
    setError('');

    try {
      // Check if user already exists
      const usersQuery = query(
        collection(db, 'users'), 
        where('email', '==', formData.personalInfo.email.toLowerCase().trim())
      );
      const userSnapshot = await getDocs(usersQuery);
      
      if (!userSnapshot.empty) {
        setError('An employee with this email already exists.');
        setLoading(false);
        return;
      }

      // Create Firebase auth user
      const userCredential = await createUserWithEmailAndPassword(
        auth, 
        formData.personalInfo.email.toLowerCase().trim(), 
        formData.account.password
      );

      // Create employee request for CEO approval with all details
      await addDoc(collection(db, 'employeeRequests'), {
        // Personal Info
        userId: userCredential.user.uid,
        firstName: formData.personalInfo.firstName,
        lastName: formData.personalInfo.lastName,
        email: formData.personalInfo.email.toLowerCase().trim(),
        phone: formData.personalInfo.phone,
        dateOfBirth: formData.personalInfo.dateOfBirth,
        address: formData.personalInfo.address,
        
        // Employment Details
        jobTitle: formData.employment.jobTitle,
        department: formData.employment.department,
        employmentType: formData.employment.employmentType,
        startDate: formData.employment.startDate,
        workLocation: formData.employment.workLocation,
        reportingManager: formData.employment.reportingManager,
        
        // Access & Permissions
        role: formData.access.role,
        permissions: formData.access.permissions,
        tools: formData.access.tools,
        securityLevel: formData.access.securityLevel,
        
        // Compensation
        baseSalary: formData.compensation.baseSalary,
        payFrequency: formData.compensation.payFrequency,
        currency: formData.compensation.currency,
        
        // Request Details
        status: 'pending',
        managerId: user?.id,
        managerName: user?.name,
        createdAt: new Date(),
        requestedBy: user?.id,
        requestedByName: user?.name
      });

      // Create temporary user document (pending approval)
      await addDoc(collection(db, 'users'), {
        id: userCredential.user.uid,
        // Personal
        firstName: formData.personalInfo.firstName,
        lastName: formData.personalInfo.lastName,
        email: formData.personalInfo.email.toLowerCase().trim(),
        phone: formData.personalInfo.phone,
        dateOfBirth: formData.personalInfo.dateOfBirth,
        address: formData.personalInfo.address,
        
        // Employment
        jobTitle: formData.employment.jobTitle,
        department: formData.employment.department,
        employmentType: formData.employment.employmentType,
        startDate: formData.employment.startDate,
        workLocation: formData.employment.workLocation,
        reportingManager: formData.employment.reportingManager,
        
        // Access
        role: 'employee',
        permissions: formData.access.permissions,
        tools: formData.access.tools,
        securityLevel: formData.access.securityLevel,
        
        // Compensation
        baseSalary: formData.compensation.baseSalary,
        payFrequency: formData.compensation.payFrequency,
        currency: formData.compensation.currency,
        
        // System
        status: 'pending',
        managerId: user?.id,
        emailVerified: true,
        createdBy: user?.id,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      setSuccess('Employee account created successfully! Waiting for CEO approval.');
      
      // Reset form after success
      setTimeout(() => {
        router.push('/manager/team');
      }, 3000);

    } catch (error: any) {
      console.error('Error creating employee:', error);
      setError(error.message || 'Failed to create employee account');
    } finally {
      setLoading(false);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900">Personal Information</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  First Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.personalInfo.firstName}
                  onChange={(e) => handleInputChange('personalInfo', 'firstName', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900 placeholder-gray-500" // ADDED: text-gray-900 placeholder-gray-500
                  placeholder="First name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Last Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.personalInfo.lastName}
                  onChange={(e) => handleInputChange('personalInfo', 'lastName', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900 placeholder-gray-500" // ADDED: text-gray-900 placeholder-gray-500
                  placeholder="Last name"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address *
              </label>
              <input
                type="email"
                required
                value={formData.personalInfo.email}
                onChange={(e) => handleInputChange('personalInfo', 'email', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900 placeholder-gray-500" // ADDED: text-gray-900 placeholder-gray-500
                placeholder="employee@company.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phone Number *
              </label>
              <input
                type="tel"
                required
                value={formData.personalInfo.phone}
                onChange={(e) => handleInputChange('personalInfo', 'phone', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900 placeholder-gray-500" // ADDED: text-gray-900 placeholder-gray-500
                placeholder="+1234567890"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date of Birth
              </label>
              <input
                type="date"
                value={formData.personalInfo.dateOfBirth}
                onChange={(e) => handleInputChange('personalInfo', 'dateOfBirth', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900" // ADDED: text-gray-900
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Address
              </label>
              <textarea
                value={formData.personalInfo.address}
                onChange={(e) => handleInputChange('personalInfo', 'address', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900 placeholder-gray-500" // ADDED: text-gray-900 placeholder-gray-500
                placeholder="Full residential address"
                rows={3}
              />
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900">Employment Details</h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Job Title *
              </label>
              <input
                type="text"
                required
                value={formData.employment.jobTitle}
                onChange={(e) => handleInputChange('employment', 'jobTitle', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900 placeholder-gray-500" // ADDED: text-gray-900 placeholder-gray-500
                placeholder="e.g., Content Writer, Sales Manager"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Department *
                </label>
                <select
                  required
                  value={formData.employment.department}
                  onChange={(e) => handleInputChange('employment', 'department', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900" // ADDED: text-gray-900
                >
                  <option value="">Select Department</option>
                  {DEPARTMENTS.map(dept => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Employment Type *
                </label>
                <select
                  required
                  value={formData.employment.employmentType}
                  onChange={(e) => handleInputChange('employment', 'employmentType', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900" // ADDED: text-gray-900
                >
                  <option value="">Select Type</option>
                  {EMPLOYMENT_TYPES.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Start Date *
                </label>
                <input
                  type="date"
                  required
                  value={formData.employment.startDate}
                  onChange={(e) => handleInputChange('employment', 'startDate', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900" // ADDED: text-gray-900
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Work Location
                </label>
                <select
                  value={formData.employment.workLocation}
                  onChange={(e) => handleInputChange('employment', 'workLocation', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900" // ADDED: text-gray-900
                >
                  <option value="">Select Location</option>
                  {WORK_LOCATIONS.map(location => (
                    <option key={location} value={location}>{location}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reporting Manager
              </label>
              <input
                type="text"
                value={formData.employment.reportingManager}
                onChange={(e) => handleInputChange('employment', 'reportingManager', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900 placeholder-gray-500" // ADDED: text-gray-900 placeholder-gray-500
                placeholder="Manager's name"
              />
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900">Access & Compensation</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Role *
                </label>
                <select
                  required
                  value={formData.access.role}
                  onChange={(e) => handleInputChange('access', 'role', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900" // ADDED: text-gray-900
                >
                  <option value="">Select Role</option>
                  {ROLES.map(role => (
                    <option key={role} value={role}>{role}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Security Level
                </label>
                <select
                  value={formData.access.securityLevel}
                  onChange={(e) => handleInputChange('access', 'securityLevel', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900" // ADDED: text-gray-900
                >
                  {SECURITY_LEVELS.map(level => (
                    <option key={level} value={level}>{level}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Permissions *
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-40 overflow-y-auto p-2 border rounded-lg">
                {PERMISSIONS.map(permission => (
                  <label key={permission} className="flex items-center space-x-2 text-sm text-gray-900"> {/* ADDED: text-gray-900 */}
                    <input
                      type="checkbox"
                      checked={formData.access.permissions.includes(permission)}
                      onChange={() => handleArrayToggle('access', 'permissions', permission)}
                      className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                    />
                    <span>{permission.replace('_', ' ')}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tools Access
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-40 overflow-y-auto p-2 border rounded-lg">
                {TOOLS.map(tool => (
                  <label key={tool} className="flex items-center space-x-2 text-sm text-gray-900"> {/* ADDED: text-gray-900 */}
                    <input
                      type="checkbox"
                      checked={formData.access.tools.includes(tool)}
                      onChange={() => handleArrayToggle('access', 'tools', tool)}
                      className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                    />
                    <span>{tool}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Base Salary *
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  step="0.01"
                  value={formData.compensation.baseSalary}
                  onChange={(e) => handleInputChange('compensation', 'baseSalary', parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900 placeholder-gray-500" // ADDED: text-gray-900 placeholder-gray-500
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Pay Frequency
                </label>
                <select
                  value={formData.compensation.payFrequency}
                  onChange={(e) => handleInputChange('compensation', 'payFrequency', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900" // ADDED: text-gray-900
                >
                  {PAY_FREQUENCIES.map(freq => (
                    <option key={freq} value={freq}>{freq}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Currency
                </label>
                <select
                  value={formData.compensation.currency}
                  onChange={(e) => handleInputChange('compensation', 'currency', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900" // ADDED: text-gray-900
                >
                  {CURRENCIES.map(currency => (
                    <option key={currency} value={currency}>{currency}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900">Account Setup</h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password *
              </label>
              <input
                type="password"
                required
                value={formData.account.password}
                onChange={(e) => handleInputChange('account', 'password', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900 placeholder-gray-500" // ADDED: text-gray-900 placeholder-gray-500
                placeholder="Minimum 8 characters"
                minLength={8}
              />
              <p className="text-xs text-gray-500 mt-1">Minimum 8 characters</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Confirm Password *
              </label>
              <input
                type="password"
                required
                value={formData.account.confirmPassword}
                onChange={(e) => handleInputChange('account', 'confirmPassword', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900 placeholder-gray-500" // ADDED: text-gray-900 placeholder-gray-500
                placeholder="Confirm your password"
              />
            </div>

            <div className="bg-blue-50 rounded-lg p-4">
              <h4 className="font-semibold text-blue-900 mb-2">Employee Summary</h4>
              <div className="text-sm text-blue-800 space-y-1">
                <p><strong>Name:</strong> {formData.personalInfo.firstName} {formData.personalInfo.lastName}</p>
                <p><strong>Position:</strong> {formData.employment.jobTitle} - {formData.employment.department}</p>
                <p><strong>Compensation:</strong> {formData.compensation.currency} {formData.compensation.baseSalary} {formData.compensation.payFrequency}</p>
                <p><strong>Access:</strong> {formData.access.permissions.length} permissions, {formData.access.tools.length} tools</p>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Create Employee</h1>
        <p className="text-gray-600 mt-2">Create a new employee account (requires CEO approval)</p>
      </div>

      <div className="max-w-4xl">
        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {[1, 2, 3, 4].map((step) => (
              <div key={step} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  currentStep >= step 
                    ? 'bg-green-600 text-white' 
                    : 'bg-gray-200 text-gray-600'
                }`}>
                  {step}
                </div>
                {step < 4 && (
                  <div className={`w-16 h-1 mx-2 ${
                    currentStep > step ? 'bg-green-600' : 'bg-gray-200'
                  }`} />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-2 text-sm text-gray-600">
            <span>Personal Info</span>
            <span>Employment</span>
            <span>Access & Pay</span>
            <span>Account</span>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <form onSubmit={handleCreateEmployee}>
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
                <p className="text-red-800 text-sm">{error}</p>
              </div>
            )}
            
            {success && (
              <div className="bg-green-50 border border-green-200 rounded-md p-4 mb-6">
                <p className="text-green-800 text-sm">{success}</p>
              </div>
            )}

            {renderStep()}

            <div className="flex justify-between mt-8 pt-6 border-t">
              {currentStep > 1 ? (
                <button
                  type="button"
                  onClick={prevStep}
                  className="bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700"
                >
                  Previous
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => router.push('/manager/team')}
                  className="bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700"
                >
                  Cancel
                </button>
              )}

              {currentStep < 4 ? (
                <button
                  type="button"
                  onClick={nextStep}
                  className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700"
                >
                  Next
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 disabled:opacity-50"
                >
                  {loading ? 'Creating Employee...' : 'Create Employee'}
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Instructions */}
        <div className="mt-6 bg-yellow-50 rounded-lg p-4">
          <h3 className="font-semibold text-yellow-900 mb-2">Important:</h3>
          <ul className="text-sm text-yellow-800 space-y-1">
            <li>• Employee accounts require CEO approval before they can login</li>
            <li>• The CEO will review and approve/reject employee requests</li>
            <li>• Once approved, the employee will receive their Business ID</li>
            <li>• Share the login credentials with the employee securely after approval</li>
          </ul>
        </div>
      </div>
    </div>
  );
}