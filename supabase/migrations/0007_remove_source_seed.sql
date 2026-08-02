-- Retire le seed automatique de sources/catégories à la création d'un
-- compte : un nouvel utilisateur doit démarrer avec des listes vides
-- (l'UI propose des suggestions en placeholder à la place de vraies lignes
-- en base, pour éviter toute confusion avec les données d'une autre
-- utilisatrice).
drop trigger if exists on_auth_user_created_defaults on auth.users;
drop function if exists public.handle_new_user_defaults();
