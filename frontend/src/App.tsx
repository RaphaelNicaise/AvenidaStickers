import { useState, useEffect } from 'react';
import { Home } from './components/Home';
import { StickersCatalog } from './components/StickersCatalog';
import { CartComponent } from './components/Cart';
import { AddStickerForm } from './components/AddStickerForm';
import AdminPanel from './components/admin/AdminPanel';
import PersonalizedStickerForm from './components/PersonalizedStickerForm';
import { apiService } from './services/api';
import type { Sticker, Cart, PersonalizedSticker, StickerSize, CartItem } from './types';
import { calculateTotalPrice } from './utils/priceCalculator';
import './App.css';

function App() {
  const [currentView, setCurrentView] = useState<'home' | 'catalog' | 'cart' | 'add-sticker' | 'admin'>('home');
  // Estado del carrito
  const [cart, setCart] = useState<Cart>({ items: [], totalItems: 0, totalPrice: 0 });

  // Debug: Log cart changes
  useEffect(() => {
    console.log('🛒 Cart state updated:', cart);
  }, [cart]);
  const [stickerSizes, setStickerSizes] = useState<StickerSize[]>([]);
  const [showPersonalizedForm, setShowPersonalizedForm] = useState(false);

  // Detectar si la URL contiene rutas específicas
  useEffect(() => {
    const checkRoute = () => {
      const path = window.location.pathname;
      if (path === '/agregar_sticker' || path === '/agregar_sticker/') {
        setCurrentView('add-sticker');
      } else if (path === '/admin' || path === '/admin/') {
        setCurrentView('admin');
      }
    };
    
    checkRoute();
  }, []);

  // Escuchar cambios en la URL
  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname;
      if (path === '/agregar_sticker' || path === '/agregar_sticker/') {
        setCurrentView('add-sticker');
      } else if (path === '/' || path === '') {
        setCurrentView('home');
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Cargar medidas disponibles al iniciar
  useEffect(() => {
    loadStickerSizes();
  }, []);

  const loadStickerSizes = async () => {
    try {
      console.log('📏 Loading sticker sizes from backend...');
      const response = await apiService.getStickerSizes();
      console.log('📏 Sticker sizes loaded:', response.data?.sizes);
      setStickerSizes(response.data?.sizes || []);
    } catch (error) {
      console.error('Error loading sticker sizes:', error);
    }
  };

  const handleViewCatalog = () => {
    setCurrentView('catalog');
  };

  const handleViewCart = () => {
    setCurrentView('cart');
  };

  const handleBackToHome = () => {  
    setCurrentView('home');
  };

  const handleBackToCatalog = () => {
    setCurrentView('catalog');
    // Actualizar la URL
    window.history.pushState({}, '', '/catalog');
  };

  // Función para abrir modal de stickers personalizados
  const handleCreatePersonalizedSticker = () => {
    setShowPersonalizedForm(true);
  };

  // Función para manejar cuando se crea un sticker personalizado
  const handlePersonalizedStickerCreated = (personalizedSticker: PersonalizedSticker) => {
    // Por defecto, agregar con tamaño medium si está disponible, o el primer tamaño disponible
    const defaultSize = stickerSizes.find(size => size.id === 'medium') || stickerSizes[0];
    
    if (defaultSize) {
      const cartItem = {
        id: `personalized-${personalizedSticker._id}-${Date.now()}`,
        sticker: personalizedSticker,
        size: defaultSize,
        quantity: 1,
        totalPrice: calculateTotalPrice(defaultSize, 1, true), // Aplicar 20% de incremento
        isPersonalized: true
      };

      const updatedItems = [...cart.items, cartItem];
      const totalItems = updatedItems.reduce((sum, item) => sum + item.quantity, 0);
      const totalPrice = updatedItems.reduce((sum, item) => sum + item.totalPrice, 0);

      setCart({
        ...cart,
        items: updatedItems,
        totalItems,
        totalPrice,
      });

      // Ir al carrito para mostrar el nuevo item
      setCurrentView('cart');
    }
    
    setShowPersonalizedForm(false);
  };

    const handleAddToCart = async (sticker: Sticker, sizeId?: string, quantity?: number) => {
    console.log('🛒 handleAddToCart called with:', { sticker: sticker.id_sticker, sizeId, quantity });
    console.log('🛒 Current stickerSizes state:', stickerSizes);
    
    // Asegurar que las sizes estén cargadas
    if (!stickerSizes || stickerSizes.length === 0) {
      console.log('🛒 StickerSizes not loaded, loading them first...');
      await loadStickerSizes();
      console.log('🛒 StickerSizes loaded:', stickerSizes);
    }
    
    const selectedSizeId = sizeId || 'small'; // Default size
    const itemQuantity = quantity || 1;
    
    // Buscar información del tamaño
    const sizeInfo = stickerSizes?.find(s => s.id === selectedSizeId);
    console.log('🛒 Size info found:', sizeInfo);
    
    if (!sizeInfo) {
      console.error('🛒 Size info not found for:', selectedSizeId);
      console.error('Error: Información de tamaño no encontrada');
      return;
    }

    // Crear item del carrito según la estructura correcta
    const cartItem: CartItem = {
      id: `${sticker._id}-${selectedSizeId}`,
      sticker: sticker,
      size: sizeInfo,
      quantity: itemQuantity,
      totalPrice: sizeInfo.price * itemQuantity,
      isPersonalized: false
    };

    console.log('🛒 Cart item to add:', cartItem);

    setCart(prevCart => {
      const existingItemIndex = prevCart.items.findIndex(
        item => item.sticker._id === sticker._id && item.size.id === selectedSizeId
      );

      let newItems;
      if (existingItemIndex > -1) {
        console.log('🛒 Item already exists, updating quantity');
        newItems = [...prevCart.items];
        newItems[existingItemIndex].quantity += itemQuantity;
        newItems[existingItemIndex].totalPrice = newItems[existingItemIndex].size.price * newItems[existingItemIndex].quantity;
      } else {
        console.log('🛒 Adding new item to cart');
        newItems = [...prevCart.items, cartItem];
      }

      const newCart = {
        items: newItems,
        totalItems: newItems.reduce((sum, item) => sum + item.quantity, 0),
        totalPrice: newItems.reduce((sum, item) => sum + item.totalPrice, 0)
      };
      
      console.log('🛒 New cart state:', newCart);
      return newCart;
    });

    console.log('[SUCCESS] Sticker agregado al carrito');
  };

  const handleUpdateCart = (updatedCart: Cart) => {
    setCart(updatedCart);
  };

  return (
    <div className="min-h-screen">
      {currentView === 'home' && (
        <Home onViewCatalog={handleViewCatalog} />
      )}
      
      {currentView === 'catalog' && (
        <StickersCatalog 
          onBackToHome={handleBackToHome}
          onViewCart={handleViewCart}
          cartCount={cart.totalItems}
          onAddToCart={handleAddToCart}
          onCreatePersonalizedSticker={handleCreatePersonalizedSticker}
        />
      )}

      {currentView === 'cart' && (
        <CartComponent 
          loading={false}
          onBackToCatalog={handleBackToCatalog}
          cart={cart}
          onUpdateCart={handleUpdateCart}
          onAddToCart={handleAddToCart}
        />
      )}

      {currentView === 'add-sticker' && (
        <AddStickerForm 
          onBackToCatalog={handleBackToCatalog}
        />
      )}

      {currentView === 'admin' && (
        <AdminPanel />
      )}

      {/* Footer (solo mostrar en home) */}
      {currentView === 'home' && (
        <footer className="bg-white border-t border-primary-100 py-6 sm:py-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <div className="flex flex-col sm:flex-row justify-center items-center space-y-2 sm:space-y-0 sm:space-x-4 mb-4">
                <p className="text-primary-600 font-modern text-sm sm:text-base">
                  © 2025 Avenida Stickers. Todos los derechos reservados.
                </p>
                <span className="text-primary-300 hidden sm:inline">•</span>
                <a
                  href="https://www.instagram.com/av.stickerss/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center space-x-2 text-primary-600 hover:text-primary-700 transition-colors duration-200 group"
                >
                  <svg 
                    className="w-4 h-4 group-hover:scale-110 transition-transform duration-200" 
                    fill="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                  </svg>
                  <span className="text-sm font-medium">@av.stickerss</span>
                </a>
              </div>
            </div>
          </div>
        </footer>
      )}

      {/* Modal para stickers personalizados */}
      {showPersonalizedForm && (
        <PersonalizedStickerForm
          onStickerCreated={handlePersonalizedStickerCreated}
          onCancel={() => setShowPersonalizedForm(false)}
        />
      )}
    </div>
  );
}

export default App;
