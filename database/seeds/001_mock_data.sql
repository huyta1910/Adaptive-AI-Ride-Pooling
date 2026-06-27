INSERT INTO users (id, email, full_name, role, status)
VALUES
  ('00000000-0000-0000-0000-000000000101', 'passenger@example.com', 'Sample Passenger', 'passenger', 'active'),
  ('00000000-0000-0000-0000-000000000102', 'driver@example.com', 'Sample Driver', 'driver', 'active')
ON CONFLICT (email) DO NOTHING;

INSERT INTO passengers (id, user_id, display_name)
VALUES
  ('00000000-0000-0000-0000-000000000201', '00000000-0000-0000-0000-000000000101', 'Sample Passenger')
ON CONFLICT (id) DO NOTHING;

INSERT INTO drivers (id, user_id, license_number, vehicle_label, availability_status)
VALUES
  ('00000000-0000-0000-0000-000000000301', '00000000-0000-0000-0000-000000000102', 'SAMPLE-LICENSE-001', 'Sample Vehicle', 'inactive')
ON CONFLICT (license_number) DO NOTHING;

INSERT INTO ride_pool_groups (id, status, origin_area, destination_area)
VALUES
  ('00000000-0000-0000-0000-000000000401', 'draft', 'Sample Origin', 'Sample Destination')
ON CONFLICT (id) DO NOTHING;

INSERT INTO weather_events (id, event_type, severity, location_label, observed_at)
VALUES
  ('00000000-0000-0000-0000-000000000501', 'sample', 'low', 'Sample Location', NOW())
ON CONFLICT (id) DO NOTHING;
