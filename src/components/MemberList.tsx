import React from 'react';
import { Trash2, User, Mail, Phone, MapPin, IdCard, Calendar, Users } from 'lucide-react';
import type { FnMemberWithRelations } from '@/hooks/useFnMembers';

interface MembersListProps {
  members: FnMemberWithRelations[];
  onSelectMember: (member: FnMemberWithRelations) => void;
  onDeleteMember: (id: string) => void;
  selectedMemberId?: string;
  isDeleting: boolean;
}

const MembersList: React.FC<MembersListProps> = ({
  members,
  onSelectMember,
  onDeleteMember,
  selectedMemberId,
  isDeleting
}) => {
  if (members.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-600 flex items-center justify-center mx-auto mb-4">
          <User className="h-8 w-8 text-slate-500 dark:text-slate-400" />
        </div>
        <p className="text-lg font-medium mb-2 text-slate-800 dark:text-slate-200">No members found</p>
        <p className="text-sm text-slate-600 dark:text-slate-400">Members will appear here once added to the system.</p>
      </div>
    );
  }

  const calculateAge = (birthdate: Date) => {
    const today = new Date();
    const birth = new Date(birthdate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    
    return age;
  };

  return (
    <div className="space-y-3">
      {members.map((member) => {
        const profile = member.profile?.[0];
        const family = member.family?.[0];
        const isSelected = selectedMemberId === member.id;
        const age = member.birthdate ? calculateAge(member.birthdate) : null;

        return (
          <div
            key={member.id}
            className={`p-4 rounded-xl cursor-pointer transition-all duration-200 hover:scale-[1.02] ${
              isSelected 
                ? 'bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/30 dark:to-purple-900/30 border-2 border-blue-200 dark:border-blue-700 shadow-lg' 
                : 'bg-gradient-to-r from-white/80 to-slate-100/80 dark:from-slate-800/80 dark:to-slate-700/80 border border-white/20 shadow-sm hover:shadow-md'
            }`}
            onClick={() => onSelectMember(member)}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                {/* Header with name and T-number */}
                <div className="flex items-center gap-3 mb-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    isSelected 
                      ? 'bg-gradient-to-br from-blue-500 to-purple-500' 
                      : 'bg-gradient-to-br from-slate-400 to-slate-500'
                  }`}>
                    <User className="h-5 w-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-slate-800 dark:text-slate-100 truncate">
                        {member.first_name} {member.last_name}
                      </h3>
                      <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 text-xs font-medium rounded-full">
                        T#{member.t_number}
                      </span>
                      {member.deceased === 'yes' && (
                        <span className="px-2 py-1 bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 text-xs font-medium rounded-full">
                          Deceased
                        </span>
                      )}
                    </div>
                    {age && (
                      <p className="text-sm text-slate-600 dark:text-slate-400 flex items-center gap-1 mt-1">
                        <Calendar className="h-3 w-3" />
                        {age} years old
                      </p>
                    )}
                  </div>
                </div>

                {/* Member details */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                  {/* Contact info */}
                  {profile?.email && (
                    <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                      <div className="w-6 h-6 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                        <Mail className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
                      </div>
                      <span className="truncate">{profile.email}</span>
                    </div>
                  )}
                  
                  {profile?.phone_number && (
                    <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                      <div className="w-6 h-6 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                        <Phone className="h-3 w-3 text-blue-600 dark:text-blue-400" />
                      </div>
                      <span>{profile.phone_number}</span>
                    </div>
                  )}

                  {/* Location info */}
                  {profile?.community && (
                    <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                      <div className="w-6 h-6 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                        <MapPin className="h-3 w-3 text-purple-600 dark:text-purple-400" />
                      </div>
                      <span className="truncate">{profile.community}</span>
                    </div>
                  )}

                  {profile?.o_r_status && (
                    <div className="flex items-center gap-2">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        profile.o_r_status === 'onreserve' 
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300' 
                          : 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300'
                      }`}>
                        {profile.o_r_status === 'onreserve' ? 'On Reserve' : 'Off Reserve'}
                      </span>
                    </div>
                  )}
                </div>

                {/* Family info */}
                {family && (family.spouse_fname || family.dependents > 0) && (
                  <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400 text-sm mt-3 p-2 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                    <div className="w-6 h-6 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                      <Users className="h-3 w-3 text-purple-600 dark:text-purple-400" />
                    </div>
                    <span>
                      {family.spouse_fname && `Spouse: ${family.spouse_fname} ${family.spouse_lname || ''}`}
                      {family.spouse_fname && family.dependents > 0 && ' • '}
                      {family.dependents > 0 && `${family.dependents} dependent${family.dependents > 1 ? 's' : ''}`}
                    </span>
                  </div>
                )}

                {/* Barcodes */}
                {member.barcode && member.barcode.length > 0 && (
                  <div className="mt-3 p-2 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                    <div className="flex items-center gap-2 flex-wrap">
                      <div className="w-6 h-6 rounded-lg bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                        <IdCard className="h-3 w-3 text-orange-600 dark:text-orange-400" />
                      </div>
                      <span className="text-xs text-slate-600 dark:text-slate-400 font-medium">Barcodes:</span>
                      {member.barcode.slice(0, 3).map((barcode) => (
                        <span 
                          key={barcode.id}
                          className="px-2 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300 text-xs rounded-full"
                        >
                          {barcode.barcode}
                        </span>
                      ))}
                      {member.barcode.length > 3 && (
                        <span className="text-xs text-slate-500 dark:text-slate-400">
                          +{member.barcode.length - 3} more
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Delete button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteMember(member.id);
                }}
                disabled={isDeleting}
                className="ml-4 p-2 text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors disabled:opacity-50"
                title="Delete member"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default MembersList;