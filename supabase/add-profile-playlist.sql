-- Profile Playlist — up to 5 songs with shuffle/repeat mode
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS profile_playlist JSONB DEFAULT '[]';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS playlist_mode TEXT DEFAULT 'repeat' CHECK (playlist_mode IN ('repeat', 'shuffle'));
-- profile_playlist stores array of song IDs: ["uuid1", "uuid2", ...]
-- playlist_mode: 'repeat' = play in order then restart, 'shuffle' = random order then restart
