-- Create daily_steps table for tracking daily step count and calories burned from walking
CREATE TABLE IF NOT EXISTS daily_steps (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  steps_count INTEGER NOT NULL DEFAULT 0,
  calories_burned INTEGER NOT NULL DEFAULT 0,
  step_date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, step_date)
);

-- Enable Row Level Security
ALTER TABLE daily_steps ENABLE ROW LEVEL SECURITY;

-- Create policies for daily_steps
CREATE POLICY "Users can view own daily steps"
  ON daily_steps FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own daily steps"
  ON daily_steps FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own daily steps"
  ON daily_steps FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own daily steps"
  ON daily_steps FOR DELETE
  USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX idx_daily_steps_user_id ON daily_steps(user_id);
CREATE INDEX idx_daily_steps_date ON daily_steps(step_date);

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_daily_steps_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
CREATE TRIGGER daily_steps_updated_at
  BEFORE UPDATE ON daily_steps
  FOR EACH ROW
  EXECUTE FUNCTION update_daily_steps_updated_at();
