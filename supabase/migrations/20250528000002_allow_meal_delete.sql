-- Allow authenticated users to delete meals (for testing)
CREATE POLICY "Enable delete for authenticated users"
ON public.meals
FOR DELETE
USING (auth.role() = 'authenticated'); 