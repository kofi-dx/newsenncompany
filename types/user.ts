// types/index.ts
export type UserRole = 'ceo' | 'manager' | 'employee';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  status: 'active' | 'pending' | 'suspended';
  createdAt: Date;
  updatedAt: Date;
  managerId?: string;
  businessId?: string;
  permissions: string[];
  emailVerified: boolean;
}

export interface AuthRequest {
  id: string;
  userId: string;
  email: string;
  name: string;
  role: UserRole;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: Date;
  businessId?: string;
  approvedBy?: string;
  approvedAt?: Date;
}

export interface Article {
  id: string;
  title: string;
  content: string;
  authorId: string;
  authorName: string;
  category: string;
  views: number;
  likes: number;
  comments: number;
  status: 'published' | 'draft' | 'archived';
  createdAt: Date;
  updatedAt: Date;
  imageUrl?: string;
  earnings: number;
}

export interface Contributor {
  id: string;
  name: string;
  email: string;
  totalArticles: number;
  totalViews: number;
  totalEarnings: number;
  joinDate: Date;
  lastActive: Date;
  status: 'active' | 'inactive';
}

export interface Promotion {
  id: string;
  companyName: string;
  email: string;
  plan: string;
  status: 'active' | 'inactive' | 'pending';
  startDate: Date;
  endDate: Date;
  budget: number;
  impressions: number;
  clicks: number;
}

export const PERMISSIONS = {
  // CEO permissions
  VIEW_ALL_DATA: 'view_all_data',
  MANAGE_SYSTEM: 'manage_system',
  APPROVE_MANAGERS: 'approve_managers',
  APPROVE_DELETIONS: 'approve_deletions',
  MANAGE_EARNINGS: 'manage_earnings',
  OVERRIDE_SYSTEM: 'override_system',
  APPROVE_BUSINESS_IDS: 'approve_business_ids',
  
  // Manager permissions
  MANAGE_EMPLOYEES: 'manage_employees',
  VIEW_TEAM_DATA: 'view_team_data',
  APPROVE_REQUESTS: 'approve_requests',
  MANAGE_CONTRIBUTORS: 'manage_contributors',
  
  // Employee permissions
  VIEW_ARTICLES: 'view_articles',
  SHARE_CONTENT: 'share_content',
  MANAGE_PROMOS: 'manage_promos',
  READ_ANALYTICS: 'read_analytics'
} as const;