-- =====================================================
-- RENDRE user_id NULLABLE SUR TOUTES LES TABLES
-- =====================================================

-- On rend user_id nullable sur TOUTES les tables qui l'ont
-- Si une table n'a pas user_id, l'erreur sera ignorée

DO $$
BEGIN
    -- patients
    BEGIN
        ALTER TABLE patients ALTER COLUMN user_id DROP NOT NULL;
        RAISE NOTICE 'patients.user_id -> nullable ✓';
    EXCEPTION WHEN undefined_column THEN
        RAISE NOTICE 'patients: pas de colonne user_id';
    END;

    -- appointments
    BEGIN
        ALTER TABLE appointments ALTER COLUMN user_id DROP NOT NULL;
        RAISE NOTICE 'appointments.user_id -> nullable ✓';
    EXCEPTION WHEN undefined_column THEN
        RAISE NOTICE 'appointments: pas de colonne user_id';
    END;

    -- invoices
    BEGIN
        ALTER TABLE invoices ALTER COLUMN user_id DROP NOT NULL;
        RAISE NOTICE 'invoices.user_id -> nullable ✓';
    EXCEPTION WHEN undefined_column THEN
        RAISE NOTICE 'invoices: pas de colonne user_id';
    END;

    -- recurring_invoices
    BEGIN
        ALTER TABLE recurring_invoices ALTER COLUMN user_id DROP NOT NULL;
        RAISE NOTICE 'recurring_invoices.user_id -> nullable ✓';
    EXCEPTION WHEN undefined_column THEN
        RAISE NOTICE 'recurring_invoices: pas de colonne user_id';
    END;

    -- expenses
    BEGIN
        ALTER TABLE expenses ALTER COLUMN user_id DROP NOT NULL;
        RAISE NOTICE 'expenses.user_id -> nullable ✓';
    EXCEPTION WHEN undefined_column THEN
        RAISE NOTICE 'expenses: pas de colonne user_id';
    END;

    -- sessions
    BEGIN
        ALTER TABLE sessions ALTER COLUMN user_id DROP NOT NULL;
        RAISE NOTICE 'sessions.user_id -> nullable ✓';
    EXCEPTION WHEN undefined_column THEN
        RAISE NOTICE 'sessions: pas de colonne user_id';
    END;

    -- sms_logs
    BEGIN
        ALTER TABLE sms_logs ALTER COLUMN user_id DROP NOT NULL;
        RAISE NOTICE 'sms_logs.user_id -> nullable ✓';
    EXCEPTION WHEN undefined_column THEN
        RAISE NOTICE 'sms_logs: pas de colonne user_id';
    END;

    -- survey_responses
    BEGIN
        ALTER TABLE survey_responses ALTER COLUMN user_id DROP NOT NULL;
        RAISE NOTICE 'survey_responses.user_id -> nullable ✓';
    EXCEPTION WHEN undefined_column THEN
        RAISE NOTICE 'survey_responses: pas de colonne user_id';
    END;

    -- goals
    BEGIN
        ALTER TABLE goals ALTER COLUMN user_id DROP NOT NULL;
        RAISE NOTICE 'goals.user_id -> nullable ✓';
    EXCEPTION WHEN undefined_column THEN
        RAISE NOTICE 'goals: pas de colonne user_id';
    END;

    -- loyalty_cards
    BEGIN
        ALTER TABLE loyalty_cards ALTER COLUMN user_id DROP NOT NULL;
        RAISE NOTICE 'loyalty_cards.user_id -> nullable ✓';
    EXCEPTION WHEN undefined_column THEN
        RAISE NOTICE 'loyalty_cards: pas de colonne user_id';
    END;

    -- loyalty_transactions
    BEGIN
        ALTER TABLE loyalty_transactions ALTER COLUMN user_id DROP NOT NULL;
        RAISE NOTICE 'loyalty_transactions.user_id -> nullable ✓';
    EXCEPTION WHEN undefined_column THEN
        RAISE NOTICE 'loyalty_transactions: pas de colonne user_id';
    END;

    -- referrals
    BEGIN
        ALTER TABLE referrals ALTER COLUMN user_id DROP NOT NULL;
        RAISE NOTICE 'referrals.user_id -> nullable ✓';
    EXCEPTION WHEN undefined_column THEN
        RAISE NOTICE 'referrals: pas de colonne user_id';
    END;

    -- promotions
    BEGIN
        ALTER TABLE promotions ALTER COLUMN user_id DROP NOT NULL;
        RAISE NOTICE 'promotions.user_id -> nullable ✓';
    EXCEPTION WHEN undefined_column THEN
        RAISE NOTICE 'promotions: pas de colonne user_id';
    END;

    -- appointment_requests
    BEGIN
        ALTER TABLE appointment_requests ALTER COLUMN user_id DROP NOT NULL;
        RAISE NOTICE 'appointment_requests.user_id -> nullable ✓';
    EXCEPTION WHEN undefined_column THEN
        RAISE NOTICE 'appointment_requests: pas de colonne user_id';
    END;

    -- notifications
    BEGIN
        ALTER TABLE notifications ALTER COLUMN user_id DROP NOT NULL;
        RAISE NOTICE 'notifications.user_id -> nullable ✓';
    EXCEPTION WHEN undefined_column THEN
        RAISE NOTICE 'notifications: pas de colonne user_id';
    END;

END $$;

-- Afficher un message de succès
SELECT 'user_id rendu nullable sur toutes les tables ✓' as status;
