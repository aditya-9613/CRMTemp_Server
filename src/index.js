import dotenv from "dotenv";
// import { createSupabaseClient } from "./config/supabaseClient.js";
import { app } from "./app.js";

dotenv.config({
    path: "./.env",
});

try {
    // const supabase = createSupabaseClient(); // No .then() — it's not async

    // // Make supabase accessible app-wide
    // app.set("supabase", supabase);

    app.on("error", (error) => {
        console.log("Error", error);
        throw error;
    });

    const port = process.env.PORT || 8000;
    app.listen(port, () => {
        console.log(`⚙️  Server is running at port: ${port}`);
    });

} catch (err) {
    console.log("Supabase initialization failed: ", err);
    process.exit(1);
}