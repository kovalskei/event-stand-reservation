"""
Business: Загрузка данных о стендах из Google Таблиц
Args: event с httpMethod, body содержащим sheetUrl
Returns: HTTP response с массивом booths
"""
import json
import re
from typing import Dict, Any, List

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    method: str = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
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
        if not body_str or body_str.strip() == '':
            body_str = '{}'
        
        body_data = json.loads(body_str)
        sheet_url = body_data.get('sheetUrl', '')
        
        if not sheet_url:
            return {
                'statusCode': 400,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({'error': 'sheetUrl is required'}),
                'isBase64Encoded': False
            }
        
        sheet_id = extract_sheet_id(sheet_url)
        if not sheet_id:
            return {
                'statusCode': 400,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({'error': 'Invalid Google Sheets URL'}),
                'isBase64Encoded': False
            }
        
        result = fetch_sheet_data(sheet_id)
        
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps(result),
            'isBase64Encoded': False
        }
    
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': f'Internal server error: {str(e)}'}),
            'isBase64Encoded': False
        }


def extract_sheet_id(url: str) -> str:
    pattern = r'/spreadsheets/d/([a-zA-Z0-9-_]+)'
    match = re.search(pattern, url)
    return match.group(1) if match else ''


def fetch_sheet_data(sheet_id: str) -> Dict[str, Any]:
    import requests
    
    csv_url = f'https://docs.google.com/spreadsheets/d/{sheet_id}/export?format=csv'
    
    response = requests.get(csv_url, timeout=10)
    response.raise_for_status()
    response.encoding = 'utf-8'
    
    lines = response.text.strip().split('\n')
    booths = []
    map_url = None
    
    for i, line in enumerate(lines):
        if i == 0:
            header = line.lower()
            continue
        
        parts = line.split(',')
        if len(parts) < 1:
            continue
        
        booth_number = parts[0].strip().strip('"')
        
        if booth_number.lower() == 'mapurl' or booth_number.lower() == 'map_url':
            if len(parts) > 1:
                map_url = parts[1].strip().strip('"')
            continue
        
        if not booth_number:
            continue
        
        status = 'available'
        if len(parts) > 1:
            status = parts[1].strip().strip('"').lower()
            if status not in ['available', 'booked', 'unavailable']:
                status = 'available'
        
        booth = {
            'id': booth_number,
            'number': booth_number,
            'status': status,
        }
        
        if len(parts) > 2 and parts[2].strip():
            booth['company'] = parts[2].strip().strip('"')
        
        if len(parts) > 3 and parts[3].strip():
            booth['contact'] = parts[3].strip().strip('"')
        
        if len(parts) > 4 and parts[4].strip():
            booth['size'] = parts[4].strip().strip('"')
        
        if len(parts) > 5 and parts[5].strip():
            booth['price'] = parts[5].strip().strip('"')
        
        booths.append(booth)
    
    return {
        'booths': booths,
        'mapUrl': map_url
    }