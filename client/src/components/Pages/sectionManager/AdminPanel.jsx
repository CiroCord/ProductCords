import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "bootstrap/dist/css/bootstrap.min.css";
import { UserProvider } from "../user/UserContext";

// Importamos los sub-componentes
import DashboardOverview from "./DashboardOverview";
import ManageSections from "./ManageSections";
import ManageCategories from "./ManageCategories";
import ManageProducts from "./ManageProducts";
import ManageOrders from "./ManageOrders";
import ManageEspectacular from "./ManageEspectacular";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

const AdminPanel = () => {
  const [activeTab, setActiveTab] = useState("overview");
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [isHovered, setIsHovered] = useState(false);
  const navigate = useNavigate();

  const isExpanded = isSidebarOpen || isHovered;

  // Verificación de seguridad (opcional, pero recomendada)
  useEffect(() => {
    const verifyAdmin = async () => {
        const storedUser = localStorage.getItem("user");
        if (!storedUser) {
            navigate('/login');
            return;
        }
        const user = JSON.parse(storedUser);
        try {
            const res = await axios.get(`${BACKEND_URL}/api/users/admin-check/${user.id}`);
            if (!res.data.isAdmin) {
                navigate('/');
            }
        } catch (error) {
            navigate('/');
        }
    };
    verifyAdmin();
  }, [navigate]);

  const menuItems = [
    { id: 'overview', label: 'Resumen', icon: <path d="M8 4a.5.5 0 0 1 .5.5V6a.5.5 0 0 1-1 0V4.5A.5.5 0 0 1 8 4zM3.732 5.732a.5.5 0 0 1 .707 0l.915.914a.5.5 0 1 1-.708.708l-.914-.915a.5.5 0 0 1 0-.707zM2 10a.5.5 0 0 1 .5-.5h1.586a.5.5 0 0 1 0 1H2.5A.5.5 0 0 1 2 10zm9.5 0a.5.5 0 0 1 .5-.5h1.5a.5.5 0 0 1 0 1H12a.5.5 0 0 1-.5-.5zm.754-4.246a.389.389 0 0 0-.527-.02L7.547 9.31a.91.91 0 1 0 1.302 1.258l3.434-4.297a.389.389 0 0 0-.029-.518z"/> },
    { id: 'espectacular', label: 'Portada', icon: <path d="M6.002 5.5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0zM2.002 1a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V3a2 2 0 0 0-2-2h-12zm12 1a1 1 0 0 1 1 1v6.5l-3.777-1.947a.5.5 0 0 0-.577.093l-3.71 3.71-2.66-1.772a.5.5 0 0 0-.63.062L1.002 12V3a1 1 0 0 1 1-1h12z"/> },
    { id: 'products', label: 'Productos', icon: <path d="M8.186 1.113a.5.5 0 0 0-.372 0L1.846 3.5l2.404.961L10.404 2l-2.218-.887zm3.564 1.426L5.596 5 8 5.961 14.154 3.5l-2.404-.961zm3.25 1.7-6.5 2.6v7.922l6.5-2.6V4.24zM7.5 14.762V6.838L1 4.239v7.923l6.5 2.6zM7.443.184a1.5 1.5 0 0 1 1.114 0l7.129 2.852A.5.5 0 0 1 16 3.5v8.662a1 1 0 0 1-.629.928l-7.185 2.874a.5.5 0 0 1-.372 0L.63 13.09a1 1 0 0 1-.63-.928V3.5a.5.5 0 0 1 .314-.464L7.443.184z"/> },
    { id: 'sections', label: 'Secciones', icon: <path d="M1 2.5A1.5 1.5 0 0 1 2.5 1h3A1.5 1.5 0 0 1 7 2.5v3A1.5 1.5 0 0 1 5.5 7h-3A1.5 1.5 0 0 1 1 5.5v-3zm8 0A1.5 1.5 0 0 1 10.5 1h3A1.5 1.5 0 0 1 15 2.5v3A1.5 1.5 0 0 1 13.5 7h-3A1.5 1.5 0 0 1 9 5.5v-3zm-8 8A1.5 1.5 0 0 1 2.5 9h3A1.5 1.5 0 0 1 7 10.5v3A1.5 1.5 0 0 1 5.5 15h-3A1.5 1.5 0 0 1 1 13.5v-3zm8 0A1.5 1.5 0 0 1 10.5 9h3a1.5 1.5 0 0 1 1.5 1.5v3a1.5 1.5 0 0 1-1.5 1.5h-3A1.5 1.5 0 0 1 9 13.5v-3z"/> },
    { id: 'categories', label: 'Categorías', icon: <path d="M2 2a1 1 0 0 1 1-1h4.586a1 1 0 0 1 .707.293l7 7a1 1 0 0 1 0 1.414l-4.586 4.586a1 1 0 0 1-1.414 0l-7-7A1 1 0 0 1 2 6.586V2zm3.5 4a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z"/> },
    { id: 'orders', label: 'Pedidos', icon: <><path d="M14 14V4.5L9.5 0H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2zM9.5 3A1.5 1.5 0 0 0 11 4.5h2V14a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1h5.5v2z"/><path d="M4.5 10a.5.5 0 0 1 .5-.5h2a.5.5 0 0 1 0 1H5a.5.5 0 0 1-.5-.5zm0-2a.5.5 0 0 1 .5-.5h5a.5.5 0 0 1 0 1H5a.5.5 0 0 1-.5-.5zm0-2a.5.5 0 0 1 .5-.5h5a.5.5 0 0 1 0 1H5a.5.5 0 0 1-.5-.5z"/></> }
  ];

  // Renderizado condicional del contenido
  const renderContent = () => {
    switch (activeTab) {
      case "overview":
        return <DashboardOverview />;
      case "products":
        return <ManageProducts />;
      case "sections":
        return <ManageSections />;
      case "categories":
        return <ManageCategories />;
      case "orders":
        return <ManageOrders />;
      case "espectacular":
        return <ManageEspectacular />;
      default:
        return <DashboardOverview />;
    }
  };

  return (
    <UserProvider>
    <div className="d-flex flex-column flex-md-row" style={{ minHeight: "100vh", backgroundColor: "#f4f6f9" }}>
      
      {/* SIDEBAR (Desktop) */}
      <div 
        className={`d-none d-md-flex flex-column flex-shrink-0 p-3 text-white bg-dark ${isExpanded ? '' : 'text-center'}`} 
        style={{ width: isExpanded ? "280px" : "80px", transition: "width 0.3s", height: "100vh", position: "sticky", top: 0, zIndex: 1000, overflowX: 'hidden' }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className={`d-flex align-items-center mb-3 mb-md-0 text-white text-decoration-none w-100 ${isExpanded ? 'justify-content-between' : 'justify-content-center'}`}>
          {isExpanded && <span className="fs-4 fw-bold text-nowrap">Admin Panel</span>}
          <button className="btn btn-sm btn-outline-light" onClick={() => setSidebarOpen(!isSidebarOpen)}>
            {isSidebarOpen ? '❮' : '☰'}
          </button>
        </div>
        <hr />
        <ul className="nav nav-pills flex-column mb-auto gap-1">
          {menuItems.map(item => (
            <li className="nav-item" key={item.id}>
              <button 
                  className={`nav-link w-100 d-flex align-items-center ${activeTab === item.id ? 'active text-dark' : 'text-white'} ${isExpanded ? 'justify-content-start' : 'justify-content-center'}`} 
                  onClick={() => setActiveTab(item.id)}
                  title={item.label}
              >
                <svg className={`bi ${isExpanded ? 'me-2' : ''}`} width="16" height="16" fill="currentColor" viewBox="0 0 16 16">{item.icon}</svg>
                {isExpanded && <span className="text-nowrap">{item.label}</span>}
              </button>
            </li>
          ))}
        </ul>
        <hr />
        <div className="dropdown">
          <a href="#" className={`d-flex align-items-center text-white text-decoration-none dropdown-toggle ${isExpanded ? '' : 'justify-content-center'}`} id="dropdownUser1" data-bs-toggle="dropdown" aria-expanded="false">
            <img src="https://github.com/mdo.png" alt="" width="32" height="32" className={`rounded-circle ${isExpanded ? 'me-2' : ''}`} />
            {isExpanded && <strong>Admin</strong>}
          </a>
          <ul className="dropdown-menu dropdown-menu-dark text-small shadow" aria-labelledby="dropdownUser1">
            <li><a className="dropdown-item" href="/">Volver a la Tienda</a></li>
            <li><hr className="dropdown-divider" /></li>
            <li><button className="dropdown-item" onClick={() => navigate('/login')}>Cerrar Sesión</button></li>
          </ul>
        </div>
      </div>

      {/* BOTTOM NAV (Mobile) */}
      <div className="d-md-none fixed-bottom bg-dark text-white p-2 shadow-lg d-flex justify-content-around align-items-center" style={{zIndex: 1000, borderTop: '1px solid #444'}}>
        {menuItems.map(item => (
          <button 
            key={item.id}
            className={`btn btn-sm d-flex flex-column align-items-center ${activeTab === item.id ? 'text-info' : 'text-white-50'}`}
            onClick={() => setActiveTab(item.id)}
            style={{background: 'none', border: 'none'}}
          >
            <svg className="bi mb-1" width="20" height="20" fill="currentColor" viewBox="0 0 16 16">{item.icon}</svg>
            <span style={{fontSize: '0.65rem'}}>{item.label}</span>
          </button>
        ))}
      </div>

      {/* MAIN CONTENT */}
      <div className="flex-grow-1 d-flex flex-column pb-5 pb-md-0" style={{ minWidth: 0 }}>
        {/* Header Superior */}
        <header className="bg-white shadow-sm p-3 mb-4 d-flex justify-content-between align-items-center">
            <h4 className="m-0 text-capitalize">{activeTab}</h4>
            <div className="d-flex align-items-center">
                <span className="me-3 text-muted">Bienvenido al panel de control</span>
            </div>
        </header>

        {/* Contenido Dinámico */}
        <main className="flex-grow-1 overflow-auto">
            {renderContent()}
        </main>
      </div>
    </div>
    </UserProvider>
  );
};

export default AdminPanel;
