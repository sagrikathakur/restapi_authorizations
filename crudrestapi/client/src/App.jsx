import React, { useState, useEffect } from "react";
import { 
  ShoppingBag, 
  Plus, 
  Edit, 
  Trash2, 
  LogOut, 
  Globe, 
  ShieldAlert, 
  Sparkles,
  Apple,
  Search,
  X,
  PlusCircle,
  MinusCircle,
  RotateCcw
} from "lucide-react";

const API_GATEWAY_URL = "http://localhost:3000";

// Resolves flags for origins
const getCountryFlag = (country) => {
  if (!country) return "🌐";
  const normalized = country.toLowerCase().trim();
  if (normalized.includes("usa") || normalized.includes("united states")) return "🇺🇸";
  if (normalized.includes("mexico")) return "🇲🇽";
  if (normalized.includes("canada")) return "🇨🇦";
  if (normalized.includes("france")) return "🇫🇷";
  if (normalized.includes("italy")) return "🇮🇹";
  if (normalized.includes("spain")) return "🇪🇸";
  if (normalized.includes("india")) return "🇮🇳";
  if (normalized.includes("china")) return "🇨🇳";
  if (normalized.includes("japan")) return "🇯🇵";
  if (normalized.includes("brazil")) return "🇧🇷";
  if (normalized.includes("vietnam")) return "🇻🇳";
  return "🌐";
};

