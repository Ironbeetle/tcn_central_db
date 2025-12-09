import bcrypt from 'bcryptjs'

async function hashPassword(password: string) {
  const hash = await bcrypt.hash(password, 12)
  console.log('Hashed password:', hash)
}

// Replace 'YourPassword123' with your desired password
hashPassword('11BXc6.1aVb')