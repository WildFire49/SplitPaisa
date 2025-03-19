-- Create users table if it doesn't exist
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create trips table if it doesn't exist
CREATE TABLE IF NOT EXISTS trips (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create trip_members table if it doesn't exist
CREATE TABLE IF NOT EXISTS trip_members (
  id UUID PRIMARY KEY,
  trip_id UUID REFERENCES trips(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(trip_id, user_id)
);

-- Create expenses table if it doesn't exist
CREATE TABLE IF NOT EXISTS expenses (
  id UUID PRIMARY KEY,
  trip_id UUID REFERENCES trips(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  paid_by UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create expense_participants table if it doesn't exist
CREATE TABLE IF NOT EXISTS expense_participants (
  id UUID PRIMARY KEY,
  expense_id UUID REFERENCES expenses(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  share DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(expense_id, user_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_trips_created_at ON trips(created_at);
CREATE INDEX IF NOT EXISTS idx_expenses_trip_id ON expenses(trip_id);
CREATE INDEX IF NOT EXISTS idx_expenses_created_at ON expenses(created_at);
CREATE INDEX IF NOT EXISTS idx_expense_participants_expense_id ON expense_participants(expense_id);
CREATE INDEX IF NOT EXISTS idx_trip_members_trip_id ON trip_members(trip_id);
