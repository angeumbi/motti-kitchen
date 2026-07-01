-- ==========================================
-- 1. Create sales table
-- ==========================================
CREATE TABLE IF NOT EXISTS public.sales (
    id SERIAL PRIMARY KEY,
    menu_title VARCHAR(255) NOT NULL,
    quantity INT NOT NULL,
    total_price INT NOT NULL,
    channel VARCHAR(50) DEFAULT 'web' NOT NULL,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- ==========================================
-- 2. Enable Row Level Security (RLS)
-- ==========================================
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;

-- ==========================================
-- 3. Setup Policies
-- ==========================================

-- Allow anyone to record sales data (Route Handlers insert on behalf of checkout operations)
DROP POLICY IF EXISTS "Anyone can insert sales data" ON public.sales;
CREATE POLICY "Anyone can insert sales data" 
    ON public.sales FOR INSERT 
    WITH CHECK (true);

-- Only admins are allowed to read/monitor store sales statistics
DROP POLICY IF EXISTS "Only admins can select sales data" ON public.sales;
CREATE POLICY "Only admins can select sales data" 
    ON public.sales FOR SELECT 
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
        )
    );
