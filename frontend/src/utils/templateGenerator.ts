import * as XLSX from "xlsx";
import { downloadBlob } from "./fileDownload";
import { REQUIRED_IMPORT_COLUMNS } from "./fileValidationUtils";

const TEMPLATE_SAMPLE_ROW = {
  survived: 1,
  pclass: 1,
  sex: "female",
  age: 29,
  fare: 82.17,
  embarked: "C"
};

const toCsvCell = (value: string | number): string => {
  const raw = String(value);
  if (/[",\n]/.test(raw)) {
    return `"${raw.replace(/"/g, "\"\"")}"`;
  }
  return raw;
};

export const downloadCsvTemplate = (): void => {
  const headerLine = REQUIRED_IMPORT_COLUMNS.join(",");
  const sampleLine = REQUIRED_IMPORT_COLUMNS.map((column) =>
    toCsvCell(TEMPLATE_SAMPLE_ROW[column])
  ).join(",");
  const csv = `\uFEFF${headerLine}\n${sampleLine}\n`;
  downloadBlob(new Blob([csv], { type: "text/csv;charset=utf-8;" }), "dashboard_import_template.csv");
};

export const downloadExcelTemplate = (): void => {
  const workbook = XLSX.utils.book_new();
  const rows = [TEMPLATE_SAMPLE_ROW];
  const worksheet = XLSX.utils.json_to_sheet(rows, {
    header: [...REQUIRED_IMPORT_COLUMNS]
  });
  XLSX.utils.book_append_sheet(workbook, worksheet, "Template");
  const output = XLSX.write(workbook, {
    bookType: "xlsx",
    type: "array"
  });
  downloadBlob(
    new Blob([output], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    }),
    "dashboard_import_template.xlsx"
  );
};
