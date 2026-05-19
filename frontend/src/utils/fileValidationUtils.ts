import type { ImportedPassengerRow } from "../types";

export const REQUIRED_IMPORT_COLUMNS = ["survived", "pclass", "sex", "age", "fare", "embarked"] as const;

export class ImportValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ImportValidationError";
  }
}

export type ValidationOutcome = {
  rows: ImportedPassengerRow[];
  warnings: string[];
};

type RawImportRow = Record<string, unknown>;

const normalizeHeader = (header: string): string => {
  return header.trim().toLowerCase().replace(/\s+/g, "_");
};

const valueToString = (value: unknown): string => {
  if (value === null || value === undefined) {
    return "";
  }

  return String(value).trim();
};

const parseNumber = (value: string): number | null => {
  if (!value) {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const normalizeSex = (value: string): "male" | "female" | null => {
  const normalized = value.toLowerCase();
  return normalized === "male" || normalized === "female" ? normalized : null;
};

const normalizeEmbarked = (value: string): "C" | "Q" | "S" | null => {
  if (!value) {
    return null;
  }

  const normalized = value.toUpperCase();
  return normalized === "C" || normalized === "Q" || normalized === "S" ? normalized : null;
};

const getHeaderLookup = (rawRows: RawImportRow[]): Record<string, string> => {
  const lookup: Record<string, string> = {};

  for (const row of rawRows) {
    for (const rawHeader of Object.keys(row)) {
      const normalized = normalizeHeader(rawHeader);
      if (!lookup[normalized]) {
        lookup[normalized] = rawHeader;
      }
    }
  }

  return lookup;
};

const readField = (row: RawImportRow, lookup: Record<string, string>, field: string): string => {
  const sourceKey = lookup[field];
  if (!sourceKey) {
    return "";
  }

  return valueToString(row[sourceKey]);
};

const isRowEmpty = (row: RawImportRow): boolean => {
  return Object.values(row).every((value) => valueToString(value) === "");
};

export const validateAndNormalizePassengerRows = (rawRows: RawImportRow[]): ValidationOutcome => {
  if (rawRows.length === 0) {
    throw new ImportValidationError("The uploaded file has no data rows. Please add rows and try again.");
  }

  const headerLookup = getHeaderLookup(rawRows);
  const missingColumns = REQUIRED_IMPORT_COLUMNS.filter((column) => !headerLookup[column]);

  if (missingColumns.length > 0) {
    throw new ImportValidationError(
      `Missing required columns: ${missingColumns.join(", ")}. Please use the provided template and try again.`
    );
  }

  const normalizedRows: ImportedPassengerRow[] = [];
  const seenRowKeys = new Set<string>();
  let emptyRowCount = 0;
  let malformedRowCount = 0;
  let duplicateRowCount = 0;

  for (const row of rawRows) {
    if (isRowEmpty(row)) {
      emptyRowCount += 1;
      continue;
    }

    const survivedRaw = readField(row, headerLookup, "survived");
    const pclassRaw = readField(row, headerLookup, "pclass");
    const sexRaw = readField(row, headerLookup, "sex");
    const ageRaw = readField(row, headerLookup, "age");
    const fareRaw = readField(row, headerLookup, "fare");
    const embarkedRaw = readField(row, headerLookup, "embarked");

    const survived = parseNumber(survivedRaw);
    const pclass = parseNumber(pclassRaw);
    const age = parseNumber(ageRaw);
    const fare = parseNumber(fareRaw);
    const sex = normalizeSex(sexRaw);
    const embarked = normalizeEmbarked(embarkedRaw);

    const isSurvivedValid = survived === 0 || survived === 1;
    const isPclassValid = pclass !== null && Number.isInteger(pclass) && pclass > 0;
    const isAgeValid = ageRaw === "" || (age !== null && age >= 0);
    const isFareValid = fare !== null && fare >= 0;

    if (!isSurvivedValid || !isPclassValid || !sex || !isAgeValid || !isFareValid) {
      malformedRowCount += 1;
      continue;
    }

    const normalizedRow: ImportedPassengerRow = {
      survived: survived as 0 | 1,
      pclass: pclass as number,
      sex,
      age: ageRaw === "" ? null : (age as number),
      fare: fare as number,
      embarked
    };

    const duplicateKey = [
      normalizedRow.survived,
      normalizedRow.pclass,
      normalizedRow.sex,
      normalizedRow.age === null ? "" : normalizedRow.age,
      normalizedRow.fare,
      normalizedRow.embarked ?? ""
    ].join("|");

    if (seenRowKeys.has(duplicateKey)) {
      duplicateRowCount += 1;
      continue;
    }

    seenRowKeys.add(duplicateKey);
    normalizedRows.push(normalizedRow);
  }

  if (normalizedRows.length === 0) {
    throw new ImportValidationError(
      "No valid rows were found in the uploaded file. Please verify the template structure and required values."
    );
  }

  const warnings: string[] = [];
  if (emptyRowCount > 0) {
    warnings.push(`${emptyRowCount} empty row(s) were skipped.`);
  }
  if (malformedRowCount > 0) {
    warnings.push(`${malformedRowCount} malformed row(s) were skipped.`);
  }
  if (duplicateRowCount > 0) {
    warnings.push(`${duplicateRowCount} duplicate row(s) were skipped.`);
  }

  return {
    rows: normalizedRows,
    warnings
  };
};
