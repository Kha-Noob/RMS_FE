'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import type { User, Branch } from '@/types';

interface AuthContextType {
  user: User | null;
  branches: Branch[];
  activeBranchId: string | null;
  activeBranchName: string | null;
  isSuperAdmin: boolean;
  isAdmin: boolean;
  canSwitchBranch: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  switchBranch: (branchId: string) => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [activeBranchId, setActiveBranchId] = useState<string | null>(null);
  const [activeBranchName, setActiveBranchName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    try {
      const me = await api.get<User>('/api/auth/me');
      setUser(me);

      const isAdmin = me.roles.includes('ADMIN');
      const isSuperAdmin = isAdmin && !me.branchId;
      const canSwitch = isSuperAdmin;

      if (me.branchId) {
        setActiveBranchId(me.branchId);
      }

      if (canSwitch) {
        try {
          const branchList = await api.get<Branch[]>('/api/branch/all');
          setBranches(branchList);
          if (!activeBranchId && branchList.length > 0) {
            setActiveBranchId(branchList[0].branchId);
            setActiveBranchName(branchList[0].name);
          }
        } catch {
          setBranches([]);
        }
      }
    } catch {
      setUser(null);
    }
  }, [activeBranchId]);

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
    await api.post('/api/auth/login', { email, password });
    await refreshUser();
  };

  const logout = async () => {
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'}/logout`, {
        method: 'POST',
        credentials: 'include',
      });
    } catch { /* ignore */ }
    setUser(null);
    window.location.href = '/login';
  };

  const switchBranch = (branchId: string) => {
    setActiveBranchId(branchId);
  };

  const isSuperAdmin = user?.roles.includes('ADMIN') && !user?.branchId || false;
  const isAdmin = user?.roles.includes('ADMIN') || false;
  const canSwitchBranch = isSuperAdmin;

  return (
    <AuthContext.Provider value={{
      user, branches, activeBranchId, activeBranchName,
      isSuperAdmin, isAdmin, canSwitchBranch,
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
