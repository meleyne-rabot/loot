-- Migration : transforme les anciennes sources Lesly, Aurele et Ulysse en Malles.
-- À exécuter APRÈS les migrations 0008 et 0009.
--
-- Ce script :
--   1. Crée les 3 malles (si elles n'existent pas encore)
--   2. Réassigne les items de chaque source vers la malle correspondante
--   3. Ne supprime PAS les sources — tu peux les supprimer manuellement
--      depuis Paramètres > Sources & Tags une fois que tu as vérifié la migration.
--
-- Remplace 'meleyne@gmail.com' par ton adresse si besoin.

DO $$
DECLARE
  v_user_id        uuid;
  v_lesly_src      uuid;
  v_aurele_src     uuid;
  v_ulysse_src     uuid;
  v_lesly_malle    uuid;
  v_aurele_malle   uuid;
  v_ulysse_malle   uuid;
BEGIN
  -- Récupère l'ID utilisatrice
  SELECT id INTO v_user_id FROM auth.users WHERE email = 'meleyne@gmail.com';
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Utilisatrice introuvable. Vérifie l''adresse email.';
  END IF;

  -- --- LESLIE ---
  SELECT id INTO v_lesly_src FROM sources WHERE user_id = v_user_id AND lower(nom) ILIKE 'lesli%' OR (user_id = v_user_id AND lower(nom) ILIKE 'leslie%') LIMIT 1;

  INSERT INTO malles (nom, user_id, commission_pct, description)
  VALUES ('Leslie', v_user_id, 0, 'Articles de Leslie')
  ON CONFLICT DO NOTHING;

  SELECT id INTO v_lesly_malle FROM malles WHERE user_id = v_user_id AND nom = 'Leslie' LIMIT 1;

  IF v_lesly_malle IS NOT NULL AND v_lesly_src IS NOT NULL THEN
    UPDATE items SET malle_id = v_lesly_malle WHERE source_id = v_lesly_src AND user_id = v_user_id;
    RAISE NOTICE 'Leslie : % articles migrés', (SELECT count(*) FROM items WHERE malle_id = v_lesly_malle AND user_id = v_user_id);
  ELSE
    RAISE NOTICE 'Leslie : source ou malle introuvable (source_id=%, malle_id=%)', v_lesly_src, v_lesly_malle;
  END IF;

  -- --- AURÈLE ---
  SELECT id INTO v_aurele_src FROM sources WHERE user_id = v_user_id AND lower(nom) ILIKE 'aur_le%' LIMIT 1;

  INSERT INTO malles (nom, user_id, commission_pct, description)
  VALUES ('Aurèle', v_user_id, 0, 'Articles d''Aurèle')
  ON CONFLICT DO NOTHING;

  SELECT id INTO v_aurele_malle FROM malles WHERE user_id = v_user_id AND nom = 'Aurèle' LIMIT 1;

  IF v_aurele_malle IS NOT NULL AND v_aurele_src IS NOT NULL THEN
    UPDATE items SET malle_id = v_aurele_malle WHERE source_id = v_aurele_src AND user_id = v_user_id;
    RAISE NOTICE 'Aurèle : % articles migrés', (SELECT count(*) FROM items WHERE malle_id = v_aurele_malle AND user_id = v_user_id);
  ELSE
    RAISE NOTICE 'Aurèle : source ou malle introuvable (source_id=%, malle_id=%)', v_aurele_src, v_aurele_malle;
  END IF;

  -- --- ULYSSE ---
  SELECT id INTO v_ulysse_src FROM sources WHERE user_id = v_user_id AND lower(nom) ILIKE 'ulysse%' LIMIT 1;

  INSERT INTO malles (nom, user_id, commission_pct, description)
  VALUES ('Ulysse', v_user_id, 0, 'Articles d''Ulysse')
  ON CONFLICT DO NOTHING;

  SELECT id INTO v_ulysse_malle FROM malles WHERE user_id = v_user_id AND nom = 'Ulysse' LIMIT 1;

  IF v_ulysse_malle IS NOT NULL AND v_ulysse_src IS NOT NULL THEN
    UPDATE items SET malle_id = v_ulysse_malle WHERE source_id = v_ulysse_src AND user_id = v_user_id;
    RAISE NOTICE 'Ulysse : % articles migrés', (SELECT count(*) FROM items WHERE malle_id = v_ulysse_malle AND user_id = v_user_id);
  ELSE
    RAISE NOTICE 'Ulysse : source ou malle introuvable (source_id=%, malle_id=%)', v_ulysse_src, v_ulysse_malle;
  END IF;
END $$;
