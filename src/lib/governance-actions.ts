'use server'

import { PrismaClient, Positions, Portfolios } from '@prisma/client'
import { revalidatePath } from 'next/cache'

const prisma = new PrismaClient()

// Types for input data
export type CouncilMemberInput = {
  position: Positions
  first_name: string
  last_name: string
  portfolios: Portfolios[]
  email: string
  phone: string
  bio?: string | null
  image_url?: string | null
  councilId?: string | null
}

export type CouncilMemberUpdateInput = Partial<CouncilMemberInput>

export type CurrentCouncilInput = {
  council_start: Date
  council_end: Date
  sourceId?: string | null
}

export type CurrentCouncilUpdateInput = Partial<CurrentCouncilInput>

// Constants
const MAX_PORTFOLIOS = 4

// ==================== CURRENT COUNCIL CRUD ====================

export async function createCurrentCouncil(data: CurrentCouncilInput) {
  try {
    const council = await prisma.current_Council.create({
      data: {
        council_start: data.council_start,
        council_end: data.council_end,
        sourceId: data.sourceId || null,
      }
    })

    revalidatePath('/ProfileEditor')
    revalidatePath('/Chief&Council')

    return {
      success: true,
      council
    }
  } catch (error) {
    console.error('Error creating council:', error)
    return {
      success: false,
      error: 'Failed to create council. Please try again.'
    }
  }
}

export async function getCurrentCouncil() {
  try {
    // Get the most recent/current council
    const council = await prisma.current_Council.findFirst({
      orderBy: { council_start: 'desc' },
      include: {
        members: {
          orderBy: [
            { position: 'asc' },
            { last_name: 'asc' }
          ]
        }
      }
    })

    return {
      success: true,
      council
    }
  } catch (error) {
    console.error('Error fetching current council:', error)
    return {
      success: false,
      error: 'Failed to fetch current council.',
      council: null
    }
  }
}

export async function getAllCouncils() {
  try {
    const councils = await prisma.current_Council.findMany({
      orderBy: { council_start: 'desc' },
      include: {
        members: {
          orderBy: [
            { position: 'asc' },
            { last_name: 'asc' }
          ]
        },
        _count: {
          select: { members: true }
        }
      }
    })

    return {
      success: true,
      councils
    }
  } catch (error) {
    console.error('Error fetching councils:', error)
    return {
      success: false,
      error: 'Failed to fetch councils.',
      councils: []
    }
  }
}

export async function getCouncilById(id: string) {
  try {
    const council = await prisma.current_Council.findUnique({
      where: { id },
      include: {
        members: {
          orderBy: [
            { position: 'asc' },
            { last_name: 'asc' }
          ]
        }
      }
    })

    if (!council) {
      return {
        success: false,
        error: 'Council not found.'
      }
    }

    return {
      success: true,
      council
    }
  } catch (error) {
    console.error('Error fetching council:', error)
    return {
      success: false,
      error: 'Failed to fetch council.'
    }
  }
}

export async function updateCurrentCouncil(id: string, data: CurrentCouncilUpdateInput) {
  try {
    const existing = await prisma.current_Council.findUnique({
      where: { id }
    })

    if (!existing) {
      return {
        success: false,
        error: 'Council not found.'
      }
    }

    const updateData: any = {}
    if (data.council_start !== undefined) updateData.council_start = data.council_start
    if (data.council_end !== undefined) updateData.council_end = data.council_end
    if (data.sourceId !== undefined) updateData.sourceId = data.sourceId || null

    const council = await prisma.current_Council.update({
      where: { id },
      data: updateData
    })

    revalidatePath('/ProfileEditor')
    revalidatePath('/Chief&Council')

    return {
      success: true,
      council
    }
  } catch (error) {
    console.error('Error updating council:', error)
    return {
      success: false,
      error: 'Failed to update council. Please try again.'
    }
  }
}

export async function deleteCurrentCouncil(id: string) {
  try {
    const existing = await prisma.current_Council.findUnique({
      where: { id }
    })

    if (!existing) {
      return {
        success: false,
        error: 'Council not found.'
      }
    }

    // This will cascade delete all members
    await prisma.current_Council.delete({
      where: { id }
    })

    revalidatePath('/ProfileEditor')
    revalidatePath('/Chief&Council')

    return {
      success: true,
      message: 'Council deleted successfully.'
    }
  } catch (error) {
    console.error('Error deleting council:', error)
    return {
      success: false,
      error: 'Failed to delete council. Please try again.'
    }
  }
}

// ==================== COUNCIL MEMBER CRUD ====================

export async function createCouncilMember(data: CouncilMemberInput) {
  try {
    // Validate portfolios limit
    if (data.portfolios && data.portfolios.length > MAX_PORTFOLIOS) {
      return {
        success: false,
        error: `A council member can have a maximum of ${MAX_PORTFOLIOS} portfolios.`
      }
    }

    // Remove duplicates from portfolios
    const uniquePortfolios = [...new Set(data.portfolios || [])]

    const member = await prisma.council_Member.create({
      data: {
        position: data.position,
        first_name: data.first_name.trim(),
        last_name: data.last_name.trim(),
        portfolios: uniquePortfolios,
        email: data.email.trim().toLowerCase(),
        phone: data.phone.trim(),
        bio: data.bio?.trim() || null,
        image_url: data.image_url || null,
        councilId: data.councilId || null,
      }
    })

    revalidatePath('/ProfileEditor')
    revalidatePath('/Chief&Council')

    return {
      success: true,
      member
    }
  } catch (error) {
    console.error('Error creating council member:', error)
    return {
      success: false,
      error: 'Failed to create council member. Please try again.'
    }
  }
}

