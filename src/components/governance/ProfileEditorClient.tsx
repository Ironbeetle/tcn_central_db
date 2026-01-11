'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  ArrowLeft,
  Plus,
  Edit,
  Trash2,
  User,
  Shield,
  Loader2,
  Search,
  Users,
  Crown,
  RefreshCcw,
  CheckCircle,
  AlertCircle,
  Upload,
  Calendar,
} from 'lucide-react'
import {
  getAllCouncilMembers,
  createCouncilMember,
  updateCouncilMember,
  deleteCouncilMember,
  getCurrentCouncil,
  createCurrentCouncil,
  updateCurrentCouncil,
  type CouncilMemberInput,
  type CurrentCouncilInput,
} from '@/lib/governance-actions'
import type { Positions, Portfolios } from '@prisma/client'

type CurrentCouncil = {
  id: string
  created: Date
  updated: Date
  council_start: Date
  council_end: Date
  sourceId: string | null
  members: CouncilMember[]
}

type CouncilMember = {
  id: string
  created: Date
  updated: Date
  position: Positions
  first_name: string
  last_name: string
  portfolios: Portfolios[]
  email: string
  phone: string
  bio: string | null
  image_url: string | null
  councilId: string | null
  Current_Council?: CurrentCouncil | null
}

// Static data for form dropdowns
const PORTFOLIOS: { value: Portfolios; label: string }[] = [
  { value: 'TREATY', label: 'Treaty' },
  { value: 'HEALTH', label: 'Health' },
  { value: 'EDUCATION', label: 'Education' },
  { value: 'HOUSING', label: 'Housing' },
  { value: 'ECONOMIC_DEVELOPMENT', label: 'Economic Development' },
  { value: 'ENVIRONMENT', label: 'Environment' },
  { value: 'PUBLIC_SAFETY', label: 'Public Safety' },
  { value: 'LEADERSHIP', label: 'Leadership' },
]

const POSITIONS: { value: Positions; label: string }[] = [
  { value: 'CHIEF', label: 'Chief' },
  { value: 'COUNCILLOR', label: 'Councillor' },
]

const MAX_PORTFOLIOS = 4

