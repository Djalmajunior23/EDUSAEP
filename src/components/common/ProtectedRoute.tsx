import React from 'react';
import { Navigate } from 'react-router-dom';
import { UserProfile } from '../../types';

interface ProtectedRouteProps {
  children: React.ReactNode;
  userProfile: UserProfile | null;
  allowedRoles?: string[];
}

export function ProtectedRoute({ children, userProfile, allowedRoles }: ProtectedRouteProps) {
  if (!userProfile) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-gray-500 font-medium animate-pulse text-sm">Validando credenciais...</p>
      </div>
    );
  }

  // Support both uppercase and lowercase roles (database might have and/or userProfile might have)
  const normalizedRole = userProfile.role.toUpperCase();
  const normalizedAllowedRoles = allowedRoles?.map(r => r.toUpperCase());

  if (allowedRoles && !normalizedAllowedRoles.includes(normalizedRole)) {
    console.warn(`Access denied for role: ${normalizedRole}. Allowed: ${normalizedAllowedRoles}`);
    return <Navigate to="/" />;
  }

  return <>{children}</>;
}
