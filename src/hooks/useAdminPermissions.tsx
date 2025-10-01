import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface AdminPermissions {
  role: string;
  permissions: string[];
  isAdmin: boolean;
  isSuperAdmin: boolean;
}

export const useAdminPermissions = () => {
  const { user } = useAuth();
  const [adminData, setAdminData] = useState<AdminPermissions>({
    role: 'viewer',
    permissions: [],
    isAdmin: false,
    isSuperAdmin: false,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const fetchAdminPermissions = async () => {
      try {
        const { data, error } = await supabase
          .from('anaji_admin_users')
          .select('role, permissions, is_active')
          .eq('user_id', user.id)
          .eq('is_active', true)
          .single();

        if (error) {
          // User is not an admin
          setAdminData({
            role: 'viewer',
            permissions: [],
            isAdmin: false,
            isSuperAdmin: false,
          });
        } else {
          const permissions = Array.isArray(data.permissions) 
            ? (data.permissions as string[]) 
            : [];
          
          setAdminData({
            role: data.role,
            permissions,
            isAdmin: true,
            isSuperAdmin: data.role === 'super_admin',
          });
        }
      } catch (error) {
        console.error('Error fetching admin permissions:', error);
        setAdminData({
          role: 'viewer',
          permissions: [],
          isAdmin: false,
          isSuperAdmin: false,
        });
      } finally {
        setLoading(false);
      }
    };

    fetchAdminPermissions();
  }, [user]);

  const hasPermission = (permissionId: string): boolean => {
    // Super admin has access to everything
    if (adminData.isSuperAdmin) return true;
    
    // Check if user has the specific permission
    return adminData.permissions.includes(permissionId);
  };

  const hasRole = (role: string): boolean => {
    return adminData.role === role;
  };

  return {
    ...adminData,
    hasPermission,
    hasRole,
    loading,
  };
};
