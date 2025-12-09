import NextAuth from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { PrismaClient } from '@prisma/client'
import { verifyPassword, isAccountLocked } from '@/lib/auth/auth-utils'

const prisma = new PrismaClient()

const handler = NextAuth({
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        try {
          // Find user by email
          const user = await prisma.user.findUnique({
            where: { email: credentials.email }
          })

          if (!user) {
            return null
          }

          // Check if account is locked
          if (isAccountLocked(user)) {
            throw new Error('Account is temporarily locked due to multiple failed login attempts')
          }

          // Verify password
          const isValidPassword = await verifyPassword(credentials.password, user.password)

          if (!isValidPassword) {
            // Increment login attempts
            await prisma.user.update({
              where: { id: user.id },
              data: {
                loginAttempts: user.loginAttempts + 1,
                lockedUntil: user.loginAttempts + 1 >= 5 ? new Date(Date.now() + 30 * 60 * 1000) : null
              }
            })
            return null
          }

          // Reset login attempts on successful login
          await prisma.user.update({
            where: { id: user.id },
            data: {
              loginAttempts: 0,
              lockedUntil: null,
              lastLogin: new Date()
            }
          })

          return {
            id: user.id,
            email: user.email,
            name: `${user.first_name} ${user.last_name}`,
            first_name: user.first_name,
            last_name: user.last_name,
            department: user.department,
            role: user.role
          }
        } catch (error) {
          console.error('Authentication error:', error)
          return null
        }
      }
    })
  ],
  session: {
    strategy: 'jwt'
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.first_name = (user as any).first_name
        token.last_name = (user as any).last_name
        token.department = (user as any).department
        token.role = (user as any).role
      }
      return token
    },
    async session({ session, token }) {
      if (session.user && token) {
        session.user.id = token.id
        session.user.first_name = token.first_name
        session.user.last_name = token.last_name
        session.user.department = token.department
        session.user.role = token.role
      }
      return session
    }
  },
  pages: {
    signIn: '/login',
    error: '/auth/error'
  }
})

export { handler as GET, handler as POST }