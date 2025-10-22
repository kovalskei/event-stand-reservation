-- Add sheet_url column to events table
ALTER TABLE t_p5249081_event_stand_reservat.events 
ADD COLUMN IF NOT EXISTS sheet_url TEXT;

-- Add rotation column to booths table
ALTER TABLE t_p5249081_event_stand_reservat.booths 
ADD COLUMN IF NOT EXISTS rotation DOUBLE PRECISION DEFAULT 0;

-- Add comment
COMMENT ON COLUMN t_p5249081_event_stand_reservat.events.sheet_url IS 'Google Sheets URL for syncing booth data';
COMMENT ON COLUMN t_p5249081_event_stand_reservat.booths.rotation IS 'Booth rotation angle in degrees';
