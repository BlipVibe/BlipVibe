-- Group Chat System: sections (categories), channels, and messages
-- Run this in Supabase SQL Editor

-- Sections (like Discord categories: "General", "Off-Topic", etc.)
CREATE TABLE IF NOT EXISTS group_chat_sections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    position INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_gcs_group_pos ON group_chat_sections(group_id, position);

-- Channels (sub-chats under sections)
CREATE TABLE IF NOT EXISTS group_chat_channels (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    section_id UUID NOT NULL REFERENCES group_chat_sections(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    position INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_gcc_section_pos ON group_chat_channels(section_id, position);
CREATE INDEX IF NOT EXISTS idx_gcc_group ON group_chat_channels(group_id);

-- Messages in channels
CREATE TABLE IF NOT EXISTS group_chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    channel_id UUID NOT NULL REFERENCES group_chat_channels(id) ON DELETE CASCADE,
    author_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    content TEXT NOT NULL DEFAULT '',
    media_url TEXT DEFAULT NULL,
    media_type TEXT DEFAULT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_gcm_channel_time ON group_chat_messages(channel_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_gcm_author ON group_chat_messages(author_id);

-- RLS
ALTER TABLE group_chat_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_chat_channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_chat_messages ENABLE ROW LEVEL SECURITY;

-- Sections: anyone can read, owner/mods manage
CREATE POLICY "Anyone can read group chat sections" ON group_chat_sections FOR SELECT USING (true);
CREATE POLICY "Group owner can manage sections" ON group_chat_sections FOR ALL USING (
    EXISTS (SELECT 1 FROM groups WHERE groups.id = group_chat_sections.group_id AND groups.owner_id = auth.uid())
);
CREATE POLICY "Group mods can manage sections" ON group_chat_sections FOR ALL USING (
    EXISTS (
        SELECT 1 FROM group_members gm
        WHERE gm.group_id = group_chat_sections.group_id
        AND gm.user_id = auth.uid()
        AND gm.role IN ('moderator', 'admin', 'owner')
    )
);

-- Channels: anyone can read, owner/mods manage
CREATE POLICY "Anyone can read group chat channels" ON group_chat_channels FOR SELECT USING (true);
CREATE POLICY "Group owner can manage channels" ON group_chat_channels FOR ALL USING (
    EXISTS (SELECT 1 FROM groups WHERE groups.id = group_chat_channels.group_id AND groups.owner_id = auth.uid())
);
CREATE POLICY "Group mods can manage channels" ON group_chat_channels FOR ALL USING (
    EXISTS (
        SELECT 1 FROM group_members gm
        WHERE gm.group_id = group_chat_channels.group_id
        AND gm.user_id = auth.uid()
        AND gm.role IN ('moderator', 'admin', 'owner')
    )
);

-- Messages: anyone can read, members can send, author/owner/mods can delete
CREATE POLICY "Anyone can read group chat messages" ON group_chat_messages FOR SELECT USING (true);
CREATE POLICY "Group members can send messages" ON group_chat_messages FOR INSERT WITH CHECK (
    auth.uid() = author_id AND
    EXISTS (
        SELECT 1 FROM group_chat_channels gcc
        JOIN group_members gm ON gm.group_id = gcc.group_id
        WHERE gcc.id = group_chat_messages.channel_id AND gm.user_id = auth.uid()
    )
);
CREATE POLICY "Author can delete own messages" ON group_chat_messages FOR DELETE USING (author_id = auth.uid());
CREATE POLICY "Group owner can delete messages" ON group_chat_messages FOR DELETE USING (
    EXISTS (
        SELECT 1 FROM group_chat_channels gcc
        JOIN groups g ON g.id = gcc.group_id
        WHERE gcc.id = group_chat_messages.channel_id AND g.owner_id = auth.uid()
    )
);
CREATE POLICY "Group mods can delete messages" ON group_chat_messages FOR DELETE USING (
    EXISTS (
        SELECT 1 FROM group_chat_channels gcc
        JOIN group_members gm ON gm.group_id = gcc.group_id
        WHERE gcc.id = group_chat_messages.channel_id
        AND gm.user_id = auth.uid()
        AND gm.role IN ('moderator', 'admin', 'owner')
    )
);

-- Enable realtime for messages
ALTER PUBLICATION supabase_realtime ADD TABLE group_chat_messages;
