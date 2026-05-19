import * as XLSX from "xlsx";
import type { ImportedPassengerRow } from "../types";
import {
  ImportValidationError,
  validateAndNormalizePassengerRows
} from "../utils/fileValidationUtils";

type ImportResult = {
  fileName: string;
  rows: ImportedPassengerRow[];
  warnings: string[];
};

const parseCsvLine = (line: string): string[] => {
  const values: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    const next = line[index + 1];

    if (char === "\"") {
      if (inQuotes && next === "\"") {
        current += "\"";
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === "," && !inQuotes) {
      values.push(current);
      current = "";
      continue;
    }

    current += char;
  }

  values.push(current);
  return values;
};

const parseCsvText = (fileContent: string): Array<Record<string, string>> => {
  const lines = fileContent
    .replace(/\r/g, "")
    .split("\n")
    .map((line) => line.trimEnd())
    .filter((line, lineIndex, allLines) => line.length > 0 || lineIndex < allLines.length - 1);

  if (lines.length === 0) {
    return [];
  }

  const headers = parseCsvLine(lines[0]).map((header) => header.trim());
  if (headers.length === 0 || headers.every((header) => header.length === 0)) {
    return [];
  }

  return lines.slice(1).map((line) => {
    const values = parseCsvLine(line);
    const row: Record<string, string> = {};
    for (let index = 0; index < headers.length; index += 1) {
      row[headers[index]] = (values[index] || "").trim();
    }
    return row;
  });
};

const parseCsvFile = async (file: File): Promise<Array<Record<string, unknown>>> => {
  const content = await file.text();
  return parseCsvText(content);
};

const parseXlsxFile = async (file: File): Promise<Array<Record<string, unknown>>> => {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: "array" });
  const firstSheetName = workbook.SheetNames[0];

  if (!firstSheetName) {
    return [];
  }

  const sheet = workbook.Sheets[firstSheetName];
  return XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
    defval: "",
    raw: true
  });
};

const validateFileExtension = (fileName: string): "csv" | "xlsx" => {
  const normalizedName = fileName.toLowerCase().trim();
  if (normalizedName.endsWith(".csv")) {
    return "csv";
  }
  if (normalizedName.endsWith(".xlsx")) {
    return "xlsx";
  }

  throw new ImportValidationError("Unsupported file format. Please upload a CSV or Excel (.xlsx) file.");
};

export const importPassengerDataset = async (file: File): Promise<ImportResult> => {
  const extension = validateFileExtension(file.name);

  try {
    const rawRows = extension === "csv" ? await parseCsvFile(file) : await parseXlsxFile(file);
    const validation = validateAndNormalizePassengerRows(rawRows);

    return {
      fileName: file.name,
      rows: validation.rows,
      warnings: validation.warnings
    };
  } catch (error) {
    if (error instanceof ImportValidationError) {
      throw error;
    }

    console.error(error);
    throw new ImportValidationError(
      "We could not read this file. Please verify the template format and try uploading again."
    );
  }
};

export const getImportErrorMessage = (error: unknown): string => {
  if (error instanceof ImportValidationError) {
    return error.message;
  }

  return "Import failed. Please try again with a valid file.";
};
