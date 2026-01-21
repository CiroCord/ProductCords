import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useUser } from "./UserContext";

export default function EditProfile() {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        fechaNacimiento: '',
        provincia: '',
        localidad: '', 
        telefono: '',
        password: '',
        confirmPassword: ''
    });
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState(null);
    
    // Estados para verificación
    const [originalEmail, setOriginalEmail] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [verificationCode, setVerificationCode] = useState('');
    const [modalLoading, setModalLoading] = useState(false);
    const [actionType, setActionType] = useState('update'); // 'update' | 'delete'
    const { isSpectator, loading: userLoading } = useUser() || { isSpectator: false, loading: false };

    useEffect(() => {
        const fetchUser = async () => {
            // Obtenemos el ID del usuario logueado desde localStorage
            const storedUser = JSON.parse(localStorage.getItem('user'));
            
            if (!storedUser || !storedUser.id) {
                navigate('/login'); // Si no está logueado, mandar al login
                return;
            }

            try {
                const { data } = await axios.get(`http://localhost:5000/api/users/${storedUser.id}`);
                
                // Formatear fecha para que el input type="date" la reconozca (YYYY-MM-DD)
                const fecha = data.fechaNacimiento ? data.fechaNacimiento.split('T')[0] : '';
                
                setOriginalEmail(data.email || '');
                setFormData({
                    username: data.username || '',
                    email: data.email || '',
                    fechaNacimiento: fecha,
                    provincia: data.provincia || '',
                    localidad: data.localidad || '',
                    telefono: data.telefono || '',
                    password: '',
                    confirmPassword: ''
                });
            } catch (error) {
                console.error(error);
                setMessage({ type: 'danger', text: 'Error al cargar los datos del usuario.' });
            } finally {
                setLoading(false);
            }
        };
        fetchUser();
    }, [navigate]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage(null);

        // Verificación de Modo Espectador
        if (userLoading) {
            alert("Cargando permisos... Por favor espera un momento.");
            return;
        }
        if (isSpectator) {
            alert("Estás en modo espectador. No puedes modificar el perfil de esta cuenta de demostración.");
            return;
        }

        // Validación simple de contraseñas
        if (formData.password && formData.password !== formData.confirmPassword) {
            setMessage({ type: 'danger', text: 'Las contraseñas no coinciden.' });
            return;
        }

        // Detectar si hay cambios sensibles (Email o Password)
        const isSensitiveChange = (formData.email !== originalEmail) || (formData.password && formData.password.trim() !== '');

        if (isSensitiveChange) {
            // Si hay cambios sensibles, pedimos el código primero
            setActionType('update'); // Marcamos que la acción es actualizar
            try {
                const storedUser = JSON.parse(localStorage.getItem('user'));
                setModalLoading(true);
                // Solicitamos al backend que envíe el código
                await axios.post(`http://localhost:5000/api/users/request-verification/${storedUser.id}`);
                setShowModal(true); // Abrimos el modal
                setMessage(null);
            } catch (error) {
                setMessage({ type: 'danger', text: 'Error al solicitar código de verificación.' });
            } finally {
                setModalLoading(false);
            }
            return; // Detenemos el flujo aquí hasta que verifique
        }

        try {
            const storedUser = JSON.parse(localStorage.getItem('user'));
            
            // Preparamos los datos para enviar
            const updateData = { ...formData };
            
            // Si la contraseña está vacía, la quitamos para no sobreescribirla con vacío
            if (!updateData.password) delete updateData.password;
            delete updateData.confirmPassword;

            await axios.put(`http://localhost:5000/api/users/${storedUser.id}`, updateData);
            
            setMessage({ type: 'success', text: 'Perfil actualizado con éxito.' });
            
            // Actualizamos el localStorage por si cambió el nombre o email
            const newUser = { ...storedUser, username: formData.username, email: formData.email };
            localStorage.setItem('user', JSON.stringify(newUser));

        } catch (error) {
            setMessage({ type: 'danger', text: error.response?.data?.message || 'Error al actualizar.' });
        }
    };

    // Función para cerrar sesión
    const handleLogout = () => {
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        navigate('/login');
    };

    // Función para solicitar eliminación de cuenta
    const handleRequestDelete = async () => {
        // Verificación de Modo Espectador
        if (userLoading) {
            alert("Cargando permisos... Por favor espera un momento.");
            return;
        }
        if (isSpectator) {
            alert("Estás en modo espectador. No puedes eliminar esta cuenta.");
            return;
        }

        if (!window.confirm("¿Estás seguro de que quieres eliminar tu cuenta? Esta acción es irreversible.")) return;

        setActionType('delete'); // Marcamos que la acción es eliminar
        try {
            const storedUser = JSON.parse(localStorage.getItem('user'));
            setModalLoading(true);
            await axios.post(`http://localhost:5000/api/users/request-verification/${storedUser.id}`);
            setShowModal(true);
            setMessage(null);
        } catch (error) {
            setMessage({ type: 'danger', text: 'Error al solicitar código de verificación.' });
        } finally {
            setModalLoading(false);
        }
    };

    // Función para confirmar eliminación con código
    const handleVerifyAndDelete = async () => {
        try {
            const storedUser = JSON.parse(localStorage.getItem('user'));
            // En axios.delete, el body va dentro de la propiedad 'data'
            await axios.delete(`http://localhost:5000/api/users/${storedUser.id}`, {
                data: { verificationCode }
            });
            
            alert("Tu cuenta ha sido eliminada.");
            handleLogout(); // Limpiamos storage y redirigimos
        } catch (error) {
            alert(error.response?.data?.message || 'Código incorrecto');
        }
    };

    // Función que se ejecuta al confirmar el código en el modal
    const handleVerifyAndSave = async () => {
        try {
            const storedUser = JSON.parse(localStorage.getItem('user'));
            const updateData = { ...formData, verificationCode }; // Incluimos el código
            
            if (!updateData.password) delete updateData.password;
            delete updateData.confirmPassword;

            await axios.put(`http://localhost:5000/api/users/${storedUser.id}`, updateData);
            
            setMessage({ type: 'success', text: 'Perfil verificado y actualizado con éxito.' });
            setShowModal(false);
            setVerificationCode('');
            
            // Actualizar originalEmail si cambió
            setOriginalEmail(formData.email);

            const newUser = { ...storedUser, username: formData.username, email: formData.email };
            localStorage.setItem('user', JSON.stringify(newUser));

        } catch (error) {
            // Si falla (código incorrecto), mostramos error pero no cerramos el modal necesariamente, o sí.
            alert(error.response?.data?.message || 'Código incorrecto');
        }
    };

    if (loading) return <div className="text-center mt-5"><div className="spinner-border text-primary" role="status"></div></div>;

    return (
        <div className="container mt-8 mb-5">
            <div className="row justify-content-center">
                <div className="col-md-8 col-lg-8">
                    <div className="card shadow">
                        <div className="card-header bg-primary text-white text-center py-3">
                            <h3 className="mb-0">Editar Perfil</h3>
                        </div>
                        <div className="card-body p-4">
                            
                            {message && (
                                <div className={`alert alert-${message.type} alert-dismissible fade show`} role="alert">
                                    {message.text}
                                    <button type="button" className="btn-close" onClick={() => setMessage(null)}></button>
                                </div>
                            )}
                            
                            <form onSubmit={handleSubmit}>
                                <div className="row">
                                    <div className="col-md-6 mb-3">
                                        <label className="form-label fw-bold">Usuario</label>
                                        <input 
                                            type="text" 
                                            className="form-control" 
                                            name="username" 
                                            value={formData.username} 
                                            onChange={handleChange} 
                                            required 
                                        />
                                    </div>
                                    <div className="col-md-6 mb-3">
                                        <label className="form-label fw-bold">Email</label>
                                        <input 
                                            type="email" 
                                            className="form-control" 
                                            name="email" 
                                            value={formData.email} 
                                            onChange={handleChange} 
                                            required 
                                        />
                                    </div>
                                </div>

                                <div className="row">
                                    <div className="col-md-6 mb-3">
                                        <label className="form-label fw-bold">Fecha de Nacimiento</label>
                                        <input 
                                            type="date" 
                                            className="form-control" 
                                            name="fechaNacimiento" 
                                            value={formData.fechaNacimiento} 
                                            onChange={handleChange} 
                                        />
                                    </div>
                                    <div className="col-md-6 mb-3">
                                        <label className="form-label fw-bold">Teléfono</label>
                                        <input 
                                            type="text" 
                                            className="form-control" 
                                            name="telefono" 
                                            value={formData.telefono} 
                                            onChange={handleChange} 
                                            placeholder="Ej: 11 1234 5678"
                                        />
                                    </div>
                                </div>

                                <div className="row">
                                    <div className="col-md-6 mb-3">
                                        <label className="form-label fw-bold">Provincia</label>
                                        <input 
                                            type="text" 
                                            className="form-control" 
                                            name="provincia" 
                                            value={formData.provincia} 
                                            onChange={handleChange} 
                                        />
                                    </div>
                                    <div className="col-md-6 mb-3">
                                        <label className="form-label fw-bold">Localidad</label>
                                        <input 
                                            type="text" 
                                            className="form-control" 
                                            name="localidad" 
                                            value={formData.localidad} 
                                            onChange={handleChange} 
                                        />
                                    </div>
                                </div>

                                <hr className="my-4" />
                                <h5 className="mb-3 text-muted">Cambiar Contraseña <small style={{fontSize: '0.8em'}}>(Opcional)</small></h5>

                                <div className="row">
                                    <div className="col-md-6 mb-3">
                                        <label className="form-label">Nueva Contraseña</label>
                                        <input 
                                            type="password" 
                                            className="form-control" 
                                            name="password" 
                                            value={formData.password} 
                                            onChange={handleChange} 
                                            placeholder="******" 
                                        />
                                    </div>
                                    <div className="col-md-6 mb-3">
                                        <label className="form-label">Confirmar Contraseña</label>
                                        <input 
                                            type="password" 
                                            className="form-control" 
                                            name="confirmPassword" 
                                            value={formData.confirmPassword} 
                                            onChange={handleChange} 
                                            placeholder="******" 
                                        />
                                    </div>
                                </div>

                                <div className="d-grid gap-2 mt-3">
                                    <button type="submit" className="btn btn-primary btn-lg">
                                        Guardar Cambios
                                    </button>
                                    <button type="button" className="btn btn-outline-secondary" onClick={() => navigate('/')}>
                                        Cancelar
                                    </button>
                                    <button type="button" className="btn btn-warning" onClick={handleLogout}>
                                        Cerrar Sesión
                                    </button>
                                </div>

                                <hr className="my-5" />
                                <div className="alert alert-danger">
                                    <h5 className="text-danger">Zona de Peligro</h5>
                                    <p className="mb-2">Una vez que elimines tu cuenta, no hay vuelta atrás. Por favor, tenlo en cuenta.</p>
                                    <button type="button" className="btn btn-danger" onClick={handleRequestDelete}>
                                        Eliminar Cuenta
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>

            {/* Modal de Verificación (Estilo Bootstrap manual) */}
            {showModal && (
                <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }} tabIndex="-1">
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">Verificación de Seguridad</h5>
                                <button type="button" className="btn-close" onClick={() => setShowModal(false)}></button>
                            </div>
                            <div className="modal-body">
                                <p>{actionType === 'delete' ? 'Has solicitado ELIMINAR tu cuenta.' : 'Has solicitado cambiar datos sensibles.'}</p>
                                <p>Hemos enviado un código a tu correo actual: <strong>{originalEmail}</strong></p>
                                <input type="text" className="form-control mt-3" placeholder="Ingresa el código de 6 dígitos" value={verificationCode} onChange={(e) => setVerificationCode(e.target.value)} />
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancelar</button>
                                <button type="button" className="btn btn-primary" onClick={actionType === 'delete' ? handleVerifyAndDelete : handleVerifyAndSave}>
                                    {actionType === 'delete' ? 'Confirmar Eliminación' : 'Verificar y Guardar'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
