-- Allow public read access to all events
CREATE POLICY "Enable read access for all users"
ON public.events
FOR SELECT
USING (true);

-- Allow public insert access
CREATE POLICY "Enable insert for all users"
ON public.events
FOR INSERT
WITH CHECK (true);

-- Allow public update access
CREATE POLICY "Enable update for all users"
ON public.events
FOR UPDATE
USING (true)
WITH CHECK (true);

-- Allow public delete access
CREATE POLICY "Enable delete for all users"
ON public.events
FOR DELETE
USING (true);
