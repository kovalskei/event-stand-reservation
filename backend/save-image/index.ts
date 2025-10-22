/**
 * Business: Save uploaded image to /public/images directory
 * Args: event with httpMethod, body containing {fileName, dataUrl}
 * Returns: HTTP response with success status
 */

import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';

interface CloudFunctionEvent {
  httpMethod: string;
  headers: Record<string, string>;
  body?: string;
  isBase64Encoded: boolean;
}

interface CloudFunctionContext {
  requestId: string;
  functionName: string;
}

export const handler = async (event: CloudFunctionEvent, context: CloudFunctionContext): Promise<any> => {
    const { httpMethod, body } = event;
    
    if (httpMethod === 'OPTIONS') {
        return {
            statusCode: 200,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Max-Age': '86400'
            },
            body: '',
            isBase64Encoded: false
        };
    }
    
    if (httpMethod !== 'POST') {
        return {
            statusCode: 405,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({ error: 'Method not allowed' }),
            isBase64Encoded: false
        };
    }

    try {
        const { fileName, dataUrl } = JSON.parse(body || '{}');
        
        if (!fileName || !dataUrl) {
            return {
                statusCode: 400,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                body: JSON.stringify({ error: 'fileName and dataUrl are required' }),
                isBase64Encoded: false
            };
        }

        const base64Data = dataUrl.replace(/^data:image\/\w+;base64,/, '');
        const buffer = Buffer.from(base64Data, 'base64');
        
        const publicDir = join(process.cwd(), '..', '..', 'public', 'images');
        
        if (!existsSync(publicDir)) {
            mkdirSync(publicDir, { recursive: true });
        }
        
        const filePath = join(publicDir, fileName);
        writeFileSync(filePath, buffer);

        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({ 
                success: true, 
                path: `/images/${fileName}`,
                message: `File saved to ${filePath}` 
            }),
            isBase64Encoded: false
        };
    } catch (error) {
        console.error('Error saving image:', error);
        return {
            statusCode: 500,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({ 
                error: 'Failed to save image',
                details: error instanceof Error ? error.message : 'Unknown error'
            }),
            isBase64Encoded: false
        };
    }
};
