-- Create sample admin user
INSERT INTO admins (id, email, password, role) VALUES 
('admin-1', 'admin@astropunj.com', '$2b$10$example-hashed-password', 'super-admin');

-- Create sample users
INSERT INTO users (id, email, name, dob, gender, language, birth_info) VALUES 
('user-1', 'john@example.com', 'John Doe', '1990-05-15', 'male', 'english', '{"time": "10:30 AM", "place": "Mumbai", "coordinates": {"lat": 19.0760, "lng": 72.8777}}'),
('user-2', 'jane@example.com', 'Jane Smith', '1985-08-22', 'female', 'hindi', '{"time": "2:15 PM", "place": "Delhi", "coordinates": {"lat": 28.6139, "lng": 77.2090}}'),
('user-3', 'astrologer@example.com', 'Pandit Sharma', '1975-12-10', 'male', 'hindi', '{"time": "6:00 AM", "place": "Varanasi", "coordinates": {"lat": 25.3176, "lng": 82.9739}}');

-- Create sample astrologer
INSERT INTO astrologers (id, user_id, bio, experience, expertise, languages, price_per_minute_chat, price_per_minute_call, available, rating, total_reviews) VALUES 
('astro-1', 'user-3', 'Experienced Vedic astrologer with 15+ years of practice. Specializes in career guidance, relationship counseling, and spiritual healing.', 15, ARRAY['vedic', 'numerology', 'palmistry'], ARRAY['hindi', 'english'], 25, 35, true, 4.5, 150);

-- Create sample wallet transactions
INSERT INTO wallet_transactions (id, user_id, type, source, amount, remarks, balance_after) VALUES 
('txn-1', 'user-1', 'credit', 'razorpay', 1000, 'Wallet recharge via Razorpay', 1000),
('txn-2', 'user-2', 'credit', 'razorpay', 500, 'Wallet recharge via Razorpay', 500);

-- Update user wallet balances
UPDATE users SET wallet_balance = 1000 WHERE id = 'user-1';
UPDATE users SET wallet_balance = 500 WHERE id = 'user-2';

-- Create sample reviews
INSERT INTO reviews (id, user_id, astrologer_id, rating, review, service_type, service_id) VALUES 
('review-1', 'user-1', 'astro-1', 5, 'Excellent guidance and very accurate predictions. Highly recommended!', 'chat', 'chat-sample-1'),
('review-2', 'user-2', 'astro-1', 4, 'Good consultation, helped me understand my career path better.', 'call', 'call-sample-1');
