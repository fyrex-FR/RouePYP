-- Migration : suppression de spot_price de la table draws
-- À exécuter dans l'éditeur SQL Supabase si la table existe déjà

alter table draws drop column if exists spot_price;
