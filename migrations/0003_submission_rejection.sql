-- Add rejection_reason column to submissions to support admin reject flow
ALTER TABLE submissions ADD COLUMN rejection_reason TEXT;
