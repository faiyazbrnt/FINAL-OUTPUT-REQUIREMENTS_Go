import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import type { DashboardFilters, DashboardSummary, ImportedPassengerRow } from "../types";
import { downloadBlob } from "../utils/fileDownload";

type ExportPayload = {
  summary: DashboardSummary;
  filters: DashboardFilters;
  sourceLabel: string;
  importedRows: ImportedPassengerRow[] | null;
};

const DASHBOARD_DATASET_HEADERS = ["survived", "pclass", "sex", "age", "fare", "embarked"] as const;

const formatTimestamp = (date: Date): string => date.toLocaleString();

const toCsvCell = (value: string | number): string => {
  const stringValue = String(value);
  if (/[",\n]/.test(stringValue)) {
    return `"${stringValue.replace(/"/g, "\"\"")}"`;
  }
  return stringValue;
};

const buildDataRowsForExport = (payload: ExportPayload): Array<Record<string, string | number>> => {
  if (payload.importedRows && payload.importedRows.length > 0) {
    return payload.importedRows.map((row) => ({
      survived: row.survived,
      pclass: row.pclass,
      sex: row.sex,
      age: row.age ?? "",
      fare: row.fare,
      embarked: row.embarked ?? ""
    }));
  }

  return payload.summary.topCategories.map((row) => ({
    category: row.category,
    passengerCount: row.passengerCount,
    survivalRatePct: row.survivalRatePct,
    avgFare: row.avgFare
  }));
};

const addWorksheetWithAutoWidth = (
  workbook: XLSX.WorkBook,
  sheetName: string,
  rows: Array<Record<string, string | number>>,
  headerOrder?: string[]
): void => {
  const worksheet = XLSX.utils.json_to_sheet(rows, headerOrder ? { header: headerOrder } : undefined);
  const keys = headerOrder || Object.keys(rows[0] || {});
  const widths = keys.map((key) => {
    const maxValueLength = rows.reduce((max, row) => {
      const value = row[key] ?? "";
      return Math.max(max, String(value).length);
    }, key.length);
    return { wch: Math.min(Math.max(maxValueLength + 2, 12), 48) };
  });
  worksheet["!cols"] = widths;
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
};

export const exportDashboardAsCsv = (payload: ExportPayload): void => {
  const timestamp = formatTimestamp(new Date());
  const lines: string[] = [];

  lines.push(`Generated At,${toCsvCell(timestamp)}`);
  lines.push(`Data Source,${toCsvCell(payload.sourceLabel)}`);
  lines.push(`Category Limit,${payload.filters.categoryLimit}`);
  lines.push(`Age Bucket Size,${payload.filters.ageBucketSize}`);
  lines.push("");

  lines.push("KPI,Value");
  lines.push(`Total Passengers,${payload.summary.kpis.totalPassengers}`);
  lines.push(`Survivors,${payload.summary.kpis.survivors}`);
  lines.push(`Survival Rate (%),${payload.summary.kpis.survivalRatePct}`);
  lines.push(`Average Age,${payload.summary.kpis.averageAge}`);
  lines.push(`Average Fare,${payload.summary.kpis.averageFare}`);
  lines.push(`Top Survival Class,${toCsvCell(payload.summary.kpis.topSurvivalClass)}`);
  lines.push("");

  const dataRows = buildDataRowsForExport(payload);
  const headers = Object.keys(dataRows[0] || {});
  if (headers.length > 0) {
    lines.push(headers.join(","));
    for (const row of dataRows) {
      lines.push(headers.map((header) => toCsvCell(row[header] ?? "")).join(","));
    }
  }

  const csv = `\uFEFF${lines.join("\n")}`;
  downloadBlob(new Blob([csv], { type: "text/csv;charset=utf-8;" }), "dashboard_export.csv");
};

export const exportDashboardAsExcel = (payload: ExportPayload): void => {
  const workbook = XLSX.utils.book_new();
  const exportedAt = formatTimestamp(new Date());

  addWorksheetWithAutoWidth(workbook, "Overview", [
    { metric: "Generated At", value: exportedAt },
    { metric: "Data Source", value: payload.sourceLabel },
    { metric: "Category Limit", value: payload.filters.categoryLimit },
    { metric: "Age Bucket Size", value: payload.filters.ageBucketSize },
    { metric: "Total Passengers", value: payload.summary.kpis.totalPassengers },
    { metric: "Survivors", value: payload.summary.kpis.survivors },
    { metric: "Survival Rate (%)", value: payload.summary.kpis.survivalRatePct },
    { metric: "Average Age", value: payload.summary.kpis.averageAge },
    { metric: "Average Fare", value: payload.summary.kpis.averageFare },
    { metric: "Top Survival Class", value: payload.summary.kpis.topSurvivalClass }
  ]);

  addWorksheetWithAutoWidth(workbook, "TopCategories", payload.summary.topCategories);
  addWorksheetWithAutoWidth(workbook, "RegionalDistribution", payload.summary.regionalDistribution);
  addWorksheetWithAutoWidth(workbook, "AgeTrend", payload.summary.ageTrend);

  if (payload.importedRows && payload.importedRows.length > 0) {
    const rows = payload.importedRows.map((row) => ({
      survived: row.survived,
      pclass: row.pclass,
      sex: row.sex,
      age: row.age ?? "",
      fare: row.fare,
      embarked: row.embarked ?? ""
    }));
    addWorksheetWithAutoWidth(workbook, "Dataset", rows, [...DASHBOARD_DATASET_HEADERS]);
  }

  const output = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
  downloadBlob(
    new Blob([output], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    }),
    "dashboard_export.xlsx"
  );
};

