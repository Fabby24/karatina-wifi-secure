CREATE OR REPLACE FUNCTION public.validate_academic_email()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NOT (NEW.email LIKE '%.ac.ke') THEN
    RAISE EXCEPTION 'Only academic emails ending in .ac.ke are allowed to register.';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER enforce_academic_email
  BEFORE INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_academic_email();