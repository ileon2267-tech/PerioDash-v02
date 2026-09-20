import React, { useState } from "react";
import { safeStorage } from "../utils/safeStorage";
import { 
  Package, 
  AlertTriangle, 
  Plus, 
  Minus, 
  Search, 
  Filter, 
  CheckCircle2, 
  Boxes, 
  Tag, 
  ArrowUpDown,
  RefreshCw,
  Archive
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export interface SupplyItem {
  id: string;
  name: string;
  category: "anestesia" | "quirurgico" | "operatoria" | "periodoncia" | "bioseguridad";
  currentStock: number;
  minAlertStock: number;
  unit: string; // e.g. "caja 50 un", "frasco 500ml", "jeringa 4g"
  location: string; // e.g. "Box 1", "Esterilización", "Gabinete Quirúrgico"
  costPerUnit: number;
}

const INITIAL_SUPPLIES: SupplyItem[] = [
  {
    id: "sup-01",
    name: "Articaína 4% con Epinefrina 1:100.000",
    category: "anestesia",
    currentStock: 4,
    minAlertStock: 10,
    unit: "caja 50 carpules",
    location: "Box 1 & Box 2",
    costPerUnit: 34500
  },
  {
    id: "sup-02",
    name: "Lidocaína 2% con Epinefrina 1:100.000",
    category: "anestesia",
    currentStock: 15,
    minAlertStock: 8,
    unit: "caja 50 carpules",
    location: "Almacén Central",
    costPerUnit: 26900
  },
  {
    id: "sup-03",
    name: "Sutura Polipropileno 5-0 / Aguja 16mm",
    category: "quirurgico",
    currentStock: 6,
    minAlertStock: 12,
    unit: "caja 12 sobres",
    location: "Gabinete Quirúrgico",
    costPerUnit: 42000
  },
  {
    id: "sup-04",
    name: "Sutura Ácido Poliglicólico (Vicryl) 4-0",
    category: "quirurgico",
    currentStock: 18,
    minAlertStock: 8,
    unit: "caja 12 sobres",
    location: "Gabinete Quirúrgico",
    costPerUnit: 48900
  },
  {
    id: "sup-05",
    name: "Matriz Ósea Particulada Bovina (0.5g)",
    category: "periodoncia",
    currentStock: 3,
    minAlertStock: 5,
    unit: "vial estéril 0.5cc",
    location: "Nevera Quirúrgica",
    costPerUnit: 79000
  },
  {
    id: "sup-06",
    name: "Membrana de Colágeno Reabsorbible 15x20mm",
    category: "periodoncia",
    currentStock: 2,
    minAlertStock: 4,
    unit: "sobre individual",
    location: "Nevera Quirúrgica",
    costPerUnit: 89000
  },
  {
    id: "sup-07",
    name: "Composite Restaurador Nanohíbrido A2",
    category: "operatoria",
    currentStock: 8,
    minAlertStock: 5,
    unit: "jeringa 4g",
    location: "Box 1",
    costPerUnit: 38000
  },
  {
    id: "sup-08",
    name: "Clorhexidina 0.12% Colutorio Bucal",
    category: "bioseguridad",
    currentStock: 22,
    minAlertStock: 10,
    unit: "frasco 500ml",
    location: "Recepción / Box",
    costPerUnit: 4900
  }
];

export default function ClinicalSuppliesInventory() {
  const [supplies, setSupplies] = useState<SupplyItem[]>(() => {
    const saved = safeStorage.getItem("perio_supplies_inventory");
    if (saved) {
      try { return JSON.parse(saved); } catch {}
    }
    return INITIAL_SUPPLIES;
  });

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [showAddModal, setShowAddModal] = useState(false);

  // Form State
  const [newName, setNewName] = useState("");
  const [newCategory, setNewCategory] = useState<SupplyItem["category"]>("anestesia");
  const [newStock, setNewStock] = useState("10");
  const [newMinAlert, setNewMinAlert] = useState("5");
  const [newUnit, setNewUnit] = useState("unidad");
  const [newLocation, setNewLocation] = useState("Box 1");
  const [newCost, setNewCost] = useState("25000");

  const handleAdjustStock = (id: string, delta: number) => {
    const updated = supplies.map((item) => {
      if (item.id === id) {
        const nextStock = Math.max(0, item.currentStock + delta);
        return { ...item, currentStock: nextStock };
      }
      return item;
    });
    setSupplies(updated);
    safeStorage.setItem("perio_supplies_inventory", JSON.stringify(updated));
  };

  const handleCreateItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    const newItem: SupplyItem = {
      id: `sup-${Date.now()}`,
      name: newName,
      category: newCategory,
      currentStock: parseInt(newStock) || 0,
      minAlertStock: parseInt(newMinAlert) || 5,
      unit: newUnit,
      location: newLocation,
      costPerUnit: parseFloat(newCost) || 0
    };

    const updated = [newItem, ...supplies];
    setSupplies(updated);
    safeStorage.setItem("perio_supplies_inventory", JSON.stringify(updated));
    setShowAddModal(false);
    setNewName("");
  };

  const criticalItems = supplies.filter(s => s.currentStock <= s.minAlertStock);

  const filteredSupplies = supplies.filter((s) => {
    const matchesSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase()) || s.location.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "all" || s.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-xs">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center font-bold">
              <Boxes className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-display font-bold text-slate-900 dark:text-white">
                Control de Insumos & Materiales Críticos
              </h2>
              <p className="text-xs text-slate-500 font-mono mt-0.5">
                Monitoreo de bioseguridad, anestésicos, biomateriales y alertas de quiebre de stock.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="w-full md:w-auto px-4 py-2.5 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white font-bold text-xs rounded-xl shadow-md shadow-teal-500/20 flex items-center justify-center gap-2 cursor-pointer transition-all"
          >
            <Plus className="w-4 h-4" />
            Añadir Insumo Clínico
          </button>
        </div>
      </div>

      {/* Alerta de Insumos Críticos */}
      {criticalItems.length > 0 && (
        <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div className="text-xs">
            <span className="font-bold text-amber-800 dark:text-amber-300 block">
              Atención: {criticalItems.length} insumos han alcanzado el umbral de reposición urgente
            </span>
            <span className="text-amber-700/80 dark:text-amber-400/80 mt-0.5 block">
              Materiales bajos: {criticalItems.map(c => `${c.name} (${c.currentStock} ${c.unit})`).join(", ")}.
            </span>
          </div>
        </div>
      )}

      {/* Filtros y Buscador */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-4 flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 shadow-xs">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar material o ubicación (ej. Box 1)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-1 focus:ring-teal-500"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          {["all", "anestesia", "quirurgico", "periodoncia", "operatoria", "bioseguridad"].map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold capitalize whitespace-nowrap cursor-pointer transition-all ${
                selectedCategory === cat
                  ? "bg-teal-600 text-white shadow-xs"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
              }`}
            >
              {cat === "all" ? "Todos" : cat}
            </button>
          ))}
        </div>
      </div>

      {/* Tabla de Insumos */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 font-mono border-b border-slate-100 dark:border-slate-800">
              <tr>
                <th className="py-3 px-4">Material / Insumo</th>
                <th className="py-3 px-4">Categoría</th>
                <th className="py-3 px-4">Ubicación</th>
                <th className="py-3 px-4 text-center">Stock Actual</th>
                <th className="py-3 px-4 text-right">Costo Ref.</th>
                <th className="py-3 px-4 text-center">Ajuste Rápido</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredSupplies.map((item) => {
                const isCritical = item.currentStock <= item.minAlertStock;
                return (
                  <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-800 dark:text-slate-200">{item.name}</div>
                      <div className="text-[10px] text-slate-400 font-mono">Presentación: {item.unit}</div>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="capitalize px-2 py-0.5 rounded-md font-mono text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                        {item.category}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-500 whitespace-nowrap">
                      {item.location}
                    </td>
                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-mono font-bold text-xs ${
                        isCritical
                          ? "bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20"
                          : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                      }`}>
                        {isCritical && <AlertTriangle className="w-3 h-3" />}
                        {item.currentStock} {item.currentStock === 1 ? "unidad" : "unidades"}
                      </span>
                      {isCritical && (
                        <span className="block text-[9px] text-rose-500 font-mono mt-0.5">
                          Mínimo: {item.minAlertStock}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-slate-700 dark:text-slate-300 whitespace-nowrap">
                      ${item.costPerUnit.toLocaleString("es-CL")}
                    </td>
                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      <div className="inline-flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                        <button
                          type="button"
                          onClick={() => handleAdjustStock(item.id, -1)}
                          className="w-6 h-6 rounded-lg bg-white dark:bg-slate-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-slate-600 hover:text-rose-600 flex items-center justify-center font-bold transition-all shadow-2xs cursor-pointer"
                          title="Descontar 1 unidad"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleAdjustStock(item.id, 1)}
                          className="w-6 h-6 rounded-lg bg-white dark:bg-slate-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-slate-600 hover:text-emerald-600 flex items-center justify-center font-bold transition-all shadow-2xs cursor-pointer"
                          title="Añadir 1 unidad"
                        >
                          <Plus className="w-3 h-3" />
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

      {/* Modal Nuevo Insumo */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-md overflow-hidden"
            >
              <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
                <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Package className="w-5 h-5 text-teal-600 dark:text-teal-400" />
                  Nuevo Insumo o Material
                </h3>
                <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
              </div>

              <form onSubmit={handleCreateItem} className="p-5 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Nombre del Material</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. Gel Hemostático con Sulfato Férrico"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Categoría</label>
                    <select
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value as any)}
                      className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
                    >
                      <option value="anestesia">Anestesia</option>
                      <option value="quirurgico">Quirúrgico</option>
                      <option value="periodoncia">Periodoncia</option>
                      <option value="operatoria">Operatoria</option>
                      <option value="bioseguridad">Bioseguridad</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Ubicación</label>
                    <input
                      type="text"
                      placeholder="Ej. Box 1 / Cajón A"
                      value={newLocation}
                      onChange={(e) => setNewLocation(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Stock Inicial</label>
                    <input
                      type="number"
                      required
                      min="0"
                      value={newStock}
                      onChange={(e) => setNewStock(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 font-mono font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Stock Mínimo</label>
                    <input
                      type="number"
                      required
                      min="1"
                      value={newMinAlert}
                      onChange={(e) => setNewMinAlert(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 font-mono font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Costo Unit.</label>
                    <input
                      type="number"
                      value={newCost}
                      onChange={(e) => setNewCost(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 font-mono"
                    />
                  </div>
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 rounded-xl"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 text-xs font-bold text-white bg-teal-600 hover:bg-teal-500 rounded-xl shadow-md cursor-pointer"
                  >
                    Guardar Insumo
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