export const exportDashboardAsPdf = (payload: ExportPayload): void => {
  const doc = new jsPDF({ orientation: "portrait", unit: "pt", format: "a4" });
  const createdAt = formatTimestamp(new Date());

  doc.setFontSize(15);
  doc.text("Operations Dashboard Export", 40, 42);
  doc.setFontSize(10);
  doc.text(`Generated: ${createdAt}`, 40, 60);
  doc.text(`Data source: ${payload.sourceLabel}`, 40, 74);
  doc.text(
    `Filters: category limit ${payload.filters.categoryLimit}, age bucket size ${payload.filters.ageBucketSize}`,
    40,
    88
  );

  autoTable(doc, {
    startY: 104,
    head: [["KPI", "Value"]],
    body: [
      ["Total Passengers", payload.summary.kpis.totalPassengers],
      ["Survivors", payload.summary.kpis.survivors],
      ["Survival Rate (%)", payload.summary.kpis.survivalRatePct],
      ["Average Age", payload.summary.kpis.averageAge],
      ["Average Fare", payload.summary.kpis.averageFare],
      ["Top Survival Class", payload.summary.kpis.topSurvivalClass]
    ],
    styles: { fontSize: 9 },
    headStyles: { fillColor: [19, 82, 217] },
    theme: "striped"
  });

  let tableY = (doc as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? 150;

  autoTable(doc, {
    startY: tableY + 18,
    head: [["Category", "Passengers", "Survival Rate (%)", "Avg Fare"]],
    body: payload.summary.topCategories.map((row) => [
      row.category,
      row.passengerCount,
      row.survivalRatePct,
      row.avgFare
    ]),
    styles: { fontSize: 9 },
    headStyles: { fillColor: [15, 143, 130] },
    theme: "grid"
  });

  tableY = (doc as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? tableY;
  autoTable(doc, {
    startY: tableY + 18,
    head: [["Region", "Passengers", "Share (%)", "Survival Rate (%)"]],
    body: payload.summary.regionalDistribution.map((row) => [
      row.region,
      row.passengerCount,
      row.sharePct,
      row.survivalRatePct
    ]),
    styles: { fontSize: 9 },
    headStyles: { fillColor: [19, 82, 217] },
    theme: "grid"
  });

  tableY = (doc as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? tableY;
  autoTable(doc, {
    startY: tableY + 18,
    head: [["Age Band", "Passengers", "Survival Rate (%)"]],
    body: payload.summary.ageTrend.map((row) => [row.ageBand, row.passengerCount, row.survivalRatePct]),
    styles: { fontSize: 9 },
    headStyles: { fillColor: [15, 143, 130] },
    theme: "grid"
  });

  if (payload.importedRows && payload.importedRows.length > 0) {
    const previewRows = payload.importedRows.slice(0, 120);
    doc.addPage();
    doc.setFontSize(12);
    doc.text("Imported Dataset Preview", 40, 42);
    doc.setFontSize(9);
    if (payload.importedRows.length > previewRows.length) {
      doc.text(
        `Showing first ${previewRows.length} rows out of ${payload.importedRows.length} rows for print readability.`,
        40,
        58
      );
    }
    autoTable(doc, {
      startY: 72,
      head: [["survived", "pclass", "sex", "age", "fare", "embarked"]],
      body: previewRows.map((row) => [
        row.survived,
        row.pclass,
        row.sex,
        row.age ?? "",
        row.fare,
        row.embarked ?? ""
      ]),
      styles: { fontSize: 8 },
      headStyles: { fillColor: [19, 82, 217] },
      theme: "striped"
    });
  }

  doc.save("dashboard_export.pdf");
};
