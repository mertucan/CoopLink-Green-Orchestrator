ALTER TABLE cooperatives RENAME COLUMN whatsapp_number TO contact_phone;
ALTER TABLE sessions RENAME COLUMN whatsapp_number TO channel_id;
ALTER TABLE ai_logs RENAME COLUMN whatsapp_number TO channel_id;

