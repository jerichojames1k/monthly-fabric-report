export const parseNumericCellValue = (cellValue: any): number => {
  // 1. Handle null, undefined, or empty string
  if (cellValue === null || cellValue === undefined || cellValue === "") {
    return 0;
  }

  // 2. Handle ExcelJS Formula objects ({ formula: '...', result: '0' })
  if (typeof cellValue === "object") {
    if ("result" in cellValue) cellValue = cellValue.result;
    else if ("text" in cellValue) cellValue = cellValue.text;
  }

  // 3. Handle String values (e.g. "0", "0 ", " 0 ", "$0.00")
  if (typeof cellValue === "string") {
    // Trim normal whitespace and non-breaking spaces (\u00A0)
    const sanitized = cellValue.replace(/\u00A0/g, " ").trim();

    // Strip out currency/formatting symbols except digits, minus, and decimal point
    const cleaned = sanitized.replace(/[^0-9.-]/g, "");

    if (cleaned === "" || cleaned === "-") return 0;

    const parsed = Number(cleaned);
    return isNaN(parsed) ? 0 : parsed;
  }

  // 4. Handle direct numbers or booleans
  const num = Number(cellValue);
  return isNaN(num) ? 0 : num;
};
