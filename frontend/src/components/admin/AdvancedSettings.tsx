import React, { useState } from 'react';
import { adminApiService } from '../../services/adminApi';
import { useToast } from '../../hooks/useToast';

const AdvancedSettings: React.FC = () => {
  const [showResetModal, setShowResetModal] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const [isResetting, setIsResetting] = useState(false);
  const { showError, showSuccess } = useToast();

  const handleResetCatalog = async () => {
    if (!adminPassword.trim()) {
      showError('La contraseña de administrador es requerida');
      return;
    }

    try {
      setIsResetting(true);
      
      const response = await adminApiService.resetCatalog(adminPassword);
      
      if (response.success) {
        showSuccess('¡Catálogo reiniciado exitosamente! Todos los datos han sido eliminados.');
        setShowResetModal(false);
        setAdminPassword('');
        
        // Redirigir al dashboard después de un delay
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      } else {
        showError(response.message || 'Error al reiniciar el catálogo');
      }
    } catch (error: any) {
      console.error('Error resetting catalog:', error);
      showError(error.message || 'Error de conexión al reiniciar el catálogo');
    } finally {
      setIsResetting(false);
    }
  };

  const handleOpenResetModal = () => {
    setAdminPassword('');
    setShowResetModal(true);
  };

  const handleCloseResetModal = () => {
    setShowResetModal(false);
    setAdminPassword('');
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Configuración Avanzada</h2>
        <p className="text-gray-600">
          Configuraciones del sistema que requieren privilegios de administrador.
        </p>
      </div>

      {/* Configuraciones del Sistema */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <span className="text-blue-500 mr-2">⚙️</span>
            Configuraciones del Sistema
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            Configuraciones generales del sistema
          </p>
        </div>
        
        <div className="p-6">
          {/* Reinicio de Fábrica */}
          <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            <div>
              <h4 className="text-sm font-medium text-gray-900 flex items-center">
                <span className="text-red-500 mr-2">🔄</span>
                Reinicio de Fábrica
              </h4>
              <p className="text-sm text-gray-600 mt-1">
                Restaura el sistema a estado inicial eliminando todos los datos
              </p>
            </div>
            <button
              onClick={handleOpenResetModal}
              disabled={isResetting}
              className="bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200 flex items-center space-x-2"
            >
              {isResetting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Reiniciando...</span>
                </>
              ) : (
                <>
                  <span>🔄</span>
                  <span>Reiniciar</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Reset Confirmation Modal */}
      {showResetModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full">
            <div className="p-6">
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                  <svg className="w-6 h-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.728-.833-2.498 0L3.732 16c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    ⚠️ Confirmar Reinicio de Fábrica
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Esta acción es IRREVERSIBLE y eliminará todos los datos del sistema.
                  </p>
                  
                  <div className="mt-4 space-y-4">
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <h4 className="text-sm font-semibold text-red-800 mb-3">
                        ⚠️ Esta acción eliminará PERMANENTEMENTE:
                      </h4>
                      <ul className="text-sm text-red-700 space-y-1 ml-4">
                        <li>• Todos los stickers del catálogo</li>
                        <li>• Todas las categorías creadas</li>
                        <li>• Todas las imágenes subidas al servidor</li>
                        <li>• Todos los stickers personalizados temporales</li>
                      </ul>
                      <p className="text-sm text-red-800 mt-3 font-medium">
                        📝 Las categorías se restaurarán a valores predeterminados.
                      </p>
                      <p className="text-sm text-green-700 mt-2 font-medium">
                        ✅ Los precios y tamaños se mantendrán sin cambios.
                      </p>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Contraseña de Administrador *
                      </label>
                      <input
                        type="password"
                        value={adminPassword}
                        onChange={(e) => setAdminPassword(e.target.value)}
                        placeholder="Ingresa tu contraseña de administrador"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                        required
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Se requiere la contraseña para confirmar esta acción crítica
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 px-6 py-4 bg-gray-50 rounded-b-lg">
              <button
                onClick={handleCloseResetModal}
                disabled={isResetting}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleResetCatalog}
                disabled={isResetting || !adminPassword.trim()}
                className="px-4 py-2 rounded-lg text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 bg-red-600 text-white hover:bg-red-700 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isResetting ? (
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Reiniciando...</span>
                  </div>
                ) : (
                  "SÍ, REINICIAR CATÁLOGO"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdvancedSettings;