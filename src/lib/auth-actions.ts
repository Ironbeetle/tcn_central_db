'use server'

import { PrismaClient } from '@prisma/client'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import {
  loginSchema,
  userCreateSchema,
  passwordResetRequestSchema,
  passwordResetSchema,
  changePasswordSchema,
  type Login,
  type UserCreate,
  type PasswordResetRequest,
  type PasswordReset,
  type ChangePassword,
} from '@/lib/validation'
import bcrypt from 'bcryptjs'
import { randomBytes } from 'crypto'

const prisma = new PrismaClient()

// Utility functions
function generatePIN(): string {
  return Math.floor(1000 + Math.random() * 9000).toString()
}

function generatePINExpiry(): Date {
  return new Date(Date.now() + 15 * 60 * 1000) // 15 minutes
}

function isPINExpired(pinExpiresAt: Date | null): boolean {
  if (!pinExpiresAt) return true
  return pinExpiresAt < new Date()
}

function isAccountLocked(user: any): boolean {
  return user.lockedUntil && user.lockedUntil > new Date()
}

async function resetLoginAttempts(userId: string) {
  await prisma.user.update({
    where: { id: userId },
    data: {
      loginAttempts: 0,
      lockedUntil: null,
    },
  })
}

async function incrementLoginAttempts(userId: string): Promise<number> {
  const user = await prisma.user.update({
    where: { id: userId },
    data: {
      loginAttempts: { increment: 1 },
      lockedUntil: {
        set: undefined // Will be set conditionally below
      }
    },
  })

  // Lock account after 5 attempts
  if (user.loginAttempts >= 5) {
    await prisma.user.update({
      where: { id: userId },
      data: {
        lockedUntil: new Date(Date.now() + 30 * 60 * 1000), // 30 minutes
      },
    })
  }

  return user.loginAttempts
}

function generateSessionToken(): string {
  return randomBytes(32).toString('hex')
}

function generateSessionExpiry(): Date {
  return new Date(Date.now() + 8 * 60 * 60 * 1000) // 8 hours
}

async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12)
}

async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword)
}

// Login action
export async function login(data: Login) {
  try {
    const validatedData = loginSchema.parse(data)
    const { email, password } = validatedData

    // Find user
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    })

    if (!user) {
      return { success: false, error: 'Invalid email or password' }
    }

    // Check if account is locked
    if (isAccountLocked(user)) {
      const lockoutEnd = user.lockedUntil!
      const minutesLeft = Math.ceil((lockoutEnd.getTime() - Date.now()) / (60 * 1000))
      return { 
        success: false, 
        error: `Account is locked. Try again in ${minutesLeft} minutes.` 
      }
    }

    // Verify password
    const isValidPassword = await verifyPassword(password, user.password)

    if (!isValidPassword) {
      // Increment login attempts
      const attempts = await incrementLoginAttempts(user.id)
      const remainingAttempts = 5 - attempts

      if (remainingAttempts <= 0) {
        return { 
          success: false, 
          error: 'Account has been locked due to too many failed login attempts. Try again in 30 minutes.' 
        }
      }

      return { 
        success: false, 
        error: `Invalid email or password. ${remainingAttempts} attempts remaining.` 
      }
    }

    // Reset login attempts on successful login
    await resetLoginAttempts(user.id)

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() },
    })

    // Create session
    const sessionToken = generateSessionToken()
    const expires = generateSessionExpiry()

    await prisma.session.create({
      data: {
        sessionToken,
        userId: user.id,
        expires,
      },
    })

    // Set cookie
    const cookieStore = await cookies()
    cookieStore.set('session-token', sessionToken, {
      expires,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
    })

    return { 
      success: true, 
      user: {
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        role: user.role,
        department: user.department,
      }
    }
  } catch (error) {
    console.error('Login error:', error)
    return { success: false, error: 'Login failed. Please try again.' }
  }
}

// Register action (for admin use)
export async function register(data: UserCreate) {
  try {
    const validatedData = userCreateSchema.parse(data)
    const { email, password, first_name, last_name, department, role } = validatedData

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    })

    if (existingUser) {
      return { success: false, error: 'User with this email already exists' }
    }

    // Hash password
    const hashedPassword = await hashPassword(password)

    // Create user
    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        password: hashedPassword,
        first_name,
        last_name,
        department,
        role,
      },
    })

    return { 
      success: true, 
      user: {
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        role: user.role,
        department: user.department,
      }
    }
  } catch (error) {
    console.error('Registration error:', error)
    return { success: false, error: 'Registration failed. Please try again.' }
  }
}

