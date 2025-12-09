"use client";
import { useState } from "react";
import MembersList from "@/components/MemberList";
import MemberForm from "@/components/MemberForm";
import Link from "next/link";
import { useFnMembers } from "@/hooks/useFnMembers";
import type { FnMemberWithRelations } from "@/hooks/useFnMembers";
import { Toaster } from "@/components/ui/sonner";
import { ArrowLeft, Plus, Search, Loader2, ChevronLeft, ChevronRight, Edit } from "lucide-react";

function Editor() {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedMember, setSelectedMember] = useState<FnMemberWithRelations | null>(null);
    const [isCreating, setIsCreating] = useState(false);
    
    const { 
        members, 
        isLoading, 
        error, 
        barcodes, 
        barcodesLoading,
        pagination,
        createMutation, 
        updateMutation, 
        deleteMutation,
        goToPage,
        nextPage,
        previousPage,
        changeLimit,
        changeSorting,
        currentPage,
        limit,
        sortBy,
        sortOrder
    } = useFnMembers(searchTerm);

    // Ensure members is always an array
    const membersList = members || [];
    const barcodesList = barcodes || [];

    const handleSelectMember = (member: FnMemberWithRelations) => {
        setIsCreating(false);
        setSelectedMember(member);
    };

    const handleCreateNew = () => {
        setIsCreating(true);
        setSelectedMember(null);
    };

    const handleFormSuccess = () => {
        setIsCreating(false);
        setSelectedMember(null);
    };

    const handleDelete = async (id: string) => {
        if (window.confirm('Are you sure you want to delete this member?')) {
            await deleteMutation.mutateAsync(id);
            if (selectedMember?.id === id) {
                setSelectedMember(null);
            }
        }
    };

    if (error) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 flex items-center justify-center">
                <div className="text-center">
                    <div className="border-0 bg-gradient-to-br from-red-50 to-pink-100 dark:from-red-900/20 dark:to-pink-800/20 backdrop-blur-sm rounded-2xl p-8 shadow-xl">
                        <h2 className="text-xl font-bold bg-gradient-to-r from-red-600 to-pink-600 bg-clip-text text-transparent mb-2">
                            Error Loading Data
                        </h2>
                        <p className="text-slate-600 dark:text-slate-300 mb-4">
                            Please try refreshing the page
                        </p>
                        <button 
                            onClick={() => window.location.reload()}
                            className="px-6 py-3 bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white rounded-xl transition-all duration-200 hover:scale-105 shadow-lg"
                        >
                            Refresh Page
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-100 via-blue-400 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
            <Toaster />
            
            {/* Header */}
            <header className="border-b border-white/20 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl supports-[backdrop-filter]:bg-white/60 dark:supports-[backdrop-filter]:bg-slate-900/60">
                <div className="container flex h-14 max-w-screen-2xl items-center justify-between px-4">
                    <div>
                        <h1 className="text-xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                            Member Management
                        </h1>
                    </div>
                    <Link 
                        href="/Home" 
                        className="flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-emerald-600 dark:text-slate-300 dark:hover:text-emerald-400 transition-colors"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Back to Home
                    </Link>
                </div>
            </header>

            {/* Main Content */}
            <main className="w-full p-4">
                <div className="mb-6">
                    <h2 className="text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 dark:from-slate-100 dark:to-slate-300 bg-clip-text text-transparent">
                        Member Database Editor
                    </h2>
                    <p className="text-slate-600 dark:text-slate-300 mt-1">
                        Manage First Nation member records and information
                    </p>
                </div>
              
                {/* Search and Create Section */}
                <div className="mb-6 flex items-center justify-between gap-4">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500 dark:text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search by name, T-number, or community..."
                            className="h-12 w-full rounded-xl border-0 bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm pl-10 pr-4 text-sm shadow-lg 
                                     placeholder:text-slate-500 dark:placeholder:text-slate-400 focus:outline-none focus:ring-2 
                                     focus:ring-emerald-500 dark:focus:ring-emerald-400 focus:bg-white dark:focus:bg-slate-800 transition-all"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        {isLoading && (
                            <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-emerald-500" />
                        )}
                    </div>
                    <button
                        onClick={handleCreateNew}
                        disabled={createMutation.isPending}
                        className="inline-flex items-center justify-center rounded-xl text-sm font-medium h-12 px-6 
                                 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 
                                 text-white shadow-lg hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:hover:scale-100"
                    >
                        {createMutation.isPending ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                            <Plus className="mr-2 h-4 w-4" />
                        )}
                        Add New Member
                    </button>
                </div>

                {/* Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Members List Panel */}
                    <div className="rounded-2xl border border-white/20 bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl shadow-xl">
                        <div className="p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-semibold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                                    Members Directory
                                </h3>
                                <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                                    {searchTerm && (
                                        <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded-full text-xs">
                                            "{searchTerm}"
                                        </span>
                                    )}
                                    <span className="px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded-full text-xs">
                                        {pagination.totalCount} total
                                    </span>
                                </div>
                            </div>

                            {/* Sorting Controls */}
                            <div className="flex items-center gap-4 mb-4 p-4 bg-gradient-to-r from-slate-50 to-gray-100 dark:from-slate-800 dark:to-slate-700 rounded-xl">
                                <div className="flex items-center gap-2">
                                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Sort by:</span>
                                    <select 
                                        value={sortBy}
                                        onChange={(e) => changeSorting(e.target.value)}
                                        className="px-3 py-1 text-sm border-0 bg-white dark:bg-slate-800 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="created">Date Added</option>
                                        <option value="name">First Name</option>
                                        <option value="last_name">Last Name</option>
                                        <option value="t_number">T-Number</option>
                                        <option value="community">Community</option>
                                    </select>
                                </div>
                                
                                <button
                                    onClick={() => changeSorting(sortBy, sortOrder === 'asc' ? 'desc' : 'asc')}
                                    className="px-3 py-1 text-sm bg-white dark:bg-slate-800 border-0 rounded-lg shadow-sm hover:bg-blue-50 dark:hover:bg-slate-700 transition-colors"
                                >
                                    {sortOrder === 'asc' ? '↑ Ascending' : '↓ Descending'}
                                </button>

                                <div className="flex items-center gap-2 ml-auto">
                                    <span className="text-sm text-slate-700 dark:text-slate-300">Show:</span>
                                    <select
                                        value={limit}
                                        onChange={(e) => changeLimit(Number(e.target.value))}
                                        className="px-3 py-1 text-sm border-0 bg-white dark:bg-slate-800 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value={10}>10</option>
                                        <option value={25}>25</option>
                                        <option value={50}>50</option>
                                        <option value={100}>100</option>
                                    </select>
                                </div>
                            </div>
                            
                            <div className="overflow-y-auto max-h-[calc(100vh-400px)]">
                                {isLoading ? (
                                    <div className="flex items-center justify-center h-32">
                                        <div className="text-center">
                                            <Loader2 className="h-8 w-8 animate-spin text-emerald-500 mx-auto mb-2" />
                                            <span className="text-sm text-slate-600 dark:text-slate-400">Loading members...</span>
                                        </div>
                                    </div>
                                ) : membersList.length === 0 ? (
                                    <div className="flex items-center justify-center h-32">
                                        <div className="text-center">
                                            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-600 flex items-center justify-center mx-auto mb-4">
                                                <Edit className="h-8 w-8 text-slate-500 dark:text-slate-400" />
                                            </div>
                                            <p className="text-slate-600 dark:text-slate-400 mb-2">
                                                {searchTerm ? 'No members found matching your search.' : 'No members found.'}
                                            </p>
                                            {searchTerm && (
                                                <button
                                                    onClick={() => setSearchTerm('')}
                                                    className="text-sm text-emerald-600 hover:text-emerald-800 dark:text-emerald-400 dark:hover:text-emerald-300 hover:underline"
                                                >
                                                    Clear search
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ) : (
                                    <MembersList 
                                        members={membersList}
                                        onSelectMember={handleSelectMember}
                                        onDeleteMember={handleDelete}
                                        selectedMemberId={selectedMember?.id}
                                        isDeleting={deleteMutation.isPending}
                                    />
                                )}
                            </div>

                            {/* Pagination */}
                            {membersList.length > 0 && pagination.totalPages > 1 && (
                                <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                                    <div className="text-sm text-slate-600 dark:text-slate-400">
                                        Showing {((currentPage - 1) * limit) + 1} to {Math.min(currentPage * limit, pagination.totalCount)} of {pagination.totalCount} members
                                    </div>
                                    
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={previousPage}
                                            disabled={!pagination.hasPreviousPage}
                                            className="p-2 rounded-lg hover:bg-blue-50 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                        >
                                            <ChevronLeft className="h-4 w-4" />
                                        </button>
                                        
                                        <span className="px-3 py-1 text-sm font-medium bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg">
                                            Page {currentPage} of {pagination.totalPages}
                                        </span>
                                        
                                        <button
                                            onClick={nextPage}
                                            disabled={!pagination.hasNextPage}
                                            className="p-2 rounded-lg hover:bg-blue-50 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                        >
                                            <ChevronRight className="h-4 w-4" />
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                    
                    {/* Member Form Panel */}
                    <div className="rounded-2xl border border-white/20 bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl shadow-xl">
                        <div className="p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-semibold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                                    {isCreating 
                                        ? 'Create New Member' 
                                        : selectedMember 
                                            ? `Edit: ${selectedMember.first_name} ${selectedMember.last_name}` 
                                            : 'Member Details'
                                    }
                                </h3>
                                {selectedMember && !isCreating && (
                                    <div className="flex items-center gap-2 text-sm">
                                        <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded-full text-xs">
                                            T#{selectedMember.t_number}
                                        </span>
                                        {selectedMember.profile?.[0]?.o_r_status && (
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                                selectedMember.profile[0].o_r_status === 'onreserve' 
                                                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300' 
                                                    : 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300'
                                            }`}>
                                                {selectedMember.profile[0].o_r_status === 'onreserve' ? 'On Reserve' : 'Off Reserve'}
                                            </span>
                                        )}
                                    </div>
                                )}
                            </div>
                            
                            {(selectedMember || isCreating) ? (
                                <div className="overflow-y-auto max-h-[calc(100vh-280px)]">
                                    <MemberForm 
                                        member={selectedMember} 
                                        isCreating={isCreating}
                                        availableBarcodes={barcodesList}
                                        barcodesLoading={barcodesLoading}
                                        onSubmit={isCreating ? createMutation.mutateAsync : updateMutation.mutateAsync}
                                        onSuccess={handleFormSuccess}
                                        onCancel={() => {
                                            setIsCreating(false);
                                            setSelectedMember(null);
                                        }}
                                        isSubmitting={createMutation.isPending || updateMutation.isPending}
                                    />
                                </div>
                            ) : (
                                <div className="flex items-center justify-center h-64">
                                    <div className="text-center">
                                        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-900/30 dark:to-teal-900/30 flex items-center justify-center mx-auto mb-4">
                                            <Edit className="h-10 w-10 text-emerald-600 dark:text-emerald-400" />
                                        </div>
                                        <p className="text-lg font-medium text-slate-800 dark:text-slate-200 mb-2">No member selected</p>
                                        <p className="text-sm text-slate-600 dark:text-slate-400 mb-4 max-w-sm">
                                            Select a member from the list to view and edit their details, 
                                            or create a new member record.
                                        </p>
                                        <button
                                            onClick={handleCreateNew}
                                            className="inline-flex items-center justify-center rounded-xl text-sm font-medium h-10 px-4 
                                                     bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 
                                                     text-white hover:scale-105 transition-all duration-200 shadow-lg"
                                        >
                                            <Plus className="mr-2 h-4 w-4" />
                                            Create New Member
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}

export default Editor;