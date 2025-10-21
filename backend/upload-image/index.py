"""
Business: Загрузка изображений на CDN
Args: event с httpMethod POST и файлом в base64
Returns: HTTP response с URL загруженного изображения
"""
import json
import base64
import uuid
import os
from typing import Dict, Any
import requests

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    method: str = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-User-Id, X-Auth-Token',
                'Access-Control-Max-Age': '86400'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    if method != 'POST':
        return {
            'statusCode': 405,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': 'Method not allowed'}),
            'isBase64Encoded': False
        }
    
    try:
        body_str = event.get('body', '{}')
        is_base64 = event.get('isBase64Encoded', False)
        
        if not body_str:
            return {
                'statusCode': 400,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({'error': 'No file provided'}),
                'isBase64Encoded': False
            }
        
        body_data = json.loads(body_str)
        file_data = body_data.get('file', '')
        file_name = body_data.get('fileName', 'image.png')
        
        if not file_data:
            return {
                'statusCode': 400,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({'error': 'No file data provided'}),
                'isBase64Encoded': False
            }
        
        if ',' in file_data:
            file_data = file_data.split(',', 1)[1]
        
        file_bytes = base64.b64decode(file_data)
        
        file_extension = file_name.split('.')[-1] if '.' in file_name else 'png'
        unique_filename = f"{uuid.uuid4()}.{file_extension}"
        
        upload_api_url = "https://api.poehali.dev/upload"
        
        files = {
            'file': (file_name, file_bytes, f'image/{file_extension}')
        }
        
        upload_response = requests.post(
            upload_api_url,
            files=files,
            timeout=30
        )
        
        if upload_response.status_code not in [200, 201]:
            raise Exception(f'Upload failed: {upload_response.status_code} - {upload_response.text}')
        
        response_data = upload_response.json()
        cdn_url = response_data.get('url', '')
        
        if not cdn_url:
            raise Exception('No URL in upload response')
        
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'url': cdn_url}),
            'isBase64Encoded': False
        }
    
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': f'Upload failed: {str(e)}'}),
            'isBase64Encoded': False
        }