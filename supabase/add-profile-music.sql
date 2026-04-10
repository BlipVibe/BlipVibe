-- Profile Music System
-- Users can pick a song from the BlipVibe music library for their profile

-- Music library table (admin-managed)
CREATE TABLE IF NOT EXISTS music_library (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  artist TEXT NOT NULL DEFAULT 'BlipVibe',
  file_url TEXT NOT NULL,
  genre TEXT,
  price INT NOT NULL DEFAULT 40,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE music_library ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view music library" ON music_library
  FOR SELECT USING (true);

-- Only admins can manage the library
CREATE POLICY "Admins can insert music" ON music_library
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );

CREATE POLICY "Admins can update music" ON music_library
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );

CREATE POLICY "Admins can delete music" ON music_library
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );

-- Add profile_song to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS profile_song_id UUID REFERENCES music_library(id) ON DELETE SET NULL;

-- Track owned songs per user
CREATE TABLE IF NOT EXISTS user_songs (
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  song_id UUID NOT NULL REFERENCES music_library(id) ON DELETE CASCADE,
  purchased_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, song_id)
);

ALTER TABLE user_songs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own songs" ON user_songs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own songs" ON user_songs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Seed music library with BlipVibe original songs
INSERT INTO music_library (title, artist, file_url, genre, price) VALUES ('808 Salvation', 'BlipVibe', 'https://jrybcihteqlqkdbrmagx.supabase.co/storage/v1/object/public/Music/808%20Salvation.mp3', 'Original', 40);
INSERT INTO music_library (title, artist, file_url, genre, price) VALUES ('Backroad Confession', 'BlipVibe', 'https://jrybcihteqlqkdbrmagx.supabase.co/storage/v1/object/public/Music/Backroad%20Confession.mp3', 'Original', 40);
INSERT INTO music_library (title, artist, file_url, genre, price) VALUES ('Chrome Slingshot', 'BlipVibe', 'https://jrybcihteqlqkdbrmagx.supabase.co/storage/v1/object/public/Music/Chrome%20Slingshot.mp3', 'Original', 40);
INSERT INTO music_library (title, artist, file_url, genre, price) VALUES ('Concrete Clap', 'BlipVibe', 'https://jrybcihteqlqkdbrmagx.supabase.co/storage/v1/object/public/Music/Concrete%20Clap.mp3', 'Original', 40);
INSERT INTO music_library (title, artist, file_url, genre, price) VALUES ('Cotton Circuit', 'BlipVibe', 'https://jrybcihteqlqkdbrmagx.supabase.co/storage/v1/object/public/Music/Cotton%20Circuit.mp3', 'Original', 40);
INSERT INTO music_library (title, artist, file_url, genre, price) VALUES ('Crackling Gauntlet', 'BlipVibe', 'https://jrybcihteqlqkdbrmagx.supabase.co/storage/v1/object/public/Music/Crackling%20Gauntlet.mp3', 'Original', 40);
INSERT INTO music_library (title, artist, file_url, genre, price) VALUES ('Dembow Citron', 'BlipVibe', 'https://jrybcihteqlqkdbrmagx.supabase.co/storage/v1/object/public/Music/Dembow%20Citron.mp3', 'Original', 40);
INSERT INTO music_library (title, artist, file_url, genre, price) VALUES ('Hushglass', 'BlipVibe', 'https://jrybcihteqlqkdbrmagx.supabase.co/storage/v1/object/public/Music/Hushglass.mp3', 'Original', 40);
INSERT INTO music_library (title, artist, file_url, genre, price) VALUES ('Neon Feverbreak', 'BlipVibe', 'https://jrybcihteqlqkdbrmagx.supabase.co/storage/v1/object/public/Music/Neon%20Feverbreak.mp3', 'Original', 40);
INSERT INTO music_library (title, artist, file_url, genre, price) VALUES ('Neon Lanterns Ballad', 'BlipVibe', 'https://jrybcihteqlqkdbrmagx.supabase.co/storage/v1/object/public/Music/Neon%20Lanterns%20Ballad.mp3', 'Original', 40);
INSERT INTO music_library (title, artist, file_url, genre, price) VALUES ('Neon Lanterns Epic', 'BlipVibe', 'https://jrybcihteqlqkdbrmagx.supabase.co/storage/v1/object/public/Music/Neon%20Lanterns%20Epic.mp3', 'Original', 40);
INSERT INTO music_library (title, artist, file_url, genre, price) VALUES ('Palmwine Pulse', 'BlipVibe', 'https://jrybcihteqlqkdbrmagx.supabase.co/storage/v1/object/public/Music/Palmwine%20Pulse.mp3', 'Original', 40);
INSERT INTO music_library (title, artist, file_url, genre, price) VALUES ('Pressure Bloom', 'BlipVibe', 'https://jrybcihteqlqkdbrmagx.supabase.co/storage/v1/object/public/Music/Pressure%20Bloom.mp3', 'Original', 40);
INSERT INTO music_library (title, artist, file_url, genre, price) VALUES ('Ruins Hushglass', 'BlipVibe', 'https://jrybcihteqlqkdbrmagx.supabase.co/storage/v1/object/public/Music/Ruins%20Hushglass.mp3', 'Original', 40);
INSERT INTO music_library (title, artist, file_url, genre, price) VALUES ('Safe-Zone Boots', 'BlipVibe', 'https://jrybcihteqlqkdbrmagx.supabase.co/storage/v1/object/public/Music/Safe-Zone%20Boots.mp3', 'Original', 40);
INSERT INTO music_library (title, artist, file_url, genre, price) VALUES ('Sapphire Detour', 'BlipVibe', 'https://jrybcihteqlqkdbrmagx.supabase.co/storage/v1/object/public/Music/Sapphire%20Detour.mp3', 'Original', 40);
INSERT INTO music_library (title, artist, file_url, genre, price) VALUES ('Vanilla Sunburn', 'BlipVibe', 'https://jrybcihteqlqkdbrmagx.supabase.co/storage/v1/object/public/Music/Vanilla%20Sunburn.mp3', 'Original', 40);
INSERT INTO music_library (title, artist, file_url, genre, price) VALUES ('Velvet Silence', 'BlipVibe', 'https://jrybcihteqlqkdbrmagx.supabase.co/storage/v1/object/public/Music/Velvet%20Silence.mp3', 'Original', 40);
INSERT INTO music_library (title, artist, file_url, genre, price) VALUES ('Vinyl Pianosmoke', 'BlipVibe', 'https://jrybcihteqlqkdbrmagx.supabase.co/storage/v1/object/public/Music/Vinyl%20Pianosmoke.mp3', 'Original', 40);