export async function getAllCouncilMembers(councilId?: string) {
  try {
    const where = councilId ? { councilId } : {}
    
    const members = await prisma.council_Member.findMany({
      where,
      orderBy: [
        { position: 'asc' }, // Chief first, then Councillors
        { last_name: 'asc' }
      ],
      include: {
        Current_Council: true
      }
    })

    return {
      success: true,
      members
    }
  } catch (error) {
    console.error('Error fetching council members:', error)
    return {
      success: false,
      error: 'Failed to fetch council members.',
      members: []
    }
  }
}

export async function getCouncilMemberById(id: string) {
  try {
    const member = await prisma.council_Member.findUnique({
      where: { id },
      include: {
        Current_Council: true
      }
    })

    if (!member) {
      return {
        success: false,
        error: 'Council member not found.'
      }
    }

    return {
      success: true,
      member
    }
  } catch (error) {
    console.error('Error fetching council member:', error)
    return {
      success: false,
      error: 'Failed to fetch council member.'
    }
  }
}

export async function updateCouncilMember(id: string, data: CouncilMemberUpdateInput) {
  try {
    // Validate portfolios limit if portfolios are being updated
    if (data.portfolios && data.portfolios.length > MAX_PORTFOLIOS) {
      return {
        success: false,
        error: `A council member can have a maximum of ${MAX_PORTFOLIOS} portfolios.`
      }
    }

    // Check if member exists
    const existing = await prisma.council_Member.findUnique({
      where: { id }
    })

    if (!existing) {
      return {
        success: false,
        error: 'Council member not found.'
      }
    }

    // Prepare update data
    const updateData: any = {}
    
    if (data.position !== undefined) updateData.position = data.position
    if (data.first_name !== undefined) updateData.first_name = data.first_name.trim()
    if (data.last_name !== undefined) updateData.last_name = data.last_name.trim()
    if (data.portfolios !== undefined) updateData.portfolios = [...new Set(data.portfolios)]
    if (data.email !== undefined) updateData.email = data.email.trim().toLowerCase()
    if (data.phone !== undefined) updateData.phone = data.phone.trim()
    if (data.bio !== undefined) updateData.bio = data.bio?.trim() || null
    if (data.image_url !== undefined) updateData.image_url = data.image_url || null
    if (data.councilId !== undefined) updateData.councilId = data.councilId || null

    const member = await prisma.council_Member.update({
      where: { id },
      data: updateData
    })

    revalidatePath('/ProfileEditor')
    revalidatePath('/Chief&Council')

    return {
      success: true,
      member
    }
  } catch (error) {
    console.error('Error updating council member:', error)
    return {
      success: false,
      error: 'Failed to update council member. Please try again.'
    }
  }
}

export async function deleteCouncilMember(id: string) {
  try {
    // Check if member exists
    const existing = await prisma.council_Member.findUnique({
      where: { id }
    })

    if (!existing) {
      return {
        success: false,
        error: 'Council member not found.'
      }
    }

    await prisma.council_Member.delete({
      where: { id }
    })

    revalidatePath('/ProfileEditor')
    revalidatePath('/Chief&Council')

    return {
      success: true,
      message: 'Council member deleted successfully.'
    }
  } catch (error) {
    console.error('Error deleting council member:', error)
    return {
      success: false,
      error: 'Failed to delete council member. Please try again.'
    }
  }
}

// ==================== UTILITY FUNCTIONS ====================

export async function getCouncilStats(councilId?: string) {
  try {
    const where = councilId ? { councilId } : {}
    
    const [total, chiefs, councillors] = await Promise.all([
      prisma.council_Member.count({ where }),
      prisma.council_Member.count({ where: { ...where, position: 'CHIEF' } }),
      prisma.council_Member.count({ where: { ...where, position: 'COUNCILLOR' } })
    ])

    return {
      success: true,
      stats: {
        total,
        chiefs,
        councillors
      }
    }
  } catch (error) {
    console.error('Error fetching council stats:', error)
    return {
      success: false,
      error: 'Failed to fetch council statistics.',
      stats: { total: 0, chiefs: 0, councillors: 0 }
    }
  }
}

// Get all available portfolios (for form dropdowns)
export async function getAvailablePortfolios(): Promise<{ value: Portfolios; label: string }[]> {
  return [
    { value: 'TREATY', label: 'Treaty' },
    { value: 'HEALTH', label: 'Health' },
    { value: 'EDUCATION', label: 'Education' },
    { value: 'HOUSING', label: 'Housing' },
    { value: 'ECONOMIC_DEVELOPMENT', label: 'Economic Development' },
    { value: 'ENVIRONMENT', label: 'Environment' },
    { value: 'PUBLIC_SAFETY', label: 'Public Safety' },
    { value: 'LEADERSHIP', label: 'Leadership' },
  ]
}

// Get all positions (for form dropdowns)
export async function getAvailablePositions(): Promise<{ value: Positions; label: string }[]> {
  return [
    { value: 'CHIEF', label: 'Chief' },
    { value: 'COUNCILLOR', label: 'Councillor' },
  ]
}

// Archive current council to history
export async function archiveCouncilToHistory(councilId: string) {
  try {
    const council = await prisma.current_Council.findUnique({
      where: { id: councilId }
    })

    if (!council) {
      return {
        success: false,
        error: 'Council not found.'
      }
    }

    // Create history record (links to the council via councilId)
    await prisma.council_History.create({
      data: {
        councilId: council.id,
      }
    })

    return {
      success: true,
      message: 'Council archived to history.'
    }
  } catch (error) {
    console.error('Error archiving council:', error)
    return {
      success: false,
      error: 'Failed to archive council.'
    }
  }
}