// Password reset request
export async function requestPasswordReset(data: PasswordResetRequest) {
  try {
    const validatedData = passwordResetRequestSchema.parse(data)
    const { email } = validatedData

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    })

    if (!user) {
      // Don't reveal if email exists or not for security
      return { success: true, message: 'If the email exists, a reset PIN has been generated.' }
    }

    // Generate PIN and set expiry
    const pin = generatePIN()
    const pinExpiresAt = generatePINExpiry()

    await prisma.user.update({
      where: { id: user.id },
      data: {
        pin,
        pinExpiresAt,
        passwordResetRequested: new Date(),
      },
    })

    // In a real office environment, you might:
    // 1. Display the PIN on screen for IT admin to provide to user
    // 2. Send to a local printer
    // 3. Store in a secure local log for IT staff
    console.log(`Password reset PIN for ${email}: ${pin}`)

    return { 
      success: true, 
      message: 'Reset PIN has been generated. Contact your IT administrator.',
      pin: process.env.NODE_ENV === 'development' ? pin : undefined // Only show PIN in development
    }
  } catch (error) {
    console.error('Password reset request error:', error)
    return { success: false, error: 'Password reset request failed. Please try again.' }
  }
}

// Verify PIN and reset password
export async function verifyPINAndResetPassword(data: PasswordReset) {
  try {
    const validatedData = passwordResetSchema.parse(data)
    const { email, pin, newPassword } = validatedData

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    })

    if (!user || !user.pin) {
      return { success: false, error: 'Invalid reset request' }
    }

    // Check if PIN is expired
    if (isPINExpired(user.pinExpiresAt)) {
      return { success: false, error: 'Reset PIN has expired. Please request a new one.' }
    }

    // Verify PIN
    if (user.pin !== pin) {
      return { success: false, error: 'Invalid PIN' }
    }

    // Hash new password
    const hashedPassword = await hashPassword(newPassword)

    // Update user
    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        pin: null,
        pinExpiresAt: null,
        passwordResetCompleted: new Date(),
        loginAttempts: 0,
        lockedUntil: null,
      },
    })

    // Invalidate all existing sessions
    await prisma.session.deleteMany({
      where: { userId: user.id },
    })

    return { success: true, message: 'Password has been reset successfully' }
  } catch (error) {
    console.error('PIN verification error:', error)
    return { success: false, error: 'Password reset failed. Please try again.' }
  }
}

// Change password (for logged-in users)
export async function changePassword(data: ChangePassword) {
  try {
    const validatedData = changePasswordSchema.parse(data)
    const { currentPassword, newPassword } = validatedData

    // Get current user from session
    const user = await getCurrentUser()
    if (!user) {
      return { success: false, error: 'Not authenticated' }
    }

    // Get full user data
    const fullUser = await prisma.user.findUnique({
      where: { id: user.id },
    })

    if (!fullUser) {
      return { success: false, error: 'User not found' }
    }

    // Verify current password
    const isValidCurrentPassword = await verifyPassword(currentPassword, fullUser.password)
    if (!isValidCurrentPassword) {
      return { success: false, error: 'Current password is incorrect' }
    }

    // Hash new password
    const hashedPassword = await hashPassword(newPassword)

    // Update password
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword },
    })

    return { success: true, message: 'Password changed successfully' }
  } catch (error) {
    console.error('Change password error:', error)
    return { success: false, error: 'Password change failed. Please try again.' }
  }
}

// Logout action
export async function logout() {
  try {
    const cookieStore = await cookies()
    const sessionToken = cookieStore.get('session-token')?.value

    if (sessionToken) {
      // Delete session from database
      await prisma.session.delete({
        where: { sessionToken },
      }).catch(() => {
        // Session might not exist, ignore error
      })
    }

    // Clear cookie
    cookieStore.delete('session-token')

    return { success: true }
  } catch (error) {
    console.error('Logout error:', error)
    return { success: false, error: 'Logout failed' }
  }
}

// Get current user from session
export async function getCurrentUser() {
  try {
    const cookieStore = await cookies()
    const sessionToken = cookieStore.get('session-token')?.value

    if (!sessionToken) {
      return null
    }

    const session = await prisma.session.findUnique({
      where: { sessionToken },
      include: { user: true },
    })

    if (!session || session.expires < new Date()) {
      return null
    }

    return {
      id: session.user.id,
      email: session.user.email,
      first_name: session.user.first_name,
      last_name: session.user.last_name,
      role: session.user.role,
      department: session.user.department,
    }
  } catch (error) {
    console.error('Get current user error:', error)
    return null
  }
}

// Check if user has permission
export async function hasPermission(requiredRole: string) {
  const user = await getCurrentUser()
  if (!user) return false

  const roleHierarchy = {
    ADMIN: 1,
    CHIEF_COUNCIL: 2,
  }

  const userLevel = roleHierarchy[user.role as keyof typeof roleHierarchy] || 0
  const requiredLevel = roleHierarchy[requiredRole as keyof typeof roleHierarchy] || 0

  return userLevel >= requiredLevel
}