import bcrypt from 'bcryptjs'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Constants for security
const MAX_LOGIN_ATTEMPTS = 5
const LOCKOUT_TIME = 30 * 60 * 1000 // 30 minutes in milliseconds
const PIN_EXPIRY_TIME = 15 * 60 * 1000 // 15 minutes in milliseconds

// Generate a secure 6-digit PIN
export function generatePIN(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

// Hash password
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12)
}

// Verify password
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

// Check if account is locked
export function isAccountLocked(user: { loginAttempts: number; lockedUntil: Date | null }): boolean {
  if (!user.lockedUntil) return false
  return new Date() < user.lockedUntil
}

// Calculate lockout end time
export function calculateLockoutTime(): Date {
  return new Date(Date.now() + LOCKOUT_TIME)
}

// Check if PIN is expired
export function isPINExpired(pinExpiresAt: Date | null): boolean {
  if (!pinExpiresAt) return true
  return new Date() > pinExpiresAt
}

// Generate PIN expiry time
export function generatePINExpiry(): Date {
  return new Date(Date.now() + PIN_EXPIRY_TIME)
}

// Reset login attempts
export async function resetLoginAttempts(userId: string) {
  await prisma.user.update({
    where: { id: userId },
    data: {
      loginAttempts: 0,
      lockedUntil: null,
    },
  })
}

// Increment login attempts
export async function incrementLoginAttempts(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { loginAttempts: true },
  })

  if (!user) throw new Error('User not found')

  const newAttempts = user.loginAttempts + 1
  const updateData: any = { loginAttempts: newAttempts }

  if (newAttempts >= MAX_LOGIN_ATTEMPTS) {
    updateData.lockedUntil = calculateLockoutTime()
  }

  await prisma.user.update({
    where: { id: userId },
    data: updateData,
  })

  return newAttempts
}

// Clean up expired PINs (run periodically)
export async function cleanupExpiredPINs() {
  await prisma.user.updateMany({
    where: {
      pinExpiresAt: {
        lt: new Date(),
      },
    },
    data: {
      pin: null,
      pinExpiresAt: null,
    },
  })
}

// Validate password strength
export function validatePasswordStrength(password: string): { isValid: boolean; errors: string[] } {
  const errors: string[] = []

  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long')
  }

  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter')
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter')
  }

  if (!/\d/.test(password)) {
    errors.push('Password must contain at least one number')
  }

  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('Password should contain at least one special character')
  }

  return {
    isValid: errors.length === 0,
    errors,
  }
}

// Generate session token
export function generateSessionToken(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36)
}

// Session expiry (24 hours)
export function generateSessionExpiry(): Date {
  return new Date(Date.now() + 24 * 60 * 60 * 1000)
}