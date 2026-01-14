
CREATE TABLE IF NOT EXISTS activity_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id INT NOT NULL, -- Linked to employee id (integer based on schema)
  title TEXT NOT NULL,
  description TEXT,
  start_time TIMESTAMP NOT NULL,
  end_time TIMESTAMP,
  is_all_day BOOLEAN DEFAULT FALSE,
  reminder_minutes INT DEFAULT 15, -- Minutes before event to notify via WA
  is_completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);
