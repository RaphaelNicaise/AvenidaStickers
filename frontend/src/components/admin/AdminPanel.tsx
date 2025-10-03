import React, { useState, useEffect } from 'react';
import AdminLayout from './AdminLayout';
import AdminLogin from './AdminLogin';
import StickerManagement from './StickerManagement';
import SizesManagement from './SizesManagement';
import CategoryManagement from './CategoryManagement';
import AdminPersonalizedStickers from './AdminPersonalizedStickers';
import AdvancedSettings from './AdvancedSettings';
import { adminApiService } from '../../services/adminApi';

const Dashboard: React.FC<{ onSectionChange: (section: string) => void }> = ({ onSectionChange }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dashboardData, setDashboardData] = useState<any>(null);

  useEffect(() => {
    // Pequeño delay para asegurar que el token esté configurado
    const timer = setTimeout(() => {
      loadDashboard();
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await adminApiService.getDashboardStats();
      
      if (response.success) {
        setDashboardData(response.data);
      } else {
        setError('Error al cargar el dashboard');
      }
    } catch (err) {
      setError('Error de conexión con el servidor');
      console.error('Dashboard error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
        <span className="ml-3 text-primary-700">Cargando dashboard...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-700">{error}</p>
        <button 
          onClick={loadDashboard}
          className="mt-2 bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
        >
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Dashboard Stats */}
      {dashboardData && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h3 className="text-lg font-semibold text-gray-900">Total Stickers</h3>
            <p className="text-3xl font-bold text-primary-600 mt-2">
              {dashboardData.totalStickers || 0}
            </p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h3 className="text-lg font-semibold text-gray-900">Categorías</h3>
            <p className="text-3xl font-bold text-primary-600 mt-2">
              {dashboardData.totalCategories || 0}
            </p>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Acciones Rápidas</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button 
            onClick={() => onSectionChange('stickers')}
            className="p-4 bg-primary-50 hover:bg-primary-100 rounded-lg border-2 border-primary-300 text-primary-700 font-medium transition-colors"
          >
            Gestionar Stickers
          </button>
          
          <button 
            onClick={() => onSectionChange('categories')}
            className="p-4 bg-purple-50 hover:bg-purple-100 rounded-lg border-2 border-purple-300 text-purple-700 font-medium transition-colors"
          >
            Gestionar Categorías
          </button>
          
          <button 
            onClick={() => onSectionChange('sizes')}
            className="p-4 bg-green-50 hover:bg-green-100 rounded-lg border-2 border-green-300 text-green-700 font-medium transition-colors"
          >
            Configurar Tamaños
          </button>
        </div>
      </div>
    </div>
  );
};

const AdminPanel: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentSection, setCurrentSection] = useState('stickers');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Verificar si hay un token guardado y validar que funcione
    const savedToken = localStorage.getItem('adminToken');
    if (savedToken) {
      adminApiService.setToken(savedToken);
      // Validar el token haciendo una request de prueba
      validateToken();
    } else {
      setLoading(false);
    }
  }, []);

  const validateToken = async () => {
    try {
      // Hacer una llamada simple para validar que el token funciona
      await adminApiService.getDashboardStats();
      setIsAuthenticated(true);
    } catch (error) {
      console.error('Token inválido:', error);
      localStorage.removeItem('adminToken');
      adminApiService.setToken('');
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = (token: string) => {
    adminApiService.setToken(token);
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    adminApiService.setToken('');
    setIsAuthenticated(false);
    setCurrentSection('dashboard');
  };

  const renderCurrentSection = () => {
    switch (currentSection) {
      case 'dashboard':
        return <Dashboard onSectionChange={setCurrentSection} />;
      case 'stickers':
        return <StickerManagement />;
      case 'personalized':
        return <AdminPersonalizedStickers />;
      case 'categories':
        return <CategoryManagement />;
      case 'sizes':
        return <SizesManagement />;
      case 'advanced':
        return <AdvancedSettings />;
      default:
        return <Dashboard onSectionChange={setCurrentSection} />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-primary-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
          <p className="text-primary-700 font-medium">Cargando panel de administración...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <AdminLogin onLogin={handleLogin} />;
  }

  return (
    <AdminLayout
      currentSection={currentSection}
      onSectionChange={setCurrentSection}
      onLogout={handleLogout}
    >
      {renderCurrentSection()}
    </AdminLayout>
  );
};

export default AdminPanel;