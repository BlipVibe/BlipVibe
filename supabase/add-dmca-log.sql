-- DMCA Notice Log — documents receipt timestamps for legal proof
-- Required for demonstrating expeditious response under § 512

CREATE TABLE IF NOT EXISTS dmca_notices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- Notice details
  notice_type TEXT NOT NULL DEFAULT 'takedown' CHECK (notice_type IN ('takedown', 'counter')),
  status TEXT NOT NULL DEFAULT 'received' CHECK (status IN ('received', 'reviewing', 'actioned', 'rejected', 'restored')),
  -- Who filed
  complainant_name TEXT,
  complainant_email TEXT,
  -- What content
  target_post_id UUID REFERENCES posts(id) ON DELETE SET NULL,
  target_user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  content_url TEXT,
  -- Copyrighted work
  copyrighted_work TEXT,
  -- Processing
  received_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  actioned_at TIMESTAMPTZ,
  restored_at TIMESTAMPTZ,
  admin_notes TEXT,
  processed_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Only admins can view/manage DMCA notices
ALTER TABLE dmca_notices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view DMCA notices" ON dmca_notices
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );

CREATE POLICY "Admins can insert DMCA notices" ON dmca_notices
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );

CREATE POLICY "Admins can update DMCA notices" ON dmca_notices
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );

-- Index for quick lookups
CREATE INDEX IF NOT EXISTS idx_dmca_notices_status ON dmca_notices (status, received_at DESC);
CREATE INDEX IF NOT EXISTS idx_dmca_notices_target ON dmca_notices (target_user_id);
