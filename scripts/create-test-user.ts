import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const email = 'ira@irawatkins.com'
  const password = 'Bobby321!'
  const name = 'Ira Watkins'

  console.log('Creating test user...')
  console.log('Email:', email)

  // Hash the password
  const hashedPassword = await bcrypt.hash(password, 10)

  try {
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      console.log('User already exists, updating password...')
      const user = await prisma.user.update({
        where: { email },
        data: {
          password: hashedPassword,
          role: 'ADMIN',
        },
      })
      console.log('✅ User updated successfully!')
      console.log('User ID:', user.id)
      console.log('Email:', user.email)
      console.log('Role:', user.role)
    } else {
      console.log('Creating new user...')
      const user = await prisma.user.create({
        data: {
          email,
          name,
          password: hashedPassword,
          role: 'ADMIN',
          emailVerified: new Date(),
        },
      })
      console.log('✅ User created successfully!')
      console.log('User ID:', user.id)
      console.log('Email:', user.email)
      console.log('Role:', user.role)
    }

    console.log('\nYou can now login with:')
    console.log('Email:', email)
    console.log('Password:', password)
  } catch (error) {
    console.error('Error creating user:', error)
    throw error
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
