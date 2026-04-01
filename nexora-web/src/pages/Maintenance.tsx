import { useEffect, useMemo, useState } from 'react';
import { itemsApi } from '../api/items';
import { branchesApi } from '../api/branches';
import { inventoryApi } from '../api/inventory';
import { categoriesApi } from '../api/categories';
import { itemGroupsApi } from '../api/itemGroups';
import { itemBrandsApi } from '../api/itemBrands';
import { itemOwnersApi } from '../api/itemOwners';
import { suppliersApi } from '../api/suppliers';

export default function Maintenance() {
  const [activeTab, setActiveTab] = useState<'items' | 'transfer'>('items');
  const [items, setItems] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [groups, setGroups] = useState<any[]>([]);
  const [brands, setBrands] = useState<any[]>([]);
  const [owners, setOwners] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  const [newItem, setNewItem] = useState({
    name: '',
    sku: '',
    groupId: 0,
    brandId: 0,
    model: '',
    description: '',
    costPrice: 0,
    basePrice: 0,
    salePrice: 0,
    wholesalePrice: 0,
    discountPercent: 0,
    promotionPercent: 0,
    ownerId: 0,
    providerId: 0,
    observations: '',
    imageUrl: '',
    categoryId: 0,
    isActive: true,
  });
  const [transferPayload, setTransferPayload] = useState({ itemId: 0, fromBranchId: 0, toBranchId: 0, quantity: 1 });

  useEffect(() => {
    loadAll();
  }, []);

  const loadAll = async () => {
    setLoading(true);
    try {
      const itemsResp = await itemsApi.list();
      setItems(itemsResp.data ?? itemsResp);
      const branchesResp = await branchesApi.list();
      setBranches(branchesResp.data ?? branchesResp);

      const groupsResp = await itemGroupsApi.list();
      setGroups(groupsResp.data ?? groupsResp);
      const brandsResp = await itemBrandsApi.list();
      setBrands(brandsResp.data ?? brandsResp);
      const ownersResp = await itemOwnersApi.list();
      setOwners(ownersResp.data ?? ownersResp);
      const suppliersResp = await suppliersApi.getAll(true);
      setSuppliers(suppliersResp.data ?? suppliersResp);
      const categoriesResp = await categoriesApi.list();
      setCategories(categoriesResp.data ?? categoriesResp);
    } catch (error: any) {
      setMessage(error.response?.data?.message || 'Error al cargar datos');
    } finally {
      setLoading(false);
    }
  };

  const filteredItems = useMemo(() => {
    return items.filter((item) => item.name.toLowerCase().includes(search.toLowerCase()));
  }, [items, search]);

  const uploadImageFile = async (file: File) => {
    setMessage(null);
    setUploadingImage(true);
    try {
      const res = await itemsApi.uploadImage(file);
      setNewItem((prev) => ({ ...prev, imageUrl: res.data.imageUrl }));
      setMessage('Imagen cargada exitosamente');
    } catch (error: any) {
      setMessage(error?.response?.data?.message || 'Error al subir imagen');
    } finally {
      setUploadingImage(false);
    }
  };

  const createItem = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setLoading(true);
    try {
      await itemsApi.create({
        name: newItem.name,
        sku: newItem.sku || undefined,
        groupId: newItem.groupId || undefined,
        brandId: newItem.brandId || undefined,
        model: newItem.model || undefined,
        description: newItem.description || undefined,
        costPrice: newItem.costPrice || undefined,
        basePrice: newItem.basePrice || undefined,
        salePrice: newItem.salePrice || undefined,
        wholesalePrice: newItem.wholesalePrice || undefined,
        discountPercent: newItem.discountPercent || undefined,
        promotionPercent: newItem.promotionPercent || undefined,
        ownerId: newItem.ownerId || undefined,
        providerId: newItem.providerId || undefined,
        observations: newItem.observations || undefined,
        imageUrl: newItem.imageUrl || undefined,
        categoryId: newItem.categoryId || undefined,
        isActive: newItem.isActive,
      });
      setNewItem({
        name: '',
        sku: '',
        groupId: 0,
        brandId: 0,
        model: '',
        description: '',
        costPrice: 0,
        basePrice: 0,
        salePrice: 0,
        wholesalePrice: 0,
        discountPercent: 0,
        promotionPercent: 0,
        ownerId: 0,
        providerId: 0,
        observations: '',
        imageUrl: '',
        categoryId: 0,
        isActive: true,
      });
      await loadAll();
      setMessage('Artículo creado correctamente');
    } catch (error: any) {
      setMessage(error.response?.data?.message || 'No se pudo crear artículo');
    } finally {
      setLoading(false);
    }
  };

  const transferItem = async () => {
    setMessage(null);
    setLoading(true);
    try {
      await inventoryApi.transfer(transferPayload);
      await loadAll();
      setMessage('Transferencia realizada correctamente');
    } catch (error: any) {
      setMessage(error.response?.data?.message || 'No se pudo transferir');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-3xl font-bold">Módulo de Mantenimiento</h1>

      <div className="flex gap-2">
        <button
          className={`btn ${activeTab === 'items' ? 'btn-primary' : 'btn-soft'}`}
          onClick={() => setActiveTab('items')}
        >
          Artículos
        </button>
        <button
          className={`btn ${activeTab === 'transfer' ? 'btn-primary' : 'btn-soft'}`}
          onClick={() => setActiveTab('transfer')}
        >
          Traslados
        </button>
      </div>

      {message && <div className="rounded-xl bg-indigo-600/20 text-indigo-100 p-2">{message}</div>}

      {activeTab === 'items' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="card p-4 lg:col-span-1">
            <h2 className="text-xl font-semibold mb-3">Crear artículo</h2>
            <form onSubmit={createItem} className="space-y-3">
              <select
                className="input"
                value={newItem.groupId}
                onChange={(e) => setNewItem((prev) => ({ ...prev, groupId: Number(e.target.value) }))}
              >
                <option value={0}>Grupo (opcional)</option>
                {groups.map((group) => (
                  <option key={group.id} value={group.id}>
                    {group.name}
                  </option>
                ))}
              </select>
              <select
                className="input"
                value={newItem.brandId}
                onChange={(e) => setNewItem((prev) => ({ ...prev, brandId: Number(e.target.value) }))}
              >
                <option value={0}>Marca (opcional)</option>
                {brands.map((brand) => (
                  <option key={brand.id} value={brand.id}>
                    {brand.name}
                  </option>
                ))}
              </select>
              <select
                className="input"
                value={newItem.categoryId}
                onChange={(e) => setNewItem((prev) => ({ ...prev, categoryId: Number(e.target.value) }))}
              >
                <option value={0}>Categoría (requerido)</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
              <input
                className="input"
                placeholder="Nombre"
                value={newItem.name}
                onChange={(e) => setNewItem((prev) => ({ ...prev, name: e.target.value }))}
                required
              />
              <input
                className="input"
                placeholder="Modelo"
                value={newItem.model}
                onChange={(e) => setNewItem((prev) => ({ ...prev, model: e.target.value }))}
              />
              <input
                className="input"
                placeholder="Código (SKU)"
                value={newItem.sku}
                onChange={(e) => setNewItem((prev) => ({ ...prev, sku: e.target.value }))}
              />
              <textarea
                className="input"
                placeholder="Descripción"
                value={newItem.description}
                onChange={(e) => setNewItem((prev) => ({ ...prev, description: e.target.value }))}
              />
              <div className="grid grid-cols-2 gap-2">
                <input
                  className="input"
                  placeholder="Precio Costo"
                  type="number"
                  min={0}
                  step="0.01"
                  value={newItem.costPrice}
                  onChange={(e) => setNewItem((prev) => ({ ...prev, costPrice: Number(e.target.value) }))}
                />
                <input
                  className="input"
                  placeholder="Precio Venta"
                  type="number"
                  min={0}
                  step="0.01"
                  value={newItem.salePrice}
                  onChange={(e) => setNewItem((prev) => ({ ...prev, salePrice: Number(e.target.value) }))}
                />
                <input
                  className="input"
                  placeholder="Por Mayor"
                  type="number"
                  min={0}
                  step="0.01"
                  value={newItem.wholesalePrice}
                  onChange={(e) => setNewItem((prev) => ({ ...prev, wholesalePrice: Number(e.target.value) }))}
                />
                <input
                  className="input"
                  placeholder="% Descuento"
                  type="number"
                  min={0}
                  step="0.01"
                  value={newItem.discountPercent}
                  onChange={(e) => setNewItem((prev) => ({ ...prev, discountPercent: Number(e.target.value) }))}
                />
                <input
                  className="input"
                  placeholder="% Promoción"
                  type="number"
                  min={0}
                  step="0.01"
                  value={newItem.promotionPercent}
                  onChange={(e) => setNewItem((prev) => ({ ...prev, promotionPercent: Number(e.target.value) }))}
                />
              </div>
              <select
                className="input"
                value={newItem.ownerId}
                onChange={(e) => setNewItem((prev) => ({ ...prev, ownerId: Number(e.target.value) }))}
              >
                <option value={0}>Propietario (opcional)</option>
                {owners.map((owner) => (
                  <option key={owner.id} value={owner.id}>
                    {owner.name}
                  </option>
                ))}
              </select>
              <select
                className="input"
                value={newItem.providerId}
                onChange={(e) => setNewItem((prev) => ({ ...prev, providerId: Number(e.target.value) }))}
                required
              >
                <option value={0}>Proveedor (requerido)</option>
                {suppliers.map((supplier) => (
                  <option key={supplier.id} value={supplier.id}>
                    {supplier.name}
                  </option>
                ))}
              </select>
              <textarea
                className="input"
                placeholder="Observaciones"
                value={newItem.observations}
                onChange={(e) => setNewItem((prev) => ({ ...prev, observations: e.target.value }))}
              />

              <label className="block text-sm font-medium text-slate-200">Cargar imagen del artículo</label>
              <input
                type="file"
                accept="image/*"
                className="input"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  uploadImageFile(file);
                }}
              />
              {uploadingImage && <div className="text-xs text-slate-400">Subiendo imagen...</div>}

              <div className="flex items-center gap-2">
                <input
                  className="input"
                  placeholder="URL de imagen del artículo (opcional)"
                  value={newItem.imageUrl}
                  onChange={(e) => setNewItem((prev) => ({ ...prev, imageUrl: e.target.value }))}
                />
              </div>
              {newItem.imageUrl && (
                <img src={newItem.imageUrl} alt="preview" className="h-24 w-24 object-cover rounded mt-2" />
              )}
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={newItem.isActive}
                  onChange={(e) => setNewItem((prev) => ({ ...prev, isActive: e.target.checked }))}
                />
                <span>Activo</span>
              </div>
              <button className="btn-primary w-full" type="submit" disabled={loading}>
                {loading ? 'Guardando...' : 'Guardar artículo'}
              </button>
            </form>
          </div>

          <div className="card p-4 lg:col-span-2">
            <div className="flex justify-between items-center mb-3">
              <h2 className="text-xl font-semibold">Listado de Artículos</h2>
              <input
                className="input w-64"
                placeholder="Buscar..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="text-left text-sm text-slate-400 border-b border-slate-700">
                  <tr>
                    <th className="py-2">ID</th>
                    <th>Grupo</th>
                    <th>Marca</th>
                    <th>Modelo</th>
                    <th>Nombre</th>
                    <th>SKU</th>
                    <th>Costo</th>
                    <th>Venta</th>
                    <th>Por Mayor</th>
                    <th>%D</th>
                    <th>%P</th>
                    <th>Exist.</th>
                    <th>Activo</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredItems.map((item) => {
                    const existence = item.stocks?.reduce((sum: number, stock: any) => sum + Number(stock.quantity || 0), 0) ?? 0;
                    return (
                      <tr key={item.id} className="border-b border-slate-700 hover:bg-slate-900/30">
                        <td className="py-2">{item.id}</td>
                        <td>{item.group?.name || item.category?.name || '-'}</td>
                        <td>{item.brand?.name || '-'}</td>
                        <td>{item.model || '-'}</td>
                        <td className="flex items-center gap-2">
                          {item.imageUrl && <img src={item.imageUrl} alt="art" className="h-8 w-8 object-cover rounded" />}
                          {item.name}
                        </td>
                        <td>{item.sku || '-'}</td>
                        <td>${Number(item.costPrice ?? 0).toFixed(2)}</td>
                        <td>${Number(item.salePrice ?? item.basePrice ?? 0).toFixed(2)}</td>
                        <td>${Number(item.wholesalePrice ?? 0).toFixed(2)}</td>
                        <td>{Number(item.discountPercent ?? 0).toFixed(2)}%</td>
                        <td>{Number(item.promotionPercent ?? 0).toFixed(2)}%</td>
                        <td>{Number(existence).toFixed(2)}</td>
                        <td>{item.isActive ? 'A' : 'I'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'transfer' && (
        <div className="card p-4 space-y-4">
          <h2 className="text-xl font-semibold">Transferir artículo entre sucursales</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <select
              className="input"
              value={transferPayload.itemId}
              onChange={(e) => setTransferPayload((prev) => ({ ...prev, itemId: Number(e.target.value) }))}
            >
              <option value={0}>Selecciona artículo</option>
              {items.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
            <select
              className="input"
              value={transferPayload.fromBranchId}
              onChange={(e) => setTransferPayload((prev) => ({ ...prev, fromBranchId: Number(e.target.value) }))}
            >
              <option value={0}>Sucursal origen</option>
              {branches.map((branch) => (
                <option key={branch.id} value={branch.id}>
                  {branch.name}
                </option>
              ))}
            </select>
            <select
              className="input"
              value={transferPayload.toBranchId}
              onChange={(e) => setTransferPayload((prev) => ({ ...prev, toBranchId: Number(e.target.value) }))}
            >
              <option value={0}>Sucursal destino</option>
              {branches.map((branch) => (
                <option key={branch.id} value={branch.id}>
                  {branch.name}
                </option>
              ))}
            </select>
            <input
              className="input"
              type="number"
              min={1}
              value={transferPayload.quantity}
              onChange={(e) => setTransferPayload((prev) => ({ ...prev, quantity: Number(e.target.value) }))}
            />
          </div>
          <button className="btn-primary" disabled={loading || !transferPayload.itemId || !transferPayload.fromBranchId || !transferPayload.toBranchId || transferPayload.fromBranchId === transferPayload.toBranchId} onClick={transferItem}>
            {loading ? 'Procesando...' : 'Transferir'}
          </button>
          <p className="text-xs text-slate-400">Una vez transferido, los inventarios se ajustan desde la API de inventario.</p>
        </div>
      )}
    </div>
  );
}
