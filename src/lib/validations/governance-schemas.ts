import { z } from 'zod'

// Position enum values
export const PositionsEnum = z.enum(['CHIEF', 'COUNCILLOR'])

// Portfolio enum values
export const PortfoliosEnum = z.enum([
  'TREATY',
  'HEALTH',
  'EDUCATION',
  'HOUSING',
  'ECONOMIC_DEVELOPMENT',
  'ENVIRONMENT',
  'PUBLIC_SAFETY',
])

// Council Member schemas
export const CouncilMemberCreateSchema = z.object({
  position: PositionsEnum,
  first_name: z.string().min(1, 'First name is required').max(100),
  last_name: z.string().min(1, 'Last name is required').max(100),
  portfolios: z.array(PortfoliosEnum).max(4, 'Maximum 4 portfolios allowed').default([]),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(1, 'Phone number is required').max(20),
  bio: z.string().max(1000).nullable().optional(),
  image_url: z.string().url().nullable().optional(),
  councilId: z.string().cuid().nullable().optional(),
})

export const CouncilMemberUpdateSchema = CouncilMemberCreateSchema.partial()

// Current Council schemas
export const CurrentCouncilCreateSchema = z.object({
  council_start: z.coerce.date(),
  council_end: z.coerce.date(),
  sourceId: z.string().nullable().optional(),
})

export const CurrentCouncilUpdateSchema = CurrentCouncilCreateSchema.partial()

// Sync schemas
export const SyncCouncilMemberSchema = z.object({
  source_id: z.string().min(1, 'source_id is required'),
  position: PositionsEnum,
  first_name: z.string().min(1),
  last_name: z.string().min(1),
  portfolios: z.array(PortfoliosEnum).max(4).default([]),
  email: z.string().email(),
  phone: z.string().min(1),
  bio: z.string().nullable().optional(),
  image_url: z.string().url().nullable().optional(),
})

export const SyncCouncilRequestSchema = z.object({
  council: z.object({
    source_id: z.string().min(1, 'Council source_id is required'),
    council_start: z.coerce.date(),
    council_end: z.coerce.date(),
  }).optional(),
  members: z.array(SyncCouncilMemberSchema).min(1, 'At least one member is required'),
})

// API Query schemas
export const CouncilMemberQuerySchema = z.object({
  position: PositionsEnum.optional(),
  councilId: z.string().cuid().optional(),
})

// Types inferred from schemas
export type CouncilMemberCreate = z.infer<typeof CouncilMemberCreateSchema>
export type CouncilMemberUpdate = z.infer<typeof CouncilMemberUpdateSchema>
export type CurrentCouncilCreate = z.infer<typeof CurrentCouncilCreateSchema>
export type CurrentCouncilUpdate = z.infer<typeof CurrentCouncilUpdateSchema>
export type SyncCouncilMember = z.infer<typeof SyncCouncilMemberSchema>
export type SyncCouncilRequest = z.infer<typeof SyncCouncilRequestSchema>
