import React, { useState, useEffect } from 'react';
import { Save, X, Loader2, User, Calendar, IdCard, Mail, Phone, MapPin, Users, CheckCircle } from 'lucide-react';
import type { FnMemberWithRelations } from '@/hooks/useFnMembers';
import type { CreateMemberData } from '@/lib/actions';

interface Barcode {
  id: string;
  barcode: string;
  activated: number;
  fnmemberId?: string | null;
}

interface FormFieldProps {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  options?: Array<{ value: string; label: string }>;
  icon?: React.ComponentType<{ className?: string }>;
  placeholder?: string;
  className?: string;
  value: string | number;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
  disabled?: boolean;
}

// FormField component defined OUTSIDE of MemberForm to prevent re-creation on each render
const FormField: React.FC<FormFieldProps> = ({ 
  label, 
  name, 
  type = 'text', 
  required = false, 
  options = [],
  icon: Icon,
  placeholder,
  className = '',
  value,
  onChange,
  disabled = false
}) => (
  <div className={className}>
    <label htmlFor={name} className="block text-sm font-medium mb-2 text-slate-700 dark:text-slate-300">
      {Icon && <Icon className="inline h-4 w-4 mr-2 text-slate-500" />}
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    {type === 'select' ? (
      <select
        id={name}
        name={name}
        value={value}
        onChange={onChange}
        required={required}
        disabled={disabled}
        className={`w-full px-4 py-3 border-0 bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm rounded-xl shadow-sm 
                 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-all
                 ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`}
      >
        <option value="">Select {label}</option>
        {options.map(option => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    ) : type === 'textarea' ? (
      <textarea
        id={name}
        name={name}
        value={value as string}
        onChange={onChange}
        required={required}
        disabled={disabled}
        placeholder={placeholder}
        rows={3}
        className={`w-full px-4 py-3 border-0 bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm rounded-xl shadow-sm 
                 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 resize-none transition-all
                 ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`}
      />
    ) : (
      <input
        type={type}
        id={name}
        name={name}
        value={value}
        onChange={onChange}
        required={required}
        disabled={disabled}
        placeholder={placeholder}
        className={`w-full px-4 py-3 border-0 bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm rounded-xl shadow-sm 
                 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-all
                 ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`}
      />
    )}
  </div>
);

interface MemberFormProps {
  member: FnMemberWithRelations | null;
  isCreating: boolean;
  availableBarcodes: Barcode[];
  barcodesLoading: boolean;
  onSubmit: (data: any) => Promise<any>;
  onSuccess: () => void;
  onCancel: () => void;
  isSubmitting: boolean;
}

const MemberForm: React.FC<MemberFormProps> = ({
  member,
  isCreating,
  availableBarcodes,
  barcodesLoading,
  onSubmit,
  onSuccess,
  onCancel,
  isSubmitting
}) => {
  // Helper function to format dates consistently
  const formatDateForInput = (date: Date | string | null): string => {
    if (!date) return '';
    const d = new Date(date);
    if (isNaN(d.getTime())) return '';
    
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };
  
  // Validate date is reasonable (not in future, not too old)
  const isValidBirthdate = (dateStr: string): boolean => {
    if (!dateStr) return false;
    const date = new Date(dateStr);
    const now = new Date();
    const minDate = new Date('1900-01-01');
    
    return !isNaN(date.getTime()) && date <= now && date >= minDate;
  };

  const [activeTab, setActiveTab] = useState('personal');
  const [formData, setFormData] = useState({
    // fnmember fields only (simplified)
    first_name: '',
    last_name: '',
    birthdate: '',
    t_number: '',
    deceased: '',
  });

  // Initialize form data when member changes
  useEffect(() => {
    if (member && !isCreating) {
      setFormData({
        first_name: member.first_name || '',
        last_name: member.last_name || '',
        birthdate: formatDateForInput(member.birthdate),
        t_number: member.t_number || '',
        deceased: member.deceased || '',
      });
    } else if (isCreating) {
      // Reset form for new member
      setFormData({
        first_name: '',
        last_name: '',
        birthdate: '',
        t_number: '',
        deceased: '',
      });
    }
  }, [member, isCreating]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields - simplified!
    if (!formData.first_name.trim()) {
      alert('Please enter a first name');
      return;
    }
    if (!formData.last_name.trim()) {
      alert('Please enter a last name');
      return;
    }
    if (!formData.t_number.trim()) {
      alert('Please enter a T-number');
      return;
    }
    if (!isValidBirthdate(formData.birthdate)) {
      alert('Please enter a valid birth date (between 1900 and today)');
      return;
    }
    
    try {
      const submitData: CreateMemberData = {
        first_name: formData.first_name.trim(),
        last_name: formData.last_name.trim(),
        birthdate: new Date(formData.birthdate + 'T00:00:00'),
        t_number: formData.t_number.trim(),
        deceased: formData.deceased || undefined,
      };

      if (isCreating) {
        await onSubmit(submitData);
      } else if (member) {
        await onSubmit({ id: member.id, data: submitData });
      }
      
      onSuccess();
    } catch (error) {
      console.error('Form submission error:', error);
    }
  };

  // Get profile and family data for display (read-only when editing)
  const profile = member?.profile?.[0];
  const family = member?.family?.[0];
  const barcode = member?.barcode?.[0];

  // Tabs: Personal (editable) + readonly info when editing
  const tabs = isCreating 
    ? [{ id: 'personal', label: 'New Member', icon: User, color: 'from-blue-500 to-blue-600' }]
    : [
        { id: 'personal', label: 'Member Info', icon: User, color: 'from-blue-500 to-blue-600' },
        { id: 'profile', label: 'Profile', icon: Mail, color: 'from-emerald-500 to-emerald-600' },
        { id: 'family', label: 'Family', icon: Users, color: 'from-purple-500 to-purple-600' },
      ];

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Tab Navigation */}
      <div className="flex space-x-1 bg-gradient-to-r from-slate-100 to-gray-200 dark:from-slate-800 dark:to-slate-700 p-1 rounded-xl">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 flex items-center justify-center gap-2 px-3 py-3 text-sm font-medium rounded-lg transition-all ${
              activeTab === tab.id
                ? `bg-gradient-to-r ${tab.color} text-white shadow-lg scale-105`
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-800 dark:hover:text-slate-100 hover:bg-white/50 dark:hover:bg-slate-800/50'
            }`}
          >
            <tab.icon className="h-4 w-4" />
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="space-y-6">
        {activeTab === 'personal' && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
              <User className="h-5 w-5 text-blue-600" />
              {isCreating ? 'Create New Member' : 'Member Information'}
            </h3>
            
            {isCreating && (
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  <CheckCircle className="inline h-4 w-4 mr-2" />
                  A barcode will be <strong>automatically assigned</strong> to this member. Profile and family information will be filled in by the member via the online portal.
                </p>
              </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField 
                label="First Name" 
                name="first_name" 
                required 
                icon={User}
                placeholder="Enter first name"
                value={formData.first_name}
                onChange={handleInputChange}
              />
              <FormField 
                label="Last Name" 
                name="last_name" 
                required 
                icon={User}
                placeholder="Enter last name"
                value={formData.last_name}
                onChange={handleInputChange}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="birthdate" className="block text-sm font-medium mb-2 text-slate-700 dark:text-slate-300">
                  <Calendar className="inline h-4 w-4 mr-2 text-slate-500" />
                  Birth Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  id="birthdate"
                  name="birthdate"
                  value={formData.birthdate}
                  onChange={handleInputChange}
                  required
                  max={new Date().toISOString().split('T')[0]}
                  min="1900-01-01"
                  className="w-full px-4 py-3 border-0 bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm rounded-xl shadow-sm 
                           focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-all"
                />
                {formData.birthdate && !isValidBirthdate(formData.birthdate) && (
                  <p className="mt-1 text-sm text-red-600">Please enter a valid date between 1900 and today</p>
                )}
              </div>
              <FormField 
                label="T Number" 
                name="t_number" 
                required 
                icon={IdCard}
                placeholder="T123456"
                value={formData.t_number}
                onChange={handleInputChange}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField 
                label="Deceased Status" 
                name="deceased" 
                type="select"
                options={[
                  { value: '', label: 'Active' },
                  { value: 'yes', label: 'Deceased' }
                ]}
                value={formData.deceased}
                onChange={handleInputChange}
              />
              
              {/* Show assigned barcode when editing */}
              {!isCreating && barcode && (
                <div>
                  <label className="block text-sm font-medium mb-2 text-slate-700 dark:text-slate-300">
                    <IdCard className="inline h-4 w-4 mr-2 text-slate-500" />
                    Assigned Barcode
                  </label>
                  <div className="flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-orange-50 to-yellow-50 dark:from-orange-900/20 dark:to-yellow-900/20 rounded-xl">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-yellow-500 flex items-center justify-center">
                      <IdCard className="h-4 w-4 text-white" />
                    </div>
                    <span className="font-medium text-slate-800 dark:text-slate-200">{barcode.barcode}</span>
                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300">
                      Active
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Activation Status (read-only display) */}
            {!isCreating && member && (
              <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                <label className="block text-sm font-medium mb-2 text-slate-700 dark:text-slate-300">
                  Portal Activation Status
                </label>
                <span className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium ${
                  member.activated === 'ACTIVATED' 
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300'
                    : member.activated === 'PENDING'
                    ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
                    : 'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-400'
                }`}>
                  <CheckCircle className="h-4 w-4" />
                  {member.activated === 'ACTIVATED' ? 'Activated via Portal' 
                    : member.activated === 'PENDING' ? 'Pending Activation'
                    : 'Not Activated'}
                </span>
                <p className="mt-2 text-xs text-slate-500">
                  Activation status is managed by the online member portal
                </p>
              </div>
            )}
          </div>
        )}

        {/* Profile Tab (Read-only) - Only when editing */}
        {activeTab === 'profile' && !isCreating && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-emerald-800 bg-clip-text text-transparent">
              <Mail className="h-5 w-5 text-emerald-600" />
              Profile Information
              <span className="text-xs font-normal text-slate-500 ml-2">(synced from portal)</span>
            </h3>

            {profile ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                    <label className="text-xs text-slate-500 uppercase tracking-wide">Email</label>
                    <p className="mt-1 font-medium flex items-center gap-2">
                      <Mail className="h-4 w-4 text-emerald-500" />
                      {profile.email || '-'}
                    </p>
                  </div>
                  <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                    <label className="text-xs text-slate-500 uppercase tracking-wide">Phone</label>
                    <p className="mt-1 font-medium flex items-center gap-2">
                      <Phone className="h-4 w-4 text-emerald-500" />
                      {profile.phone_number || '-'}
                    </p>
                  </div>
                </div>
                <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                  <label className="text-xs text-slate-500 uppercase tracking-wide">Community</label>
                  <p className="mt-1 font-medium flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-emerald-500" />
                    {profile.community || '-'} ({profile.o_r_status === 'onreserve' ? 'On Reserve' : 'Off Reserve'})
                  </p>
                </div>
                <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                  <label className="text-xs text-slate-500 uppercase tracking-wide">Address</label>
                  <p className="mt-1 font-medium">{profile.address || '-'}</p>
                </div>
                {profile.gender && (
                  <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                    <label className="text-xs text-slate-500 uppercase tracking-wide">Gender</label>
                    <p className="mt-1 font-medium">{profile.gender}</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-6 text-center bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                <Mail className="h-8 w-8 mx-auto text-slate-400 mb-2" />
                <p className="text-slate-500">No profile data yet</p>
                <p className="text-xs text-slate-400 mt-1">Member will fill this out via the online portal</p>
              </div>
            )}
          </div>
        )}

        {/* Family Tab (Read-only) - Only when editing */}
        {activeTab === 'family' && !isCreating && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold flex items-center gap-2 bg-gradient-to-r from-purple-600 to-purple-800 bg-clip-text text-transparent">
              <Users className="h-5 w-5 text-purple-600" />
              Family Information
              <span className="text-xs font-normal text-slate-500 ml-2">(synced from portal)</span>
            </h3>

            {family ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                    <label className="text-xs text-slate-500 uppercase tracking-wide">Spouse</label>
                    <p className="mt-1 font-medium">
                      {family.spouse_fname || family.spouse_lname 
                        ? `${family.spouse_fname || ''} ${family.spouse_lname || ''}`.trim()
                        : '-'}
                    </p>
                  </div>
                  <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                    <label className="text-xs text-slate-500 uppercase tracking-wide">Dependents</label>
                    <p className="mt-1 font-medium">{family.dependents ?? 0}</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-6 text-center bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                <Users className="h-8 w-8 mx-auto text-slate-400 mb-2" />
                <p className="text-slate-500">No family data yet</p>
                <p className="text-xs text-slate-400 mt-1">Member will fill this out via the online portal</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Form Actions */}
      <div className="flex items-center justify-end gap-3 pt-6 border-t border-slate-200 dark:border-slate-700">
        <button
          type="button"
          onClick={onCancel}
          disabled={isSubmitting}
          className="px-6 py-3 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors disabled:opacity-50 flex items-center gap-2"
        >
          <X className="w-4 h-4" />
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white rounded-xl transition-all duration-200 hover:scale-105 shadow-lg disabled:opacity-50 disabled:hover:scale-100 flex items-center gap-2"
        >
          {isSubmitting ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          {isCreating ? 'Create Member' : 'Update Member'}
        </button>
      </div>
    </form>
  );
};

export default MemberForm;