import { POST } from '@/app/api/auth/register/route'
import { mockRequest } from '@/__tests__/utils/test-helpers'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

jest.mock('@/lib/prisma')
jest.mock('bcryptjs')

describe('/api/auth/register', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('POST', () => {
    it('should create a new user successfully', async () => {
      const mockHashedPassword = '$2a$10$hashedpassword'
      ;(bcrypt.hash as jest.Mock).mockResolvedValue(mockHashedPassword)
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(null)
      ;(prisma.user.create as jest.Mock).mockResolvedValue({
        id: 'user-123',
        email: 'newuser@example.com',
        name: 'New User',
        role: 'CUSTOMER',
      })

      const request = mockRequest({
        method: 'POST',
        body: {
          email: 'newuser@example.com',
          password: 'SecurePass123!',
          name: 'New User',
        },
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.message).toBe('User created successfully')
      expect(data.user.email).toBe('newuser@example.com')
      expect(bcrypt.hash).toHaveBeenCalledWith('SecurePass123!', 10)
    })

    it('should return 400 if email already exists', async () => {
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'existing-user',
        email: 'existing@example.com',
      })

      const request = mockRequest({
        method: 'POST',
        body: {
          email: 'existing@example.com',
          password: 'SecurePass123!',
          name: 'Duplicate User',
        },
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('already exists')
    })

    it('should return 400 for invalid email format', async () => {
      const request = mockRequest({
        method: 'POST',
        body: {
          email: 'invalid-email',
          password: 'SecurePass123!',
          name: 'Test User',
        },
      })

      const response = await POST(request)

      expect(response.status).toBe(400)
    })

    it('should return 400 for weak password', async () => {
      const request = mockRequest({
        method: 'POST',
        body: {
          email: 'test@example.com',
          password: '123', // Too short
          name: 'Test User',
        },
      })

      const response = await POST(request)

      expect(response.status).toBe(400)
    })

    it('should return 400 for missing required fields', async () => {
      const request = mockRequest({
        method: 'POST',
        body: {
          email: 'test@example.com',
          // Missing password and name
        },
      })

      const response = await POST(request)

      expect(response.status).toBe(400)
    })
  })
})
