-- ─────────────────────────────────────────────────────────────────────────────
-- Migration 003: Email trigger for opportunity_selected notifications
-- Calls the send-email Edge Function via pg_net when a volunteer is selected.
-- ─────────────────────────────────────────────────────────────────────────────

-- Trigger to call send-email Edge Function on opportunity_selected notifications
CREATE OR REPLACE FUNCTION notify_volunteer_email()
RETURNS trigger AS $$
DECLARE
  vol_email text;
  vol_name text;
BEGIN
  SELECT email, full_name INTO vol_email, vol_name
  FROM volunteers WHERE id = NEW.volunteer_id;

  PERFORM pg_net.http_post(
    url     := current_setting('app.supabase_url') || '/functions/v1/send-email',
    headers := jsonb_build_object(
      'Content-Type',  'application/json',
      'Authorization', 'Bearer ' || current_setting('app.service_role_key')
    ),
    body    := jsonb_build_object(
      'to_email',       vol_email,
      'volunteer_name', vol_name,
      'subject',        'You have been selected for ' || NEW.title,
      'html_body',      '<p>Hi ' || vol_name || ',</p><p>' || NEW.body || '</p>'
    )
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_notification_insert_email
  AFTER INSERT ON notifications
  FOR EACH ROW
  WHEN (NEW.type = 'opportunity_selected')
  EXECUTE FUNCTION notify_volunteer_email();
