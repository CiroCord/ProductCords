import React, { useEffect, useState, useMemo } from 'react';
import axios from 'axios';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  BarChart, Bar, Legend, PieChart, Pie, Cell 
} from 'recharts';

const DashboardOverview = () => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('today'); // 'today', 'week', 'month', 'all'

  useEffect(() => {
    const initDashboard = async () => {
      try {
        // 1. Recopilación Automática: Generar/Actualizar datos de hoy al entrar
        await axios.post('http://localhost:5000/api/status/generate');

        // 2. Obtener historial para visualización
        const res = await axios.get('http://localhost:5000/api/status');
        const data = res.data;
        
        setHistory(data);
      } catch (error) {
        console.error("Error inicializando dashboard:", error);
      } finally {
        setLoading(false);
      }
    };
    initDashboard();
  }, []);

  // --- LÓGICA DE AGREGACIÓN Y FILTRADO ---
  const { displayStats, displayChart } = useMemo(() => {
    if (!history.length) return { displayStats: null, displayChart: [] };

    const now = new Date();
    now.setHours(23, 59, 59, 999); // Final del día actual
    let startDate = new Date(now);

    // Definir fecha de inicio según el rango
    if (timeRange === 'today') startDate.setHours(0, 0, 0, 0);
    else if (timeRange === 'week') startDate.setDate(now.getDate() - 7);
    else if (timeRange === 'month') startDate.setMonth(now.getMonth() - 1);
    else if (timeRange === 'all') startDate = new Date(0); // Inicio de los tiempos

    // 1. Filtrar historial
    const filtered = history.filter(item => {
      const date = new Date(item.date);
      return date >= startDate && date <= now;
    });

    if (!filtered.length) return { displayStats: null, displayChart: [] };

    // 2. Agregar datos (Sumar ventas, combinar productos, promediar snapshots)
    const aggregated = filtered.reduce((acc, curr) => {
      // Sumas directas
      acc.totalRevenue += curr.totalRevenue || 0;
      acc.totalOrders += curr.totalOrders || 0;
      acc.newUsers += curr.newUsers || 0;
      
      // Snapshots (Sumamos para luego promediar)
      acc.potentialCartRevenue += curr.potentialCartRevenue || 0;
      acc.abandonedCartsCount += curr.abandonedCartsCount || 0;

      // Combinar Productos Top
      curr.topProducts?.forEach(p => {
        const id = p.product || p.name; // Usar ID o Nombre como clave
        if (!acc.products[id]) acc.products[id] = { ...p, quantity: 0, revenue: 0 };
        acc.products[id].quantity += p.quantity;
        acc.products[id].revenue += p.revenue;
      });

      // Combinar Categorías
      curr.categorySales?.forEach(c => {
        if (!acc.categories[c.category]) acc.categories[c.category] = { ...c, revenue: 0, count: 0 };
        acc.categories[c.category].revenue += c.revenue;
        acc.categories[c.category].count += (c.count || 0);
      });

      return acc;
    }, { totalRevenue: 0, totalOrders: 0, newUsers: 0, potentialCartRevenue: 0, abandonedCartsCount: 0, products: {}, categories: {} });

    const count = filtered.length || 1;

    const finalStats = {
      totalRevenue: aggregated.totalRevenue,
      totalOrders: aggregated.totalOrders,
      averageOrderValue: aggregated.totalOrders > 0 ? aggregated.totalRevenue / aggregated.totalOrders : 0,
      newUsers: aggregated.newUsers,
      // Para métricas de "estado actual" (carritos), mostramos el promedio del periodo
      potentialCartRevenue: aggregated.potentialCartRevenue / count,
      abandonedCartsCount: Math.round(aggregated.abandonedCartsCount / count),
      
      topProducts: Object.values(aggregated.products).sort((a, b) => b.revenue - a.revenue).slice(0, 5),
      categorySales: Object.values(aggregated.categories)
    };

    return { displayStats: finalStats, displayChart: filtered };
  }, [history, timeRange]);

  if (loading) return <div className="p-5 text-center text-muted">Analizando inteligencia de negocio...</div>;
  if (!displayStats) return <div className="p-5 text-center text-muted">No hay datos suficientes para este periodo.</div>;

  // --- PREPARACIÓN DE DATOS ---
  const chartData = displayChart.map(item => ({
      name: new Date(item.date).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' }),
      Ventas: item.totalRevenue,
      Pedidos: item.totalOrders
  }));

  const categoryData = displayStats.categorySales || [];
  const topProducts = displayStats.topProducts || [];
  
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];
  const formatCurrency = (val) => `$${Number(val).toFixed(2)}`;

  return (
    <div className="container-fluid p-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="fw-bold text-dark m-0">Inteligencia de Negocio</h2>
        <select className="form-select form-select-sm w-auto shadow-sm border-primary" value={timeRange} onChange={(e) => setTimeRange(e.target.value)}>
            <option value="today">Hoy</option>
            <option value="week">Última Semana</option>
            <option value="month">Último Mes</option>
            <option value="all">Histórico Completo</option>
        </select>
      </div>
      
      {/* KPI Cards */}
      <div className="row g-3 mb-4">
        <div className="col-md-3">
          <div className="card border-0 shadow-sm h-100 border-start border-4 border-primary">
            <div className="card-body">
              <h6 className="text-muted text-uppercase small fw-bold">Ingresos ({timeRange === 'today' ? 'Hoy' : 'Total'})</h6>
              <h3 className="mb-0 fw-bold text-primary">{formatCurrency(displayStats.totalRevenue)}</h3>
              <small className="text-muted">{displayStats.totalOrders} pedidos procesados</small>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card border-0 shadow-sm h-100 border-start border-4 border-success">
            <div className="card-body">
              <h6 className="text-muted text-uppercase small fw-bold">Ticket Promedio</h6>
              <h3 className="mb-0 fw-bold text-success">{formatCurrency(displayStats.averageOrderValue)}</h3>
              <small className="text-muted">Por pedido realizado</small>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card border-0 shadow-sm h-100 border-start border-4 border-info">
            <div className="card-body">
              <h6 className="text-muted text-uppercase small fw-bold">Nuevos Usuarios</h6>
              <h3 className="mb-0 fw-bold text-info">{displayStats.newUsers}</h3>
              <small className="text-muted">Registrados en periodo</small>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card border-0 shadow-sm h-100 border-start border-4 border-warning">
            <div className="card-body">
              <h6 className="text-muted text-uppercase small fw-bold">Oportunidad {timeRange !== 'today' && '(Promedio)'}</h6>
              <h3 className="mb-0 fw-bold text-warning">{formatCurrency(displayStats.potentialCartRevenue)}</h3>
              <small className="text-muted">~{displayStats.abandonedCartsCount} carritos activos</small>
            </div>
          </div>
        </div>
      </div>

      {/* Gráficos */}
      <div className="row g-4">
        {/* Gráfico de Evolución */}
        <div className="col-lg-8 mb-4">
          <div className="card shadow-sm border-0 h-100">
            <div className="card-header bg-white fw-bold border-0 py-3">Evolución de Ingresos</div>
            <div className="card-body">
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorVentas" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0088FE" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#0088FE" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip formatter={(value) => formatCurrency(value)} />
                  <Legend />
                  <Area type="monotone" dataKey="Ventas" stroke="#0088FE" fillOpacity={1} fill="url(#colorVentas)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Gráfico de Categorías (Pie) */}
        <div className="col-lg-4 mb-4">
          <div className="card shadow-sm border-0 h-100">
            <div className="card-header bg-white fw-bold border-0 py-3">Ventas por Categoría</div>
            <div className="card-body">
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    fill="#8884d8"
                    paddingAngle={5}
                    dataKey="revenue"
                    nameKey="category"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => formatCurrency(value)} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* Tabla de Productos Top */}
      <div className="row">
        <div className="col-12">
          <div className="card shadow-sm border-0">
            <div className="card-header bg-white fw-bold border-0 py-3">Top Productos del Periodo</div>
            <div className="card-body p-0">
              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0">
                  <thead className="bg-light">
                    <tr>
                      <th className="border-0 ps-4">Producto</th>
                      <th className="border-0">Unidades Vendidas</th>
                      <th className="border-0">Ingresos Generados</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topProducts.length > 0 ? topProducts.map((prod, idx) => (
                      <tr key={idx}>
                        <td className="ps-4 fw-bold">{prod.name}</td>
                        <td>{prod.quantity}</td>
                        <td className="text-success fw-bold">{formatCurrency(prod.revenue)}</td>
                      </tr>
                    )) : (
                      <tr><td colSpan="3" className="text-center py-4 text-muted">Sin ventas registradas en este periodo</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardOverview;
