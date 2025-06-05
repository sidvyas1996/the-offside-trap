import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL!
const supabaseAnonKey =  import.meta.env.VITE_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
        console.error('Error logging out:', error.message);
    } else {
        window.location.href = '/login';
    }
};

serve(async (req) => {
    const { event, user } = await req.json();

    if (event === 'signup' || event === 'login') {
        return new Response(
            JSON.stringify({
                // 👇 This will be injected into the user's JWT
                jwt: {
                    role: 'user',
                    user_id: user.id,
                    // Add custom claims here
                    custom_claim: 'some-value',
                },
            }),
            { headers: { 'Content-Type': 'application/json' } }
        );
    }

    return new Response('Unhandled event', { status: 400 });
});
