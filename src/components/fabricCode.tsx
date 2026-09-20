import { useState } from "react";
import type { SubmitEvent } from "react";
import { type FabCode, useFabCodeStore } from "../stores/fabricCodeStore";

interface FormData {
  name: string;
  defects: string;
  yards: string;
}

interface FormErrors {
  name?: string;
  defects?: string;
  yards?: string;
}

const initialForm: FormData = {
  name: "",
  defects: "",
  yards: "",
};

export default function FabCodeManager() {
  const { fabCodes, addFabCode, updateFabCode, removeFabCode } =
    useFabCodeStore();

  const [form, setForm] = useState<FormData>(initialForm);

  const [errors, setErrors] = useState<FormErrors>({});

  const [editingId, setEditingId] = useState<string | null>(null);

  // --------------------------------
  // Handle input changes
  // --------------------------------

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Remove error for this field
    setErrors((prev) => ({
      ...prev,
      [name]: undefined,
    }));
  };

  // --------------------------------
  // Validation
  // --------------------------------

  const validate = (): boolean => {
    const newErrors: FormErrors = {};

    if (!form.name.trim()) {
      newErrors.name = "Name is required.";
    }

    if (!form.defects.trim()) {
      newErrors.defects = "Defects is required.";
    } else if (Number(form.defects) < 0) {
      newErrors.defects = "Defects cannot be negative.";
    }

    if (!form.yards.trim()) {
      newErrors.yards = "Yards is required.";
    } else if (Number(form.yards) < 0) {
      newErrors.yards = "Yards cannot be negative.";
    }

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  };

  // --------------------------------
  // Submit
  // --------------------------------

  const handleSubmit = (e: SubmitEvent) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    const data = {
      name: form.name.trim(),
      defects: Number(form.defects),
      yards: Number(form.yards),
    };

    // Edit
    if (editingId) {
      updateFabCode(editingId, data);
    }

    // Create
    else {
      addFabCode(data);
    }

    resetForm();
  };

  // --------------------------------
  // Edit
  // --------------------------------

  const handleEdit = (fabCode: FabCode) => {
    setEditingId(fabCode.id);

    setForm({
      name: fabCode.name,
      defects: String(fabCode.defects),
      yards: String(fabCode.yards),
    });

    setErrors({});

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  // --------------------------------
  // Delete
  // --------------------------------

  const handleDelete = (id: string) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this FAB code?",
    );

    if (!confirmed) {
      return;
    }

    removeFabCode(id);

    // If currently editing this record
    if (editingId === id) {
      resetForm();
    }
  };

  // --------------------------------
  // Reset
  // --------------------------------

  const resetForm = () => {
    setForm(initialForm);
    setErrors({});
    setEditingId(null);
  };

  return (
    <div className="w-full max-w-6xl mx-auto p-4 sm:p-6">
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-4 sm:p-6">
        <div className="mb-6">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-800">
            {editingId ? "Edit FAB Code" : "Add FAB Code"}
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            {editingId
              ? "Update the FAB code information."
              : "Enter the FAB code information."}
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Inputs */}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Name */}

            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Name
              </label>

              <input
                id="name"
                name="name"
                type="text"
                value={form.name}
                onChange={handleChange}
                placeholder="Enter name"
                className={`w-full rounded-lg border px-3 py-2.5
                  outline-none transition
                  ${
                    errors.name
                      ? "border-red-500 focus:ring-2 focus:ring-red-200"
                      : "border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  }`}
              />

              {errors.name && (
                <p className="mt-1 text-sm text-red-500">{errors.name}</p>
              )}
            </div>

            {/* Defects */}

            <div>
              <label
                htmlFor="defects"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Defects
              </label>

              <input
                id="defects"
                name="defects"
                type="number"
                min="0"
                value={form.defects}
                onChange={handleChange}
                placeholder="Enter defects"
                className={`w-full rounded-lg border px-3 py-2.5
                  outline-none transition
                  ${
                    errors.defects
                      ? "border-red-500 focus:ring-2 focus:ring-red-200"
                      : "border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  }`}
              />

              {errors.defects && (
                <p className="mt-1 text-sm text-red-500">{errors.defects}</p>
              )}
            </div>

            {/* Yards */}

            <div>
              <label
                htmlFor="yards"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Yards
              </label>

              <input
                id="yards"
                name="yards"
                type="number"
                min="0"
                step="0.01"
                value={form.yards}
                onChange={handleChange}
                placeholder="Enter yards"
                className={`w-full rounded-lg border px-3 py-2.5
                  outline-none transition
                  ${
                    errors.yards
                      ? "border-red-500 focus:ring-2 focus:ring-red-200"
                      : "border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  }`}
              />

              {errors.yards && (
                <p className="mt-1 text-sm text-red-500">{errors.yards}</p>
              )}
            </div>
          </div>

          {/* Buttons */}

          <div className="flex flex-col sm:flex-row justify-end gap-2 mt-6">
            {editingId && (
              <button
                type="button"
                onClick={resetForm}
                className="w-full sm:w-auto px-5 py-2.5 rounded-lg
                  border border-gray-300
                  text-gray-700
                  hover:bg-gray-50
                  transition"
              >
                Cancel
              </button>
            )}

            <button
              type="submit"
              className="w-full sm:w-auto px-5 py-2.5 rounded-lg
                bg-blue-600
                text-white
                hover:bg-blue-700
                transition"
            >
              {editingId ? "Update" : "Add"}
            </button>
          </div>
        </form>
      </div>

      {/* ============================
          TABLE
      ============================ */}

      <div className="mt-6 bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        {/* Table header */}

        <div className="p-4 sm:p-6 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <h2 className="text-xl font-bold text-gray-800">FAB Codes</h2>

              <p className="text-sm text-gray-500 mt-1">
                Total records: {fabCodes.length}
              </p>
            </div>
          </div>
        </div>

        {/* Responsive table */}

        <div className="overflow-x-auto">
          <table className="w-full min-w-[650px]">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                  Name
                </th>

                <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">
                  Defects
                </th>

                <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">
                  Yards
                </th>

                <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100">
              {fabCodes.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    className="px-4 py-10 text-center text-gray-500"
                  >
                    No FAB codes found.
                  </td>
                </tr>
              ) : (
                fabCodes.map((fabCode) => (
                  <tr key={fabCode.id} className="hover:bg-gray-50 transition">
                    <td className="px-4 py-3 text-sm font-medium text-gray-800">
                      {fabCode.name}
                    </td>

                    <td className="px-4 py-3 text-sm text-right text-gray-600">
                      {fabCode.defects}
                    </td>

                    <td className="px-4 py-3 text-sm text-right text-gray-600">
                      {fabCode.yards}
                    </td>

                    <td className="px-4 py-3">
                      <div className="flex justify-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleEdit(fabCode)}
                          className="px-3 py-1.5 rounded-md
                            bg-blue-100
                            text-blue-700
                            hover:bg-blue-200
                            transition"
                        >
                          Edit
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDelete(fabCode.id)}
                          className="px-3 py-1.5 rounded-md
                            bg-red-100
                            text-red-700
                            hover:bg-red-200
                            transition"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
