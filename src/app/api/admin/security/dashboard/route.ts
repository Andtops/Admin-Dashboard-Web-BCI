import { NextRequest, NextResponse } from 'next/server';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '../../../../../../convex/_generated/api';
import { getSessionFromRequest } from '@/lib/session';

// Initialize Convex client for server-side operations
const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

/**
 * GET /api/admin/security/dashboard
 * Get security dashboard data (admin only)
 */
export async function GET(request: NextRequest) {
  try {
    // Verify admin session
    const session = await getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const url = new URL(request.url);
    const startDate = url.searchParams.get('start_date');
    const endDate = url.searchParams.get('end_date');

    // Convert date strings to timestamps if provided
    const startTimestamp = startDate ? new Date(startDate).getTime() : undefined;
    const endTimestamp = endDate ? new Date(endDate).getTime() : undefined;

    // Validate dates
    if (startDate && isNaN(startTimestamp!)) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid start_date format. Use ISO 8601 format (YYYY-MM-DD)',
          code: 'INVALID_DATE'
        },
        { status: 400 }
      );
    }

    if (endDate && isNaN(endTimestamp!)) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid end_date format. Use ISO 8601 format (YYYY-MM-DD)',
          code: 'INVALID_DATE'
        },
        { status: 400 }
      );
    }

    // Get security statistics and recent events
    const [securityStats, recentEvents, apiKeyStats] = await Promise.all([
      convex.query(api.security.getSecurityEventStats, {
        startDate: startTimestamp,
        endDate: endTimestamp,
      }),
      convex.query(api.security.getSecurityEvents, {
        limit: 10,
        offset: 0,
      }),
      convex.query(api.apiKeys.getApiKeyStats, {})
    ]);

    // Calculate security score (simplified algorithm)
    const securityScore = calculateSecurityScore(securityStats);

    // Identify top threats
    const topThreats = identifyTopThreats(securityStats);

    // Generate recommendations
    const recommendations = generateSecurityRecommendations(securityStats, apiKeyStats);

    const dashboardData = {
      overview: {
        securityScore,
        totalEvents: securityStats.total,
        criticalEvents: securityStats.bySeverity.critical,
        openEvents: securityStats.byStatus.open,
        recentAlerts: securityStats.alerts.total,
      },
      statistics: securityStats,
      recentEvents: recentEvents.slice(0, 5), // Show only 5 most recent
      topThreats,
      recommendations,
      apiKeySecurity: {
        totalKeys: apiKeyStats.total,
        activeKeys: apiKeyStats.active,
        inactiveKeys: apiKeyStats.inactive,
        recentlyUsed: apiKeyStats.recentlyUsed,
        totalUsage: apiKeyStats.totalUsage,
      },
      dateRange: {
        startDate: startDate || null,
        endDate: endDate || null,
        startTimestamp: startTimestamp || null,
        endTimestamp: endTimestamp || null,
      },
      generatedAt: Date.now(),
    };

    return NextResponse.json({
      success: true,
      data: dashboardData,
      meta: {
        adminId: session.adminId,
        timestamp: Date.now()
      }
    });

  } catch (error) {
    console.error('Security dashboard API error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to load security dashboard',
        code: 'INTERNAL_ERROR'
      },
      { status: 500 }
    );
  }
}

/**
 * Calculate security score based on recent events
 */
function calculateSecurityScore(stats: any): number {
  let score = 100; // Start with perfect score

  // Deduct points for critical events
  score -= stats.bySeverity.critical * 10;
  
  // Deduct points for high severity events
  score -= stats.bySeverity.high * 5;
  
  // Deduct points for medium severity events
  score -= stats.bySeverity.medium * 2;
  
  // Deduct points for open events
  score -= stats.byStatus.open * 1;

  // Bonus points for resolved events (shows good incident response)
  score += Math.min(stats.byStatus.resolved * 0.5, 10);

  // Ensure score is between 0 and 100
  return Math.max(0, Math.min(100, Math.round(score)));
}

