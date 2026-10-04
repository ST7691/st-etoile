"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useSession } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import Swal from "sweetalert2";
import {
  Plus,
  Pencil,
  Trash2,
  Search,
  Upload,
  ImageIcon,
  X,
  Loader2,
  FolderOpen,
  RefreshCw,
  Utensils,
} from "lucide-react";

export default function CategoriesPage() {
  const { data: session, status } = useSession();
  const searchParams = useSearchParams();

  // =========================
  // STATE
  // =========================
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);

  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  const [imagePreview, setImagePreview] = useState("");

  const [form, setForm] = useState({
    name: "",
    slug: "",
    description: "",
    image: "",
  });

  // =========================
  // LOAD CATEGORIES
  // =========================
  async function loadCategories() {
    try {
      setLoading(true);

      const response = await fetch("/api/admin/categories", {
        method: "GET",
        cache: "no-store",
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result?.message || "Failed to load categories.");
      }

      setCategories(Array.isArray(result?.data) ? result.data : []);
    } catch (error) {
      console.error("CATEGORY LOAD ERROR:", error);

      Swal.fire({
        icon: "error",
        title: "Failed to load",
        text: error?.message || "Could not load categories.",
        background: "#111",
        color: "#fff",
        confirmButtonColor: "#d4af37",
      });
    } finally {
      setLoading(false);
    }
  }

  // =========================
  // INITIAL LOAD
  // =========================
  useEffect(() => {
    if (status === "authenticated") {
      loadCategories();
    }
  }, [status]);

  // =========================
  // AUTO OPEN ADD MODAL
  // /dashboard/categories?action=add
  // =========================
  useEffect(() => {
    if (status === "authenticated" && searchParams.get("action") === "add") {
      openAddModal();
    }
  }, [status, searchParams]);

  // =========================
  // OPEN ADD MODAL
  // =========================
  function openAddModal() {
    setEditingCategory(null);

    setForm({
      name: "",
      slug: "",
      description: "",
      image: "",
    });

    setImagePreview("");

    setModalOpen(true);
  }

  // =========================
  // OPEN EDIT MODAL
  // =========================
  function openEditModal(category) {
    setEditingCategory(category);

    setForm({
      name: category?.name || "",
      slug: category?.slug || "",
      description: category?.description || "",
      image: category?.image || "",
    });

    setImagePreview(category?.image || "");

    setModalOpen(true);
  }

  // =========================
  // CLOSE MODAL
  // =========================
  function closeModal() {
    if (saving || uploadingImage) {
      return;
    }

    setModalOpen(false);
    setEditingCategory(null);

    setImagePreview("");

    setForm({
      name: "",
      slug: "",
      description: "",
      image: "",
    });
  }

  // =========================
  // NAME CHANGE
  // =========================
  function handleNameChange(value) {
    setForm((prev) => ({
      ...prev,

      name: value,

      slug: editingCategory
        ? prev.slug
        : value
            .toLowerCase()
            .trim()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-+|-+$/g, ""),
    }));
  }

  // =========================
  // IMAGE UPLOAD
  // =========================
  async function handleImageUpload(event) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    // -------------------------
    // Allowed types
    // -------------------------
    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/avif",
    ];

    if (!allowedTypes.includes(file.type)) {
      Swal.fire({
        icon: "error",
        title: "Invalid image",
        text: "JPG, PNG, WebP and AVIF are allowed.",
        background: "#111",
        color: "#fff",
        confirmButtonColor: "#d4af37",
      });

      event.target.value = "";
      return;
    }

    // -------------------------
    // Max 5MB
    // -------------------------
    const maxSize = 5 * 1024 * 1024;

    if (file.size > maxSize) {
      Swal.fire({
        icon: "error",
        title: "Image too large",
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

      // -------------------------
      // Instant local preview
      // -------------------------
      const localPreview = URL.createObjectURL(file);

      setImagePreview(localPreview);

      // -------------------------
      // FormData
      // -------------------------
      const formData = new FormData();

      formData.append("file", file);

      // -------------------------
      // Upload API
      // -------------------------
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

      console.log("CATEGORY IMAGE UPLOAD RESPONSE:", result);

      if (!response.ok) {
        throw new Error(
          result?.message || `Upload failed with status ${response.status}.`,
        );
      }

      if (!result?.success) {
        throw new Error(result?.message || "Image upload failed.");
      }

      // -------------------------
      // Cloudinary URL
      // -------------------------
      const uploadedUrl = result?.data?.url || result?.data?.secure_url;

      if (!uploadedUrl) {
        throw new Error("Image uploaded but Cloudinary URL was not returned.");
      }

      // -------------------------
      // Save URL in form
      // -------------------------
      setForm((prev) => ({
        ...prev,
        image: uploadedUrl,
      }));

      // Replace blob preview
      // with Cloudinary URL
      setImagePreview(uploadedUrl);

      Swal.fire({
        icon: "success",
        title: "Image uploaded",
        text: "Category image uploaded successfully.",
        background: "#111",
        color: "#fff",
        confirmButtonColor: "#d4af37",
        timer: 1400,
        showConfirmButton: false,
      });
    } catch (error) {
      console.error("CATEGORY IMAGE UPLOAD ERROR:", error);

      // Restore old image
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

      // Allow same file selection again
      event.target.value = "";
    }
  }

  // =========================
  // SAVE CATEGORY
  // =========================
  async function handleSubmit(event) {
    event.preventDefault();

    if (!form.name.trim()) {
      Swal.fire({
        icon: "warning",
        title: "Category name required",
        text: "Please enter a category name.",
        background: "#111",
        color: "#fff",
        confirmButtonColor: "#d4af37",
      });

      return;
    }

    try {
      setSaving(true);

      const url = editingCategory
        ? `/api/admin/categories/${editingCategory.id}`
        : "/api/admin/categories";

      const method = editingCategory ? "PATCH" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          name: form.name.trim(),

          slug:
            form.slug.trim() ||
            form.name
              .trim()
              .toLowerCase()
              .replace(/[^a-z0-9]+/g, "-")
              .replace(/^-+|-+$/g, ""),

          description: form.description.trim(),

          image: form.image || null,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result?.message || "Failed to save category.");
      }

      await loadCategories();

      setModalOpen(false);
      setEditingCategory(null);
      setImagePreview("");

      setForm({
        name: "",
        slug: "",
        description: "",
        image: "",
      });

      Swal.fire({
        icon: "success",
        title: editingCategory ? "Category updated" : "Category created",

        text: editingCategory
          ? "Category updated successfully."
          : "Category created successfully.",

        background: "#111",
        color: "#fff",
        confirmButtonColor: "#d4af37",

        timer: 1500,
        showConfirmButton: false,
      });
    } catch (error) {
      console.error("CATEGORY SAVE ERROR:", error);

      Swal.fire({
        icon: "error",
        title: "Save failed",
        text: error?.message || "Could not save category.",
        background: "#111",
        color: "#fff",
        confirmButtonColor: "#d4af37",
      });
    } finally {
      setSaving(false);
    }
  }

  // =========================
  // DELETE CATEGORY
  // =========================
  async function handleDelete(category) {
    const result = await Swal.fire({
      icon: "warning",
      title: "Delete category?",
      text: `"${category.name}" will be deleted.`,
      background: "#111",
      color: "#fff",

      showCancelButton: true,

      confirmButtonColor: "#dc2626",

      cancelButtonColor: "#444",

      confirmButtonText: "Delete",

      cancelButtonText: "Cancel",
    });

    if (!result.isConfirmed) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/categories/${category.id}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.message || "Failed to delete category.");
      }

      setCategories((prev) => prev.filter((item) => item.id !== category.id));

      Swal.fire({
        icon: "success",
        title: "Deleted",
        text: "Category deleted successfully.",

        background: "#111",
        color: "#fff",

        confirmButtonColor: "#d4af37",

        timer: 1400,
        showConfirmButton: false,
      });
    } catch (error) {
      console.error("CATEGORY DELETE ERROR:", error);

      Swal.fire({
        icon: "error",
        title: "Delete failed",
        text: error?.message || "Could not delete category.",
        background: "#111",
        color: "#fff",
        confirmButtonColor: "#d4af37",
      });
    }
  }

  // =========================
  // FILTER
  // =========================
  const filteredCategories = categories.filter((category) => {
    const keyword = search.trim().toLowerCase();

    if (!keyword) {
      return true;
    }

    return (
      category?.name?.toLowerCase().includes(keyword) ||
      category?.slug?.toLowerCase().includes(keyword)
    );
  });

  // =========================
  // LOADING
  // =========================
  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#080808]">
        <Loader2 size={35} className="animate-spin text-[#d4af37]" />
      </div>
    );
  }

  // =========================
  // ACCESS DENIED
  // =========================
  if (
    status === "unauthenticated" ||
    !["ADMIN", "STAFF"].includes(session?.user?.role)
  ) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#080808] px-6">
        <div className="text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-red-500/20 bg-red-500/10">
            <FolderOpen size={30} className="text-red-400" />
          </div>

          <h1 className="mt-5 text-3xl font-bold text-white">Access Denied</h1>

          <p className="mt-3 text-white/50">
            You do not have permission to access this page.
          </p>
        </div>
      </div>
    );
  }

  // =========================
  // MAIN UI
  // =========================
  return (
    <main className="min-h-screen bg-[#080808] px-4 py-8 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        {/* =====================
            HEADER
        ====================== */}
        <div className="mb-8 flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2">
              <FolderOpen size={18} className="text-[#d4af37]" />

              <span className="text-xs font-semibold uppercase tracking-[0.25em] text-[#d4af37]">
                Restaurant
              </span>
            </div>

            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Categories
            </h1>

            <p className="mt-2 max-w-xl text-sm text-white/45">
              Manage your restaurant food categories and category images.
            </p>
          </div>

          <button
            onClick={openAddModal}
            className="flex items-center justify-center gap-2 rounded-xl bg-[#d4af37] px-5 py-3 font-semibold text-black transition hover:-translate-y-0.5 hover:bg-[#f1d77a]"
          >
            <Plus size={18} />
            Add Category
          </button>
        </div>

        {/* =====================
            STATS
        ====================== */}
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-[#111] p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-wider text-white/40">
                  Total Categories
                </p>

                <p className="mt-2 text-3xl font-bold">{categories.length}</p>
              </div>

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#d4af37]/10 text-[#d4af37]">
                <FolderOpen size={21} />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-[#111] p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-wider text-white/40">
                  Menu Items
                </p>

                <p className="mt-2 text-3xl font-bold">
                  {categories.reduce(
                    (total, category) =>
                      total + (category?._count?.menuItems || 0),
                    0,
                  )}
                </p>
              </div>

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#d4af37]/10 text-[#d4af37]">
                <Utensils size={21} />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-[#111] p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-wider text-white/40">
                  With Images
                </p>

                <p className="mt-2 text-3xl font-bold">
                  {
                    categories.filter((category) => Boolean(category.image))
                      .length
                  }
                </p>
              </div>

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#d4af37]/10 text-[#d4af37]">
                <ImageIcon size={21} />
              </div>
            </div>
          </div>
        </div>

        {/* =====================
            SEARCH
        ====================== */}
        <div className="mb-6 flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search
              size={18}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-white/35"
            />

            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search category..."
              className="w-full rounded-xl border border-white/10 bg-[#111] py-3 pl-11 pr-4 text-sm text-white outline-none transition placeholder:text-white/25 focus:border-[#d4af37]/50"
            />
          </div>

          <button
            onClick={loadCategories}
            disabled={loading}
            className="flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-[#111] px-5 py-3 text-sm text-white/70 transition hover:border-[#d4af37]/30 hover:text-[#d4af37]"
          >
            <RefreshCw size={17} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>

        {/* =====================
            CATEGORY LIST
        ====================== */}
        {loading ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({
              length: 8,
            }).map((_, index) => (
              <div
                key={index}
                className="h-80 animate-pulse rounded-2xl border border-white/10 bg-[#111]"
              />
            ))}
          </div>
        ) : filteredCategories.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-[#111] px-6 py-24 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-white/5">
              <FolderOpen size={32} className="text-white/20" />
            </div>

            <h2 className="mt-5 text-xl font-semibold">No categories found</h2>

            <p className="mt-2 text-sm text-white/40">
              Create your first food category.
            </p>

            <button
              onClick={openAddModal}
              className="mt-6 rounded-xl bg-[#d4af37] px-5 py-3 text-sm font-semibold text-black hover:bg-[#f1d77a]"
            >
              Create Category
            </button>
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredCategories.map((category) => (
              <div
                key={category.id}
                className="group overflow-hidden rounded-2xl border border-white/10 bg-[#111] transition duration-300 hover:-translate-y-1 hover:border-[#d4af37]/30"
              >
                {/* IMAGE */}
                <div className="relative aspect-[4/3] overflow-hidden bg-[#181818]">
                  {category.image ? (
                    category.image.startsWith("https://res.cloudinary.com/") ? (
                      <Image
                        src={category.image}
                        alt={category.name}
                        fill
                        sizes="(max-width: 768px) 100vw, 33vw"
                        className="object-cover transition duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <img
                        src={category.image}
                        alt={category.name}
                        className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                      />
                    )
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <ImageIcon size={45} className="text-white/15" />
                    </div>
                  )}

                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />

                  <div className="absolute bottom-4 left-4">
                    <span className="rounded-full border border-white/10 bg-black/50 px-3 py-1 text-xs text-white/80 backdrop-blur-md">
                      {category?._count?.menuItems || 0} items
                    </span>
                  </div>
                </div>

                {/* CONTENT */}
                <div className="p-5">
                  <h2 className="truncate text-lg font-semibold">
                    {category.name}
                  </h2>

                  <p className="mt-1 truncate text-xs text-[#d4af37]">
                    /{category.slug}
                  </p>

                  {category.description && (
                    <p className="mt-3 line-clamp-2 min-h-[40px] text-sm leading-5 text-white/45">
                      {category.description}
                    </p>
                  )}

                  <div className="mt-5 flex items-center justify-between border-t border-white/10 pt-4">
                    <div className="flex items-center gap-2 text-xs text-white/35">
                      <Utensils size={14} />
                      {category?._count?.menuItems || 0} menu items
                    </div>

                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => openEditModal(category)}
                        className="rounded-lg border border-white/10 p-2 text-white/55 transition hover:border-[#d4af37]/40 hover:text-[#d4af37]"
                      >
                        <Pencil size={16} />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDelete(category)}
                        className="rounded-lg border border-red-500/10 p-2 text-red-400 transition hover:bg-red-500/10"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ==================================================
          ADD / EDIT CATEGORY MODAL
      ================================================== */}
      {modalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4 backdrop-blur-md">
          <div className="flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl border border-white/10 bg-[#111] shadow-2xl">
            {/* MODAL HEADER */}
            <div className="flex shrink-0 items-center justify-between border-b border-white/10 px-6 py-5">
              <div>
                <div className="flex items-center gap-2">
                  <FolderOpen size={18} className="text-[#d4af37]" />

                  <h2 className="text-xl font-bold">
                    {editingCategory ? "Edit Category" : "Add Category"}
                  </h2>
                </div>

                <p className="mt-1 text-sm text-white/40">
                  {editingCategory
                    ? "Update category information and image."
                    : "Create a new restaurant food category."}
                </p>
              </div>

              <button
                type="button"
                onClick={closeModal}
                disabled={saving || uploadingImage}
                className="rounded-xl p-2 text-white/45 transition hover:bg-white/5 hover:text-white disabled:opacity-30"
              >
                <X size={21} />
              </button>
            </div>

            {/* MODAL BODY */}
            <div className="overflow-y-auto">
              <form onSubmit={handleSubmit} className="space-y-6 p-6">
                {/* CATEGORY NAME */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-white">
                    Category Name
                    <span className="ml-1 text-red-400">*</span>
                  </label>

                  <input
                    type="text"
                    value={form.name}
                    onChange={(event) => handleNameChange(event.target.value)}
                    placeholder="e.g. Main Course"
                    className="w-full rounded-xl border border-white/10 bg-[#080808] px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/20 focus:border-[#d4af37]/60"
                  />
                </div>

                {/* SLUG */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-white">
                    Slug
                  </label>

                  <input
                    type="text"
                    value={form.slug}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        slug: event.target.value,
                      }))
                    }
                    placeholder="main-course"
                    className="w-full rounded-xl border border-white/10 bg-[#080808] px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/20 focus:border-[#d4af37]/60"
                  />

                  <p className="mt-2 text-xs text-white/30">
                    Example: main-course
                  </p>
                </div>

                {/* DESCRIPTION */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-white">
                    Description
                  </label>

                  <textarea
                    rows={4}
                    value={form.description}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        description: event.target.value,
                      }))
                    }
                    placeholder="Write a short category description..."
                    className="w-full resize-none rounded-xl border border-white/10 bg-[#080808] px-4 py-3 text-sm leading-6 text-white outline-none transition placeholder:text-white/20 focus:border-[#d4af37]/60"
                  />
                </div>

                {/* ==================================================
                    IMAGE UPLOAD
                ================================================== */}
                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <label className="block text-sm font-medium text-white">
                      Category Image
                    </label>

                    {form.image && (
                      <span className="text-xs text-emerald-400">
                        Image uploaded
                      </span>
                    )}
                  </div>

                  <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#080808]">
                    {/* IMAGE PREVIEW */}
                    <div className="relative aspect-[16/9] overflow-hidden bg-[#151515]">
                      {imagePreview ? (
                        <Image
                          src={imagePreview}
                          alt="Category preview"
                          fill
                          sizes="700px"
                          unoptimized={imagePreview.startsWith("blob:")}
                          className="object-cover"
                        />
                      ) : (
                        <div className="flex h-full flex-col items-center justify-center">
                          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/5">
                            <ImageIcon size={28} className="text-white/20" />
                          </div>

                          <p className="mt-3 text-sm text-white/30">
                            No image selected
                          </p>
                        </div>
                      )}

                      {/* DARK OVERLAY */}
                      {imagePreview && (
                        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                      )}

                      {/* UPLOAD LOADING */}
                      {uploadingImage && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/75 backdrop-blur-sm">
                          <Loader2
                            size={34}
                            className="animate-spin text-[#d4af37]"
                          />

                          <p className="mt-3 text-sm font-medium text-white">
                            Uploading image...
                          </p>

                          <p className="mt-1 text-xs text-white/40">
                            Please wait
                          </p>
                        </div>
                      )}
                    </div>

                    {/* CHOOSE FILE */}
                    <div className="p-4">
                      <label
                        className={`flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-[#d4af37]/30 bg-[#d4af37]/10 px-4 py-3 text-sm font-semibold text-[#d4af37] transition hover:bg-[#d4af37]/20 ${
                          uploadingImage || saving
                            ? "pointer-events-none opacity-50"
                            : ""
                        }`}
                      >
                        {uploadingImage ? (
                          <>
                            <Loader2 size={18} className="animate-spin" />
                            Uploading...
                          </>
                        ) : (
                          <>
                            <Upload size={18} />

                            {imagePreview
                              ? "Choose Another Image"
                              : "Choose File"}
                          </>
                        )}

                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/webp,image/avif"
                          onChange={handleImageUpload}
                          disabled={uploadingImage || saving}
                          className="hidden"
                        />
                      </label>

                      <p className="mt-2 text-center text-xs text-white/30">
                        JPG, PNG, WebP or AVIF
                        {" • "}
                        Maximum 5MB
                      </p>
                    </div>
                  </div>
                </div>

                {/* BUTTONS */}
                <div className="flex flex-col-reverse gap-3 border-t border-white/10 pt-5 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    onClick={closeModal}
                    disabled={saving || uploadingImage}
                    className="rounded-xl border border-white/10 px-6 py-3 text-sm font-medium text-white/65 transition hover:bg-white/5 hover:text-white disabled:opacity-30"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={saving || uploadingImage || !form.name.trim()}
                    className="flex items-center justify-center gap-2 rounded-xl bg-[#d4af37] px-6 py-3 text-sm font-bold text-black transition hover:bg-[#f1d77a] disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {saving && <Loader2 size={17} className="animate-spin" />}

                    {saving
                      ? "Saving..."
                      : editingCategory
                        ? "Update Category"
                        : "Create Category"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
