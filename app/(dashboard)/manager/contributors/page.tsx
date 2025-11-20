/* eslint-disable @typescript-eslint/no-explicit-any */
// app/manager/contributors/page.tsx (FIXED VERSION)
'use client';

import { useState, useEffect } from 'react';
import { collection, query, getDocs, doc, updateDoc, where, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { useAuth } from '@/contexts/AuthContext';

interface Contributor {
  id: string;
  name: string;
  email: string;
  status: 'active' | 'inactive' | 'suspended' | 'pending';
  totalEarnings: number;
  articlesCount: number;
  totalViews: number;
  joinedAt: any;
  lastActive?: any;
  level?: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  specialization?: string[];
  balance: number;
  pendingPayouts: number;
  affiliateEarnings?: number;
  referralEarnings?: number;
  performanceScore?: number;
  lastPayoutDate?: any;
}

interface Article {
  id: string;
  title: string;
  authorId: string;
  status: string;
  views: number;
  earnings: number;
  publishedAt?: any;
  category?: string;
  engagementRate?: number;
}

export default function ManagerContributors() {
  const { user } = useAuth();
  const [contributors, setContributors] = useState<Contributor[]>([]);
  const [recentArticles, setRecentArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterLevel, setFilterLevel] = useState('all');
  const [selectedContributor, setSelectedContributor] = useState<Contributor | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [updating, setUpdating] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    fetchContributorsData();
  }, [user]);

  const fetchContributorsData = async () => {
    try {
      // Fetch all contributors
      const contributorsQuery = query(collection(db, 'contributors'));
      const contributorsSnapshot = await getDocs(contributorsQuery);
      const contributorsData = contributorsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Contributor[];
      
      // Fetch recent articles for performance insights
      const articlesQuery = query(
        collection(db, 'articles'),
        where('status', '==', 'approved'),
        orderBy('publishedAt', 'desc'),
        // limit(10)
      );
      const articlesSnapshot = await getDocs(articlesQuery);
      const articlesData = articlesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Article[];

      setContributors(contributorsData);
      setRecentArticles(articlesData);
    } catch (error) {
      console.error('Error fetching contributors data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (contributorId: string, newStatus: Contributor['status']) => {
    setUpdating(contributorId);
    try {
      await updateDoc(doc(db, 'contributors', contributorId), {
        status: newStatus,
        updatedAt: new Date()
      });
      
      await fetchContributorsData();
      setShowDetails(false);
      alert('Contributor status updated successfully!');
    } catch (error) {
      console.error('Error updating contributor status:', error);
      alert('Error updating contributor status. Please try again.');
    } finally {
      setUpdating(null);
    }
  };

  const viewDetails = (contributor: Contributor) => {
    setSelectedContributor(contributor);
    setShowDetails(true);
  };

  // Filter contributors based on search and filters
  const filteredContributors = contributors.filter(contributor => {
    const matchesSearch = 
      contributor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contributor.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contributor.specialization?.some(spec => 
        spec.toLowerCase().includes(searchTerm.toLowerCase())
      );

    const matchesStatus = filterStatus === 'all' || contributor.status === filterStatus;
    const matchesLevel = filterLevel === 'all' || contributor.level === filterLevel;

    return matchesSearch && matchesStatus && matchesLevel;
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'Never';
    return timestamp.toDate().toLocaleDateString();
  };

  const formatLastActive = (lastActive: any) => {
    if (!lastActive) return 'Never';
    
    const lastActiveDate = lastActive.toDate();
    const now = new Date();
    const diffMs = now.getTime() - lastActiveDate.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return lastActiveDate.toLocaleDateString();
  };

  const getStatusColor = (status: Contributor['status']) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-gray-100 text-gray-800';
      case 'suspended': return 'bg-red-100 text-red-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getLevelColor = (level?: string) => {
    switch (level) {
      case 'expert': return 'bg-purple-100 text-purple-800';
      case 'advanced': return 'bg-blue-100 text-blue-800';
      case 'intermediate': return 'bg-green-100 text-green-800';
      case 'beginner': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPerformanceColor = (score?: number) => {
    if (!score) return 'bg-gray-100 text-gray-800';
    if (score >= 90) return 'bg-green-100 text-green-800';
    if (score >= 70) return 'bg-blue-100 text-blue-800';
    if (score >= 50) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  const getStatusCounts = () => {
    return {
      active: contributors.filter(contrib => contrib.status === 'active').length,
      inactive: contributors.filter(contrib => contrib.status === 'inactive').length,
      suspended: contributors.filter(contrib => contrib.status === 'suspended').length,
      pending: contributors.filter(contrib => contrib.status === 'pending').length,
      total: contributors.length
    };
  };

  const getEarningsStats = () => {
    const totalEarnings = contributors.reduce((sum, contrib) => sum + (contrib.totalEarnings || 0), 0);
    const averageEarnings = contributors.length > 0 ? totalEarnings / contributors.length : 0;
    const topEarner = contributors.reduce((max, contrib) => 
      (contrib.totalEarnings || 0) > (max.totalEarnings || 0) ? contrib : max, contributors[0]
    );

    return { totalEarnings, averageEarnings, topEarner };
  };

  const getRecentPerformance = (contributorId: string) => {
    return recentArticles
      .filter(article => article.authorId === contributorId)
      .slice(0, 5);
  };

  const statusCounts = getStatusCounts();
  const earningsStats = getEarningsStats();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
        <span className="ml-3 text-gray-600">Loading contributors...</span>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Contributor Management</h1>
        <p className="text-gray-600 mt-2">Monitor and manage content contributors</p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg border shadow-sm">
          <div className="text-2xl font-bold text-gray-900">{statusCounts.total}</div>
          <div className="text-sm text-gray-600">Total Contributors</div>
        </div>
        <div className="bg-green-50 p-4 rounded-lg border border-green-200">
          <div className="text-2xl font-bold text-green-600">{statusCounts.active}</div>
          <div className="text-sm text-green-700">Active</div>
        </div>
        <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
          <div className="text-2xl font-bold text-purple-600">
            {formatCurrency(earningsStats.totalEarnings)}
          </div>
          <div className="text-sm text-purple-700">Total Earnings</div>
        </div>
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <div className="text-2xl font-bold text-blue-600">
            {contributors.reduce((sum, contrib) => sum + (contrib.articlesCount || 0), 0)}
          </div>
          <div className="text-sm text-blue-700">Total Articles</div>
        </div>
        <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
          <div className="text-2xl font-bold text-orange-600">
            {formatCurrency(earningsStats.averageEarnings)}
          </div>
          <div className="text-sm text-orange-700">Avg Earnings</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-sm border mb-6">
        <div className="border-b">
          <nav className="flex -mb-px">
            {['overview', 'performance', 'payouts'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-4 px-6 text-sm font-medium border-b-2 ${
                  activeTab === tab
                    ? 'border-green-500 text-green-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
            <input
              type="text"
              placeholder="Search contributors..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900 placeholder-gray-500" // ADDED: text-gray-900 placeholder-gray-500
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900" // ADDED: text-gray-900
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="suspended">Suspended</option>
              <option value="pending">Pending</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Level</label>
            <select
              value={filterLevel}
              onChange={(e) => setFilterLevel(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900" // ADDED: text-gray-900
            >
              <option value="all">All Levels</option>
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
              <option value="expert">Expert</option>
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={() => {
                setSearchTerm('');
                setFilterStatus('all');
                setFilterLevel('all');
              }}
              className="w-full bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Contributor Details Modal */}
      {showDetails && selectedContributor && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">
                  {selectedContributor.name}
                </h2>
                <button
                  onClick={() => setShowDetails(false)}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  ✕
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Basic Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Basic Information</h3>
                  <div className="space-y-3">
                    <InfoRow label="Email" value={selectedContributor.email} />
                    <InfoRow label="Joined Date" value={formatDate(selectedContributor.joinedAt)} />
                    <InfoRow label="Last Active" value={formatLastActive(selectedContributor.lastActive)} />
                    <div>
                      <label className="text-sm font-medium text-gray-600">Status</label>
                      <div className="mt-1">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(selectedContributor.status)}`}>
                          {selectedContributor.status}
                        </span>
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Level</label>
                      <div className="mt-1">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getLevelColor(selectedContributor.level)}`}>
                          {selectedContributor.level || 'Not set'}
                        </span>
                      </div>
                    </div>
                    {selectedContributor.specialization && selectedContributor.specialization.length > 0 && (
                      <div>
                        <label className="text-sm font-medium text-gray-600">Specialization</label>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {selectedContributor.specialization.map(spec => (
                            <span key={spec} className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                              {spec}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Earnings & Performance */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Earnings & Performance</h3>
                  <div className="space-y-3">
                    <InfoRow label="Total Earnings" value={formatCurrency(selectedContributor.totalEarnings || 0)} />
                    <InfoRow label="Available Balance" value={formatCurrency(selectedContributor.balance || 0)} />
                    <InfoRow label="Pending Payouts" value={formatCurrency(selectedContributor.pendingPayouts || 0)} />
                    <InfoRow label="Articles Published" value={selectedContributor.articlesCount?.toString() || '0'} />
                    <InfoRow label="Total Views" value={selectedContributor.totalViews?.toLocaleString() || '0'} />
                    {selectedContributor.affiliateEarnings && (
                      <InfoRow label="Affiliate Earnings" value={formatCurrency(selectedContributor.affiliateEarnings)} />
                    )}
                    {selectedContributor.performanceScore && (
                      <div>
                        <label className="text-sm font-medium text-gray-600">Performance Score</label>
                        <div className="mt-1">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPerformanceColor(selectedContributor.performanceScore)}`}>
                            {selectedContributor.performanceScore}%
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Recent Articles */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Recent Articles</h3>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {getRecentPerformance(selectedContributor.id).length > 0 ? (
                      getRecentPerformance(selectedContributor.id).map(article => (
                        <div key={article.id} className="p-2 border rounded-lg">
                          <div className="font-medium text-sm text-gray-900 truncate">{article.title}</div>
                          <div className="flex justify-between text-xs text-gray-500 mt-1">
                            <span>{article.views} views</span>
                            <span className="text-green-600">{formatCurrency(article.earnings)}</span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-gray-500 text-center py-4">No recent articles</p>
                    )}
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
                      onClick={() => handleStatusUpdate(selectedContributor.id, status as Contributor['status'])}
                      disabled={updating === selectedContributor.id || selectedContributor.status === status}
                      className={`px-4 py-2 rounded-lg text-sm font-medium ${
                        selectedContributor.status === status
                          ? 'bg-green-600 text-white'
                          : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                      } disabled:opacity-50`}
                    >
                      {updating === selectedContributor.id ? 'Updating...' : `Set ${status}`}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex justify-end mt-6 pt-6 border-t">
                <button
                  onClick={() => setShowDetails(false)}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Contributors Table */}
      <div className="bg-white rounded-lg shadow-sm border">
        {filteredContributors.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <div className="text-6xl mb-4">✍️</div>
            <p className="text-lg">
              {contributors.length === 0 ? 'No contributors yet' : 'No contributors match your filters'}
            </p>
            <p className="text-sm mt-2">
              {contributors.length === 0 
                ? 'Contributors will appear here when they join the platform' 
                : 'Try adjusting your search or filters'
              }
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="text-left p-4 font-semibold text-gray-700">Contributor</th>
                  <th className="text-left p-4 font-semibold text-gray-700">Level</th>
                  <th className="text-left p-4 font-semibold text-gray-700">Articles</th>
                  <th className="text-left p-4 font-semibold text-gray-700">Total Earnings</th>
                  <th className="text-left p-4 font-semibold text-gray-700">Balance</th>
                  <th className="text-left p-4 font-semibold text-gray-700">Status</th>
                  <th className="text-left p-4 font-semibold text-gray-700">Last Active</th>
                  <th className="text-left p-4 font-semibold text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredContributors.map((contributor) => (
                  <tr key={contributor.id} className="border-b hover:bg-gray-50">
                    <td className="p-4">
                      <div>
                        <div className="font-medium text-gray-900">
                          {contributor.name}
                        </div>
                        <div className="text-sm text-gray-500">{contributor.email}</div>
                        {contributor.specialization && contributor.specialization.length > 0 && (
                          <div className="text-xs text-gray-400 mt-1">
                            {contributor.specialization.slice(0, 2).join(', ')}
                            {contributor.specialization.length > 2 && '...'}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="p-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getLevelColor(contributor.level)}`}>
                        {contributor.level || 'Not set'}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="text-gray-900 font-medium">{contributor.articlesCount || 0}</div>
                      <div className="text-sm text-gray-500">{contributor.totalViews?.toLocaleString() || 0} views</div>
                    </td>
                    <td className="p-4">
                      <div className="text-green-600 font-semibold">
                        {formatCurrency(contributor.totalEarnings || 0)}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="text-blue-600 font-medium">
                        {formatCurrency(contributor.balance || 0)}
                      </div>
                    </td>
                    <td className="p-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(contributor.status)}`}>
                        {contributor.status}
                      </span>
                    </td>
                    <td className="p-4 text-gray-600 text-sm">
                      {formatLastActive(contributor.lastActive)}
                    </td>
                    <td className="p-4">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => viewDetails(contributor)}
                          className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                        >
                          View
                        </button>
                        <button
                          onClick={() => handleStatusUpdate(
                            contributor.id, 
                            contributor.status === 'active' ? 'inactive' : 'active'
                          )}
                          disabled={updating === contributor.id}
                          className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700 disabled:opacity-50"
                        >
                          {updating === contributor.id ? '...' : contributor.status === 'active' ? 'Deactivate' : 'Activate'}
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

      {/* Top Performers Section */}
      {activeTab === 'performance' && contributors.length > 0 && (
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Earners</h3>
            <div className="space-y-3">
              {[...contributors]
                .filter(c => c.totalEarnings > 0)
                .sort((a, b) => (b.totalEarnings || 0) - (a.totalEarnings || 0))
                .slice(0, 5)
                .map((contributor, index) => (
                  <div key={contributor.id} className="flex items-center justify-between p-2 border rounded">
                    <div className="flex items-center">
                      <div className="w-6 h-6 bg-yellow-500 rounded-full flex items-center justify-center text-white text-xs font-bold mr-2">
                        {index + 1}
                      </div>
                      <span className="text-sm font-medium text-gray-900">{contributor.name}</span> {/* ADDED: text-gray-900 */}
                    </div>
                    <span className="text-green-600 font-semibold text-sm">
                      {formatCurrency(contributor.totalEarnings || 0)}
                    </span>
                  </div>
                ))}
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Most Prolific</h3>
            <div className="space-y-3">
              {[...contributors]
                .filter(c => c.articlesCount > 0)
                .sort((a, b) => (b.articlesCount || 0) - (a.articlesCount || 0))
                .slice(0, 5)
                .map((contributor, index) => (
                  <div key={contributor.id} className="flex items-center justify-between p-2 border rounded">
                    <div className="flex items-center">
                      <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-bold mr-2">
                        {index + 1}
                      </div>
                      <span className="text-sm font-medium text-gray-900">{contributor.name}</span> {/* ADDED: text-gray-900 */}
                    </div>
                    <span className="text-blue-600 font-semibold text-sm">
                      {contributor.articlesCount} articles
                    </span>
                  </div>
                ))}
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Highest Engagement</h3>
            <div className="space-y-3">
              {[...contributors]
                .filter(c => c.totalViews > 0)
                .sort((a, b) => (b.totalViews || 0) - (a.totalViews || 0))
                .slice(0, 5)
                .map((contributor, index) => (
                  <div key={contributor.id} className="flex items-center justify-between p-2 border rounded">
                    <div className="flex items-center">
                      <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center text-white text-xs font-bold mr-2">
                        {index + 1}
                      </div>
                      <span className="text-sm font-medium text-gray-900">{contributor.name}</span> {/* ADDED: text-gray-900 */}
                    </div>
                    <span className="text-green-600 font-semibold text-sm">
                      {contributor.totalViews?.toLocaleString()} views
                    </span>
                  </div>
                ))}
            </div>
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
    <p className="text-gray-900">{value || 'Not provided'}</p>
  </div>
);