import React, { useState } from 'react';
import { Package, Plus, Edit, Trash2, AlertTriangle, TrendingUp, ShoppingCart, X, Save, Search, DollarSign } from 'lucide-react';

interface Product {
  id: number;
  name: string;
  category: 'Huiles' | 'Crèmes' | 'Bandages' | 'Accessoires' | 'Suppléments' | 'Autre';
  stock: number;
  minStock: number;
  price: number;
  cost: number;
  supplier: string;
  barcode?: string;
}

const ProductsInventory: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([
    {
      id: 1,
      name: 'Huile de Massage Arnica',
      category: 'Huiles',
      stock: 8,
      minStock: 5,
      price: 18,
      cost: 10,
      supplier: 'Pranarom'
    },
    {
      id: 2,
      name: 'Crème Anti-Inflammatoire',
      category: 'Crèmes',
      stock: 3,
      minStock: 5,
      price: 25,
      cost: 15,
      supplier: 'Weleda'
    },
    {
      id: 3,
      name: 'Bandes Adhésives K-Tape',
      category: 'Bandages',
      stock: 15,
      minStock: 10,
      price: 12,
      cost: 7,
      supplier: 'Kinesio'
    },
    {
      id: 4,
      name: 'Rouleau Massage Fascia',
      category: 'Accessoires',
      stock: 5,
      minStock: 3,
      price: 35,
      cost: 20,
      supplier: 'TriggerPoint'
    },
    {
      id: 5,
      name: 'Complément Articulaire Cheval',
      category: 'Suppléments',
      stock: 12,
      minStock: 8,
      price: 45,
      cost: 28,
      supplier: 'Equistro'
    }
  ]);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('ALL');
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const categories: Array<Product['category']> = ['Huiles', 'Crèmes', 'Bandages', 'Accessoires', 'Suppléments', 'Autre'];

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.supplier.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === 'ALL' || p.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const lowStockProducts = products.filter(p => p.stock <= p.minStock);

  const stats = {
    total: products.length,
    lowStock: lowStockProducts.length,
    totalValue: products.reduce((sum, p) => sum + (p.stock * p.cost), 0),
    potentialRevenue: products.reduce((sum, p) => sum + (p.stock * p.price), 0)
  };

  const handleCreate = () => {
    setEditingProduct({
      id: Date.now(),
      name: '',
      category: 'Huiles',
      stock: 0,
      minStock: 5,
      price: 0,
      cost: 0,
      supplier: ''
    });
    setShowModal(true);
  };

  const handleEdit = (product: Product) => {
    setEditingProduct({ ...product });
    setShowModal(true);
  };

  const handleSave = () => {
    if (!editingProduct) return;

    const exists = products.find(p => p.id === editingProduct.id);
    if (exists) {
      setProducts(products.map(p => p.id === editingProduct.id ? editingProduct : p));
    } else {
      setProducts([...products, editingProduct]);
    }

    setShowModal(false);
    setEditingProduct(null);
  };

  const handleDelete = (id: number) => {
    if (confirm('Supprimer ce produit ?')) {
      setProducts(products.filter(p => p.id !== id));
    }
  };

  const adjustStock = (id: number, quantity: number) => {
    setProducts(products.map(p =>
      p.id === id ? { ...p, stock: Math.max(0, p.stock + quantity) } : p
    ));
  };

  return (
    <div className="space-y-6 pb-24">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent flex items-center">
            <Package size={32} className="mr-3 text-green-600" />
            Gestion Stocks & Produits
          </h2>
          <p className="text-slate-500 text-sm mt-1">Catalogue et inventaire produits vendus</p>
        </div>

        <button
          onClick={handleCreate}
          className="px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg font-bold text-sm hover:shadow-lg transition-all flex items-center"
        >
          <Plus size={18} className="mr-2" /> Nouveau Produit
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-green-500 to-emerald-600 p-6 rounded-2xl text-white shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <Package size={24} />
            <span className="text-sm font-medium opacity-90">Produits</span>
          </div>
          <h3 className="text-3xl font-bold">{stats.total}</h3>
          <p className="text-sm opacity-90 mt-1">références</p>
        </div>

        <div className="bg-gradient-to-br from-red-500 to-pink-600 p-6 rounded-2xl text-white shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <AlertTriangle size={24} />
            <span className="text-sm font-medium opacity-90">Alerte Stock</span>
          </div>
          <h3 className="text-3xl font-bold">{stats.lowStock}</h3>
          <p className="text-sm opacity-90 mt-1">à réapprovisionner</p>
        </div>

        <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-6 rounded-2xl text-white shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <DollarSign size={24} />
            <span className="text-sm font-medium opacity-90">Valeur Stock</span>
          </div>
          <h3 className="text-3xl font-bold">{stats.totalValue.toFixed(0)}€</h3>
          <p className="text-sm opacity-90 mt-1">coût d'achat</p>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-pink-600 p-6 rounded-2xl text-white shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <TrendingUp size={24} />
            <span className="text-sm font-medium opacity-90">CA Potentiel</span>
          </div>
          <h3 className="text-3xl font-bold">{stats.potentialRevenue.toFixed(0)}€</h3>
          <p className="text-sm opacity-90 mt-1">si vente totale</p>
        </div>
      </div>

      {/* Low Stock Alert */}
      {lowStockProducts.length > 0 && (
        <div className="bg-gradient-to-r from-red-50 to-orange-50 border-l-4 border-red-500 p-4 rounded-xl">
          <div className="flex items-center">
            <AlertTriangle size={24} className="text-red-600 mr-3" />
            <div className="flex-1">
              <h4 className="font-bold text-red-900">⚠️ Réapprovisionnement Nécessaire</h4>
              <p className="text-sm text-red-700">
                {lowStockProducts.length} produit(s) sous le seuil minimum :
                {' '}
                <span className="font-bold">
                  {lowStockProducts.map(p => p.name).join(', ')}
                </span>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Rechercher un produit ou fournisseur..."
            className="w-full pl-10 p-3 bg-white border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-green-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-green-500"
        >
          <option value="ALL">Toutes catégories</option>
          {categories.map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gradient-to-r from-green-50 to-emerald-50 text-slate-600 font-bold">
              <tr>
                <th className="p-4 text-left">Produit</th>
                <th className="p-4 text-center">Catégorie</th>
                <th className="p-4 text-center">Stock</th>
                <th className="p-4 text-right">Prix Vente</th>
                <th className="p-4 text-right">Coût</th>
                <th className="p-4 text-right">Marge</th>
                <th className="p-4 text-left">Fournisseur</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredProducts.map((product) => {
                const isLowStock = product.stock <= product.minStock;
                const margin = product.price - product.cost;
                const marginPercent = product.price > 0 ? ((margin / product.price) * 100) : 0;

                return (
                  <tr
                    key={product.id}
                    className={`hover:bg-green-50/30 transition-colors ${isLowStock ? 'bg-red-50/30' : ''}`}
                  >
                    <td className="p-4">
                      <div className="font-bold text-slate-800">{product.name}</div>
                      {product.barcode && (
                        <div className="text-xs text-slate-500 font-mono">{product.barcode}</div>
                      )}
                    </td>
                    <td className="p-4 text-center">
                      <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold">
                        {product.category}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => adjustStock(product.id, -1)}
                          className="w-6 h-6 bg-gray-200 hover:bg-gray-300 rounded-full flex items-center justify-center font-bold text-xs"
                        >
                          −
                        </button>
                        <span className={`px-3 py-1 rounded-full font-bold ${isLowStock ? 'bg-red-100 text-red-700 animate-pulse' : 'bg-gray-100 text-slate-700'
                          }`}>
                          {product.stock}
                        </span>
                        <button
                          onClick={() => adjustStock(product.id, 1)}
                          className="w-6 h-6 bg-green-200 hover:bg-green-300 rounded-full flex items-center justify-center font-bold text-xs"
                        >
                          +
                        </button>
                      </div>
                      {isLowStock && (
                        <div className="text-[10px] text-red-600 font-bold mt-1">
                          ⚠️ Min: {product.minStock}
                        </div>
                      )}
                    </td>
                    <td className="p-4 text-right font-bold text-slate-700">
                      {product.price.toFixed(2)} €
                    </td>
                    <td className="p-4 text-right text-slate-600">
                      {product.cost.toFixed(2)} €
                    </td>
                    <td className="p-4 text-right">
                      <div className="font-bold text-green-700">
                        +{margin.toFixed(2)} €
                      </div>
                      <div className="text-[10px] text-slate-500">
                        {marginPercent.toFixed(0)}%
                      </div>
                    </td>
                    <td className="p-4 text-slate-600">
                      {product.supplier}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleEdit(product)}
                          className="p-2 hover:bg-blue-50 rounded-lg transition-colors"
                        >
                          <Edit size={16} className="text-blue-600" />
                        </button>
                        <button
                          onClick={() => handleDelete(product.id)}
                          className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 size={16} className="text-red-600" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create/Edit Modal */}
      {showModal && editingProduct && (
        <div className="fixed inset-0 bg-black/60 z-[70] flex items-center justify-center p-4">
          <div className="bg-white rounded-xl w-full max-w-md">
            <div className="bg-gradient-to-r from-green-600 to-emerald-600 p-4 text-white flex justify-between items-center">
              <h3 className="font-bold text-lg">
                {products.find(p => p.id === editingProduct.id) ? 'Modifier Produit' : 'Nouveau Produit'}
              </h3>
              <button onClick={() => setShowModal(false)}>
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Nom du Produit</label>
                <input
                  type="text"
                  className="w-full p-2.5 border border-gray-300 rounded-lg text-sm"
                  value={editingProduct.name}
                  onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Catégorie</label>
                  <select
                    className="w-full p-2.5 border border-gray-300 rounded-lg text-sm"
                    value={editingProduct.category}
                    onChange={(e) => setEditingProduct({ ...editingProduct, category: e.target.value as any })}
                  >
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Fournisseur</label>
                  <input
                    type="text"
                    className="w-full p-2.5 border border-gray-300 rounded-lg text-sm"
                    value={editingProduct.supplier}
                    onChange={(e) => setEditingProduct({ ...editingProduct, supplier: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Prix Vente (€)</label>
                  <input
                    type="number"
                    step="0.01"
                    className="w-full p-2.5 border border-gray-300 rounded-lg text-sm"
                    value={editingProduct.price}
                    onChange={(e) => setEditingProduct({ ...editingProduct, price: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Coût Achat (€)</label>
                  <input
                    type="number"
                    step="0.01"
                    className="w-full p-2.5 border border-gray-300 rounded-lg text-sm"
                    value={editingProduct.cost}
                    onChange={(e) => setEditingProduct({ ...editingProduct, cost: parseFloat(e.target.value) || 0 })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Stock Actuel</label>
                  <input
                    type="number"
                    className="w-full p-2.5 border border-gray-300 rounded-lg text-sm"
                    value={editingProduct.stock}
                    onChange={(e) => setEditingProduct({ ...editingProduct, stock: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Stock Minimum</label>
                  <input
                    type="number"
                    className="w-full p-2.5 border border-gray-300 rounded-lg text-sm"
                    value={editingProduct.minStock}
                    onChange={(e) => setEditingProduct({ ...editingProduct, minStock: parseInt(e.target.value) || 0 })}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Code-barres (optionnel)</label>
                <input
                  type="text"
                  className="w-full p-2.5 border border-gray-300 rounded-lg text-sm font-mono"
                  value={editingProduct.barcode || ''}
                  onChange={(e) => setEditingProduct({ ...editingProduct, barcode: e.target.value })}
                />
              </div>

              {editingProduct.price > 0 && editingProduct.cost > 0 && (
                <div className="bg-green-50 p-3 rounded-lg text-sm">
                  <div className="font-bold text-green-900">Marge Calculée</div>
                  <div className="text-green-700">
                    +{(editingProduct.price - editingProduct.cost).toFixed(2)} €
                    {' '}
                    ({(((editingProduct.price - editingProduct.cost) / editingProduct.price) * 100).toFixed(0)}%)
                  </div>
                </div>
              )}

              <button
                onClick={handleSave}
                disabled={!editingProduct.name || editingProduct.price === 0}
                className="w-full py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg font-bold hover:shadow-lg transition-all disabled:opacity-50 flex items-center justify-center"
              >
                <Save size={18} className="mr-2" />
                Enregistrer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductsInventory;
