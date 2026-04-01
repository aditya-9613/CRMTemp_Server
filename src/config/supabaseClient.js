import { createClient } from "@supabase/supabase-js";

const createSupabaseClient = () => {
    try {
        if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
            throw new Error("SUPABASE_URL or SUPABASE_ANON_KEY is missing in .env");
        }
        const supabase = createClient(
            process.env.SUPABASE_URL,
            process.env.SUPABASE_ANON_KEY
        );

        console.log(`\nSupabase connected !! HOST: ${process.env.SUPABASE_URL}`);
        return supabase;
    } catch (error) {
        console.log("Supabase connection FAILED ", error);
        process.exit(1);
    }
};

export {
    createSupabaseClient
};