/**
 * Identify top security threats
 */
function identifyTopThreats(stats: any): Array<{
  type: string;
  count: number;
  severity: string;
  description: string;
}> {
  const threats = [];

  // Check for high-frequency event types
  for (const [eventType, count] of Object.entries(stats.byEventType)) {
    if (typeof count === 'number' && count > 0) {
      let severity = 'low';
      let description = '';

      switch (eventType) {
        case 'invalid_api_key':
          severity = count > 10 ? 'high' : 'medium';
          description = 'Multiple invalid API key attempts detected';
          break;
        case 'rate_limit_exceeded':
          severity = count > 50 ? 'medium' : 'low';
          description = 'API rate limits being exceeded frequently';
          break;
        case 'permission_violation':
          severity = count > 5 ? 'high' : 'medium';
          description = 'Unauthorized access attempts detected';
          break;
        case 'potential_key_compromise':
          severity = 'critical';
          description = 'Potential API key compromise detected';
          break;
        case 'suspicious_usage_pattern':
          severity = count > 20 ? 'medium' : 'low';
          description = 'Unusual API usage patterns detected';
          break;
        default:
          description = `${eventType.replace(/_/g, ' ')} events detected`;
      }

      threats.push({
        type: eventType,
        count,
        severity,
        description
      });
    }
  }

  // Sort by severity and count
  const severityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
  threats.sort((a, b) => {
    const severityDiff = (severityOrder[b.severity as keyof typeof severityOrder] || 0) - 
                        (severityOrder[a.severity as keyof typeof severityOrder] || 0);
    if (severityDiff !== 0) return severityDiff;
    return b.count - a.count;
  });

  return threats.slice(0, 5); // Return top 5 threats
}

/**
 * Generate security recommendations
 */
function generateSecurityRecommendations(securityStats: any, apiKeyStats: any): Array<{
  priority: string;
  title: string;
  description: string;
  action: string;
}> {
  const recommendations = [];

  // Check for critical events
  if (securityStats.bySeverity.critical > 0) {
    recommendations.push({
      priority: 'critical',
      title: 'Critical Security Events Detected',
      description: `${securityStats.bySeverity.critical} critical security events require immediate attention.`,
      action: 'Review and resolve critical security events immediately'
    });
  }

  // Check for high number of invalid API key attempts
  if (securityStats.byEventType.invalid_api_key > 10) {
    recommendations.push({
      priority: 'high',
      title: 'High Number of Invalid API Key Attempts',
      description: 'Multiple invalid API key attempts may indicate brute force attacks.',
      action: 'Consider implementing IP-based rate limiting and monitoring'
    });
  }

  // Check for permission violations
  if (securityStats.byEventType.permission_violation > 5) {
    recommendations.push({
      priority: 'medium',
      title: 'Permission Violations Detected',
      description: 'API keys are attempting to access unauthorized resources.',
      action: 'Review API key permissions and consider principle of least privilege'
    });
  }

  // Check for old API keys
  if (apiKeyStats.inactive > apiKeyStats.active * 0.5) {
    recommendations.push({
      priority: 'medium',
      title: 'High Number of Inactive API Keys',
      description: 'Many inactive API keys may pose a security risk.',
      action: 'Review and clean up unused API keys'
    });
  }

  // Check for open security events
  if (securityStats.byStatus.open > 10) {
    recommendations.push({
      priority: 'medium',
      title: 'Many Open Security Events',
      description: 'Multiple unresolved security events require attention.',
      action: 'Review and resolve open security events'
    });
  }

  // General recommendations
  if (recommendations.length === 0) {
    recommendations.push({
      priority: 'low',
      title: 'Regular Security Review',
      description: 'No immediate security concerns detected.',
      action: 'Continue monitoring and consider regular API key rotation'
    });
  }

  return recommendations;
}

/**
 * OPTIONS handler for CORS
 */
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    },
  });
}
