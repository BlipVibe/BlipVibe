-- Story Text Overlays — draggable, rotatable, resizable text on stories
-- Stores array of overlay objects as JSONB
ALTER TABLE stories ADD COLUMN IF NOT EXISTS text_overlays JSONB DEFAULT '[]';
-- Each overlay: { text, x, y, rotation, scale, fontFamily, fontSize, color, bgColor }
