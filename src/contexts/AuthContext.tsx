'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api, storeCredentials, clearCredentials } from '@/lib/api';
import type { User, Branch } from '@/types';

const BRANCH_STORAGE_KEY = 'rms_active_branch';

function getStoredBranchId(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(BRANCH_STORAGE_KEY) || null;
}

function setStoredBranchId(branchId: string | null) {
  if (typeof window === 'undefined') return;
  if (branchId) {
    localStorage.setItem(BRANCH_STORAGE_KEY, branchId);
  } else {
    localStorage.removeItem(BRANCH_STORAGE_KEY);
  }
}

interface AuthContextType {
  user: User | null;
  branches: Branch[];
  activeBranchId: string | null;
  activeBranchName: string | null;
  isSuperAdmin: boolean;
  isAdmin: boolean;
  isManager: boolean;
  isCashier: boolean;
  isKitchen: boolean;
  isHR: boolean;
  isProcurement: boolean;
  isWarehouse: boolean;
  isEmployee: boolean;
  hasRole: (role: string) => boolean;
  hasAnyRole: (roles: string[]) => boolean;
  getDefaultLandingPage: (roles: string[]) => string;
  canSwitchBranch: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<User>;
  logout: () => Promise<void>;
  switchBranch: (branchId: string) => Promise<void>;
  refreshUser: () => Promise<User | undefined>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [activeBranchId, setActiveBranchId] = useState<string | null>(null);
  const [activeBranchName, setActiveBranchName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const loadBranchesAndSetDefault = useCallback(async (currentUser: User) => {
    try {
      const branchList = await api.get<Branch[]>('/api/branches/my-branches');
      setBranches(branchList);

      if (branchList.length === 0) {
        setStoredBranchId(null);
        return;
      }

      const storedBranchId = getStoredBranchId();
      const storedStillValid = storedBranchId && branchList.some(b => b.branchId === storedBranchId);

      if (storedStillValid) {
        setActiveBranchId(storedBranchId);
        const found = branchList.find(b => b.branchId === storedBranchId);
        if (found) setActiveBranchName(found.name);
      } else if (currentUser.branchId && branchList.some(b => b.branchId === currentUser.branchId)) {
        setActiveBranchId(currentUser.branchId);
        setStoredBranchId(currentUser.branchId);
        const found = branchList.find(b => b.branchId === currentUser.branchId);
        if (found) setActiveBranchName(found.name);
      } else {
        setActiveBranchId(branchList[0].branchId);
        setStoredBranchId(branchList[0].branchId);
        setActiveBranchName(branchList[0].name);
      }
    } catch {
      setBranches([]);
    }
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const me = await api.get<User>('/api/auth/me');
      setUser(me);
      await loadBranchesAndSetDefault(me);
      return me;
    } catch (err) {
      // Mock login bypass - prevent clearing mock session when backend is down
      // setUser(null);
      return undefined;
    }
  }, [loadBranchesAndSetDefault]);

  useEffect(() => {
    refreshUser().finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (branches.length > 0 && activeBranchId) {
      const found = branches.find(b => b.branchId === activeBranchId);
      if (found) setActiveBranchName(found.name);
    }
  }, [activeBranchId, branches]);

  const login = async (email: string, password: string) => {
    storeCredentials(email, password);
    // Mock login bypass for testing:
    if (email === 'admin@rms.com' && password === '123456') {
      const mockUser: User = {
        id: 1,
        email: email,
        name: 'Admin RMS',
        roles: ['ADMIN'],
        isActive: true,
        branchId: 'b1',
        tenantId: 't1'
      };
      setUser(mockUser);
      setBranches([
        { branchId: 'b1', name: 'Chi nhánh Hoàn Kiếm', address: '12 Tràng Tiền', phone: '0123456789', isActive: true }
      ]);
      setActiveBranchId('b1');
      setActiveBranchName('Chi nhánh Hoàn Kiếm');
      return mockUser;
    } else if (email === 'customer@rms.com' && password === '123456') {
      const mockUser: User = {
        id: 99,
        email: email,
        name: 'Customer Test',
        roles: ['CUSTOMER'],
        isActive: true,
        branchId: 'b1',
        tenantId: 't1'
      };
      setUser(mockUser);
      setBranches([]);
      setActiveBranchId(null);
      setActiveBranchName(null);
      return mockUser;
    } else {
      try {
        await api.post('/api/auth/login', { email, password });
        const me = await refreshUser();
        if (!me) {
          throw new Error('Failed to retrieve user profile');
        }
        return me;
      } catch (err) {
        throw new Error(err instanceof Error ? err.message : 'Invalid credentials or Server down');
      }
    }
  };

  const logout = async () => {
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'}/logout`, {
        method: 'POST',
        credentials: 'include',
      });
    } catch { /* ignore */ }
    clearCredentials();
    setStoredBranchId(null);
    setUser(null);
    window.location.href = '/';
  };

  const switchBranch = useCallback(async (branchId: string) => {
    const previousBranchId = activeBranchId;
    try {
      await api.post('/api/branches/select', { branchId });
      setActiveBranchId(branchId);
      setStoredBranchId(branchId);
      const found = branches.find(b => b.branchId === branchId);
      if (found) setActiveBranchName(found.name);
    } catch {
      setActiveBranchId(previousBranchId);
      if (previousBranchId) setStoredBranchId(previousBranchId);
    }
  }, [activeBranchId, branches]);

  const isSuperAdmin = user?.roles.includes('ADMIN') && !user?.branchId || false;
  const isAdmin = user?.roles.includes('ADMIN') || false;
  const isManager = user?.roles.includes('MANAGER') || false;
  const isCashier = user?.roles.includes('CASHIER') || false;
  const isKitchen = user?.roles.includes('KITCHEN') || user?.roles.includes('CHEF') || false;
  const isHR = user?.roles.includes('HR') || false;
  const isProcurement = user?.roles.includes('PROCUREMENT') || false;
  const isWarehouse = user?.roles.includes('WAREHOUSE') || false;
  const isEmployee = user?.roles.includes('EMPLOYEE') || false;

  const hasRole = useCallback((role: string) => user?.roles.includes(role) || false, [user]);
  const hasAnyRole = useCallback((rolesToCheck: string[]) => user?.roles.some(r => rolesToCheck.includes(r)) || false, [user]);

  const getDefaultLandingPage = useCallback((roles: string[]) => {
    if (roles.includes('ADMIN') || roles.includes('MANAGER')) return '/dashboard';
    if (roles.includes('HR')) return '/hr-management';
    if (roles.includes('KITCHEN') || roles.includes('CHEF')) return '/kds';
    if (roles.includes('WAREHOUSE')) return '/inventory';
    if (roles.includes('PROCUREMENT')) return '/procurement';
    if (roles.includes('CASHIER')) return '/pos';
    if (roles.includes('EMPLOYEE')) return '/schedule';
    return '/profile';
  }, []);

  const canSwitchBranch = isSuperAdmin;

  return (
    <AuthContext.Provider value={{
      user, branches, activeBranchId, activeBranchName,
      isSuperAdmin, isAdmin, isManager, isCashier, isKitchen, isHR, isProcurement, isWarehouse, isEmployee,
      hasRole, hasAnyRole, getDefaultLandingPage, canSwitchBranch,
      loading, login, logout, switchBranch, refreshUser,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
