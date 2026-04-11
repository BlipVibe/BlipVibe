-- Group Role Permissions System
-- Owners can set granular permissions for Co-Admins and Mods

CREATE TABLE IF NOT EXISTS group_permissions (
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'co-admin', 'moderator', 'member')),
  can_manage_shop BOOLEAN NOT NULL DEFAULT false,
  can_boot_members BOOLEAN NOT NULL DEFAULT false,
  can_manage_chat BOOLEAN NOT NULL DEFAULT false,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (group_id, user_id)
);

ALTER TABLE group_permissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view group permissions" ON group_permissions
  FOR SELECT USING (true);

CREATE POLICY "Group owners can manage permissions" ON group_permissions
  FOR ALL USING (
    EXISTS (SELECT 1 FROM group_members WHERE group_id = group_permissions.group_id AND user_id = auth.uid() AND role = 'owner')
    OR auth.uid() = user_id
  );

CREATE INDEX IF NOT EXISTS idx_group_permissions_group ON group_permissions (group_id);
CREATE INDEX IF NOT EXISTS idx_group_permissions_user ON group_permissions (user_id);

-- Set default permissions for co-admins: boot=true, shop=false, chat=true
-- Set default permissions for moderators: boot=false, shop=false, chat=true
