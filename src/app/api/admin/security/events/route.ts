import { NextRequest, NextResponse } from 'next/server';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '../../../../../../convex/_generated/api';
import { getSessionFromRequest } from '@/lib/session';

// Initialize Convex client for server-side operations
const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

/**
 * GET /api/admin/security/events
 * Get security events (admin only)
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
    const eventType = url.searchParams.get('event_type') || undefined;
    const severity = url.searchParams.get('severity') || undefined;
    const status = url.searchParams.get('status') || undefined;
    const apiKeyId = url.searchParams.get('api_key_id') || undefined;
    const ipAddress = url.searchParams.get('ip_address') || undefined;
    const startDate = url.searchParams.get('start_date');
    const endDate = url.searchParams.get('end_date');
    const limit = parseInt(url.searchParams.get('limit') || '50');
    const offset = parseInt(url.searchParams.get('offset') || '0');

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

    // Get security events
    const events = await convex.query(api.security.getSecurityEvents, {
      eventType: eventType as any,
      severity: severity as any,
      status: status as any,
      apiKeyId,
      ipAddress,
      startDate: startTimestamp,
      endDate: endTimestamp,
      limit,
      offset,
    });

    return NextResponse.json({
      success: true,
      data: events,
      pagination: {
        limit,
        offset,
        total: events.length,
        hasMore: events.length === limit
      },
      filters: {
        eventType,
        severity,
        status,
        apiKeyId,
        ipAddress,
        startDate,
        endDate
      },
      meta: {
        adminId: session.adminId,
        timestamp: Date.now()
      }
    });

  } catch (error) {
    console.error('Security events API error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to retrieve security events',
        code: 'INTERNAL_ERROR'
      },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/admin/security/events
 * Update security event status (admin only)
 */
export async function PATCH(request: NextRequest) {
  try {
    // Verify admin session
    const session = await getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { eventId, status, resolutionNotes } = body;

    // Validate required fields
    if (!eventId || !status) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Event ID and status are required',
          code: 'MISSING_FIELDS'
        },
        { status: 400 }
      );
    }

    // Validate status
    const validStatuses = ['open', 'investigating', 'resolved', 'false_positive'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { 
          success: false, 
          error: `Invalid status. Must be one of: ${validStatuses.join(', ')}`,
          code: 'INVALID_STATUS'
        },
        { status: 400 }
      );
    }

    // Update security event
    const updatedEventId = await convex.mutation(api.security.updateSecurityEventStatus, {
      eventId: eventId as any,
      status: status as any,
      resolvedBy: session.adminId as any,
      resolutionNotes,
    });

    return NextResponse.json({
      success: true,
      data: {
        id: updatedEventId,
        status,
        message: 'Security event status updated successfully'
      },
      meta: {
        updatedBy: session.adminId,
        updatedAt: Date.now()
      }
    });

  } catch (error) {
    console.error('Update security event error:', error);
    
    if (error instanceof Error && error.message.includes('not found')) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Security event not found',
          code: 'NOT_FOUND'
        },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to update security event',
        code: 'UPDATE_FAILED'
      },
      { status: 500 }
    );
  }
}

/**
 * OPTIONS handler for CORS
 */
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, PATCH, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    },
  });
}
