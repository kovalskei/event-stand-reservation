"""
Business: Автоматическое определение позиций стендов на карте
Args: event с httpMethod POST и base64 изображением карты
Returns: HTTP response с массивом координат стендов
"""
import json
import base64
import cv2
import numpy as np
from typing import Dict, Any, List

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
        if not body_str or body_str.strip() == '':
            body_str = '{}'
        body_data = json.loads(body_str)
        
        image_data = body_data.get('image', '')
        
        if not image_data:
            return {
                'statusCode': 400,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({'error': 'No image data provided'}),
                'isBase64Encoded': False
            }
        
        if ',' in image_data:
            image_data = image_data.split(',', 1)[1]
        
        img_bytes = base64.b64decode(image_data)
        nparr = np.frombuffer(img_bytes, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        if img is None:
            raise Exception('Failed to decode image')
        
        height, width = img.shape[:2]
        
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        
        blurred = cv2.GaussianBlur(gray, (5, 5), 0)
        
        edges = cv2.Canny(blurred, 50, 150)
        
        contours, _ = cv2.findContours(edges, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        
        valid_booths = []
        
        for contour in contours:
            area = cv2.contourArea(contour)
            
            if area < 500 or area > width * height * 0.1:
                continue
            
            x, y, w, h = cv2.boundingRect(contour)
            
            aspect_ratio = float(w) / h if h > 0 else 0
            if aspect_ratio < 0.3 or aspect_ratio > 3:
                continue
            
            x_percent = (x / width) * 100
            y_percent = (y / height) * 100
            w_percent = (w / width) * 100
            h_percent = (h / height) * 100
            
            valid_booths.append({
                'x': round(x_percent, 2),
                'y': round(y_percent, 2),
                'width': round(w_percent, 2),
                'height': round(h_percent, 2)
            })
        
        valid_booths = sorted(valid_booths, key=lambda b: (b['y'], b['x']))
        
        booths = []
        row_letter = ord('A')
        row_num = 1
        prev_y = None
        y_threshold = 5
        
        for booth in valid_booths:
            if prev_y is None:
                prev_y = booth['y']
            elif abs(booth['y'] - prev_y) > y_threshold:
                row_letter += 1
                row_num = 1
                prev_y = booth['y']
            
            letter = chr(row_letter) if row_letter <= ord('Z') else f'{chr(ord("A") + (row_letter - ord("A")) // 26 - 1)}{chr(ord("A") + (row_letter - ord("A")) % 26)}'
            
            booths.append({
                'id': f'{letter}{row_num}',
                'x': booth['x'],
                'y': booth['y'],
                'width': booth['width'],
                'height': booth['height']
            })
            
            row_num += 1
        
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({
                'booths': booths,
                'count': len(booths)
            }),
            'isBase64Encoded': False
        }
    
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': f'Detection failed: {str(e)}'}),
            'isBase64Encoded': False
        }