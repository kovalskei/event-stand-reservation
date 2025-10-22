-- Clean up base64 data from map_url column
UPDATE t_p5249081_event_stand_reservat.events 
SET map_url = 'https://cdn.poehali.dev/files/84989299-cef8-4fc0-a2cd-b8106a39b96d.png' 
WHERE map_url LIKE 'data:image%';

-- Add comment
COMMENT ON COLUMN t_p5249081_event_stand_reservat.events.map_url IS 'CDN URL only, no base64 data allowed';
