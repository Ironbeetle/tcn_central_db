import { z } from "zod";
import { UserRole, Department } from "@prisma/client";

// Common validation schemas
const idSchema = z.string().cuid();
const dateTimeSchema = z.date();
const emailSchema = z.string().email("Invalid email format");
const phoneSchema = z.string().regex(/^[\+]?[1-9][\d]{0,15}$/, "Invalid phone number format");

// fnmember validations
export const fnmemberCreateSchema = z.object({
  birthdate: z.date({
    message: "Birth date is required"
  }),
  first_name: z.string()
    .min(1, "First name is required")
    .max(50, "First name must be less than 50 characters")
    .regex(/^[a-zA-Z\s'-]+$/, "First name can only contain letters, spaces, hyphens, and apostrophes"),
  last_name: z.string()
    .min(1, "Last name is required")
    .max(50, "Last name must be less than 50 characters")
    .regex(/^[a-zA-Z\s'-]+$/, "Last name can only contain letters, spaces, hyphens, and apostrophes"),
  t_number: z.string()
    .min(1, "T-number is required")
    .max(20, "T-number must be less than 20 characters")
    .regex(/^T\d+$/, "T-number must start with 'T' followed by numbers"),
  option: z.string().default("none"),
  deceased: z.string().optional().nullable(),
});

export const fnmemberUpdateSchema = fnmemberCreateSchema.partial().extend({
  id: idSchema,
});

export const fnmemberQuerySchema = z.object({
  id: idSchema.optional(),
  t_number: z.string().optional(),
  first_name: z.string().optional(),
  last_name: z.string().optional(),
  deceased: z.string().optional().nullable(),
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(10),
  sortBy: z.enum(["created", "first_name", "last_name", "t_number"]).default("created"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

// Profile validations
export const profileCreateSchema = z.object({
  gender: z.enum(["MALE", "FEMALE", "OTHER"]).optional().nullable(),
  o_r_status: z.string()
    .min(1, "On-reserve status is required")
    .max(50, "Status must be less than 50 characters"),
  community: z.string()
    .min(1, "Community is required")
    .max(100, "Community must be less than 100 characters"),
  address: z.string()
    .min(1, "Address is required")
    .max(200, "Address must be less than 200 characters"),
  phone_number: phoneSchema,
  email: emailSchema,
  image_url: z.string().url("Invalid image URL").optional().nullable(),
  fnmemberId: idSchema.optional().nullable(),
});

export const profileUpdateSchema = profileCreateSchema.partial().extend({
  id: idSchema,
});

export const profileQuerySchema = z.object({
  id: idSchema.optional(),
  fnmemberId: idSchema.optional(),
  gender: z.string().optional(),
  community: z.string().optional(),
  email: emailSchema.optional(),
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(10),
});

// Barcode validations
export const barcodeCreateSchema = z.object({
  barcode: z.string()
    .min(1, "Barcode is required")
    .max(50, "Barcode must be less than 50 characters")
    .regex(/^[A-Za-z0-9]+$/, "Barcode can only contain alphanumeric characters"),
  activated: z.number().int().min(0).max(1).default(1),
  fnmemberId: idSchema.optional().nullable(),
});

export const barcodeUpdateSchema = barcodeCreateSchema.partial().extend({
  id: idSchema,
});

export const barcodeQuerySchema = z.object({
  id: idSchema.optional(),
  barcode: z.string().optional(),
  fnmemberId: idSchema.optional(),
  activated: z.number().int().min(0).max(1).optional(),
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(10),
});

// Family validations
export const familyCreateSchema = z.object({
  spouse_fname: z.string()
    .max(50, "Spouse first name must be less than 50 characters")
    .regex(/^[a-zA-Z\s'-]*$/, "Spouse first name can only contain letters, spaces, hyphens, and apostrophes")
    .optional()
    .nullable(),
  spouse_lname: z.string()
    .max(50, "Spouse last name must be less than 50 characters")
    .regex(/^[a-zA-Z\s'-]*$/, "Spouse last name can only contain letters, spaces, hyphens, and apostrophes")
    .optional()
    .nullable(),
  dependents: z.number().int().min(0).max(20).default(0),
  fnmemberId: idSchema.optional().nullable(),
});

export const familyUpdateSchema = familyCreateSchema.partial().extend({
  id: idSchema,
});

export const familyQuerySchema = z.object({
  id: idSchema.optional(),
  fnmemberId: idSchema.optional(),
  dependents: z.number().int().min(0).optional(),
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(10),
});

// User validations
export const userCreateSchema = z.object({
  email: emailSchema,
  password: z.string()
    .min(8, "Password must be at least 8 characters")
    .max(100, "Password must be less than 100 characters")
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, 
      "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character"),
  first_name: z.string()
    .min(1, "First name is required")
    .max(50, "First name must be less than 50 characters")
    .regex(/^[a-zA-Z\s'-]+$/, "First name can only contain letters, spaces, hyphens, and apostrophes"),
  last_name: z.string()
    .min(1, "Last name is required")
    .max(50, "Last name must be less than 50 characters")
    .regex(/^[a-zA-Z\s'-]+$/, "Last name can only contain letters, spaces, hyphens, and apostrophes"),
  department: z.nativeEnum(Department).default(Department.OFFICE_ADMIN),
  role: z.nativeEnum(UserRole).default(UserRole.ADMIN),
  pin: z.string()
    .regex(/^\d{4}$/, "PIN must be exactly 4 digits")
    .optional()
    .nullable(),
});

export const userUpdateSchema = userCreateSchema.partial().extend({
  id: idSchema,
  password: z.string()
    .min(8, "Password must be at least 8 characters")
    .max(100, "Password must be less than 100 characters")
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, 
      "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character")
    .optional(),
});

export const userQuerySchema = z.object({
  id: idSchema.optional(),
  email: emailSchema.optional(),
  department: z.nativeEnum(Department).optional(),
  role: z.nativeEnum(UserRole).optional(),
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(10),
  sortBy: z.enum(["created", "first_name", "last_name", "email"]).default("created"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

// Authentication validations
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Password is required"),
});

export const passwordResetRequestSchema = z.object({
  email: emailSchema,
});

export const passwordResetSchema = z.object({
  email: emailSchema,
  pin: z.string().regex(/^\d{4}$/, "PIN must be exactly 4 digits"),
  newPassword: z.string()
    .min(8, "Password must be at least 8 characters")
    .max(100, "Password must be less than 100 characters")
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, 
      "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character"),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string()
    .min(8, "Password must be at least 8 characters")
    .max(100, "Password must be less than 100 characters")
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, 
      "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character"),
});

// Session validations
export const sessionCreateSchema = z.object({
  sessionToken: z.string().min(1, "Session token is required"),
  userId: idSchema,
  expires: dateTimeSchema,
  access_token: z.string().optional().nullable(),
  refresh_token: z.string().optional().nullable(),
});

export const sessionUpdateSchema = sessionCreateSchema.partial().extend({
  id: idSchema,
});

// Combined member with relations validation
export const memberWithRelationsCreateSchema = z.object({
  member: fnmemberCreateSchema,
  profile: profileCreateSchema.omit({ fnmemberId: true }).optional(),
  barcodes: z.array(barcodeCreateSchema.omit({ fnmemberId: true })).optional(),
  family: familyCreateSchema.omit({ fnmemberId: true }).optional(),
});

export const memberWithRelationsUpdateSchema = z.object({
  member: fnmemberUpdateSchema.optional(),
  profile: profileUpdateSchema.omit({ fnmemberId: true }).optional(),
  barcodes: z.array(barcodeUpdateSchema.omit({ fnmemberId: true })).optional(),
  family: familyUpdateSchema.omit({ fnmemberId: true }).optional(),
});

// Bulk operations
export const bulkDeleteSchema = z.object({
  ids: z.array(idSchema).min(1, "At least one ID is required").max(100, "Cannot delete more than 100 records at once"),
});

export const bulkUpdateSchema = z.object({
  ids: z.array(idSchema).min(1, "At least one ID is required").max(100, "Cannot update more than 100 records at once"),
  data: z.record(z.string(), z.any()), // Generic update data
});

// Export type definitions
export type FnmemberCreate = z.infer<typeof fnmemberCreateSchema>;
export type FnmemberUpdate = z.infer<typeof fnmemberUpdateSchema>;
export type FnmemberQuery = z.infer<typeof fnmemberQuerySchema>;

export type ProfileCreate = z.infer<typeof profileCreateSchema>;
export type ProfileUpdate = z.infer<typeof profileUpdateSchema>;
export type ProfileQuery = z.infer<typeof profileQuerySchema>;

export type BarcodeCreate = z.infer<typeof barcodeCreateSchema>;
export type BarcodeUpdate = z.infer<typeof barcodeUpdateSchema>;
export type BarcodeQuery = z.infer<typeof barcodeQuerySchema>;

export type FamilyCreate = z.infer<typeof familyCreateSchema>;
export type FamilyUpdate = z.infer<typeof familyUpdateSchema>;
export type FamilyQuery = z.infer<typeof familyQuerySchema>;

export type UserCreate = z.infer<typeof userCreateSchema>;
export type UserUpdate = z.infer<typeof userUpdateSchema>;
export type UserQuery = z.infer<typeof userQuerySchema>;

export type Login = z.infer<typeof loginSchema>;
export type PasswordResetRequest = z.infer<typeof passwordResetRequestSchema>;
export type PasswordReset = z.infer<typeof passwordResetSchema>;
export type ChangePassword = z.infer<typeof changePasswordSchema>;

export type SessionCreate = z.infer<typeof sessionCreateSchema>;
export type SessionUpdate = z.infer<typeof sessionUpdateSchema>;

export type MemberWithRelationsCreate = z.infer<typeof memberWithRelationsCreateSchema>;
export type MemberWithRelationsUpdate = z.infer<typeof memberWithRelationsUpdateSchema>;

export type BulkDelete = z.infer<typeof bulkDeleteSchema>;
export type BulkUpdate = z.infer<typeof bulkUpdateSchema>;

