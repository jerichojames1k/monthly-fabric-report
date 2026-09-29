import { useState } from "react";
import type { ChangeEvent, SubmitEvent } from "react";
import { type FabCode, useFabCodeStore } from "../stores/fabricCodeStore";
import React, { useTransition } from "react";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import { format, parse, isValid } from "date-fns";
type DynamicRow = Record<string, any>;

interface FormData {
  date: string;
  name: string;
  defects: string;
  yards: string;
}

interface FormErrors {
  date?: string;
  name?: string;
  defects?: string;
  yards?: string;
}

const initialForm: FormData = {
  date: "",
  name: "",
  defects: "",
  yards: "",
};

export default function FabCodeManager() {
  const {
    fabCodes,
    addFabCode,
    updateFabCode,
    removeFabCode,

    monthlyReport,
    showMonthlyReport,
    generateMonthlyReport,
    hideMonthlyReport,
    clearAllData,
  } = useFabCodeStore();

  const [isPending, startTransition] = useTransition();
  const [statusText, setStatusText] = useState<string>("");

  const [validationError, setValidationError] = useState<string | null>(null);

  const [form, setForm] = useState<FormData>(initialForm);

  const [errors, setErrors] = useState<FormErrors>({});

  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<number>(9);
  // --------------------------------
  // Handle input changes
  // --------------------------------

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    // Do NOT hide monthly report here.
    // Typing in the form will keep the report open.

    setForm((prev) => ({
      ...prev,
      [name]: name === "name" ? value.toUpperCase() : value,
    }));

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
    if (!form.date) {
      newErrors.date = "Date is required.";
    }

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
      date: form?.date,
      name: form.name.trim(),
      defects: Number(form.defects),
      yards: Number(form.yards),
    };

    if (editingId) {
      // Update existing data
      updateFabCode(editingId, data);
    } else {
      // Add new data
      addFabCode(data);
    }

    // Close monthly report after
    // successful Add / Update
    hideMonthlyReport();

    resetForm();
  };

  // --------------------------------
  // Edit
  // --------------------------------

  const handleEdit = (fabCode: FabCode) => {
    // Close monthly report
    // immediately when Edit is clicked
    hideMonthlyReport();

    setEditingId(fabCode.id);

    setForm({
      date: fabCode?.date as string,
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

    // Close monthly report after delete
    hideMonthlyReport();

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

  // --------------------------------
  // Generate monthly report
  // --------------------------------

  const handleGenerateMonthlyReport = () => {
    generateMonthlyReport();
  };
  const handleClearAllData = () => {
    const confirmed = window.confirm(
      "Are you sure you want to clear ALL FAB code data?\n\nThis action cannot be undone.",
    );

    if (!confirmed) {
      return;
    }

    clearAllData();

    // Also reset the form
    resetForm();
  };

  // Yield control back to the main thread to keep the UI smooth during reading
  const yieldToMain = () => new Promise((resolve) => setTimeout(resolve, 0));

  // Extract primitive value from ExcelJS cell objects (handles formulas, rich text, etc.)
  const extractCellValue = (value: ExcelJS.CellValue): any => {
    if (value === null || value === undefined) return "";
    if (typeof value === "object") {
      if ("result" in value) return value.result; // Formula result
      if ("text" in value) return value.text; // Rich text
    }
    return value;
  };

  const exportMonthlyReport = async () => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Monthly Report");

    // Header
    worksheet.columns = [
      { header: "No.", key: "no", width: 10 },
      { header: "Name", key: "name", width: 25 },
      { header: "Total Defects", key: "totalDefects", width: 18 },
      { header: "Total Yards", key: "totalYards", width: 18 },
      { header: "Result %", key: "result", width: 15 },
    ];

    // Data
    monthlyReport.forEach((item, index) => {
      worksheet.addRow({
        no: index + 1,
        name: item.name,
        totalDefects: item.totalDefects,
        totalYards: item.totalYards,
        result: item.result,
      });
    });

    // Format header
    const headerRow = worksheet.getRow(1);

    headerRow.font = {
      bold: true,
    };

    headerRow.alignment = {
      horizontal: "center",
      vertical: "middle",
    };

    // Format data
    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber > 1) {
        row.alignment = {
          horizontal: "center",
          vertical: "middle",
        };
      }
    });

    // Number formats
    worksheet.getColumn("totalYards").numFmt = "0.00";
    worksheet.getColumn("result").numFmt = "0.00";

    // Create Excel file
    const buffer = await workbook.xlsx.writeBuffer();

    // Save file
    const blob = new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    saveAs(blob, "monthly-report.xlsx");
  };

  const handleFileUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) return;

    setStatusText("Reading file...");
    setValidationError(null);

    try {
      const buffer = await file.arrayBuffer();

      startTransition(async () => {
        const workbook = new ExcelJS.Workbook();

        try {
          await workbook.xlsx.load(buffer);
        } catch (err) {
          console.error(err);

          setValidationError("Invalid or corrupted Excel file format.");
          setStatusText("Validation failed.");
          return;
        }

        const worksheet = workbook.worksheets[0];

        if (!worksheet || worksheet.rowCount <= 0) {
          setValidationError("The Excel file is completely empty.");
          setStatusText("Validation failed.");
          return;
        }

        const expectedHeaders = [
          "DATE",
          "FABRIC CODE/COLOR",
          "TOTAL YARDS INSPECTED QTY.",
          "TTL.DEFECT QTY.",
        ];

        const headerRow = worksheet.getRow(1);
        console.log("🚀 ~ handleFileUpload ~ headerRow:", headerRow);

        const colIndexMap: Record<string, number> = {};

        headerRow.eachCell({ includeEmpty: false }, (cell, colNumber) => {
          const rawHeader = extractCellValue(cell.value);

          const headerName = String(rawHeader).trim().toUpperCase();
          console.log("🚀 ~ handleFileUpload ~ headerName:", headerName);

          if (headerName == "DATE") {
            colIndexMap["DATE"] = colNumber;
          }

          const normalizedHeader = headerName.replace(/\s+/g, "");
          console.log(
            "🚀 ~ handleFileUpload ~ normalizedHeader:",
            normalizedHeader,
          );

          if (
            normalizedHeader.includes("FABRICCODE") ||
            normalizedHeader.includes("COLOR/CODE")
          ) {
            colIndexMap["FABRIC CODE/COLOR"] = colNumber;
          }

          if (normalizedHeader.includes("TOTALYARDSINSPECTEDQTY.")) {
            colIndexMap["TOTAL YARDS INSPECTED QTY."] = colNumber;
          }

          if (
            normalizedHeader.includes("TTL.DEFECTQTY.") ||
            normalizedHeader.includes("TOTALDEFECTQTY.")
          ) {
            colIndexMap["TTL.DEFECT QTY."] = colNumber;
          }
        });

        const missingHeaders = expectedHeaders.filter(
          (header) => !colIndexMap[header],
        );
        console.log("🚀 ~ handleFileUpload ~ colIndexMap:", colIndexMap);

        console.log("🚀 ~ handleFileUpload ~ missingHeaders:", missingHeaders);

        if (missingHeaders.length > 0) {
          setValidationError(
            `Missing required column(s): ${missingHeaders.join(", ")}`,
          );
          setStatusText("Validation failed.");
          return;
        }

        const totalRows = worksheet.rowCount;
        const parsedRows: DynamicRow[] = [];
        console.log("🚀 ~ handleFileUpload ~ parsedRows:", parsedRows);
        const CHUNK_SIZE = 500;

        for (let rowNumber = 2; rowNumber <= totalRows; rowNumber++) {
          const row = worksheet.getRow(rowNumber);

          if (!row.hasValues) continue;

          const dateCellValue = extractCellValue(
            row.getCell(colIndexMap["DATE"]).value,
          );

          let parsedDate: Date;

          if (dateCellValue instanceof Date) {
            parsedDate = dateCellValue;
          } else {
            const dateString = String(dateCellValue).trim();

            parsedDate = parse(dateString, "MM/dd/yyyy", new Date());
          }

          if (!isValid(parsedDate)) {
            continue;
          }

          const rowMonth = parsedDate.getMonth() + 1;
          const rowYear = parsedDate.getFullYear();

          if (rowMonth !== 9 || rowYear !== 2026) {
            continue;
          }

          const fabricCodeValue = extractCellValue(
            row.getCell(colIndexMap["FABRIC CODE/COLOR"]).value,
          );

          const fabricCodeOnly = String(fabricCodeValue)
            .trim()
            .split("-")[0]
            .trim();

          const totalYardsValue = extractCellValue(
            row.getCell(colIndexMap["TOTAL YARDS INSPECTED QTY."]).value,
          );

          const defectQtyValue = extractCellValue(
            row.getCell(colIndexMap["TTL.DEFECT QTY."]).value,
          );

          parsedRows.push({
            id: crypto.randomUUID(),
            date: format(parsedDate, "yyyy-MM-dd"),
            name: fabricCodeOnly,
            yards: Number(totalYardsValue || 0),
            defects: Number(defectQtyValue || 0),
          });

          if (rowNumber % CHUNK_SIZE === 0) {
            setStatusText(`Reading row ${rowNumber} of ${totalRows}...`);

            await yieldToMain();
          }
        }
        console.log("🚀 ~ handleFileUpload ~ parsedRows:", parsedRows);

        addFabCode([...parsedRows] as any);

        setStatusText(
          `Successfully loaded ${parsedRows.length} rows for September 2026.`,
        );
      });
    } catch (err) {
      console.error(err);

      setValidationError("Failed to process the Excel file.");

      setStatusText("Error");
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto p-4 sm:p-6">
      {/* ============================
          FORM
      ============================ */}

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
          {/* ============================
              INPUTS
          ============================ */}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label
                htmlFor="date"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Date <span className="text-red-500">*</span>
              </label>

              <input
                id="date"
                name="date"
                type="date"
                value={form.date}
                onChange={handleChange}
                className={`w-full rounded-lg border px-3 py-2.5 outline-none transition
                ${
                  errors.date
                    ? "border-red-500 focus:ring-2 focus:ring-red-100"
                    : "border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                }
              `}
              />

              {errors.date && (
                <p className="mt-1 text-sm text-red-500">{errors.date}</p>
              )}
            </div>
            {/* Name */}

            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Name <span className="text-red-500">*</span>
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
                Defects <span className="text-red-500">*</span>
              </label>

              <input
                id="defects"
                name="defects"
                type="number"
                min="0"
                value={form.defects}
                onChange={handleChange}
                placeholder="Enter defects"
                onKeyDown={(e) => {
                  if (["-", ".", "e", "E", "+"].includes(e.key)) {
                    e.preventDefault();
                  }
                }}
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
                Yards <span className="text-red-500">*</span>
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
                onKeyDown={(e) => {
                  if (["-", "e", "E", "+"].includes(e.key)) {
                    e.preventDefault();
                  }
                }}
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

          {/* ============================
              FORM BUTTONS
          ============================ */}

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
          FAB CODE TABLE
      ============================ */}

      <div className="mt-6 bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <div className="p-4 sm:p-6 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-gray-800">FAB Codes</h2>

              <p className="text-sm text-gray-500 mt-1">
                Total records: {fabCodes.length}
              </p>
            </div>

            <button
              type="button"
              onClick={handleGenerateMonthlyReport}
              disabled={fabCodes.length === 0}
              className="w-full sm:w-auto px-5 py-2.5 rounded-lg
                bg-blue-600
                text-white
                hover:bg-blue-700
                disabled:bg-gray-300
                disabled:cursor-not-allowed
                transition"
            >
              Generate Monthly Report
            </button>
            <button
              type="button"
              onClick={handleClearAllData}
              disabled={fabCodes.length === 0}
              className="w-full sm:w-auto px-5 py-2.5 rounded-lg
              bg-red-600
              text-white
              hover:bg-red-700
              disabled:bg-gray-300
              disabled:cursor-not-allowed
              transition"
            >
              Clear All Data
            </button>
            <div className="flex items-center cursor-pointer border-2">
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(Number(e.target.value))}
              >
                <option value={1}>January</option>
                <option value={2}>February</option>
                <option value={3}>March</option>
                <option value={4}>April</option>
                <option value={5}>May</option>
                <option value={6}>June</option>
                <option value={7}>July</option>
                <option value={8}>August</option>
                <option value={9}>September</option>
                <option value={10}>October</option>
                <option value={11}>November</option>
                <option value={12}>December</option>
              </select>
              <p>Select a month</p>
            </div>

            <div>
              <label
                className={`flex items-center cursor-pointer group ${
                  isPending ? "opacity-50 pointer-events-none" : ""
                }`}
              >
                {/* Hidden File Input (Accepts any file selected) */}
                <input
                  type="file"
                  className="hidden"
                  onChange={handleFileUpload}
                  disabled={isPending}
                />
                <svg
                  className="download-icon text-gray-600 group-hover:text-green-500 transition-colors"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                </svg>

                {/* Label Text */}
                <p className="text-gray-700 group-hover:text-green-500 transition-colors">
                  Upload Excel File
                </p>
              </label>
            </div>
          </div>
        </div>

        <div className="max-h-[500px] overflow-auto">
          <table className="w-full min-w-[650px]">
            <thead className="sticky top-0 z-10 bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">
                  No.
                </th>
                <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">
                  Date
                </th>
                <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">
                  Name
                </th>

                <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">
                  Defects
                </th>

                <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">
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
                fabCodes.map((fabCode, index) => (
                  <tr key={fabCode.id} className="hover:bg-gray-50 transition">
                    <td className="px-4 py-3 text-sm text-center text-gray-600">
                      {index + 1}
                    </td>
                    <td className="px-4 py-3 text-sm text-center font-medium text-gray-800">
                      {fabCode?.date}
                    </td>
                    <td className="px-4 py-3 text-sm text-center font-medium text-gray-800">
                      {fabCode.name}
                    </td>

                    <td className="px-4 py-3 text-sm text-center text-gray-600">
                      {fabCode.defects}
                    </td>

                    <td className="px-4 py-3 text-sm text-center text-gray-600">
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
      {/* Excel File Data */}
      <div style={{ padding: "20px", fontFamily: "sans-serif" }}>
        {isPending && <p>Processing... {statusText}</p>}
        {!isPending && statusText && (
          <p>
            <strong>Status:</strong> {statusText}
          </p>
        )}

        {/* Show single file-level validation error */}
        {validationError && (
          <div style={{ marginTop: "15px", color: "red", fontWeight: "bold" }}>
            Error: {validationError}
          </div>
        )}
      </div>
      {/* ============================
          MONTHLY REPORT
      ============================ */}

      {showMonthlyReport && (
        <div className="mt-6 bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
          {/* Report Header */}

          <div className="p-4 sm:p-6 border-b border-gray-200">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-gray-800">
                  Monthly Report
                </h2>

                <p className="text-sm text-gray-500 mt-1">
                  Total FAB codes: {monthlyReport.length}
                </p>
              </div>
              <div className="inline-flex gap-2">
                <button
                  type="button"
                  onClick={exportMonthlyReport}
                  disabled={monthlyReport.length === 0}
                  className="w-full sm:w-auto px-4 py-2 rounded-lg
                bg-green-600
                text-white
                hover:bg-green-700
                disabled:bg-gray-300
                disabled:cursor-not-allowed
                transition"
                >
                  Download as Excel
                </button>
                <button
                  type="button"
                  onClick={hideMonthlyReport}
                  className="w-full sm:w-auto px-4 py-2 rounded-lg
                  border border-gray-300
                  text-gray-700
                  hover:bg-gray-50
                  transition"
                >
                  Close Report
                </button>
              </div>
            </div>
          </div>

          {/* Report Table */}

          <div className="max-h-[600px] overflow-auto">
            <table className="w-full min-w-[650px]">
              <thead className="sticky top-0 z-10 bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">
                    No.
                  </th>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">
                    Date
                  </th>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">
                    Name
                  </th>

                  <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">
                    Total Defects
                  </th>

                  <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">
                    Total Yards
                  </th>

                  <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">
                    Result %
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">
                {monthlyReport.length === 0 ? (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-4 py-10 text-center text-gray-500"
                    >
                      No monthly report data.
                    </td>
                  </tr>
                ) : (
                  monthlyReport.map((item, index) => (
                    <tr
                      key={`${item.name}-${index}`}
                      className="hover:bg-gray-50 transition"
                    >
                      <td className="px-4 py-3 text-sm text-center text-gray-600">
                        {index + 1}
                      </td>
                      <td className="px-4 py-3 text-sm text-center font-medium text-gray-800">
                        {item?.date ?? ""}
                      </td>
                      {/* Name */}

                      <td className="px-4 py-3 text-sm text-center font-medium text-gray-800">
                        {item.name}
                      </td>

                      {/* Total Defects */}

                      <td className="px-4 py-3 text-sm text-center text-gray-600">
                        {item.totalDefects}
                      </td>

                      {/* Total Yards */}

                      <td className="px-4 py-3 text-sm text-center text-gray-600">
                        {item.totalYards.toFixed(2)}
                      </td>

                      {/* Result */}

                      <td className="px-4 py-3 text-sm text-center font-semibold text-green-500">
                        {item.result}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
