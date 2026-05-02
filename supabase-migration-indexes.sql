-- ─────────────────────────────────────────────────────────────────────────────
-- MindVault: Performance Indexes
-- Run in Supabase SQL Editor (safe to run multiple times — uses IF NOT EXISTS)
-- ─────────────────────────────────────────────────────────────────────────────

-- notes
CREATE INDEX IF NOT EXISTS idx_notes_user_id        ON notes(user_id);
CREATE INDEX IF NOT EXISTS idx_notes_user_tag        ON notes(user_id, tag);
CREATE INDEX IF NOT EXISTS idx_notes_created_at      ON notes(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notes_user_project    ON notes(user_id, project_id);

-- tasks: composite covers (user+date+done) and (user+done+date) queries
CREATE INDEX IF NOT EXISTS idx_tasks_user_id         ON tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_user_date_done  ON tasks(user_id, date, done);
CREATE INDEX IF NOT EXISTS idx_tasks_user_done_date  ON tasks(user_id, done, date);
CREATE INDEX IF NOT EXISTS idx_tasks_created_at      ON tasks(created_at ASC);

-- projects
CREATE INDEX IF NOT EXISTS idx_projects_user_id      ON projects(user_id);

-- project sub-tables
CREATE INDEX IF NOT EXISTS idx_project_tasks_proj    ON project_tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_project_tasks_user    ON project_tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_project_notes_proj    ON project_notes(project_id);
CREATE INDEX IF NOT EXISTS idx_project_bugs_proj     ON project_bugs(project_id);

-- links
CREATE INDEX IF NOT EXISTS idx_links_user_id         ON links(user_id);
CREATE INDEX IF NOT EXISTS idx_links_user_project    ON links(user_id, project_id);

-- link_folders
CREATE INDEX IF NOT EXISTS idx_link_folders_user     ON link_folders(user_id);

-- apps (skip html in index — it's a text column)
CREATE INDEX IF NOT EXISTS idx_apps_user_id          ON apps(user_id);
CREATE INDEX IF NOT EXISTS idx_apps_user_project     ON apps(user_id, project_id);
CREATE INDEX IF NOT EXISTS idx_apps_share_token      ON apps(share_token) WHERE share_token IS NOT NULL;

-- app_folders
CREATE INDEX IF NOT EXISTS idx_app_folders_user      ON app_folders(user_id);

-- app_usage_logs
CREATE INDEX IF NOT EXISTS idx_app_usage_user_opened ON app_usage_logs(user_id, opened_at DESC);

-- transactions
CREATE INDEX IF NOT EXISTS idx_tx_user               ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_tx_scope_date         ON transactions(user_id, scope_id, date);

-- finance_scopes
CREATE INDEX IF NOT EXISTS idx_scopes_user           ON finance_scopes(user_id);

-- categories
CREATE INDEX IF NOT EXISTS idx_categories_user       ON categories(user_id);

-- focus_sessions
CREATE INDEX IF NOT EXISTS idx_focus_user_started    ON focus_sessions(user_id, started_at DESC);
CREATE INDEX IF NOT EXISTS idx_focus_user_task       ON focus_sessions(user_id, task_id) WHERE task_id IS NOT NULL;

-- backlog
CREATE INDEX IF NOT EXISTS idx_backlog_user          ON backlog(user_id);
CREATE INDEX IF NOT EXISTS idx_backlog_user_deleted  ON backlog(user_id, deleted_at DESC);
