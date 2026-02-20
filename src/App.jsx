import { useEffect, useState } from 'react';
import { supabase } from './Back/lib/supabase';
import AppRouter from './router/AppRouter';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {

    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null);
      setLoading(false);
    });

    const { data: listener } =
      supabase.auth.onAuthStateChange((_event, session) => {
        setUser(session?.user ?? null);
      });

    return () => {
      listener.subscription.unsubscribe();
    };

  }, []);

  if (loading) return <p>Cargando...</p>;

  return <AppRouter user={user} />;
}

export default App;
