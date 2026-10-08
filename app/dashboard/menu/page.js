"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { useSession } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import Swal from "sweetalert2";

import {
  Plus,
  Search,
  Pencil,
  Trash2,
  ImagePlus,
  X,
  Upload,
  Loader2,
  EyeOff,
  Star,
  Utensils,
  RefreshCw,
  Check,
  Ban,
  Filter,
  ChevronDown,
  Tag,
  DollarSign,
  Sparkles,
} from "lucide-react";

/* =========================================================
   HELPERS
========================================================= */

function slugify(value = "") {
  return value
    .toString()
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

function money(value) {
  return Number(value || 0).toLocaleString("en-BD", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
}

/* =========================================================
   EMPTY FORM
========================================================= */

const emptyForm = {
  name: "",
  slug: "",
  description: "",
  price: "",
  oldPrice: "",
  rating: "5",
  image: "",
  categoryId: "",
  available: true,
  featured: false,
};

/* =========================================================
   PAGE WRAPPER
   IMPORTANT:
   useSearchParams() requires Suspense in production build.
========================================================= */

export default function MenuManagementPage() {
  return (
    <Suspense fallback={<MenuPageLoading />}>
      <MenuManagementContent />
    </Suspense>
  );
}

/* =========================================================
   SUSPENSE FALLBACK
========================================================= */

function MenuPageLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#080808]">
      <Loader2 size={38} className="animate-spin text-[#d4af37]" />
    </div>
  );
}

/* =========================================================
   MAIN PAGE CONTENT
========================================================= */

function MenuManagementContent() {
  const { data: session, status: sessionStatus } = useSession();

  const searchParams = useSearchParams();

  const [menuItems, setMenuItems] = useState([]);
  const [categories, setCategories] = useState([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);

  const [editingItem, setEditingItem] = useState(null);

  const [form, setForm] = useState(emptyForm);

  const [imagePreview, setImagePreview] = useState("");

  const [uploadingImage, setUploadingImage] = useState(false);

  const [saving, setSaving] = useState(false);

  const [deletingId, setDeletingId] = useState(null);

  const [search, setSearch] = useState("");

  const [categoryFilter, setCategoryFilter] = useState("all");

  const [statusFilter, setStatusFilter] = useState("all");

  /* =========================================================
     ACCESS
  ========================================================= */

  const isAdmin =
    session?.user?.role === "ADMIN" || session?.user?.role === "STAFF";

  /* =========================================================
     LOAD DATA
  ========================================================= */

  async function loadData(showRefresh = false) {
    try {
      if (showRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const [menuResponse, categoryResponse] = await Promise.all([
        fetch("/api/admin/menu", {
          cache: "no-store",
        }),

        fetch("/api/admin/categories", {
          cache: "no-store",
        }),
      ]);

      const menuResult = await menuResponse.json();

      const categoryResult = await categoryResponse.json();

      if (!menuResponse.ok || !menuResult.success) {
        throw new Error(menuResult.message || "Failed to load menu.");
      }

      if (!categoryResponse.ok || !categoryResult.success) {
        throw new Error(categoryResult.message || "Failed to load categories.");
      }

      setMenuItems(Array.isArray(menuResult.data) ? menuResult.data : []);

      setCategories(
        Array.isArray(categoryResult.data) ? categoryResult.data : [],
      );
    } catch (error) {
      console.error("MENU LOAD ERROR:", error);

      Swal.fire({
        icon: "error",
        title: "Failed to load",
        text: error?.message || "Could not load menu data.",
        background: "#111",
        color: "#fff",
        confirmButtonColor: "#d4af37",
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    if (sessionStatus === "authenticated" && isAdmin) {
      loadData();
    }
  }, [sessionStatus, isAdmin]);

  /* =========================================================
     AUTO OPEN ADD MODAL

     /dashboard/menu?action=add
  ========================================================= */

  useEffect(() => {
    if (
      sessionStatus === "authenticated" &&
      isAdmin &&
      searchParams.get("action") === "add" &&
      categories.length > 0
    ) {
      openCreateModal();
    }
  }, [sessionStatus, isAdmin, categories, searchParams]);

  /* =========================================================
     FILTER
  ========================================================= */

  const filteredItems = useMemo(() => {
    const query = search.trim().toLowerCase();

    return menuItems.filter((item) => {
      const matchesSearch =
        !query ||
        item.name?.toLowerCase().includes(query) ||
        item.description?.toLowerCase().includes(query) ||
        item.slug?.toLowerCase().includes(query);

      const matchesCategory =
        categoryFilter === "all" ||
        item.categoryId === categoryFilter ||
        item.category?.slug === categoryFilter;

      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "available" && item.available) ||
        (statusFilter === "unavailable" && !item.available) ||
        (statusFilter === "featured" && item.featured);

      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [menuItems, search, categoryFilter, statusFilter]);

  /* =========================================================
     STATS
  ========================================================= */

  const stats = useMemo(() => {
    return {
      total: menuItems.length,

      available: menuItems.filter((item) => item.available).length,

      unavailable: menuItems.filter((item) => !item.available).length,

      featured: menuItems.filter((item) => item.featured).length,
    };
  }, [menuItems]);

  /* =========================================================
     CREATE MODAL
  ========================================================= */

  function openCreateModal() {
    setEditingItem(null);

    setForm({
      ...emptyForm,
      categoryId: categories[0]?.id || "",
    });

    setImagePreview("");

    setModalOpen(true);
  }

  /* =========================================================
     EDIT MODAL
  ========================================================= */

  function openEditModal(item) {
    setEditingItem(item);

    setForm({
      name: item.name || "",

      slug: item.slug || "",

      description: item.description || "",

      price: item.price ?? "",

      oldPrice: item.oldPrice ?? "",

      rating: item.rating ?? "5",

      image: item.image || "",

      categoryId: item.categoryId || item.category?.id || "",

      available: item.available ?? true,

      featured: item.featured ?? false,
    });

    setImagePreview(item.image || "");

    setModalOpen(true);
  }

  /* =========================================================
     CLOSE MODAL
  ========================================================= */

  function closeModal() {
    if (saving || uploadingImage) {
      return;
    }

    setModalOpen(false);

    setEditingItem(null);

    setForm(emptyForm);

    setImagePreview("");
  }

  /* =========================================================
     FORM CHANGE
  ========================================================= */

  function handleChange(event) {
    const { name, value, type, checked } = event.target;

    setForm((prev) => ({
      ...prev,

      [name]: type === "checkbox" ? checked : value,
    }));
  }

  /* =========================================================
     NAME CHANGE
  ========================================================= */

  function handleNameChange(event) {
    const value = event.target.value;

    setForm((prev) => ({
      ...prev,

      name: value,

      slug: editingItem ? prev.slug : slugify(value),
    }));
  }

  /* =========================================================
     IMAGE UPLOAD
  ========================================================= */

  async function handleImageUpload(event) {
    const file = event.target.files?.[0];

    if (!file) return;

    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/avif",
    ];

    if (!allowedTypes.includes(file.type)) {
      Swal.fire({
        icon: "warning",
        title: "Invalid image",
        text: "Please choose JPG, PNG, WebP or AVIF.",
        background: "#111",
        color: "#fff",
        confirmButtonColor: "#d4af37",
      });

      event.target.value = "";

      return;
    }

    const maxSize = 5 * 1024 * 1024;

    if (file.size > maxSize) {
      Swal.fire({
        icon: "warning",
        title: "Image is too large",
        text: "Maximum image size is 5MB.",
        background: "#111",
        color: "#fff",
        confirmButtonColor: "#d4af37",
      });

      event.target.value = "";

      return;
    }

    try {
      setUploadingImage(true);

      const localPreview = URL.createObjectURL(file);

      setImagePreview(localPreview);

      const formData = new FormData();

      formData.append("file", file);

      const response = await fetch("/api/admin/upload", {
        method: "POST",
        body: formData,
      });

      let result;

      try {
        result = await response.json();
      } catch {
        throw new Error("Server returned an invalid response.");
      }

      console.log("UPLOAD RESPONSE:", result);

      if (!response.ok) {
        throw new Error(
          result?.message || `Upload failed with status ${response.status}.`,
        );
      }

      if (!result?.success) {
        throw new Error(result?.message || "Image upload failed.");
      }

      const uploadedUrl = result?.data?.url || result?.data?.secure_url;

      if (!uploadedUrl) {
        throw new Error("Image uploaded but Cloudinary URL was not returned.");
      }

      setForm((prev) => ({
        ...prev,

        image: uploadedUrl,
      }));

      setImagePreview(uploadedUrl);

      Swal.fire({
        icon: "success",
        title: "Image uploaded",
        text: "Food image uploaded successfully.",
        background: "#111",
        color: "#fff",
        confirmButtonColor: "#d4af37",
        timer: 1400,
        showConfirmButton: false,
      });
    } catch (error) {
      console.error("IMAGE UPLOAD ERROR:", error);

      setImagePreview(form.image || "");

      Swal.fire({
        icon: "error",
        title: "Upload failed",
        text: error?.message || "Could not upload image.",
        background: "#111",
        color: "#fff",
        confirmButtonColor: "#d4af37",
      });
    } finally {
      setUploadingImage(false);

      event.target.value = "";
    }
  }

  /* =========================================================
     CREATE / UPDATE
  ========================================================= */

  async function handleSubmit(event) {
    event.preventDefault();

    if (saving || uploadingImage) {
      return;
    }

    if (!form.name.trim()) {
      Swal.fire({
        icon: "warning",
        title: "Name required",
        text: "Please enter menu item name.",
        background: "#111",
        color: "#fff",
        confirmButtonColor: "#d4af37",
      });

      return;
    }

    if (!form.categoryId) {
      Swal.fire({
        icon: "warning",
        title: "Category required",
        text: "Please select a category.",
        background: "#111",
        color: "#fff",
        confirmButtonColor: "#d4af37",
      });

      return;
    }

    if (!form.price || Number(form.price) <= 0) {
      Swal.fire({
        icon: "warning",
        title: "Invalid price",
        text: "Please enter a valid price.",
        background: "#111",
        color: "#fff",
        confirmButtonColor: "#d4af37",
      });

      return;
    }

    if (!form.image) {
      Swal.fire({
        icon: "warning",
        title: "Image required",
        text: "Please choose and upload a food image.",
        background: "#111",
        color: "#fff",
        confirmButtonColor: "#d4af37",
      });

      return;
    }

    try {
      setSaving(true);

      const payload = {
        name: form.name.trim(),

        slug: form.slug.trim() || slugify(form.name),

        description: form.description.trim(),

        price: Number(form.price),

        oldPrice: form.oldPrice !== "" ? Number(form.oldPrice) : null,

        rating: Number(form.rating || 5),

        image: form.image,

        categoryId: form.categoryId,

        available: Boolean(form.available),

        featured: Boolean(form.featured),
      };

      const url = editingItem
        ? `/api/admin/menu/${editingItem.id}`
        : "/api/admin/menu";

      const method = editingItem ? "PATCH" : "POST";

      const response = await fetch(url, {
        method,

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.message ||
            `Failed to ${editingItem ? "update" : "create"} menu item.`,
        );
      }

      if (editingItem) {
        setMenuItems((prev) =>
          prev.map((item) => (item.id === editingItem.id ? result.data : item)),
        );
      } else {
        setMenuItems((prev) => [result.data, ...prev]);
      }

      Swal.fire({
        icon: "success",

        title: editingItem ? "Menu updated" : "Menu item created",

        text: editingItem
          ? "Menu item updated successfully."
          : "New menu item added successfully.",

        background: "#111",

        color: "#fff",

        confirmButtonColor: "#d4af37",

        timer: 1500,

        showConfirmButton: false,
      });

      closeModal();
    } catch (error) {
      console.error("MENU SAVE ERROR:", error);

      Swal.fire({
        icon: "error",

        title: editingItem ? "Update failed" : "Create failed",

        text: error?.message || "Could not save menu item.",

        background: "#111",

        color: "#fff",

        confirmButtonColor: "#d4af37",
      });
    } finally {
      setSaving(false);
    }
  }

  /* =========================================================
     DELETE
  ========================================================= */

  async function handleDelete(item) {
    const result = await Swal.fire({
      icon: "warning",

      title: "Delete menu item?",

      text: `"${item.name}" will be permanently deleted.`,

      background: "#111",

      color: "#fff",

      showCancelButton: true,

      confirmButtonText: "Yes, delete",

      cancelButtonText: "Cancel",

      confirmButtonColor: "#dc2626",

      cancelButtonColor: "#374151",
    });

    if (!result.isConfirmed) {
      return;
    }

    try {
      setDeletingId(item.id);

      const response = await fetch(`/api/admin/menu/${item.id}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to delete menu item.");
      }

      setMenuItems((prev) => prev.filter((menu) => menu.id !== item.id));

      Swal.fire({
        icon: "success",

        title: "Deleted",

        text: "Menu item deleted successfully.",

        background: "#111",

        color: "#fff",

        confirmButtonColor: "#d4af37",

        timer: 1300,

        showConfirmButton: false,
      });
    } catch (error) {
      console.error("DELETE ERROR:", error);

      Swal.fire({
        icon: "error",

        title: "Delete failed",

        text: error?.message || "Could not delete menu item.",

        background: "#111",

        color: "#fff",

        confirmButtonColor: "#d4af37",
      });
    } finally {
      setDeletingId(null);
    }
  }

  /* =========================================================
     TOGGLE AVAILABLE / FEATURED
  ========================================================= */

  async function toggleField(item, field) {
    const oldValue = Boolean(item[field]);

    const newValue = !oldValue;

    setMenuItems((prev) =>
      prev.map((menu) =>
        menu.id === item.id
          ? {
              ...menu,
              [field]: newValue,
            }
          : menu,
      ),
    );

    try {
      const response = await fetch(`/api/admin/menu/${item.id}`, {
        method: "PATCH",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          [field]: newValue,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Update failed.");
      }

      setMenuItems((prev) =>
        prev.map((menu) => (menu.id === item.id ? result.data : menu)),
      );
    } catch (error) {
      console.error("TOGGLE ERROR:", error);

      setMenuItems((prev) =>
        prev.map((menu) =>
          menu.id === item.id
            ? {
                ...menu,
                [field]: oldValue,
              }
            : menu,
        ),
      );

      Swal.fire({
        icon: "error",

        title: "Update failed",

        text: error?.message || "Could not update item.",

        background: "#111",

        color: "#fff",

        confirmButtonColor: "#d4af37",
      });
    }
  }

  /* =========================================================
     ACCESS LOADING
  ========================================================= */

  if (sessionStatus === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#080808]">
        <Loader2 size={38} className="animate-spin text-[#d4af37]" />
      </div>
    );
  }

  /* =========================================================
     ACCESS DENIED
  ========================================================= */

  if (!session || !isAdmin) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#080808] px-6 text-white">
        <div className="w-full max-w-md rounded-3xl border border-red-500/20 bg-[#111] p-8 text-center">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-red-500/10">
            <EyeOff size={28} className="text-red-400" />
          </div>

          <h1 className="text-2xl font-bold">Access Denied</h1>

          <p className="mt-3 text-sm text-gray-400">
            You need ADMIN or STAFF permission to manage restaurant menu items.
          </p>
        </div>
      </main>
    );
  }

  /* =========================================================
     MAIN UI
  ========================================================= */

  return (
    <main className="min-h-screen bg-[#080808] px-4 py-8 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        {/* HEADER */}

        <div className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2 text-[#d4af37]">
              <Utensils size={18} />

              <span className="text-xs font-semibold uppercase tracking-[0.25em]">
                Restaurant Management
              </span>
            </div>

            <h1 className="text-3xl font-bold sm:text-4xl">Menu Management</h1>

            <p className="mt-2 max-w-2xl text-sm text-gray-400">
              Create, update and manage restaurant menu items from your
              professional dashboard.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => loadData(true)}
              disabled={refreshing}
              className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-medium text-white transition hover:border-[#d4af37]/30 hover:bg-white/[0.07] disabled:opacity-50"
            >
              <RefreshCw
                size={17}
                className={refreshing ? "animate-spin" : ""}
              />
              Refresh
            </button>

            <button
              onClick={openCreateModal}
              className="inline-flex items-center gap-2 rounded-xl bg-[#d4af37] px-5 py-3 text-sm font-bold text-black transition hover:bg-[#f1d77a]"
            >
              <Plus size={18} />
              Add Menu Item
            </button>
          </div>
        </div>

        {/* STATS */}

        <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard icon={Utensils} label="Total Items" value={stats.total} />

          <StatCard
            icon={Check}
            label="Available"
            value={stats.available}
            type="green"
          />

          <StatCard
            icon={Ban}
            label="Unavailable"
            value={stats.unavailable}
            type="red"
          />

          <StatCard
            icon={Sparkles}
            label="Featured"
            value={stats.featured}
            type="gold"
          />
        </div>

        {/* FILTER BAR */}

        <div className="mb-6 rounded-2xl border border-white/[0.08] bg-[#101010] p-4">
          <div className="grid gap-3 lg:grid-cols-[1fr_220px_200px]">
            {/* Search */}

            <div className="relative">
              <Search
                size={18}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30"
              />

              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search menu item..."
                className="h-12 w-full rounded-xl border border-white/10 bg-black/20 pl-11 pr-4 text-sm text-white outline-none transition placeholder:text-white/25 focus:border-[#d4af37]/40"
              />
            </div>

            {/* Category */}

            <div className="relative">
              <Filter
                size={16}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30"
              />

              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="h-12 w-full appearance-none rounded-xl border border-white/10 bg-black/20 pl-10 pr-10 text-sm text-white outline-none focus:border-[#d4af37]/40"
              >
                <option value="all" className="bg-[#111]">
                  All Categories
                </option>

                {categories.map((category) => (
                  <option
                    key={category.id}
                    value={category.id}
                    className="bg-[#111]"
                  >
                    {category.name}
                  </option>
                ))}
              </select>

              <ChevronDown
                size={15}
                className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-white/30"
              />
            </div>

            {/* Status */}

            <div className="relative">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="h-12 w-full appearance-none rounded-xl border border-white/10 bg-black/20 px-4 pr-10 text-sm text-white outline-none focus:border-[#d4af37]/40"
              >
                <option value="all" className="bg-[#111]">
                  All Status
                </option>

                <option value="available" className="bg-[#111]">
                  Available
                </option>

                <option value="unavailable" className="bg-[#111]">
                  Unavailable
                </option>

                <option value="featured" className="bg-[#111]">
                  Featured
                </option>
              </select>

              <ChevronDown
                size={15}
                className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-white/30"
              />
            </div>
          </div>
        </div>

        {/* CONTENT */}

        {loading ? (
          <LoadingGrid />
        ) : filteredItems.length === 0 ? (
          <EmptyState search={search} onAdd={openCreateModal} />
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {filteredItems.map((item) => (
              <MenuCard
                key={item.id}
                item={item}
                onEdit={openEditModal}
                onDelete={handleDelete}
                onToggle={toggleField}
                deletingId={deletingId}
              />
            ))}
          </div>
        )}
      </div>

      {/* MODAL */}

      {modalOpen && (
        <MenuModal
          form={form}
          editingItem={editingItem}
          categories={categories}
          imagePreview={imagePreview}
          uploadingImage={uploadingImage}
          saving={saving}
          onClose={closeModal}
          onSubmit={handleSubmit}
          onChange={handleChange}
          onNameChange={handleNameChange}
          onImageUpload={handleImageUpload}
        />
      )}
    </main>
  );
}

/* =========================================================
   STAT CARD
========================================================= */

function StatCard({ icon: Icon, label, value, type = "default" }) {
  const iconClass =
    type === "green"
      ? "bg-emerald-500/10 text-emerald-400"
      : type === "red"
        ? "bg-red-500/10 text-red-400"
        : "bg-[#d4af37]/10 text-[#d4af37]";

  return (
    <div className="rounded-2xl border border-white/[0.08] bg-[#101010] p-5">
      <div className="flex items-center justify-between">
        <div
          className={`flex h-10 w-10 items-center justify-center rounded-full ${iconClass}`}
        >
          <Icon size={18} />
        </div>

        <Tag size={15} className="text-white/15" />
      </div>

      <p className="mt-4 text-xs text-white/40">{label}</p>

      <p className="mt-1 text-2xl font-bold">{value}</p>
    </div>
  );
}

/* =========================================================
   MENU CARD
========================================================= */

function MenuCard({ item, onEdit, onDelete, onToggle, deletingId }) {
  return (
    <article className="group overflow-hidden rounded-2xl border border-white/[0.08] bg-[#101010] transition duration-300 hover:-translate-y-1 hover:border-[#d4af37]/25">
      {/* IMAGE */}

      <div className="relative h-56 overflow-hidden bg-[#171717]">
        {item.image ? (
          <Image
            src={item.image}
            alt={item.name}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 33vw"
            className="object-cover transition duration-700 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-white/20">
            <ImagePlus size={40} />
          </div>
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20" />

        {item.featured && (
          <div className="absolute left-3 top-3 flex items-center gap-1 rounded-full bg-[#d4af37] px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-black">
            <Sparkles size={11} />
            Featured
          </div>
        )}

        <div className="absolute right-3 top-3">
          <button
            onClick={() => onToggle(item, "available")}
            className={`rounded-full px-3 py-1.5 text-[10px] font-semibold backdrop-blur-md ${
              item.available
                ? "bg-emerald-500/15 text-emerald-300"
                : "bg-red-500/15 text-red-300"
            }`}
          >
            {item.available ? "Available" : "Unavailable"}
          </button>
        </div>

        <div className="absolute bottom-3 left-3">
          <div className="flex items-center gap-2">
            <span className="text-xl font-bold text-[#d4af37]">
              BDT {money(item.price)}
            </span>

            {item.oldPrice && (
              <span className="text-xs text-white/40 line-through">
                BDT {money(item.oldPrice)}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* BODY */}

      <div className="p-5">
        <div className="mb-2 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="truncate text-lg font-bold">{item.name}</h3>

            <p className="mt-1 text-xs text-[#d4af37]">
              {item.category?.name || "Uncategorized"}
            </p>
          </div>

          <div className="flex shrink-0 items-center gap-1 text-xs text-[#d4af37]">
            <Star size={13} fill="currentColor" />

            {Number(item.rating || 5).toFixed(1)}
          </div>
        </div>

        <p className="min-h-[40px] text-sm leading-5 text-white/40">
          {item.description || "No description available."}
        </p>

        <div className="mt-4 flex items-center justify-between border-t border-white/[0.06] pt-4">
          <button
            onClick={() => onToggle(item, "featured")}
            className="flex items-center gap-2 text-xs text-white/45 transition hover:text-white"
          >
            {item.featured ? (
              <>
                <Sparkles size={14} className="text-[#d4af37]" />
                Featured
              </>
            ) : (
              <>
                <Sparkles size={14} />
                Make Featured
              </>
            )}
          </button>

          <span className="text-[10px] text-white/20">
            {item._count?.reviews || 0} reviews
          </span>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2">
          <button
            onClick={() => onEdit(item)}
            className="flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] py-2.5 text-xs font-medium text-white transition hover:border-[#d4af37]/30 hover:text-[#d4af37]"
          >
            <Pencil size={14} />
            Edit
          </button>

          <button
            onClick={() => onDelete(item)}
            disabled={deletingId === item.id}
            className="flex items-center justify-center gap-2 rounded-xl border border-red-500/10 bg-red-500/[0.04] py-2.5 text-xs font-medium text-red-400 transition hover:bg-red-500/10 disabled:opacity-50"
          >
            {deletingId === item.id ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Trash2 size={14} />
            )}
            Delete
          </button>
        </div>
      </div>
    </article>
  );
}

/* =========================================================
   MODAL
========================================================= */

function MenuModal({
  form,
  editingItem,
  categories,
  imagePreview,
  uploadingImage,
  saving,
  onClose,
  onSubmit,
  onChange,
  onNameChange,
  onImageUpload,
}) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-black/80 p-4 backdrop-blur-md">
      <div className="relative my-8 w-full max-w-3xl overflow-hidden rounded-3xl border border-[#d4af37]/20 bg-[#111] shadow-2xl">
        {/* HEADER */}

        <div className="flex items-center justify-between border-b border-white/[0.07] px-6 py-5">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-[#d4af37]">
              ST Restaurant
            </p>

            <h2 className="mt-1 text-xl font-bold">
              {editingItem ? "Edit Menu Item" : "Add Menu Item"}
            </h2>
          </div>

          <button
            onClick={onClose}
            disabled={saving || uploadingImage}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white/[0.05] text-white/60 transition hover:bg-white/10 hover:text-white disabled:opacity-40"
          >
            <X size={18} />
          </button>
        </div>

        {/* FORM */}

        <form onSubmit={onSubmit} className="max-h-[80vh] overflow-y-auto p-6">
          <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
            {/* IMAGE SECTION */}

            <div>
              <label className="mb-2 block text-sm font-medium">
                Food Image
              </label>

              <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#080808]">
                <div className="relative aspect-square overflow-hidden">
                  {imagePreview ? (
                    <Image
                      src={imagePreview}
                      alt="Food preview"
                      fill
                      unoptimized={imagePreview.startsWith("blob:")}
                      sizes="280px"
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex h-full flex-col items-center justify-center text-white/20">
                      <ImagePlus size={40} />

                      <p className="mt-3 text-xs">No image selected</p>
                    </div>
                  )}

                  {uploadingImage && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 backdrop-blur-sm">
                      <Loader2
                        size={32}
                        className="animate-spin text-[#d4af37]"
                      />

                      <p className="mt-3 text-xs font-medium text-white">
                        Uploading...
                      </p>
                    </div>
                  )}
                </div>

                <div className="p-4">
                  <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-[#d4af37]/30 bg-[#d4af37]/5 px-4 py-3 text-sm font-medium text-[#d4af37] transition hover:bg-[#d4af37]/10">
                    {uploadingImage ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload size={16} />
                        Choose File
                      </>
                    )}

                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/avif"
                      onChange={onImageUpload}
                      disabled={uploadingImage || saving}
                      className="hidden"
                    />
                  </label>

                  <p className="mt-3 text-center text-[10px] leading-4 text-white/25">
                    JPG, PNG, WebP or AVIF
                    <br />
                    Maximum size: 5MB
                  </p>
                </div>
              </div>
            </div>

            {/* FIELDS */}

            <div className="space-y-4">
              {/* NAME */}

              <Field label="Menu Item Name" icon={Utensils}>
                <input
                  name="name"
                  value={form.name}
                  onChange={onNameChange}
                  placeholder="e.g. Truffle Steak"
                  className="input-style"
                />
              </Field>

              {/* SLUG */}

              <Field label="Slug" icon={Tag}>
                <input
                  name="slug"
                  value={form.slug}
                  onChange={onChange}
                  placeholder="truffle-steak"
                  className="input-style"
                />
              </Field>

              {/* CATEGORY */}

              <Field label="Category" icon={Tag}>
                <select
                  name="categoryId"
                  value={form.categoryId}
                  onChange={onChange}
                  className="input-style"
                >
                  <option value="" className="bg-[#111]">
                    Select category
                  </option>

                  {categories.map((category) => (
                    <option
                      key={category.id}
                      value={category.id}
                      className="bg-[#111]"
                    >
                      {category.name}
                    </option>
                  ))}
                </select>
              </Field>

              {/* PRICE */}

              <div className="grid grid-cols-2 gap-3">
                <Field label="Price" icon={DollarSign}>
                  <input
                    name="price"
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.price}
                    onChange={onChange}
                    placeholder="850"
                    className="input-style"
                  />
                </Field>

                <Field label="Old Price" icon={DollarSign}>
                  <input
                    name="oldPrice"
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.oldPrice}
                    onChange={onChange}
                    placeholder="1000"
                    className="input-style"
                  />
                </Field>
              </div>

              {/* RATING */}

              <Field label="Rating" icon={Star}>
                <input
                  name="rating"
                  type="number"
                  min="0"
                  max="5"
                  step="0.1"
                  value={form.rating}
                  onChange={onChange}
                  className="input-style"
                />
              </Field>

              {/* DESCRIPTION */}

              <div>
                <label className="mb-2 block text-xs font-medium text-white/60">
                  Description
                </label>

                <textarea
                  name="description"
                  value={form.description}
                  onChange={onChange}
                  rows={4}
                  placeholder="Describe this delicious menu item..."
                  className="input-style resize-none"
                />
              </div>

              {/* TOGGLES */}

              <div className="grid grid-cols-2 gap-3">
                <label className="flex cursor-pointer items-center justify-between rounded-xl border border-white/10 bg-white/[0.02] p-4">
                  <div>
                    <p className="text-sm font-medium">Available</p>

                    <p className="mt-1 text-[10px] text-white/30">
                      Customers can order
                    </p>
                  </div>

                  <input
                    type="checkbox"
                    name="available"
                    checked={form.available}
                    onChange={onChange}
                    className="h-4 w-4 accent-[#d4af37]"
                  />
                </label>

                <label className="flex cursor-pointer items-center justify-between rounded-xl border border-white/10 bg-white/[0.02] p-4">
                  <div>
                    <p className="text-sm font-medium">Featured</p>

                    <p className="mt-1 text-[10px] text-white/30">
                      Show as featured
                    </p>
                  </div>

                  <input
                    type="checkbox"
                    name="featured"
                    checked={form.featured}
                    onChange={onChange}
                    className="h-4 w-4 accent-[#d4af37]"
                  />
                </label>
              </div>
            </div>
          </div>

          {/* ACTIONS */}

          <div className="mt-7 flex flex-col-reverse gap-3 border-t border-white/[0.07] pt-5 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={saving || uploadingImage}
              className="rounded-xl border border-white/10 px-6 py-3 text-sm font-medium text-white/70 transition hover:bg-white/[0.05] disabled:opacity-40"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={saving || uploadingImage}
              className="flex items-center justify-center gap-2 rounded-xl bg-[#d4af37] px-7 py-3 text-sm font-bold text-black transition hover:bg-[#f1d77a] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? (
                <>
                  <Loader2 size={17} className="animate-spin" />
                  Saving...
                </>
              ) : uploadingImage ? (
                <>
                  <Loader2 size={17} className="animate-spin" />
                  Uploading image...
                </>
              ) : (
                <>
                  <Check size={17} />

                  {editingItem ? "Update Item" : "Create Item"}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* =========================================================
   FIELD
========================================================= */

function Field({ label, icon: Icon, children }) {
  return (
    <div>
      <label className="mb-2 flex items-center gap-2 text-xs font-medium text-white/60">
        {Icon && <Icon size={13} className="text-[#d4af37]" />}

        {label}
      </label>

      {children}
    </div>
  );
}

/* =========================================================
   EMPTY STATE
========================================================= */

function EmptyState({ search, onAdd }) {
  return (
    <div className="rounded-3xl border border-dashed border-white/10 bg-[#101010] px-6 py-20 text-center">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#d4af37]/10 text-[#d4af37]">
        <Utensils size={28} />
      </div>

      <h2 className="mt-5 text-xl font-bold">
        {search ? "No menu items found" : "No menu items yet"}
      </h2>

      <p className="mx-auto mt-2 max-w-md text-sm text-white/35">
        {search
          ? "Try a different search keyword or filter."
          : "Start building your restaurant menu by adding your first delicious item."}
      </p>

      {!search && (
        <button
          onClick={onAdd}
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#d4af37] px-5 py-3 text-sm font-bold text-black"
        >
          <Plus size={17} />
          Add Menu Item
        </button>
      )}
    </div>
  );
}

/* =========================================================
   LOADING GRID
========================================================= */

function LoadingGrid() {
  return (
    <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
      {Array.from({
        length: 6,
      }).map((_, index) => (
        <div
          key={index}
          className="overflow-hidden rounded-2xl border border-white/[0.08] bg-[#101010]"
        >
          <div className="h-56 animate-pulse bg-white/[0.04]" />

          <div className="space-y-3 p-5">
            <div className="h-5 w-2/3 animate-pulse rounded bg-white/[0.05]" />

            <div className="h-3 w-1/3 animate-pulse rounded bg-white/[0.05]" />

            <div className="h-10 w-full animate-pulse rounded bg-white/[0.05]" />

            <div className="grid grid-cols-2 gap-2">
              <div className="h-10 animate-pulse rounded bg-white/[0.05]" />

              <div className="h-10 animate-pulse rounded bg-white/[0.05]" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
