'''
Загружает изображение в S3-хранилище и возвращает публичный CDN URL.
Принимает base64-изображение в теле запроса, сохраняет в bucket 'files' и возвращает ссылку.
'''

import json
import base64
import os
import uuid
import boto3
from typing import Dict, Any


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
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Method not allowed'})
        }

    body_data = json.loads(event.get('body', '{}'))
    image_data = body_data.get('image')

    if not image_data:
        return {
            'statusCode': 400,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'No image data provided'})
        }

    # Разбираем data URL: data:image/png;base64,...
    content_type = 'image/png'
    ext = 'png'
    if image_data.startswith('data:'):
        parts = image_data.split(',', 1)
        if len(parts) != 2:
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Invalid image data format'})
            }
        meta = parts[0]  # data:image/jpeg;base64
        image_data = parts[1]
        if 'jpeg' in meta or 'jpg' in meta:
            content_type = 'image/jpeg'
            ext = 'jpg'
        elif 'gif' in meta:
            content_type = 'image/gif'
            ext = 'gif'
        elif 'webp' in meta:
            content_type = 'image/webp'
            ext = 'webp'

    image_bytes = base64.b64decode(image_data)

    s3 = boto3.client(
        's3',
        endpoint_url='https://bucket.poehali.dev',
        aws_access_key_id=os.environ['AWS_ACCESS_KEY_ID'],
        aws_secret_access_key=os.environ['AWS_SECRET_ACCESS_KEY']
    )

    key = f'maps/{uuid.uuid4().hex}.{ext}'
    s3.put_object(
        Bucket='files',
        Key=key,
        Body=image_bytes,
        ContentType=content_type
    )

    access_key = os.environ['AWS_ACCESS_KEY_ID']
    cdn_url = f'https://cdn.poehali.dev/projects/{access_key}/bucket/{key}'

    return {
        'statusCode': 200,
        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
        'body': json.dumps({'url': cdn_url})
    }
