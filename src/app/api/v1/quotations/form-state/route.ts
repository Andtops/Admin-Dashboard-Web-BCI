import { NextRequest, NextResponse } from 'next/server';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '../../../../../../convex/_generated/api';
import { withApiKeyAuth } from '@/lib/apiKeyAuth';

// Initialize Convex client for server-side operations
const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

// In-memory storage for demo (in production, use Convex database)
const formStateStorage = new Map<string, { notes: string; urgency: 'standard' | 'urgent' | 'asap' }>();

/**
 * GET /api/v1/quotations/form-state
 * Get quotation form state (notes and urgency) for a user
 */
export const GET = withApiKeyAuth(
    async (request: NextRequest, apiKey) => {
        try {
            const { searchParams } = new URL(request.url);
            const userId = searchParams.get('userId');

            console.log(`Admin API: Getting form state for user ${userId}`);

            if (!userId) {
                return NextResponse.json(
                    {
                        success: false,
                        error: 'User ID is required',
                        code: 'MISSING_USER_ID'
                    },
                    { status: 400 }
                );
            }

            // Get form state from storage (in production, this would be from Convex)
            const formState = formStateStorage.get(userId) || { notes: '', urgency: 'standard' as const };

            console.log(`Found form state for user ${userId}:`, formState);

            return NextResponse.json({
                success: true,
                data: formState,
                meta: {
                    apiKeyId: apiKey.keyId,
                    environment: apiKey.environment,
                    timestamp: Date.now()
                }
            });

        } catch (error) {
            console.error('Get form state API error:', error);
            return NextResponse.json(
                {
                    success: false,
                    error: 'Failed to get form state',
                    code: 'GET_FORM_STATE_FAILED'
                },
                { status: 500 }
            );
        }
    },
    {
        requiredPermission: 'quotations:read'
    }
);

/**
 * POST /api/v1/quotations/form-state
 * Update quotation form state (notes and urgency) for a user
 */
export const POST = withApiKeyAuth(
    async (request: NextRequest, apiKey) => {
        try {
            const body = await request.json();
            const { userId, notes, urgency } = body;

            console.log(`Admin API: Updating form state for user ${userId} with:`, { notes: notes?.length || 0, urgency });

            if (!userId) {
                return NextResponse.json(
                    {
                        success: false,
                        error: 'User ID is required',
                        code: 'MISSING_USER_ID'
                    },
                    { status: 400 }
                );
            }

            if (typeof notes !== 'string') {
                return NextResponse.json(
                    {
                        success: false,
                        error: 'Notes must be a string',
                        code: 'INVALID_NOTES'
                    },
                    { status: 400 }
                );
            }

            if (!['standard', 'urgent', 'asap'].includes(urgency)) {
                return NextResponse.json(
                    {
                        success: false,
                        error: 'Urgency must be one of: standard, urgent, asap',
                        code: 'INVALID_URGENCY'
                    },
                    { status: 400 }
                );
            }

            // Store form state (in production, this would be stored in Convex)
            formStateStorage.set(userId, { notes, urgency });

            console.log(`Form state updated successfully for user ${userId}`);

            return NextResponse.json({
                success: true,
                data: {
                    userId,
                    notes,
                    urgency,
                    message: 'Form state updated successfully'
                },
                meta: {
                    apiKeyId: apiKey.keyId,
                    environment: apiKey.environment,
                    timestamp: Date.now()
                }
            });

        } catch (error) {
            console.error('Update form state API error:', error);
            return NextResponse.json(
                {
                    success: false,
                    error: 'Failed to update form state',
                    code: 'UPDATE_FORM_STATE_FAILED'
                },
                { status: 500 }
            );
        }
    },
    {
        requiredPermission: 'quotations:write'
    }
);

/**
 * OPTIONS handler for CORS
 */
export async function OPTIONS(request: NextRequest) {
    return new NextResponse(null, {
        status: 200,
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-API-Key',
            'Access-Control-Max-Age': '86400',
        },
    });
}