export default function ProfileEditorClient() {
  const router = useRouter()
  const [council, setCouncil] = useState<CurrentCouncil | null>(null)
  const [members, setMembers] = useState<CouncilMember[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  
  // Dialog states
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isSyncDialogOpen, setIsSyncDialogOpen] = useState(false)
  const [isCouncilDialogOpen, setIsCouncilDialogOpen] = useState(false)
  const [selectedMember, setSelectedMember] = useState<CouncilMember | null>(null)
  
  // Sync state
  const [syncLoading, setSyncLoading] = useState(false)
  const [syncResult, setSyncResult] = useState<{
    success: boolean
    message: string
    details?: { created: number; updated: number; errors: number }
  } | null>(null)
  
  // Form state
  const [formData, setFormData] = useState<CouncilMemberInput>({
    position: 'COUNCILLOR',
    first_name: '',
    last_name: '',
    portfolios: [],
    email: '',
    phone: '',
    bio: '',
    image_url: '',
    councilId: null,
  })
  const [councilFormData, setCouncilFormData] = useState<{
    council_start: string
    council_end: string
  }>({
    council_start: new Date().toISOString().split('T')[0],
    council_end: new Date(new Date().getFullYear() + 4, new Date().getMonth(), new Date().getDate()).toISOString().split('T')[0],
  })
  const [formError, setFormError] = useState('')
  const [formLoading, setFormLoading] = useState(false)

  // Fetch council and members on mount
  useEffect(() => {
    fetchCouncilData()
  }, [])

  // Update council form data when council changes
  useEffect(() => {
    if (council) {
      setCouncilFormData({
        council_start: new Date(council.council_start).toISOString().split('T')[0],
        council_end: new Date(council.council_end).toISOString().split('T')[0],
      })
    }
  }, [council])

  const fetchCouncilData = async () => {
    setLoading(true)
    const result = await getCurrentCouncil()
    if (result.success && result.council) {
      setCouncil(result.council as CurrentCouncil)
      setMembers(result.council.members as CouncilMember[])
    } else {
      // No council exists yet
      setCouncil(null)
      setMembers([])
    }
    setLoading(false)
  }

  const fetchMembers = async () => {
    const result = await getAllCouncilMembers(council?.id)
    if (result.success && result.members) {
      setMembers(result.members as CouncilMember[])
    }
  }

  // Filter members by search term
  const filteredMembers = members.filter(member => {
    const searchLower = searchTerm.toLowerCase()
    return (
      member.first_name.toLowerCase().includes(searchLower) ||
      member.last_name.toLowerCase().includes(searchLower) ||
      member.email.toLowerCase().includes(searchLower) ||
      member.position.toLowerCase().includes(searchLower)
    )
  })

  // Reset form
  const resetForm = () => {
    setFormData({
      position: 'COUNCILLOR',
      first_name: '',
      last_name: '',
      portfolios: [],
      email: '',
      phone: '',
      bio: '',
      image_url: '',
      councilId: council?.id || null,
    })
    setFormError('')
  }

  // Create or update council handler
  const handleCreateCouncil = async () => {
    setFormLoading(true)
    setFormError('')
    
    const councilData = {
      council_start: new Date(councilFormData.council_start),
      council_end: new Date(councilFormData.council_end),
    }
    
    let result
    if (council) {
      // Update existing council
      result = await updateCurrentCouncil(council.id, councilData)
      if (result.success) {
        await fetchCouncilData()
        setIsCouncilDialogOpen(false)
        toast.success('Council term updated successfully')
      }
    } else {
      // Create new council
      result = await createCurrentCouncil(councilData)
      if (result.success) {
        await fetchCouncilData()
        setIsCouncilDialogOpen(false)
        toast.success('Council term created successfully')
      }
    }
    
    if (!result.success) {
      setFormError(result.error || 'Failed to save council')
    }
    setFormLoading(false)
  }

  // Open create dialog
  const handleOpenCreate = () => {
    resetForm()
    setIsCreateDialogOpen(true)
  }

  // Open edit dialog
  const handleOpenEdit = (member: CouncilMember) => {
    setSelectedMember(member)
    setFormData({
      position: member.position,
      first_name: member.first_name,
      last_name: member.last_name,
      portfolios: member.portfolios,
      email: member.email,
      phone: member.phone,
      bio: member.bio || '',
      image_url: member.image_url || '',
      councilId: member.councilId || council?.id || null,
    })
    setFormError('')
    setIsEditDialogOpen(true)
  }

  // Open delete dialog
  const handleOpenDelete = (member: CouncilMember) => {
    setSelectedMember(member)
    setIsDeleteDialogOpen(true)
  }

  // Handle portfolio toggle
  const handlePortfolioToggle = (portfolio: Portfolios) => {
    setFormData(prev => {
      const isSelected = prev.portfolios.includes(portfolio)
      if (isSelected) {
        return {
          ...prev,
          portfolios: prev.portfolios.filter(p => p !== portfolio)
        }
      } else {
        if (prev.portfolios.length >= MAX_PORTFOLIOS) {
          setFormError(`Maximum ${MAX_PORTFOLIOS} portfolios allowed.`)
          return prev
        }
        setFormError('')
        return {
          ...prev,
          portfolios: [...prev.portfolios, portfolio]
        }
      }
    })
  }

  // Create member
  const handleCreate = async () => {
    setFormLoading(true)
    setFormError('')

    // Basic validation
    if (!formData.first_name.trim() || !formData.last_name.trim()) {
      setFormError('First name and last name are required.')
      setFormLoading(false)
      return
    }
    if (!formData.email.trim()) {
      setFormError('Email is required.')
      setFormLoading(false)
      return
    }
    if (!formData.phone.trim()) {
      setFormError('Phone number is required.')
      setFormLoading(false)
      return
    }

    // Ensure member is linked to current council
    const memberData = {
      ...formData,
      councilId: council?.id || null,
    }

    const result = await createCouncilMember(memberData)
    
    if (result.success) {
      setIsCreateDialogOpen(false)
      resetForm()
      await fetchCouncilData()
    } else {
      setFormError(result.error || 'Failed to create member.')
    }
    
    setFormLoading(false)
  }

  // Update member
  const handleUpdate = async () => {
    if (!selectedMember) return
    
    setFormLoading(true)
    setFormError('')

    const result = await updateCouncilMember(selectedMember.id, formData)
    
    if (result.success) {
      setIsEditDialogOpen(false)
      setSelectedMember(null)
      resetForm()
      await fetchCouncilData()
    } else {
      setFormError(result.error || 'Failed to update member.')
    }
    
    setFormLoading(false)
  }

  // Delete member
  const handleDelete = async () => {
    if (!selectedMember) return
    
    setFormLoading(true)
    
    const result = await deleteCouncilMember(selectedMember.id)
    
    if (result.success) {
      setIsDeleteDialogOpen(false)
      setSelectedMember(null)
      await fetchCouncilData()
    }
    
    setFormLoading(false)
  }

  // Open sync dialog
  const handleOpenSync = () => {
    setSyncResult(null)
    setIsSyncDialogOpen(true)
  }

  // Sync to VPS - Push local data to external server
  const handleSyncToVPS = async () => {
    setSyncLoading(true)
    setSyncResult(null)

    try {
      if (!council) {
        setSyncResult({
          success: false,
          message: 'No council exists to sync. Please create a council term first.',
        })
        setSyncLoading(false)
        return
      }

      // Prepare council data for sync
      const councilData = {
        source_id: council.id, // Use local ID as source_id for VPS
        council_start: council.council_start,
        council_end: council.council_end,
      }

      // Prepare members data for sync
      const membersToSync = members.map(member => ({
        source_id: member.id, // Use local ID as source_id for VPS
        position: member.position,
        first_name: member.first_name,
        last_name: member.last_name,
        portfolios: member.portfolios,
        email: member.email,
        phone: member.phone,
        bio: member.bio,
        image_url: member.image_url,
      }))

      // Use local proxy route to avoid CORS issues (server-to-server)
      const response = await fetch('/api/sync/governance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          council: councilData,
          members: membersToSync 
        }),
      })

      const data = await response.json()

      if (data.success) {
        setSyncResult({
          success: true,
          message: 'Sync completed successfully!',
          details: {
            created: data.data?.created || 0,
            updated: data.data?.updated || 0,
            errors: data.data?.errors?.length || 0,
          },
        })
      } else {
        setSyncResult({
          success: false,
          message: data.error || 'Sync failed. Please try again.',
        })
      }
    } catch (error) {
      console.error('Sync error:', error)
      setSyncResult({
        success: false,
        message: 'Failed to connect to VPS. Please check your connection and try again.',
      })
    }

    setSyncLoading(false)
  }

  // Get initials for avatar
  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName[0] || ''}${lastName[0] || ''}`.toUpperCase()
  }

  // Format portfolio label
  const formatPortfolio = (portfolio: Portfolios) => {
    return PORTFOLIOS.find(p => p.value === portfolio)?.label || portfolio
  }

  // Stats
  const stats = {
    total: members.length,
    chiefs: members.filter(m => m.position === 'CHIEF').length,
    councillors: members.filter(m => m.position === 'COUNCILLOR').length,
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-amber-100 to-orange-200 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      {/* Header */}
      <div className="border-b border-white/20 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Link href="/Chief&Council">
                <Button variant="ghost" size="sm" className="gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  Back
                </Button>
              </Link>
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-md">
                  <Shield className="h-4 w-4 text-white" />
                </div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
                  Council Profile Editor
                </h1>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button 
                onClick={handleOpenSync} 
                variant="outline" 
                disabled={!council || members.length === 0}
                className="gap-2 border-amber-300 text-amber-700 hover:bg-amber-50 dark:border-amber-700 dark:text-amber-400 dark:hover:bg-amber-900/20"
              >
                <Upload className="h-4 w-4" />
                Sync to VPS
              </Button>
              <Button 
                onClick={handleOpenCreate} 
                disabled={!council}
                className="gap-2 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700"
              >
                <Plus className="h-4 w-4" />
                Add Member
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Council Term Card */}
        {council ? (
          <Card className="border-0 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm shadow-lg mb-8">
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center">
                  <Calendar className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Current Council Term</p>
                  <p className="text-lg font-bold text-slate-900 dark:text-slate-100">
                    {new Date(council.council_start).toLocaleDateString('en-CA')} — {new Date(council.council_end).toLocaleDateString('en-CA')}
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsCouncilDialogOpen(true)}
                className="gap-2"
              >
                <Edit className="h-4 w-4" />
                Edit Term
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card className="border-0 bg-amber-50 dark:bg-amber-900/20 backdrop-blur-sm shadow-lg mb-8">
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
                  <Calendar className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="text-sm text-amber-700 dark:text-amber-400">No Council Term Set</p>
                  <p className="text-lg font-semibold text-amber-900 dark:text-amber-200">
                    Create a council term to start adding members
                  </p>
                </div>
              </div>
              <Button
                onClick={() => setIsCouncilDialogOpen(true)}
                className="gap-2 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700"
              >
                <Plus className="h-4 w-4" />
                Create Council Term
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card className="border-0 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm shadow-lg">
            <CardContent className="p-4 flex items-center space-x-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                <Users className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">Total Members</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{stats.total}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm shadow-lg">
            <CardContent className="p-4 flex items-center space-x-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
                <Crown className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">Chief</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{stats.chiefs}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm shadow-lg">
            <CardContent className="p-4 flex items-center space-x-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center">
                <User className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">Councillors</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{stats.councillors}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search members..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-white/80 dark:bg-slate-800/80 border-0 shadow-lg"
            />
          </div>
        </div>

        {/* Members List */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
          </div>
        ) : filteredMembers.length === 0 ? (
          <Card className="border-0 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm shadow-lg">
            <CardContent className="p-12 text-center">
              <Users className="h-12 w-12 mx-auto text-slate-400 mb-4" />
              <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-300 mb-2">
                {searchTerm ? 'No members found' : 'No council members yet'}
              </h3>
              <p className="text-slate-500 dark:text-slate-400 mb-4">
                {searchTerm ? 'Try a different search term.' : 'Get started by adding your first council member.'}
              </p>
              {!searchTerm && (
                <Button onClick={handleOpenCreate} className="gap-2 bg-gradient-to-r from-amber-500 to-orange-600">
                  <Plus className="h-4 w-4" />
                  Add First Member
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredMembers.map((member) => (
              <Card key={member.id} className="border-0 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm shadow-lg hover:shadow-xl transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <Avatar className="h-12 w-12 bg-gradient-to-br from-amber-500 to-orange-500">
                        <AvatarFallback className="bg-transparent text-white font-semibold">
                          {getInitials(member.first_name, member.last_name)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="font-semibold text-slate-900 dark:text-slate-100">
                          {member.first_name} {member.last_name}
                        </h3>
                        <Badge 
                          variant={member.position === 'CHIEF' ? 'default' : 'secondary'}
                          className={member.position === 'CHIEF' ? 'bg-amber-500 hover:bg-amber-600' : ''}
                        >
                          {member.position === 'CHIEF' ? '👑 Chief' : 'Councillor'}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex space-x-1">
                      <Button variant="ghost" size="icon" onClick={() => handleOpenEdit(member)}>
                        <Edit className="h-4 w-4 text-slate-500" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleOpenDelete(member)}>
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                  
                  <div className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
                    <p>📧 {member.email}</p>
                    <p>📞 {member.phone}</p>
                  </div>
                  
                  {member.portfolios.length > 0 && (
                    <div className="mt-4">
                      <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-2">Portfolios:</p>
                      <div className="flex flex-wrap gap-1">
                        {member.portfolios.map((portfolio) => (
                          <Badge key={portfolio} variant="outline" className="text-xs">
                            {formatPortfolio(portfolio)}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Create Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add Council Member</DialogTitle>
            <DialogDescription>
              Create a new profile for a Chief or Council member.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="first_name">First Name *</Label>
                <Input
                  id="first_name"
                  value={formData.first_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, first_name: e.target.value }))}
                  placeholder="Enter first name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="last_name">Last Name *</Label>
                <Input
                  id="last_name"
                  value={formData.last_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, last_name: e.target.value }))}
                  placeholder="Enter last name"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="position">Position *</Label>
              <Select
                value={formData.position}
                onValueChange={(value: Positions) => setFormData(prev => ({ ...prev, position: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select position" />
                </SelectTrigger>
                <SelectContent>
                  {POSITIONS.map((pos) => (
                    <SelectItem key={pos.value} value={pos.value}>
                      {pos.value === 'CHIEF' ? '👑 ' : ''}{pos.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="email@example.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone *</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="(204) 555-1234"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Portfolios (max {MAX_PORTFOLIOS})</Label>
              <p className="text-xs text-slate-500">Selected: {formData.portfolios.length}/{MAX_PORTFOLIOS}</p>
              <div className="grid grid-cols-2 gap-2 p-3 border rounded-lg bg-slate-50 dark:bg-slate-800">
                {PORTFOLIOS.map((portfolio) => (
                  <div key={portfolio.value} className="flex items-center space-x-2">
                    <Checkbox
                      id={`create-${portfolio.value}`}
                      checked={formData.portfolios.includes(portfolio.value)}
                      onCheckedChange={() => handlePortfolioToggle(portfolio.value)}
                      disabled={!formData.portfolios.includes(portfolio.value) && formData.portfolios.length >= MAX_PORTFOLIOS}
                    />
                    <Label htmlFor={`create-${portfolio.value}`} className="text-sm font-normal cursor-pointer">
                      {portfolio.label}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                value={formData.bio || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
                placeholder="Brief biography..."
                rows={3}
              />
            </div>

            {formError && (
              <p className="text-sm text-red-500">{formError}</p>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleCreate} 
              disabled={formLoading}
              className="bg-gradient-to-r from-amber-500 to-orange-600"
            >
              {formLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Create Member'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Council Member</DialogTitle>
            <DialogDescription>
              Update the profile for {selectedMember?.first_name} {selectedMember?.last_name}.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit_first_name">First Name *</Label>
                <Input
                  id="edit_first_name"
                  value={formData.first_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, first_name: e.target.value }))}
                  placeholder="Enter first name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit_last_name">Last Name *</Label>
                <Input
                  id="edit_last_name"
                  value={formData.last_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, last_name: e.target.value }))}
                  placeholder="Enter last name"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit_position">Position *</Label>
              <Select
                value={formData.position}
                onValueChange={(value: Positions) => setFormData(prev => ({ ...prev, position: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select position" />
                </SelectTrigger>
                <SelectContent>
                  {POSITIONS.map((pos) => (
                    <SelectItem key={pos.value} value={pos.value}>
                      {pos.value === 'CHIEF' ? '👑 ' : ''}{pos.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit_email">Email *</Label>
                <Input
                  id="edit_email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="email@example.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit_phone">Phone *</Label>
                <Input
                  id="edit_phone"
                  value={formData.phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="(204) 555-1234"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Portfolios (max {MAX_PORTFOLIOS})</Label>
              <p className="text-xs text-slate-500">Selected: {formData.portfolios.length}/{MAX_PORTFOLIOS}</p>
              <div className="grid grid-cols-2 gap-2 p-3 border rounded-lg bg-slate-50 dark:bg-slate-800">
                {PORTFOLIOS.map((portfolio) => (
                  <div key={portfolio.value} className="flex items-center space-x-2">
                    <Checkbox
                      id={`edit-${portfolio.value}`}
                      checked={formData.portfolios.includes(portfolio.value)}
                      onCheckedChange={() => handlePortfolioToggle(portfolio.value)}
                      disabled={!formData.portfolios.includes(portfolio.value) && formData.portfolios.length >= MAX_PORTFOLIOS}
                    />
                    <Label htmlFor={`edit-${portfolio.value}`} className="text-sm font-normal cursor-pointer">
                      {portfolio.label}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit_bio">Bio</Label>
              <Textarea
                id="edit_bio"
                value={formData.bio || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
                placeholder="Brief biography..."
                rows={3}
              />
            </div>

            {formError && (
              <p className="text-sm text-red-500">{formError}</p>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleUpdate} 
              disabled={formLoading}
              className="bg-gradient-to-r from-amber-500 to-orange-600"
            >
              {formLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Council Member</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {selectedMember?.first_name} {selectedMember?.last_name}? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDelete}
              disabled={formLoading}
            >
              {formLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Sync to VPS Dialog */}
      <Dialog open={isSyncDialogOpen} onOpenChange={setIsSyncDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <RefreshCcw className="h-5 w-5 text-amber-500" />
              Sync to VPS
            </DialogTitle>
            <DialogDescription>
              Push all council member profiles to the VPS Governance section. This will update or create records on the central server.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            {syncResult ? (
              <div className={`p-4 rounded-lg ${syncResult.success ? 'bg-emerald-50 dark:bg-emerald-900/20' : 'bg-red-50 dark:bg-red-900/20'}`}>
                <div className="flex items-start gap-3">
                  {syncResult.success ? (
                    <CheckCircle className="h-5 w-5 text-emerald-500 mt-0.5" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-red-500 mt-0.5" />
                  )}
                  <div>
                    <p className={`font-medium ${syncResult.success ? 'text-emerald-700 dark:text-emerald-400' : 'text-red-700 dark:text-red-400'}`}>
                      {syncResult.message}
                    </p>
                    {syncResult.details && (
                      <div className="mt-2 text-sm text-slate-600 dark:text-slate-400 space-y-1">
                        <p>✓ Created: {syncResult.details.created} members</p>
                        <p>✓ Updated: {syncResult.details.updated} members</p>
                        {syncResult.details.errors > 0 && (
                          <p className="text-red-600 dark:text-red-400">✗ Errors: {syncResult.details.errors}</p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                  <h4 className="font-medium text-slate-900 dark:text-slate-100 mb-2">
                    Ready to sync {members.length} member{members.length !== 1 ? 's' : ''}
                  </h4>
                  <ul className="text-sm text-slate-600 dark:text-slate-400 space-y-1">
                    <li>• {stats.chiefs} Chief{stats.chiefs !== 1 ? 's' : ''}</li>
                    <li>• {stats.councillors} Councillor{stats.councillors !== 1 ? 's' : ''}</li>
                  </ul>
                </div>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  This action will sync all local council profiles to the VPS. Existing records will be updated, and new records will be created.
                </p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsSyncDialogOpen(false)}>
              {syncResult ? 'Close' : 'Cancel'}
            </Button>
            {!syncResult && (
              <Button 
                onClick={handleSyncToVPS} 
                disabled={syncLoading || members.length === 0}
                className="gap-2 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700"
              >
                {syncLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Syncing...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4" />
                    Sync Now
                  </>
                )}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Council Term Dialog */}
      <Dialog open={isCouncilDialogOpen} onOpenChange={setIsCouncilDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-purple-500" />
              {council ? 'Edit Council Term' : 'Create Council Term'}
            </DialogTitle>
            <DialogDescription>
              {council 
                ? 'Update the start and end dates for the current council term.'
                : 'Set up a new council term. You can then add council members to this term.'
              }
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="council_start">Term Start Date</Label>
              <Input
                id="council_start"
                type="date"
                value={councilFormData.council_start}
                onChange={(e) => setCouncilFormData(prev => ({ ...prev, council_start: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="council_end">Term End Date</Label>
              <Input
                id="council_end"
                type="date"
                value={councilFormData.council_end}
                onChange={(e) => setCouncilFormData(prev => ({ ...prev, council_end: e.target.value }))}
              />
            </div>

            {formError && (
              <p className="text-sm text-red-500">{formError}</p>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCouncilDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleCreateCouncil} 
              disabled={formLoading}
              className="bg-gradient-to-r from-purple-500 to-purple-600"
            >
              {formLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : (council ? 'Update Term' : 'Create Term')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
