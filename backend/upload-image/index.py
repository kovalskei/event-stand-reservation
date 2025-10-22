'''
Business: Upload image to Yandex Object Storage and return permanent URL
Args: event - dict with httpMethod, body containing base64 image
      context - object with request_id attribute
Returns: HTTP response with Yandex Storage hosted image URL
'''

import json
import base64
import os
import hashlib
import hmac
from datetime import datetime
from typing import Dict, Any
import urllib.request
import urllib.parse


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
            mime_type = parts[0].split(';')[0].split(':')[1]
            image_data = parts[1]
        else:
            mime_type = 'image/png'
        
        access_key = os.environ.get('YC_STORAGE_ACCESS_KEY')
        secret_key = os.environ.get('YC_STORAGE_SECRET_KEY')
        bucket = os.environ.get('YC_STORAGE_BUCKET')
        
        if not all([access_key, secret_key, bucket]):
            return {
                'statusCode': 500,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({'error': 'Yandex Storage credentials not configured'})
            }
        
        image_bytes = base64.b64decode(image_data)
        
        extension = mime_type.split('/')[-1]
        timestamp = datetime.utcnow().strftime('%Y%m%d_%H%M%S')
        file_hash = hashlib.md5(image_bytes).hexdigest()[:8]
        filename = f"maps/{timestamp}_{file_hash}.{extension}"
        
        host = f'{bucket}.storage.yandexcloud.net'
        url = f'https://{host}/{filename}'
        
        date = datetime.utcnow().strftime('%a, %d %b %Y %H:%M:%S GMT')
        content_type = mime_type
        
        string_to_sign = f"PUT\n\n{content_type}\n{date}\n/{bucket}/{filename}"
        signature = base64.b64encode(
            hmac.new(
                secret_key.encode('utf-8'),
                string_to_sign.encode('utf-8'),
                hashlib.sha1
            ).digest()
        ).decode('utf-8')
        
        headers = {
            'Host': host,
            'Date': date,
            'Content-Type': content_type,
            'Content-Length': str(len(image_bytes)),
            'Authorization': f'AWS {access_key}:{signature}',
            'x-amz-acl': 'public-read'
        }
        
        req = urllib.request.Request(url, data=image_bytes, headers=headers, method='PUT')
        
        try:
            with urllib.request.urlopen(req) as response:
                if response.status in [200, 201]:
                    return {
                        'statusCode': 200,
                        'headers': {
                            'Content-Type': 'application/json',
                            'Access-Control-Allow-Origin': '*'
                        },
                        'isBase64Encoded': False,
                        'body': json.dumps({
                            'url': url,
                            'filename': filename
                        })
                    }
                else:
                    return {
                        'statusCode': 500,
                        'headers': {
                            'Content-Type': 'application/json',
                            'Access-Control-Allow-Origin': '*'
                        },
                        'body': json.dumps({'error': f'Upload failed with status {response.status}'})
                    }
        except urllib.error.HTTPError as e:
            error_body = e.read().decode('utf-8')
            return {
                'statusCode': 500,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({'error': f'Upload failed: {e.code} - {error_body}'})
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
