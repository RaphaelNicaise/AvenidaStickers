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
