import { NextRequest, NextResponse } from 'next/server';

const REMOVE_BG_API_KEY = process.env.REMOVE_BG_API_KEY;

interface BackgroundRemovalResponse {
  success: boolean;
  data?: ArrayBuffer;
  error?: string;
  originalSize?: number;
  processedSize?: number;
}

async function removeBackgroundWithRemoveBg(imageBuffer: Buffer): Promise<BackgroundRemovalResponse> {
  try {
    if (!REMOVE_BG_API_KEY) {
      throw new Error('Remove.bg API key not configured');
    }

    const formData = new FormData();
    formData.append('image_file', new Blob([imageBuffer]), 'image.jpg');
    formData.append('size', '50MP'); // Maximum quality - up to 50 megapixels
    formData.append('format', 'png'); // PNG for transparency support

    const response = await fetch('https://api.remove.bg/v1.0/removebg', {
      method: 'POST',
      headers: {
        'X-Api-Key': REMOVE_BG_API_KEY,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Remove.bg API error: ${response.status} - ${errorText}`);
    }

    const processedImageBuffer = await response.arrayBuffer();

    return {
      success: true,
      data: processedImageBuffer,
      originalSize: imageBuffer.length,
      processedSize: processedImageBuffer.byteLength,
    };
  } catch (error) {
    console.error('Remove.bg error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error with Remove.bg',
    };
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { error: 'File must be an image' },
        { status: 400 }
      );
    }

    // Validate file size (25MB limit for high quality)
    const maxSize = 25 * 1024 * 1024; // 25MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File size must be less than 25MB' },
        { status: 400 }
      );
    }

    const imageBuffer = Buffer.from(await file.arrayBuffer());
    const result = await removeBackgroundWithRemoveBg(imageBuffer);

    if (result.success && result.data) {
      const timestamp = Date.now();
      const originalName = file.name.split('.')[0];
      const fileName = `${originalName}_bg_removed_${timestamp}.png`;

      return new NextResponse(result.data, {
        status: 200,
        headers: {
          'Content-Type': 'image/png',
          'Content-Disposition': `attachment; filename="${fileName}"`,
          'X-File-Name': fileName,
          'X-Provider': 'remove.bg',
          'X-Original-Size': result.originalSize?.toString() || '0',
          'X-Processed-Size': result.processedSize?.toString() || '0',
        },
      });
    }

    // If Remove.bg failed, provide helpful error message
    const hasApiKey = !!REMOVE_BG_API_KEY;
    
    if (!hasApiKey) {
      return NextResponse.json(
        {
          error: 'Remove.bg API key not configured. Please add REMOVE_BG_API_KEY to your environment variables.',
          details: 'Visit https://www.remove.bg/users/sign_up to get your API key (50 free images/month).',
          provider: 'remove.bg'
        },
        { status: 503 }
      );
    }

    return NextResponse.json(
      {
        error: 'Remove.bg background removal failed. Please try again later.',
        details: result.error,
      },
      { status: 500 }
    );

  } catch (error) {
    console.error('Background removal error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to remove background',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Health check endpoint
export async function GET() {
  return NextResponse.json({
    status: 'healthy',
    service: 'remove.bg-background-removal',
    provider: {
      name: 'remove.bg',
      maxResolution: '50MP (8000x6250)',
      quality: 'Highest',
      freeLimit: '50 images/month',
      available: !!REMOVE_BG_API_KEY,
    },
    supportedFormats: ['jpg', 'jpeg', 'png', 'webp'],
    maxFileSize: '25MB',
    message: 'Remove.bg background removal service is running'
  });
}