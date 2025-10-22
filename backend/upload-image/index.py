'''
Business: Upload image file and store it in the project
Args: event - dict with httpMethod, body containing base64 image
      context - object with request_id attribute
Returns: HTTP response with uploaded image URL
'''

import json
import base64
import os
from typing import Dict, Any
from datetime import datetime
import hashlib


def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    method: str = event.get('httpMethod', 'POST')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-User-Id',
                'Access-Control-Max-Age': '86400'
            },
            'body': ''
        }
    
    if method != 'POST':
        return {
            'statusCode': 405,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': 'Method not allowed'})
        }
    
    try:
        body_data = json.loads(event.get('body', '{}'))
        image_data = body_data.get('image')
        
        if not image_data:
            return {
                'statusCode': 400,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({'error': 'No image data provided'})
            }
        
        # Handle data URL format (data:image/png;base64,...)
        if image_data.startswith('data:'):
            parts = image_data.split(',', 1)
            if len(parts) != 2:
                return {
                    'statusCode': 400,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    'body': json.dumps({'error': 'Invalid image data format'})
                }
            image_data = parts[1]
        
        # Decode base64
        try:
            image_bytes = base64.b64decode(image_data)
        except Exception:
            return {
                'statusCode': 400,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({'error': 'Invalid base64 data'})
            }
        
        # Generate unique filename
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        hash_suffix = hashlib.md5(image_bytes).hexdigest()[:8]
        filename = f"map_{timestamp}_{hash_suffix}.png"
        
        # Create public directory if it doesn't exist
        public_dir = '/tmp/public'
        os.makedirs(public_dir, exist_ok=True)
        
        file_path = os.path.join(public_dir, filename)
        
        # Save file
        with open(file_path, 'wb') as f:
            f.write(image_bytes)
        
        # Generate public URL
        image_url = f"/public/{filename}"
        
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'isBase64Encoded': False,
            'body': json.dumps({
                'url': image_url,
                'filename': filename
            })
        }
        
    except json.JSONDecodeError:
        return {
            'statusCode': 400,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': 'Invalid JSON in request body'})
        }
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': f'Internal server error: {str(e)}'})
        }
