import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase } from '../supabase.js';
import { api } from '../api.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [perfil, setPerfil] = useState(null);
  const [cargando, setCargando] = useState(true);

  const cargarPerfil = useCallback(async (s) => {
    if (!s) return setPerfil(null);
    try {
      setPerfil(await api.perfil());
    } catch {
      setPerfil({ email: s.user.email, rol: 'cliente', nombre: '' });
    }
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      setSession(data.session);
      await cargarPerfil(data.session);
      setCargando(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_evento, s) => {
      setSession(s);
      cargarPerfil(s);
    });
    return () => sub.subscription.unsubscribe();
  }, [cargarPerfil]);

  const valor = {
    session,
    perfil,
    setPerfil,
    cargando,
    esAdmin: perfil?.rol === 'admin',
    login: (email, password) => supabase.auth.signInWithPassword({ email, password }),
    registro: (email, password, nombre, telefono) =>
      supabase.auth.signUp({ email, password, options: { data: { nombre, telefono } } }),
    logout: () => supabase.auth.signOut(),
  };

  return <AuthContext.Provider value={valor}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
