'''
Business: API для управления мероприятиями и стендами
Args: event - dict с httpMethod, body, queryStringParameters
      context - object с request_id, function_name
Returns: HTTP response dict с данными мероприятий/стендов
'''

import json
import os
from typing import Dict, Any
import psycopg2
from psycopg2.extras import RealDictCursor

def get_db_connection():
    return psycopg2.connect(os.environ['DATABASE_URL'])

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    method: str = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-User-Email',
                'Access-Control-Max-Age': '86400'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    headers = event.get('headers', {}) or {}
    user_email = (headers.get('x-user-email') or headers.get('X-User-Email') or 
                  headers.get('X-USER-EMAIL'))
    
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    
    try:
        if method == 'GET':
            params = event.get('queryStringParameters', {}) or {}
            event_id = params.get('event_id')
            
            if event_id:
                cur.execute(
                    "SELECT * FROM booths WHERE event_id = %s",
                    (event_id,)
                )
                booths = cur.fetchall()
                
                cur.execute(
                    "SELECT sheet_url FROM events WHERE id = %s",
                    (event_id,)
                )
                event_data = cur.fetchone()
                
                return {
                    'statusCode': 200,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    'body': json.dumps({
                        'booths': [dict(b) for b in booths],
                        'sheet_url': event_data['sheet_url'] if event_data else None
                    }, default=str),
                    'isBase64Encoded': False
                }
            else:
                if not user_email:
                    return {
                        'statusCode': 200,
                        'headers': {
                            'Content-Type': 'application/json',
                            'Access-Control-Allow-Origin': '*'
                        },
                        'body': json.dumps([]),
                        'isBase64Encoded': False
                    }
                
                cur.execute(
                    "SELECT id FROM users WHERE email = %s",
                    (user_email,)
                )
                user = cur.fetchone()
                
                if not user:
                    cur.execute(
                        "INSERT INTO users (email) VALUES (%s) RETURNING id",
                        (user_email,)
                    )
                    conn.commit()
                    user = cur.fetchone()
                
                cur.execute(
                    "SELECT * FROM events WHERE user_id = %s ORDER BY created_at DESC",
                    (user['id'],)
                )
                events = cur.fetchall()
                
                return {
                    'statusCode': 200,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    'body': json.dumps([dict(e) for e in events], default=str),
                    'isBase64Encoded': False
                }
        
        if method == 'POST':
            body_data = json.loads(event.get('body', '{}'))
            action = body_data.get('action')
            
            if action == 'create_event' and user_email:
                cur.execute(
                    "SELECT id FROM users WHERE email = %s",
                    (user_email,)
                )
                user = cur.fetchone()
                
                if not user:
                    cur.execute(
                        "INSERT INTO users (email) VALUES (%s) RETURNING id",
                        (user_email,)
                    )
                    conn.commit()
                    user = cur.fetchone()
                
                cur.execute(
                    "INSERT INTO events (user_id, name, date, location, map_url) VALUES (%s, %s, %s, %s, %s) RETURNING *",
                    (user['id'], body_data.get('name'), body_data.get('date'), body_data.get('location'), body_data.get('map_url'))
                )
                conn.commit()
                new_event = cur.fetchone()
                
                return {
                    'statusCode': 201,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    'body': json.dumps(dict(new_event), default=str),
                    'isBase64Encoded': False
                }
            
            if action == 'update_map':
                event_id = body_data.get('event_id')
                map_url = body_data.get('map_url')
                
                if not event_id or not map_url:
                    return {
                        'statusCode': 400,
                        'headers': {
                            'Content-Type': 'application/json',
                            'Access-Control-Allow-Origin': '*'
                        },
                        'body': json.dumps({'error': 'event_id and map_url are required'}),
                        'isBase64Encoded': False
                    }
                
                cur.execute(
                    "UPDATE events SET map_url = %s, updated_at = CURRENT_TIMESTAMP WHERE id = %s RETURNING *",
                    (map_url, event_id)
                )
                conn.commit()
                updated_event = cur.fetchone()
                
                if not updated_event:
                    return {
                        'statusCode': 404,
                        'headers': {
                            'Content-Type': 'application/json',
                            'Access-Control-Allow-Origin': '*'
                        },
                        'body': json.dumps({'error': 'Event not found'}),
                        'isBase64Encoded': False
                    }
                
                return {
                    'statusCode': 200,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    'body': json.dumps(dict(updated_event), default=str),
                    'isBase64Encoded': False
                }
            
            if action == 'update_sheet_url':
                event_id = body_data.get('event_id')
                sheet_url = body_data.get('sheet_url')
                
                cur.execute(
                    "UPDATE events SET sheet_url = %s, updated_at = CURRENT_TIMESTAMP WHERE id = %s",
                    (sheet_url, event_id)
                )
                conn.commit()
                
                return {
                    'statusCode': 200,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    'body': json.dumps({'success': True}),
                    'isBase64Encoded': False
                }
            
            if action == 'save_booths':
                event_id = body_data.get('event_id')
                booths = body_data.get('booths', [])
                
                for booth in booths:
                    cur.execute(
                        """INSERT INTO booths (id, event_id, x, y, width, height, rotation, status, company, contact_person, phone, email, notes)
                           VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                           ON CONFLICT (id, event_id) DO UPDATE SET
                           x = EXCLUDED.x, y = EXCLUDED.y, width = EXCLUDED.width, height = EXCLUDED.height,
                           rotation = EXCLUDED.rotation,
                           status = EXCLUDED.status, company = EXCLUDED.company, contact_person = EXCLUDED.contact_person,
                           phone = EXCLUDED.phone, email = EXCLUDED.email, notes = EXCLUDED.notes,
                           updated_at = CURRENT_TIMESTAMP""",
                        (booth.get('id'), event_id, booth.get('x'), booth.get('y'), booth.get('width'),
                         booth.get('height'), booth.get('rotation', 0), booth.get('status'), booth.get('company'), booth.get('contactPerson'),
                         booth.get('phone'), booth.get('email'), booth.get('notes'))
                    )
                conn.commit()
                
                return {
                    'statusCode': 200,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    'body': json.dumps({'success': True}),
                    'isBase64Encoded': False
                }
        
        return {
            'statusCode': 400,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Invalid request'}),
            'isBase64Encoded': False
        }
    
    finally:
        cur.close()
        conn.close()