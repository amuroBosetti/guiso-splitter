-- Add DELETE policy for meals table to allow event guests to delete proposed meals
CREATE POLICY "Enable delete for event guests on proposed meals"
ON public.meals
FOR DELETE
USING (
  status = 'proposed' AND
  EXISTS (
    SELECT 1 FROM public.event_guests
    JOIN public.user_profiles ON user_profiles.auth_id = auth.uid()
    WHERE event_guests.event_id = meals.event_id
    AND event_guests.user_id = user_profiles.id
  )
); 