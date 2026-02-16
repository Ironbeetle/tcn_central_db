import { useState, useCallback, useMemo, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { 
  getFnMembers,
  getUnassignedBarcodes,
  createFnMember,
  updateFnMember,
  deleteFnMember,
  type CreateMemberData
} from '@/lib/actions';
import type { fnmember, Profile, Barcode, Family } from '@prisma/client';

// Type for member with relations (matches what your actions return)
export type FnMemberWithRelations = fnmember & {
  profile: Profile[];
  barcode: Barcode[];
  family: Family[];
};

// Query keys for cache management
const QUERY_KEYS = {
  members: (searchTerm: string) => ['fnmembers', searchTerm] as const,
  barcodes: ['unassigned-barcodes'] as const,
};

export const useFnMembers = (searchTerm: string = '') => {
  const queryClient = useQueryClient();

  // Pagination and sorting state (kept local since it's UI state)
  const [currentPage, setCurrentPage] = useState(1);
  const [limit, setLimit] = useState(25);
  const [sortBy, setSortBy] = useState('created');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Fetch members using TanStack Query
  const {
    data: membersData,
    isLoading,
    error,
    refetch: refetchMembersQuery,
  } = useQuery({
    queryKey: QUERY_KEYS.members(searchTerm),
    queryFn: async () => {
      const result = await getFnMembers(searchTerm);
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch members');
      }
      return result.data as FnMemberWithRelations[];
    },
    staleTime: 30 * 1000, // Data fresh for 30 seconds
    gcTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  // Fetch barcodes using TanStack Query
  const {
    data: barcodes = [],
    isLoading: barcodesLoading,
    refetch: refetchBarcodesQuery,
  } = useQuery({
    queryKey: QUERY_KEYS.barcodes,
    queryFn: async () => {
      const result = await getUnassignedBarcodes();
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch barcodes');
      }
      return result.data as Barcode[];
    },
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
  });

  const allMembers = membersData ?? [];

  // Client-side sorting - MEMOIZED to prevent recalculation on every render
  const sortedMembers = useMemo(() => {
    return [...allMembers].sort((a, b) => {
      let aValue: any;
      let bValue: any;
      
      switch (sortBy) {
        case 'name':
          aValue = a.first_name.toLowerCase();
          bValue = b.first_name.toLowerCase();
          break;
        case 'last_name':
          aValue = a.last_name.toLowerCase();
          bValue = b.last_name.toLowerCase();
          break;
        case 't_number':
          aValue = a.t_number;
          bValue = b.t_number;
          break;
        case 'birthdate':
          aValue = new Date(a.birthdate);
          bValue = new Date(b.birthdate);
          break;
        case 'community':
          aValue = a.profile?.[0]?.community?.toLowerCase() || '';
          bValue = b.profile?.[0]?.community?.toLowerCase() || '';
          break;
        case 'created':
        default:
          aValue = new Date(a.created);
          bValue = new Date(b.created);
          break;
      }
      
      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
  }, [allMembers, sortBy, sortOrder]);

  // Client-side pagination - MEMOIZED
  const totalPages = Math.ceil(sortedMembers.length / limit);
  const paginatedMembers = useMemo(() => {
    return sortedMembers.slice((currentPage - 1) * limit, currentPage * limit);
  }, [sortedMembers, currentPage, limit]);
  
  const pagination = useMemo(() => ({
    currentPage,
    totalPages,
    totalCount: sortedMembers.length,
    hasNextPage: currentPage < totalPages,
    hasPreviousPage: currentPage > 1,
    limit,
  }), [currentPage, totalPages, sortedMembers.length, limit]);

  // Pagination functions
  const goToPage = useCallback((page: number) => {
    const newPage = Math.max(1, Math.min(page, totalPages));
    setCurrentPage(newPage);
  }, [totalPages]);

  const nextPage = useCallback(() => {
    if (pagination.hasNextPage) {
      setCurrentPage(prev => prev + 1);
    }
  }, [pagination.hasNextPage]);

  const previousPage = useCallback(() => {
    if (pagination.hasPreviousPage) {
      setCurrentPage(prev => prev - 1);
    }
  }, [pagination.hasPreviousPage]);

  const changeLimit = useCallback((newLimit: number) => {
    setLimit(newLimit);
    setCurrentPage(1); // Reset to first page when changing limit
  }, []);

  const changeSorting = useCallback((newSortBy: string, newSortOrder?: 'asc' | 'desc') => {
    setSortBy(newSortBy);
    if (newSortOrder) {
      setSortOrder(newSortOrder);
    } else {
      setSortOrder(prev => newSortBy === sortBy ? (prev === 'asc' ? 'desc' : 'asc') : 'asc');
    }
    setCurrentPage(1); // Reset to first page when changing sort
  }, [sortBy]);

  // Reset page when search term changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  // Create member mutation with TanStack Query
  const createMutationHook = useMutation({
    mutationFn: async (data: CreateMemberData) => {
      const result = await createFnMember(data);
      
      if (!result.success) {
        if (result.error === 'Validation failed' && (result as any).details) {
          const validationErrors = (result as any).details;
          const fieldErrors = validationErrors.map((err: any) => `${err.path.join('.')}: ${err.message}`).join(', ');
          throw new Error(`Validation failed: ${fieldErrors}`);
        }
        throw new Error(result.error || 'Failed to create member');
      }
      
      return result.data as FnMemberWithRelations;
    },
    onSuccess: (newMember, variables) => {
      // Optimistically update cache
      queryClient.setQueryData<FnMemberWithRelations[]>(
        QUERY_KEYS.members(searchTerm),
        (old) => old ? [newMember, ...old] : [newMember]
      );
      
      // Invalidate queries to refetch in background
      queryClient.invalidateQueries({ queryKey: ['fnmembers'] });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.barcodes });
      
      setCurrentPage(1);
      toast.success(`Member ${variables.first_name} ${variables.last_name} created successfully!`);
    },
    onError: (err: Error) => {
      console.error('Create member error:', err);
      
      let errorMessage = err.message;
      if (errorMessage.includes('Validation failed') || errorMessage.includes('required')) {
        errorMessage = 'Please fill in all required fields correctly';
      } else if (errorMessage.includes('T-number already exists')) {
        errorMessage = 'This T-number is already in use. Please use a different T-number.';
      } else if (errorMessage.includes('email')) {
        errorMessage = 'Please enter a valid email address';
      }
      
      toast.error(`Failed to create member: ${errorMessage}`);
    },
  });

  // Update member mutation with TanStack Query
  const updateMutationHook = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<CreateMemberData> }) => {
      const result = await updateFnMember(id, data);
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to update member');
      }
      
      return result.data as FnMemberWithRelations;
    },
    onSuccess: (updatedMember) => {
      // Optimistically update cache
      queryClient.setQueryData<FnMemberWithRelations[]>(
        QUERY_KEYS.members(searchTerm),
        (old) => old?.map(member => member.id === updatedMember.id ? updatedMember : member)
      );
      
      // Invalidate queries to refetch in background
      queryClient.invalidateQueries({ queryKey: ['fnmembers'] });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.barcodes });
      
      toast.success('Member updated successfully!');
    },
    onError: (err: Error) => {
      console.error('Update member error:', err);
      toast.error(`Failed to update member: ${err.message}`);
    },
  });

  // Delete member mutation with TanStack Query
  const deleteMutationHook = useMutation({
    mutationFn: async (id: string) => {
      const result = await deleteFnMember(id);
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to delete member');
      }
      
      return id;
    },
    onSuccess: (deletedId) => {
      // Optimistically update cache
      queryClient.setQueryData<FnMemberWithRelations[]>(
        QUERY_KEYS.members(searchTerm),
        (old) => old?.filter(member => member.id !== deletedId)
      );
      
      // Invalidate queries to refetch in background
      queryClient.invalidateQueries({ queryKey: ['fnmembers'] });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.barcodes });
      
      toast.success('Member deleted successfully!');
    },
    onError: (err: Error) => {
      console.error('Delete member error:', err);
      toast.error(`Failed to delete member: ${err.message}`);
    },
  });

  // Return shape matches original hook for backwards compatibility
  const createMutation = {
    isPending: createMutationHook.isPending,
    mutateAsync: createMutationHook.mutateAsync,
  };

  const updateMutation = {
    isPending: updateMutationHook.isPending,
    mutateAsync: updateMutationHook.mutateAsync,
  };

  const deleteMutation = {
    isPending: deleteMutationHook.isPending,
    mutateAsync: deleteMutationHook.mutateAsync,
  };

  // Return all the properties that the Editor page expects
  return {
    // Data
    members: paginatedMembers,
    barcodes,
    pagination,
    
    // Loading states
    isLoading,
    barcodesLoading,
    error: error as Error | null,
    
    // Mutations
    createMutation,
    updateMutation,
    deleteMutation,
    
    // Pagination functions
    goToPage,
    nextPage,
    previousPage,
    changeLimit,
    changeSorting,
    
    // Current state
    currentPage,
    limit,
    sortBy,
    sortOrder,
    
    // Refresh functions
    refetchMembers: () => refetchMembersQuery(),
    refetchBarcodes: () => refetchBarcodesQuery(),
  };
};

export default useFnMembers;