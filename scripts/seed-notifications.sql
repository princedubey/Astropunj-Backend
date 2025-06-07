-- Create sample notifications
INSERT INTO notifications (id, user_id, title, message, type, data) VALUES 
('notif-1', 'user-1', 'Welcome to AstroPunj', 'Thank you for joining our platform!', 'system', '{}'),
('notif-2', 'user-2', 'Chat Request', 'Pandit Sharma has accepted your chat request', 'chat', '{"chatId": "chat-1", "action": "chat_accepted"}'),
('notif-3', 'user-3', 'New Review', 'John Doe gave you 5 stars', 'review', '{"rating": 5, "action": "review_received"}');

-- Create default notification settings for existing users
INSERT INTO notification_settings (id, user_id, push_enabled, email_enabled, chat_notifications, call_notifications, payment_notifications, promotional_notifications) VALUES 
('settings-1', 'user-1', true, true, true, true, true, false),
('settings-2', 'user-2', true, false, true, true, true, true),
('settings-3', 'user-3', true, true, true, true, true, true);

-- Create sample kundali records
INSERT INTO kundalis (id, user_id, file_name, file_path, bucket, file_type) VALUES 
('kundali-1', 'user-1', 'birth_chart.pdf', 'charts/user-1/1703123456_abc123.pdf', 'kundalis', 'application/pdf'),
('kundali-2', 'user-2', 'horoscope.png', 'charts/user-2/1703123789_def456.png', 'kundalis', 'image/png');
