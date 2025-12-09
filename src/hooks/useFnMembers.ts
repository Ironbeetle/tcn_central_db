import { useState, useEffect, useCallback, useTransition } from 'react';
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



export const useFnMembers = (searchTerm: string = '') => {
  const [allMembers, setAllMembers] = useState<FnMemberWithRelations[]>([]);
  const [barcodes, setBarcodes] = useState<Barcode[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [barcodesLoading, setBarcodesLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [isPending, startTransition] = useTransition();

  // Pagination and sorting state
  const [currentPage, setCurrentPage] = useState(1);
  const [limit, setLimit] = useState(25);
  const [sortBy, setSortBy] = useState('created');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Fetch members using your existing function
  const refetchMembers = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await getFnMembers(searchTerm);
      if (result.success && result.data) {
        setAllMembers(result.data);
      } else {
        throw new Error(result.error);
      }
    } catch (err) {
      console.error('Error fetching members:', err);
      setError(err as Error);
      toast.error('Failed to fetch members');
    } finally {
      setIsLoading(false);
    }
  }, [searchTerm]);

  // Fetch available barcodes using your existing function
  const refetchBarcodes = useCallback(async () => {
    setBarcodesLoading(true);
    
    try {
      const result = await getUnassignedBarcodes();
      if (result.success && result.data) {
        setBarcodes(result.data);
      } else {
        throw new Error(result.error);
      }
    } catch (err) {
      console.error('Error fetching barcodes:', err);
      toast.error('Failed to fetch barcodes');
    } finally {
      setBarcodesLoading(false);
    }
  }, []);

  // Client-side sorting
  const sortedMembers = [...allMembers].sort((a, b) => {
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

  // Client-side pagination
  const totalPages = Math.ceil(sortedMembers.length / limit);
  const paginatedMembers = sortedMembers.slice((currentPage - 1) * limit, currentPage * limit);
  
  const pagination = {
    currentPage,
    totalPages,
    totalCount: sortedMembers.length,
    hasNextPage: currentPage < totalPages,
    hasPreviousPage: currentPage > 1,
    limit,
  };

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

  // Create member mutation
  const createMutation = {
    isPending,
    mutateAsync: async (data: CreateMemberData): Promise<FnMemberWithRelations> => {
      try {
        const result = await createFnMember(data);
        
        if (!result.success) {
          // Handle validation errors with more detail
          if (result.error === 'Validation failed' && (result as any).details) {
            const validationErrors = (result as any).details;
            const fieldErrors = validationErrors.map((err: any) => `${err.path.join('.')}: ${err.message}`).join(', ');
            throw new Error(`Validation failed: ${fieldErrors}`);
          }
          throw new Error(result.error || 'Failed to create member');
        }

        // Update local state immediately for better UX
        const newMember = result.data as FnMemberWithRelations;
        setAllMembers(prev => [newMember, ...prev]);
        
        // Reset to first page to show new member
        setCurrentPage(1);
        
        console.log('Member created in hook, ID:', newMember.id);
        
        // Refetch in background to ensure consistency with API endpoints
        // Add a small delay to ensure database transaction is fully committed
        startTransition(async () => {
          try {
            // Small delay to ensure transaction commit is complete
            await new Promise(resolve => setTimeout(resolve, 500));
            await Promise.all([refetchMembers(), refetchBarcodes()]);
            console.log('Refetch completed after member creation');
          } catch (refetchError) {
            console.warn('Failed to refetch data after member creation:', refetchError);
            // Don't throw here - member was created successfully
          }
        });
        
        toast.success(`Member ${data.first_name} ${data.last_name} created successfully!`);
        return newMember;
        
      } catch (err) {
        console.error('Create member error:', {
          error: err,
          data,
          timestamp: new Date().toISOString()
        });

        // Handle specific error types
        if (err instanceof Error) {
          let errorMessage = err.message;
          
          // Handle validation errors more gracefully
          if (errorMessage.includes('Validation failed') || errorMessage.includes('required')) {
            errorMessage = 'Please fill in all required fields correctly';
          } else if (errorMessage.includes('T-number already exists')) {
            errorMessage = 'This T-number is already in use. Please use a different T-number.';
          } else if (errorMessage.includes('email')) {
            errorMessage = 'Please enter a valid email address';
          }
          
          toast.error(`Failed to create member: ${errorMessage}`);
        } else {
          toast.error('Failed to create member: Unknown error occurred');
        }
        
        throw err;
      }
    }
  };

  // Update member mutation
  const updateMutation = {
    isPending,
    mutateAsync: async ({ id, data }: { id: string; data: Partial<CreateMemberData> }): Promise<FnMemberWithRelations> => {
      try {
        const result = await updateFnMember(id, data);
        
        if (!result.success) {
          throw new Error(result.error || 'Failed to update member');
        }

        // Update local state immediately
        const updatedMember = result.data as FnMemberWithRelations;
        setAllMembers(prev => 
          prev.map(member => member.id === id ? updatedMember : member)
        );
        
        // Refetch in background
        startTransition(async () => {
          try {
            await Promise.all([refetchMembers(), refetchBarcodes()]);
          } catch (refetchError) {
            console.warn('Failed to refetch data after member update:', refetchError);
          }
        });
        
        toast.success('Member updated successfully!');
        return updatedMember;
        
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
        console.error('Update member error:', err);
        toast.error(`Failed to update member: ${errorMessage}`);
        throw err;
      }
    }
  };

  // Delete member mutation
  const deleteMutation = {
    isPending,
    mutateAsync: async (id: string): Promise<void> => {
      try {
        const result = await deleteFnMember(id);
        
        if (!result.success) {
          throw new Error(result.error || 'Failed to delete member');
        }

        // Update local state immediately
        setAllMembers(prev => prev.filter(member => member.id !== id));
        
        // Refetch in background
        startTransition(async () => {
          try {
            await Promise.all([refetchMembers(), refetchBarcodes()]);
          } catch (refetchError) {
            console.warn('Failed to refetch data after member deletion:', refetchError);
          }
        });
        
        toast.success('Member deleted successfully!');
        
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
        console.error('Delete member error:', err);
        toast.error(`Failed to delete member: ${errorMessage}`);
        throw err;
      }
    }
  };

  // Load data on mount and when search term changes
  useEffect(() => {
    refetchMembers();
  }, [refetchMembers]);

  useEffect(() => {
    refetchBarcodes();
  }, [refetchBarcodes]);

  // Return all the properties that the Editor page expects
  return {
    // Data
    members: paginatedMembers, // Return paginated and sorted members
    barcodes,
    pagination,
    
    // Loading states
    isLoading,
    barcodesLoading,
    error,
    
    // Mutations
    createMutation,
    updateMutation,
    deleteMutation,
    
    // Pagination functions - ALL OF THESE are now included
    goToPage,
    nextPage,
    previousPage,
    changeLimit,
    changeSorting,
    
    // Current state - ALL OF THESE are now included
    currentPage,
    limit,
    sortBy,
    sortOrder,
    
    // Refresh functions
    refetchMembers,
    refetchBarcodes,
  };
};

export default useFnMembers;