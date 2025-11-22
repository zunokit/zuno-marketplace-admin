/**
 * Health Check API Route
 * Provides system health status for monitoring and observability
 *
 * Endpoints:
 * - GET /api/health - Basic health check
 * - GET /api/health?detailed=true - Detailed health check with all services
 */

import { NextRequest, NextResponse } from 'next/server';
import { sql } from 'drizzle-orm';
import { logger } from '@/lib/utils/logger';

interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  uptime: number;
  version: string;
  environment: string;
  services?: {
    database: ServiceHealth;
    encryption: ServiceHealth;
    auth: ServiceHealth;
    email: ServiceHealth;
  };
}

interface ServiceHealth {
  status: 'healthy' | 'unhealthy';
  message?: string;
  responseTime?: number;
}

/**
 * Check database connectivity
 */
async function checkDatabase(): Promise<ServiceHealth> {
  const startTime = Date.now();
  try {
    // Dynamically import db to avoid build-time errors
    const { db } = await import('@/lib/db');
    await db.execute(sql`SELECT 1 as health_check`);
    const responseTime = Date.now() - startTime;

    return {
      status: 'healthy',
      message: 'Database connection successful',
      responseTime,
    };
  } catch (error) {
    logger.error('Database health check failed', error);
    return {
      status: 'unhealthy',
      message: 'Database connection failed',
      responseTime: Date.now() - startTime,
    };
  }
}

/**
 * Check encryption service
 */
async function checkEncryption(): Promise<ServiceHealth> {
  const startTime = Date.now();
  try {
    const { verifyEncryptionSetup } = await import('@/lib/crypto');
    const isValid = verifyEncryptionSetup();
    const responseTime = Date.now() - startTime;

    if (!isValid) {
      return {
        status: 'unhealthy',
        message: 'Encryption key not configured',
        responseTime,
      };
    }

    return {
      status: 'healthy',
      message: 'Encryption service operational',
      responseTime,
    };
  } catch (error) {
    logger.error('Encryption health check failed', error);
    return {
      status: 'unhealthy',
      message: 'Encryption service failed',
      responseTime: Date.now() - startTime,
    };
  }
}

/**
 * Check authentication service
 */
async function checkAuth(): Promise<ServiceHealth> {
  const startTime = Date.now();
  try {
    // Verify auth is properly configured
    const { auth } = await import('@/lib/auth/config');
    const isConfigured = !!auth && !!process.env.BETTER_AUTH_SECRET;
    const responseTime = Date.now() - startTime;

    if (!isConfigured) {
      return {
        status: 'unhealthy',
        message: 'Auth service not configured',
        responseTime,
      };
    }

    return {
      status: 'healthy',
      message: 'Auth service operational',
      responseTime,
    };
  } catch (error) {
    logger.error('Auth health check failed', error);
    return {
      status: 'unhealthy',
      message: 'Auth service failed',
      responseTime: Date.now() - startTime,
    };
  }
}

/**
 * Check email service
 */
async function checkEmail(): Promise<ServiceHealth> {
  const startTime = Date.now();
  try {
    const { getEmailService } = await import('@/lib/infrastructure/external/email');
    const emailService = getEmailService();
    const isConfigured = !!emailService;
    const responseTime = Date.now() - startTime;

    if (!isConfigured) {
      return {
        status: 'unhealthy',
        message: 'Email service not configured',
        responseTime,
      };
    }

    return {
      status: 'healthy',
      message: 'Email service operational',
      responseTime,
    };
  } catch (error) {
    logger.error('Email health check failed', error);
    return {
      status: 'unhealthy',
      message: 'Email service failed',
      responseTime: Date.now() - startTime,
    };
  }
}

/**
 * GET /api/health
 * Returns basic or detailed health status
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const detailed = searchParams.get('detailed') === 'true';

  const timestamp = new Date().toISOString();
  const uptime = process.uptime();
  const version = process.env.npm_package_version || '0.1.0';
  const environment = process.env.NODE_ENV || 'development';

  // Basic health check
  if (!detailed) {
    const basicHealth: HealthStatus = {
      status: 'healthy',
      timestamp,
      uptime,
      version,
      environment,
    };

    return NextResponse.json(basicHealth, { status: 200 });
  }

  // Detailed health check
  try {
    const [database, encryption, authService, email] = await Promise.all([
      checkDatabase(),
      checkEncryption(),
      checkAuth(),
      checkEmail(),
    ]);

    const services = {
      database,
      encryption,
      auth: authService,
      email,
    };

    // Determine overall status
    const hasUnhealthy = Object.values(services).some(
      (service) => service.status === 'unhealthy'
    );

    const overallStatus: 'healthy' | 'degraded' | 'unhealthy' = hasUnhealthy
      ? database.status === 'unhealthy'
        ? 'unhealthy' // Database down = unhealthy
        : 'degraded' // Other services down = degraded
      : 'healthy';

    const detailedHealth: HealthStatus = {
      status: overallStatus,
      timestamp,
      uptime,
      version,
      environment,
      services,
    };

    const statusCode = overallStatus === 'healthy' ? 200 : overallStatus === 'degraded' ? 207 : 503;

    return NextResponse.json(detailedHealth, { status: statusCode });
  } catch (error) {
    logger.error('Health check failed', error);

    const errorHealth: HealthStatus = {
      status: 'unhealthy',
      timestamp,
      uptime,
      version,
      environment,
    };

    return NextResponse.json(errorHealth, { status: 503 });
  }
}
