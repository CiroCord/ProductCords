import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "../../../styles/auth.css";
import { Link } from 'react-router-dom';
import { useUser } from "./UserContext";

const Auth = () => {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    fechaNacimiento: "",
  });

  const location = useLocation();
  // Inicializamos el estado basándonos en lo que recibimos del Link (si existe)
  const [isRightPanelActive, setIsRightPanelActive] = useState(location.state?.isSignUp || false);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState(""); // Mensajes de éxito o error
  const [messageType, setMessageType] = useState("danger"); // Tipo de alerta (success, danger, warning)
  const navigate = useNavigate();
  const { refreshUser } = useUser() || {}; // Manejo seguro si no está el provider aún

  // Este efecto asegura que si cambias entre login/registro desde el mismo link, se actualice
  useEffect(() => {
    if (location.state?.isSignUp !== undefined) {
      setIsRightPanelActive(location.state.isSignUp);
    }

    if (location.state?.alert) {
      setMessage(location.state.alert.text);
      setMessageType(location.state.alert.type || "warning");
    }
  }, [location.state]);

  const changeSignIn = () => setIsRightPanelActive(false);
  const changeSignUp = () => setIsRightPanelActive(true);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const validatePassword = (password) => {
    return /[a-zA-Z]/.test(password) && /\d/.test(password);
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
  
    const newErrors = {};
    if (!validatePassword(formData.password)) {
      newErrors.password = "La contraseña debe incluir letras y números.";
    }
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Las contraseñas no coinciden.";
    }
  
    setErrors(newErrors);
  
    if (Object.keys(newErrors).length === 0) {
      try {
        const response = await fetch("http://localhost:5000/api/users/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            username: formData.username,
            email: formData.email,
            password: formData.password,
            fechaNacimiento: formData.fechaNacimiento,
          }),
        });
  
        if (!response.ok) {
          // Manejar errores de respuesta
          const errorData = await response.json();
          throw new Error(errorData.message || "Error en el registro.");
        }
  
        // Procesar la respuesta exitosa
        const result = await response.json();
        console.log(result);
        // Validar que `user` exista antes de acceder a `_id`
        if (result.user && result.user._id) {
          localStorage.setItem("user", JSON.stringify({ id: result.user._id }));
          setMessage("Registro exitoso, redirigiendo...");
          if (refreshUser) refreshUser();
          setMessageType("success");
          setTimeout(() => navigate("/"), 2000);
        } else {
          throw new Error("Respuesta del servidor inválida.");
        }
      } catch (error) {
        setMessage(error.message || "Error en el servidor. Intente nuevamente.");
        setMessageType("danger");
      }
    }
  };
  
  const handleSignIn = async (e) => {
    e.preventDefault();

    try {
        const response = await fetch("http://localhost:5000/api/users/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                credential: formData.email,
                password: formData.password,
            }),
        });

        const result = await response.json();

        if (response.ok) {
            // Guardar en localStorage el usuario y el token
            localStorage.setItem("user", JSON.stringify({
                id: result.user._id,
                username: result.user.username,
                email: result.user.email,
                isSpectator: result.user.isSpectator
            }));
            localStorage.setItem("token", result.token);

            setMessage("Inicio de sesión exitoso, redirigiendo...");
            if (refreshUser) refreshUser();
            setMessageType("success");
            setTimeout(() => navigate("/"), 2000);
        } else {
            setMessage(result.message || "Error al iniciar sesión.");
            setMessageType("danger");
        }
    } catch (error) {
        setMessage("Error en el servidor. Intente nuevamente.");
        setMessageType("danger");
    }
};

  return (
    <div className="log">
      <div
        className={`log-container ${
          isRightPanelActive ? "right-panel-active" : ""
        }`}
      >
        <div className="log-form-container log-sign-up-container">
          <form onSubmit={handleSignUp} className="log-form">
            <h1>Crea tu cuenta</h1>
            <span>o usa el mail para registrarte</span>
            <input
              type="text"
              placeholder="Name"
              name="username"
              value={formData.username}
              onChange={handleInputChange}
              className={errors.username ? "input-error" : ""}
              required
            />
            <input
              type="email"
              placeholder="Email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              className={errors.email ? "input-error" : ""}
              required
            />
            <div className="password-container">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                className={errors.password ? "input-error" : ""}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="show-password-btn"
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
            {errors.password && <p className="error-text">{errors.password}</p>}
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Confirm Password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleInputChange}
              className={errors.confirmPassword ? "input-error" : ""}
              required
            />
            {errors.confirmPassword && (
              <p className="error-text">{errors.confirmPassword}</p>
            )}
            <input
              type="date"
              placeholder="Fecha de Nacimiento"
              name="fechaNacimiento"
              value={formData.fechaNacimiento}
              onChange={handleInputChange}
              required
            />
            <button className="log-btn">Registrarse</button>
            <button type="button" className="mobile-toggle-btn" onClick={changeSignIn}>
              ¿Ya tienes cuenta? Inicia sesión
            </button>
          </form>
        </div>
        <div className="log-form-container log-sign-in-container">
          <form className="log-form" onSubmit={handleSignIn}>
            <h1>Inicia Sesión</h1>
            <span>o usa tu cuenta</span>
            <input
              type="email"
              placeholder="Email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              required
            />
            <input
              type="password"
              placeholder="Password"
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              required
            />
            <div className="forgot-pass-link">
              <Link to="/forgot-password">¿Olvidaste tu contraseña?</Link>
            </div>
            <button className="log-btn">Inicia Sesión</button>
            <button type="button" className="mobile-toggle-btn" onClick={changeSignUp}>
              ¿No tienes cuenta? Regístrate
            </button>
          </form>
        </div>
        <div className="log-overlay-container">
          <div className="log-overlay">
            <div className="log-overlay-panel log-overlay-left">
              <h1>Bienvenido Devuelta</h1>
              <p>
                Inicia Sesión para mantenerte conectado con nosotros
              </p>
              <button
                className="log-ghost log-btn"
                id="signIn"
                onClick={changeSignIn}
              >
                Iniciar Sesión
              </button>
            </div>
            <div className="log-overlay-panel log-overlay-right">
              <h1>Hola, bienvenido</h1>
              <p>Ingresa tu información personal para unirte a nosotros</p>
              <button
                className="log-ghost log-btn"
                id="signUp"
                onClick={changeSignUp}
              >
                Registrarse
              </button>
            </div>
          </div>
        </div>
      </div>
      {message && (
        <div className={`alert alert-${messageType} position-fixed bottom-0 start-50 translate-middle-x mb-4 shadow-lg`} role="alert" style={{ zIndex: 1050, minWidth: '320px', textAlign: 'center', borderRadius: '50px' }}>
          {message}
        </div>
      )}
    </div>
  );
};

export default Auth;
