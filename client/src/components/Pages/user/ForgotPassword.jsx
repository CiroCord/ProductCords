import React, { useState } from 'react';
import axios from 'axios';

const ForgotPassword = () => {
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage('');
        setError('');
        
        try {
            // Ajusta la URL al puerto de tu BACKEND (ej. 3000)
            const res = await axios.post('http://localhost:5000/api/users/forgot-password', { email });
            setMessage(res.data.message);
        } catch (err) {
            setError(err.response?.data?.message || 'Error al enviar el correo.');
        }
    };
 
    return (
        <div style={{ maxWidth: '400px', margin: '50px auto', textAlign: 'center' }}>
            <h2>Recuperar Contraseña</h2>
            <p>Ingresa tu correo electrónico para recibir un enlace de recuperación.</p>
            
            <form onSubmit={handleSubmit}>
                <input
                    type="email"
                    placeholder="tuemail@ejemplo.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    style={{ width: '100%', padding: '10px', margin: '10px 0' }}
                />
                <button type="submit" class='btn btn-primary'>
                    Enviar Enlace
                </button>
            </form>

            {message && <p style={{ color: 'green', marginTop: '10px' }}>{message}</p>}
            {error && <p style={{ color: 'red', marginTop: '10px' }}>{error}</p>}
        </div>
    );
};

export default ForgotPassword;