export default function App() {
  // App Catalog state
  const [foods, setFoods] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [user, setUser] = useState(null);

  // Meal Planner state
  const [planner, setPlanner] = useState([]);

  // Modals & Form state
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showFoodModal, setShowFoodModal] = useState(false);
  const [authMode, setAuthMode] = useState("login"); // 'login' | 'register'
  const [authForm, setAuthForm] = useState({ email: "", password: "" });
  const [foodForm, setFoodForm] = useState({ name: "", color: "", price: "", carbs: "", origin_country: "" });
  const [editingFoodId, setEditingFoodId] = useState(null);

  // Feedback states
  const [toast, setToast] = useState(null);
  const [authError, setAuthError] = useState("");
  const [foodError, setFoodError] = useState("");

  // Load Catalog on Mount
  useEffect(() => {
    const token = localStorage.getItem("auth_token");
    if (token) {
      fetchUserProfile(token);
    }
    fetchFoods();
  }, []);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Fetch Session User
  const fetchUserProfile = async (token) => {
    try {
      const res = await fetch(`${API_GATEWAY_URL}/api/v1/auth/me`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok && data.status === "success") {
        setUser(data.data.user);
      } else {
        localStorage.removeItem("auth_token");
        setUser(null);
      }
    } catch (err) {
      console.error(err);
      localStorage.removeItem("auth_token");
      setUser(null);
    }
  };

  // Fetch Produce
  const fetchFoods = async () => {
    try {
      const res = await fetch(`${API_GATEWAY_URL}/api/v1/food`);
      const data = await res.json();
      if (res.ok && data.status === "success") {
        setFoods(data.data.foods);
      }
    } catch (err) {
      console.error(err);
      showToast("Could not sync with the market server", "error");
    }
  };

  // Auth Submit
  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setAuthError("");
    const path = authMode === "login" ? "/api/v1/auth/login" : "/api/v1/auth/register";

    try {
      const res = await fetch(`${API_GATEWAY_URL}${path}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(authForm)
      });
      const data = await res.json();

      if (res.ok) {
        if (data.token) {
          localStorage.setItem("auth_token", data.token);
          setUser(data.data.user);
          setAuthForm({ email: "", password: "" });
          setShowAuthModal(false);
          showToast(authMode === "login" ? "Supplier portal unlocked" : "Supplier registration complete!");
        }
      } else {
        setAuthError(data.message || "Credential verification failed");
      }
    } catch (err) {
      setAuthError("Supplier login server offline.");
    }
  };

  // Food Create / Update Submit
  const handleFoodSubmit = async (e) => {
    e.preventDefault();
    setFoodError("");
    const token = localStorage.getItem("auth_token");
    if (!token) {
      setFoodError("Authorization required");
      return;
    }

    const payload = {
      name: foodForm.name,
      color: foodForm.color || null,
      price: foodForm.price ? Number(foodForm.price) : null,
      carbs: foodForm.carbs ? Number(foodForm.carbs) : null,
      origin_country: foodForm.origin_country || null
    };

    const isEditing = editingFoodId !== null;
    const url = isEditing ? `${API_GATEWAY_URL}/api/v1/food/${editingFoodId}` : `${API_GATEWAY_URL}/api/v1/food`;
    const method = isEditing ? "PUT" : "POST";

    try {
      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      const data = await res.json();

      if (res.ok && data.status === "success") {
        showToast(isEditing ? "Updated produce listing" : "Added fresh produce to catalog!");
        setFoodForm({ name: "", color: "", price: "", carbs: "", origin_country: "" });
        setEditingFoodId(null);
        setShowFoodModal(false);
        fetchFoods();
      } else {
        if (data.errors) {
          const firstErrField = Object.keys(data.errors)[0];
          const errorMsg = data.errors[firstErrField]?._errors?.[0] || "Invalid parameter";
          setFoodError(`${firstErrField}: ${errorMsg}`);
        } else {
          setFoodError(data.message || "Failed to save item");
        }
      }
    } catch (err) {
      setFoodError("Could not write to server.");
    }
  };

  // Delete Food
  const handleDeleteFood = async (id) => {
    if (!confirm("Remove this produce item from catalog?")) return;
    const token = localStorage.getItem("auth_token");
    if (!token) {
      showToast("Supplier session required", "error");
      return;
    }

    try {
      const res = await fetch(`${API_GATEWAY_URL}/api/v1/food/${id}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      });
      const data = await res.json();

      if (res.ok && data.status === "success") {
        showToast("Removed produce item");
        setPlanner((prev) => prev.filter(item => item.id !== id));
        fetchFoods();
      } else {
        showToast(data.message || "Failed to remove item", "error");
      }
    } catch (err) {
      showToast("Server delete failed", "error");
    }
  };

  // Logout
  const handleLogout = () => {
    localStorage.removeItem("auth_token");
    setUser(null);
    showToast("Supplier portal locked");
  };

  // Open Edit Form
  const openEdit = (food) => {
    setEditingFoodId(food.id);
    setFoodForm({
      name: food.name,
      color: food.color || "",
      price: food.price || "",
      carbs: food.carbs || "",
      origin_country: food.origin_country || ""
    });
    setFoodError("");
    setShowFoodModal(true);
  };

  // Add to Meal Planner shopping list
  const addToPlanner = (food) => {
    const exists = planner.find(item => item.id === food.id);
    if (exists) {
      setPlanner(prev => prev.map(item => item.id === food.id ? { ...item, qty: item.qty + 1 } : item));
    } else {
      setPlanner(prev => [...prev, { ...food, qty: 1 }]);
    }
  };

  // Remove / Decrement from Planner
  const removeFromPlanner = (id) => {
    setPlanner(prev => {
      const item = prev.find(i => i.id === id);
      if (!item) return prev;
      if (item.qty > 1) {
        return prev.map(i => i.id === id ? { ...i, qty: i.qty - 1 } : i);
      }
      return prev.filter(i => i.id !== id);
    });
  };

  // Clear all items in planner
  const clearPlanner = () => {
    setPlanner([]);
    showToast("Planner reset");
  };

  // Meal stats calculation
  const totalPlannerPrice = planner.reduce((sum, item) => sum + (Number(item.price || 0) * item.qty), 0);
  const totalPlannerCarbs = planner.reduce((sum, item) => sum + ((item.carbs || 0) * item.qty), 0);

  // Filter produce
  const filteredFoods = foods.filter(food => 
    food.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (food.origin_country && food.origin_country.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Carb health classification
  const getCarbCategory = (carbs) => {
    if (carbs === 0) return { label: "Keto Friendly", color: "text-emerald-700 bg-emerald-50 border-emerald-100" };
    if (carbs <= 15) return { label: "Low Carb", color: "text-teal-700 bg-teal-50 border-teal-100" };
    if (carbs <= 45) return { label: "Moderate Carb", color: "text-amber-700 bg-amber-50 border-amber-100" };
    return { label: "High Carb Load", color: "text-orange-700 bg-orange-50 border-orange-100" };
  };

  const maxCarbsLimit = 100;
  const progressPercent = Math.min((totalPlannerCarbs / maxCarbsLimit) * 100, 100);

  const plannerCarbInfo = totalPlannerCarbs === 0 
    ? { label: "No Carbs Selected", color: "text-stone-500 bg-stone-100" }
    : totalPlannerCarbs <= 30 
      ? { label: "Low Carb Plan", color: "text-emerald-700 bg-emerald-50 border-emerald-100" }
      : totalPlannerCarbs <= 75 
        ? { label: "Moderate Carb Plan", color: "text-amber-700 bg-amber-50 border-amber-100" }
        : { label: "High Carb Plan", color: "text-rose-700 bg-rose-50 border-rose-100" };

  return (
    <div className="min-h-screen bg-[#faf9f5] text-[#2d2a26] flex flex-col font-sans selection:bg-emerald-100 selection:text-emerald-800">
      
      {/* Toast Alert */}
      {toast && (
        <div className={`fixed bottom-6 left-6 z-50 px-4 py-3 rounded-lg border text-xs font-semibold shadow-xl flex items-center gap-2 transition-all duration-300 bg-white ${
          toast.type === "success" ? "border-emerald-200 text-emerald-700" : "border-rose-200 text-rose-700"
        }`}>
          <div className={`w-1.5 h-1.5 rounded-full ${toast.type === "success" ? "bg-emerald-500" : "bg-rose-500"}`} />
          <span>{toast.message}</span>
        </div>
      )}

      {/* Main Header navigation */}
      <header className="border-b border-[#ece8df] bg-white/70 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-600 flex items-center justify-center text-white shadow-sm shadow-emerald-600/20">
              <Apple className="w-4.5 h-4.5" />
            </div>
            <div>
              <h1 className="font-serif font-bold text-lg leading-none text-stone-900">Verde Market</h1>
              <p className="text-[9px] uppercase font-bold tracking-widest text-emerald-700 mt-1 font-sans">Produce & Nutrition Planner</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Search Bar */}
            <div className="relative hidden md:block">
              <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input 
                type="text" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search fresh produce..."
                className="organic-input rounded-full pl-10 pr-5 py-2 text-xs w-64 focus:w-80 shadow-inner bg-stone-50 border-stone-200"
              />
            </div>

            {user ? (
              <div className="flex items-center gap-3 bg-stone-50 border border-stone-200 rounded-full pl-3 pr-1 py-1">
                <span className="text-xs font-semibold text-stone-700 truncate max-w-[120px]">{user.email}</span>
                <button 
                  onClick={handleLogout}
                  className="bg-stone-200 hover:bg-stone-300 text-stone-700 p-1.5 rounded-full transition-colors cursor-pointer"
                  title="Lock Supplier Panel"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button 
                onClick={() => {
                  setAuthMode("login");
                  setAuthError("");
                  setShowAuthModal(true);
                }}
                className="text-xs font-semibold text-stone-500 hover:text-stone-900 border border-stone-200 bg-white px-4 py-2 rounded-full cursor-pointer hover:border-stone-400 transition-colors"
              >
                Supplier Portal
              </button>
            )}
            
            {user && (
              <button
                onClick={() => {
                  setEditingFoodId(null);
                  setFoodForm({ name: "", color: "", price: "", carbs: "", origin_country: "" });
                  setFoodError("");
                  setShowFoodModal(true);
                }}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs py-2.5 px-4 rounded-full cursor-pointer transition-colors flex items-center gap-1 shadow-sm"
              >
                <Plus className="w-4 h-4" /> Add Produce
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Hero Welcome banner */}
      <section className="bg-gradient-to-b from-[#f2efe6] to-[#faf9f5] py-8 text-center border-b border-[#ece8df]">
        <div className="max-w-3xl mx-auto px-4">
          <span className="text-[10px] font-bold tracking-widest text-emerald-700 uppercase bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100">
            Organic & Farm Fresh
          </span>
          <h2 className="font-serif text-3xl font-bold mt-3.5 text-stone-950">Nutritional Planner & Market</h2>
          <p className="text-xs text-stone-500 max-w-lg mx-auto leading-relaxed mt-2.5">
            Compare fresh vegetables and fruits, inspect carbs load, and organize a balanced shopping basket using live database records.
          </p>
        </div>
      </section>

      {/* Main Grid: Catalog vs Meal Planner */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Side: Produce Catalog (8 columns on lg) */}
        <section className="lg:col-span-8 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="font-serif font-bold text-lg text-stone-900 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-600" />
              Available Harvest
            </h3>
            <span className="text-[11px] font-mono text-stone-500 font-semibold">{filteredFoods.length} varieties ready</span>
          </div>

          {filteredFoods.length === 0 ? (
            <div className="bg-white rounded-2xl p-16 text-center text-stone-400 border border-stone-200">
              <Apple className="w-10 h-10 mx-auto mb-3 text-stone-300" />
              <p className="text-sm font-semibold">No harvest matches your search.</p>
              <p className="text-xs text-stone-400 mt-1">Try another produce name or filter.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {filteredFoods.map((food) => {
                const carbInfo = getCarbCategory(food.carbs || 0);
                
                return (
                  <div key={food.id} className="organic-card rounded-2xl p-5 flex flex-col justify-between relative overflow-hidden group">
                    {/* Admin CRUD options on hover */}
                    {user && (
                      <div className="absolute top-4 right-4 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 rounded-full p-1 border border-stone-100 shadow-sm z-10">
                        <button 
                          onClick={() => openEdit(food)}
                          className="p-1 hover:bg-stone-50 text-stone-600 hover:text-emerald-600 rounded transition-colors cursor-pointer"
                          title="Edit produce info"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button 
                          onClick={() => handleDeleteFood(food.id)}
                          className="p-1 hover:bg-rose-50 text-stone-600 hover:text-rose-600 rounded transition-colors cursor-pointer"
                          title="Remove produce"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}

                    <div>
                      {/* Product Header */}
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-serif font-bold text-stone-900 group-hover:text-emerald-700 transition-colors leading-tight text-md">{food.name}</h4>
                          <p className="text-[10px] text-stone-500 font-medium flex items-center gap-1 mt-1 font-mono uppercase">
                            <span>{getCountryFlag(food.origin_country)}</span>
                            <span>{food.origin_country || "Imported"}</span>
                          </p>
                        </div>
                        {food.color && (
                          <span className="text-[10px] font-semibold bg-stone-100 border border-stone-200 text-stone-600 px-2 py-0.5 rounded-full flex items-center gap-1.5 capitalize">
                            <span 
                              className="w-1.5 h-1.5 rounded-full border border-black/10 inline-block shrink-0" 
                              style={{ backgroundColor: food.color }}
                            />
                            {food.color}
                          </span>
                        )}
                      </div>

                      {/* Nutrition Info pill */}
                      <div className="mt-3 flex flex-wrap gap-2">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${carbInfo.color}`}>
                          {carbInfo.label}
                        </span>
                      </div>

                      {/* Nutrient specs */}
                      <div className="mt-5 grid grid-cols-2 gap-4 border-t border-stone-100 pt-3">
                        <div>
                          <span className="text-[9px] uppercase font-bold tracking-wider text-stone-400 block font-mono">Net Price</span>
                          <span className="text-lg font-serif font-bold text-stone-900">${Number(food.price || 0).toFixed(2)}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-[9px] uppercase font-bold tracking-wider text-stone-400 block font-mono">Carbohydrates</span>
                          <span className="text-md font-bold text-stone-700">{food.carbs ?? 0}g <span className="text-[10px] text-stone-400 font-normal">/ea</span></span>
                        </div>
                      </div>
                    </div>

                    {/* Add to Planner Action */}
                    <div className="mt-5 pt-3 border-t border-stone-100">
                      <button 
                        onClick={() => addToPlanner(food)}
                        className="w-full flex items-center justify-center gap-1.5 bg-stone-100 hover:bg-emerald-50 hover:text-emerald-700 border border-stone-200/80 hover:border-emerald-200/80 text-stone-700 font-semibold py-2 px-3 rounded-xl text-xs transition-all cursor-pointer"
                      >
                        <ShoppingBag className="w-3.5 h-3.5" /> Add to Meal Planner
                      </button>
                    </div>

                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Right Side: Meal Planner Column (4 columns on lg) */}
        <section className="lg:col-span-4 lg:sticky lg:top-28 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="font-serif font-bold text-lg text-stone-900">Your Meal Planner</h3>
            {planner.length > 0 && (
              <button 
                onClick={clearPlanner}
                className="text-[10px] text-stone-500 hover:text-stone-850 flex items-center gap-1 cursor-pointer font-semibold uppercase tracking-wider"
              >
                <RotateCcw className="w-3 h-3" /> Reset
              </button>
            )}
          </div>

          <div className="bg-white border border-[#ece8df] rounded-2xl p-6 shadow-sm space-y-5 flex flex-col">
            {planner.length === 0 ? (
              <div className="py-12 text-center text-stone-455 flex flex-col items-center justify-center">
                <ShoppingBag className="w-8 h-8 mb-2.5 text-stone-300" />
                <p className="text-xs font-semibold text-stone-500">Your planner is empty.</p>
                <p className="text-[11px] text-stone-400 max-w-[180px] mx-auto mt-1 leading-normal">
                  Add fresh items from the catalog on the left to track price and carbs loads.
                </p>
              </div>
            ) : (
              <>
                {/* Selected Basket List */}
                <div className="space-y-4 divide-y divide-stone-100 max-h-72 overflow-y-auto pr-1">
                  {planner.map((item) => (
                    <div key={item.id} className="flex items-center justify-between pt-4 first:pt-0">
                      <div className="min-w-0 pr-2">
                        <h4 className="font-serif font-bold text-stone-900 text-sm truncate leading-tight">{item.name}</h4>
                        <p className="text-[10px] text-stone-400 mt-1 font-mono">
                          {item.carbs ?? 0}g carbs • ${Number(item.price || 0).toFixed(2)} ea
                        </p>
                      </div>
                      
                      {/* Premium Quantity Selector Controls */}
                      <div className="flex items-center gap-3 shrink-0">
                        <div className="flex items-center border border-stone-200 rounded-full p-0.5 bg-stone-50">
                          <button 
                            onClick={() => removeFromPlanner(item.id)}
                            className="p-1 text-stone-400 hover:text-stone-800 transition-colors cursor-pointer rounded-full hover:bg-stone-200/50"
                          >
                            <MinusCircle className="w-3.5 h-3.5" />
                          </button>
                          <span className="text-xs font-bold text-stone-700 w-5 text-center font-mono">{item.qty}</span>
                          <button 
                            onClick={() => addToPlanner(item)}
                            className="p-1 text-stone-400 hover:text-stone-800 transition-colors cursor-pointer rounded-full hover:bg-stone-200/50"
                          >
                            <PlusCircle className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Carb limit progress indicators */}
                <div className="pt-4 border-t border-stone-200/60 space-y-2">
                  <div className="flex justify-between text-[9px] uppercase font-bold tracking-wider text-stone-400 font-mono">
                    <span>Carbs Accumulation</span>
                    <span className="text-stone-600 font-semibold">{totalPlannerCarbs} / {maxCarbsLimit}g</span>
                  </div>
                  <div className="w-full bg-stone-100 rounded-full h-2 overflow-hidden border border-stone-200/10">
                    <div 
                      className={`h-full rounded-full transition-all duration-500 ${
                        totalPlannerCarbs <= 30 ? "bg-emerald-500" :
                        totalPlannerCarbs <= 75 ? "bg-amber-500" : "bg-rose-500"
                      }`}
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                </div>

                {/* Aggregated Nutrition Reports */}
                <div className="border-t border-stone-200/60 pt-4 space-y-3 font-sans">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-stone-500 font-semibold">Diet Plan Category:</span>
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded border ${plannerCarbInfo.color}`}>
                      {plannerCarbInfo.label}
                    </span>
                  </div>

                  <div className="flex justify-between items-center text-xs">
                    <span className="text-stone-500 font-semibold">Estimated Cost:</span>
                    <span className="font-bold text-emerald-600 text-base font-mono">${totalPlannerPrice.toFixed(2)}</span>
                  </div>
                </div>
              </>
            )}
          </div>
        </section>

      </main>

      {/* FOOTER */}
      <footer className="border-t border-[#ece8df] bg-white py-8 text-center text-xs text-stone-500 mt-12">
        <div className="max-w-7xl mx-auto px-4 space-y-2">
          <p className="font-serif italic font-bold text-[#2d2a26]">Verde Organic Fresh Market</p>
          <p className="text-[10px] text-stone-400">Synced directly with regional Neon Serverless PostgreSQL instances.</p>
        </div>
      </footer>

      {/* MODAL 1: SUPPLIER PORTAL LOGIN */}
      {showAuthModal && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-[#ece8df] w-full max-w-sm rounded-2xl p-6 shadow-2xl relative">
            <button 
              onClick={() => setShowAuthModal(false)}
              className="absolute top-4 right-4 p-1 hover:bg-stone-100 text-stone-400 hover:text-stone-800 rounded-full transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2 mb-5">
              <Apple className="w-4 h-4 text-emerald-600" />
              <h3 className="font-serif font-bold text-stone-950 text-md">
                {authMode === "login" ? "Supplier Sign In" : "Register Farm Account"}
              </h3>
            </div>

            <form onSubmit={handleAuthSubmit} className="space-y-4 font-sans text-xs">
              <div>
                <label className="block text-[10px] font-bold text-stone-500 mb-1.5 uppercase tracking-wide">Farming Email</label>
                <input 
                  type="email"
                  required
                  value={authForm.email}
                  onChange={(e) => setAuthForm({ ...authForm, email: e.target.value })}
                  className="w-full organic-input rounded-xl px-3.5 py-2.5 focus:ring-1"
                  placeholder="farmer@verdemarket.com"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-stone-500 mb-1.5 uppercase tracking-wide">Secure Password</label>
                <input 
                  type="password"
                  required
                  value={authForm.password}
                  onChange={(e) => setAuthForm({ ...authForm, password: e.target.value })}
                  className="w-full organic-input rounded-xl px-3.5 py-2.5 focus:ring-1"
                  placeholder="••••••••"
                />
              </div>

              {authError && (
                <div className="bg-rose-50 border border-rose-100 text-rose-700 rounded-xl p-3 flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 shrink-0 text-rose-500" />
                  <span>{authError}</span>
                </div>
              )}

              <div className="flex items-center justify-between pt-3 border-t border-stone-100">
                <button 
                  type="button"
                  onClick={() => {
                    setAuthMode(authMode === "login" ? "register" : "login");
                    setAuthError("");
                  }}
                  className="text-xs text-emerald-600 hover:text-emerald-700 font-semibold cursor-pointer underline"
                >
                  {authMode === "login" ? "Create farmer account" : "Log in to portal"}
                </button>
                
                <button 
                  type="submit"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2 px-4 rounded-full cursor-pointer transition-colors shadow-sm"
                >
                  {authMode === "login" ? "Access Portal" : "Register Supplier"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: PRODUCE CREATE / UPDATE */}
      {showFoodModal && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-[#ece8df] w-full max-w-md rounded-2xl p-6 shadow-2xl relative">
            <button 
              onClick={() => setShowFoodModal(false)}
              className="absolute top-4 right-4 p-1 hover:bg-stone-100 text-stone-400 hover:text-stone-800 rounded-full transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="font-serif font-bold text-stone-950 text-md mb-5">
              {editingFoodId ? "Edit Harvest Details" : "Record Fresh Harvest"}
            </h3>

            <form onSubmit={handleFoodSubmit} className="space-y-4 font-sans text-xs">
              <div>
                <label className="block text-[10px] font-bold text-stone-500 mb-1.5 uppercase tracking-wide">Produce Name *</label>
                <input 
                  type="text"
                  required
                  value={foodForm.name}
                  onChange={(e) => setFoodForm({ ...foodForm, name: e.target.value })}
                  className="w-full organic-input rounded-xl px-3.5 py-2.5"
                  placeholder="e.g. Heirloom Tomato"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-stone-500 mb-1.5 uppercase tracking-wide">Price ($) *</label>
                  <input 
                    type="number"
                    step="0.01"
                    required
                    value={foodForm.price}
                    onChange={(e) => setFoodForm({ ...foodForm, price: e.target.value })}
                    className="w-full organic-input rounded-xl px-3.5 py-2.5"
                    placeholder="1.99"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-stone-500 mb-1.5 uppercase tracking-wide">Carbs Content (g)</label>
                  <input 
                    type="number"
                    value={foodForm.carbs}
                    onChange={(e) => setFoodForm({ ...foodForm, carbs: e.target.value })}
                    className="w-full organic-input rounded-xl px-3.5 py-2.5"
                    placeholder="7"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-stone-500 mb-1.5 uppercase tracking-wide">Swatched Color</label>
                  <input 
                    type="text"
                    value={foodForm.color}
                    onChange={(e) => setFoodForm({ ...foodForm, color: e.target.value })}
                    className="w-full organic-input rounded-xl px-3.5 py-2.5"
                    placeholder="red"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-stone-500 mb-1.5 uppercase tracking-wide">Harvest Country</label>
                  <input 
                    type="text"
                    value={foodForm.origin_country}
                    onChange={(e) => setFoodForm({ ...foodForm, origin_country: e.target.value })}
                    className="w-full organic-input rounded-xl px-3.5 py-2.5"
                    placeholder="USA"
                  />
                </div>
              </div>

              {foodError && (
                <div className="bg-rose-50 border border-rose-100 text-rose-700 rounded-xl p-3 flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 shrink-0 text-rose-500" />
                  <span>{foodError}</span>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-stone-100">
                <button 
                  type="button"
                  onClick={() => setShowFoodModal(false)}
                  className="px-4 py-2 rounded-xl text-stone-500 hover:text-stone-850 hover:bg-stone-50 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2 px-5 rounded-full cursor-pointer transition-colors"
                >
                  {editingFoodId ? "Save Changes" : "Register Harvest"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
