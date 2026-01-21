import React, { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';

const UserContext = createContext();

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

export const UserProvider = ({ children }) => {
    // Inicializamos el estado leyendo directamente de localStorage para evitar retrasos
    const [user, setUser] = useState(() => {
        const stored = localStorage.getItem('user');
        return stored ? JSON.parse(stored) : null;
    });

    const [loading, setLoading] = useState(true);
    
    // Determinamos si es espectador desde el inicio (antes de llamar a la API)
    const [isSpectator, setIsSpectator] = useState(() => {
        const stored = localStorage.getItem('user');
        if (stored) {
            const u = JSON.parse(stored);
            return u.isSpectator || (u.username?.toLowerCase() === 'espectador' || u.email === 'espectador@example.com');
        }
        return false;
    });

    const fetchUser = async () => {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            try {
                const parsedUser = JSON.parse(storedUser);
                const userId = parsedUser.id || parsedUser._id;
                
                if (userId) {
                    // Buscamos los datos frescos del usuario por ID
                    const res = await axios.get(`${BACKEND_URL}/api/users/${userId}`);
                    setUser(res.data);
                    checkSpectator(res.data);
                } else {
                    setUser(parsedUser);
                }
            } catch (error) {
                console.error("Error cargando contexto de usuario:", error);
            }
        }
        setLoading(false);
    };

    const checkSpectator = (userData) => {
        if (userData && (userData.isSpectator || userData.username?.toLowerCase() === 'espectador' || userData.email === 'espectador@example.com')) {
            setIsSpectator(true);
        } else {
            setIsSpectator(false);
        }
    };

    useEffect(() => {
        fetchUser();
    }, []);

    const refreshUser = () => fetchUser();

    return (
        <UserContext.Provider value={{ user, loading, isSpectator, refreshUser }}>
            {children}
        </UserContext.Provider>
    );
};

export const useUser = () => useContext(UserContext);