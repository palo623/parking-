import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase } from '../supabase.js';
import { api } from '../api.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [perfil, setPerfil] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [recuperando, setRecuperando] = useState(false);

  const cargarPerfil = useCallback(async (s) => {
    if (!s) return setPerfil(null);
    try {
      setPerfil(await api.perfil());
    } catch {
      setPerfil({ email: s.user.email, rol: 'cliente', nombre: s.user.user_metadata?.nombre || '' });
    }
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      setSession(data.session);
      await cargarPerfil(data.session);
      setCargando(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((evento, s) => {
      if (evento === 'PASSWORD_RECOVERY') setRecuperando(true);
      setSession(s);
      // Se aplaza para no bloquear el callback de Supabase
      setTimeout(() => cargarPerfil(s), 0);
    });
    return () => sub.subscription.unsubscribe();
  }, [cargarPerfil]);

  const valor = {
    session,
    perfil,
    setPerfil,
    cargando,
    recuperando,
    setRecuperando,
    esAdmin: perfil?.rol === 'admin',
    nombreVisible: perfil?.nombre || session?.user?.email?.split('@')[0] || '',
    login: (email, password) => supabase.auth.signInWithPassword({ email, password }),
    registro: (email, password, nombre, telefono) =>
      supabase.auth.signUp({
        email,
        password,
        options: { data: { nombre, telefono }, emailRedirectTo: window.location.origin },
      }),
    enviarRecuperacion: (email) =>
      supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/nueva-contrasena` }),
    cambiarContrasena: (password) => supabase.auth.updateUser({ password }),
    logout: () => supabase.auth.signOut(),
  };

  return <AuthContext.Provider value={valor}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
