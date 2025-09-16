-- Rename all tables to start with anaji prefix

-- Rename nana_* tables
ALTER TABLE IF EXISTS nana_customers RENAME TO anaji_customers;
ALTER TABLE IF EXISTS nana_admin_users RENAME TO anaji_admin_users;
ALTER TABLE IF EXISTS nana_categories RENAME TO anaji_categories;
ALTER TABLE IF EXISTS nana_foods RENAME TO anaji_foods;
ALTER TABLE IF EXISTS nana_orders RENAME TO anaji_orders;
ALTER TABLE IF EXISTS nana_order_items RENAME TO anaji_order_items;
ALTER TABLE IF EXISTS nana_profiles RENAME TO anaji_profiles;
ALTER TABLE IF EXISTS nana_chats RENAME TO anaji_chats;
ALTER TABLE IF EXISTS nana_chat_messages RENAME TO anaji_chat_messages;

-- Rename sms_* tables
ALTER TABLE IF EXISTS sms_templates RENAME TO anaji_sms_templates;
ALTER TABLE IF EXISTS sms_campaigns RENAME TO anaji_sms_campaigns;
ALTER TABLE IF EXISTS sms_campaign_recipients RENAME TO anaji_sms_campaign_recipients;

-- Rename other tables
ALTER TABLE IF EXISTS messages RENAME TO anaji_messages;
ALTER TABLE IF EXISTS message_recipients RENAME TO anaji_message_recipients;
ALTER TABLE IF EXISTS message_groups RENAME TO anaji_message_groups;
ALTER TABLE IF EXISTS members RENAME TO anaji_members;
ALTER TABLE IF EXISTS groups RENAME TO anaji_groups;
ALTER TABLE IF EXISTS admins RENAME TO anaji_admins;
ALTER TABLE IF EXISTS customer_presence RENAME TO anaji_customer_presence;
ALTER TABLE IF EXISTS ejcon_admins RENAME TO anaji_ejcon_admins;