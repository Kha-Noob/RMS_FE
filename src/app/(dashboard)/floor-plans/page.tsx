'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

export default function FloorPlansPage() {
  const { activeBranchId } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (activeBranchId) {
      router.replace(`/branches/${activeBranchId}/floor-plans`);
    }
  }, [activeBranchId, router]);

  return (
    <div className="h-full flex items-center justify-center text-sm text-slate-500">
      No floor plan available.
    </div>
  );
}
