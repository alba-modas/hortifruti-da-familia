import type { Category, Product } from '@/lib/types';

// Mock data for initial development - will be replaced with Supabase queries
export const MOCK_CATEGORIES: Category[] = [
  { id: '1', name: 'Frutas', sort_order: 1 },
  { id: '2', name: 'Verduras', sort_order: 2 },
  { id: '3', name: 'Legumes', sort_order: 3 },
  { id: '4', name: 'Mercearia', sort_order: 4 },
  { id: '5', name: 'Rações / Pet', sort_order: 5 },
  { id: '6', name: 'Promoções do Dia', sort_order: 0 },
];

export const MOCK_PRODUCTS: Product[] = [
  { id: '1', name: 'Banana Prata', price: 5.99, unit: 'kg', category_id: '1', available: true, has_stock_control: false, is_promo: true, created_at: '', image_url: null },
  { id: '2', name: 'Maçã Fuji', price: 8.99, unit: 'kg', category_id: '1', available: true, has_stock_control: false, is_promo: false, created_at: '', image_url: null },
  { id: '3', name: 'Laranja Pêra', price: 4.99, unit: 'kg', category_id: '1', available: true, has_stock_control: false, is_promo: false, created_at: '', image_url: null },
  { id: '4', name: 'Manga Tommy', price: 6.99, unit: 'kg', category_id: '1', available: true, has_stock_control: false, is_promo: true, created_at: '', image_url: null },
  { id: '5', name: 'Alface Americana', price: 3.99, unit: 'unidade', category_id: '2', available: true, has_stock_control: true, stock_quantity: 5, stock_minimum: 3, is_promo: false, created_at: '', image_url: null },
  { id: '6', name: 'Couve Manteiga', price: 2.99, unit: 'maço', category_id: '2', available: true, has_stock_control: false, is_promo: false, created_at: '', image_url: null },
  { id: '7', name: 'Rúcula', price: 4.50, unit: 'maço', category_id: '2', available: true, has_stock_control: false, is_promo: false, created_at: '', image_url: null },
  { id: '8', name: 'Batata', price: 5.49, unit: 'kg', category_id: '3', available: true, has_stock_control: false, is_promo: false, created_at: '', image_url: null },
  { id: '9', name: 'Cenoura', price: 4.99, unit: 'kg', category_id: '3', available: true, has_stock_control: false, is_promo: false, created_at: '', image_url: null },
  { id: '10', name: 'Cebola', price: 3.99, unit: 'kg', category_id: '3', available: true, has_stock_control: false, is_promo: true, created_at: '', image_url: null },
  { id: '11', name: 'Arroz 5kg', price: 24.99, unit: 'pacote', category_id: '4', available: true, has_stock_control: true, stock_quantity: 20, stock_minimum: 5, is_promo: false, created_at: '', image_url: null },
  { id: '12', name: 'Feijão Carioca 1kg', price: 8.49, unit: 'pacote', category_id: '4', available: true, has_stock_control: true, stock_quantity: 15, stock_minimum: 5, is_promo: false, created_at: '', image_url: null },
  { id: '13', name: 'Ração Cão Adulto 15kg', price: 89.90, unit: 'pacote', category_id: '5', available: true, has_stock_control: true, stock_quantity: 3, stock_minimum: 2, is_promo: false, created_at: '', image_url: null },
  { id: '14', name: 'Tomate', price: 7.99, unit: 'kg', category_id: '3', available: false, has_stock_control: false, is_promo: false, created_at: '', image_url: null },
];
