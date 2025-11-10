import { NextResponse } from 'next/server'
import prisma from '@/lib/db'
import redis from '@/lib/redis'

export async function GET() {
  const checks = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    checks: {
      database: 'unknown',
      redis: 'unknown',
      memory: 'unknown',
    },
    metrics: {
      memoryUsage: {} as NodeJS.MemoryUsage,
      cpuUsage: {} as NodeJS.CpuUsage,
    }
  }

  try {
    // Database check
    await prisma.$queryRaw`SELECT 1`
    checks.checks.database = 'healthy'
  } catch {
    checks.checks.database = 'unhealthy'
    checks.status = 'degraded'
  }

  try {
    // Redis check
    const pong = await redis.ping()
    checks.checks.redis = pong === 'PONG' ? 'healthy' : 'unhealthy'
  } catch {
    checks.checks.redis = 'unhealthy'
    checks.status = 'degraded'
  }

  // Memory check
  const memUsage = process.memoryUsage()
  checks.metrics.memoryUsage = memUsage
  const memoryHealthy = memUsage.heapUsed < 500 * 1024 * 1024 // 500MB threshold
  checks.checks.memory = memoryHealthy ? 'healthy' : 'warning'

  // CPU usage
  checks.metrics.cpuUsage = process.cpuUsage()

  const statusCode = checks.status === 'healthy' ? 200 : 503

  return NextResponse.json(checks, { status: statusCode })
}
