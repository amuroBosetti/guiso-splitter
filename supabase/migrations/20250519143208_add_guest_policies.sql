-- Allow public read access to users (for autocomplete, etc.)
CREATE POLICY "Allow public read access to users"
ON public.user_profiles
FOR SELECT
USING (true);

-- Allow users to insert into users
CREATE POLICY "Allow insert for users"
ON public.user_profiles
FOR INSERT
WITH CHECK (true);

-- Allow public read access to event_guests
CREATE POLICY "Allow public read access to event_guests"
ON public.event_guests
FOR SELECT
USING (true);

-- Allow users to insert into event_guests
CREATE POLICY "Allow insert for event guests"
ON public.event_guests
FOR INSERT
WITH CHECK (true);
