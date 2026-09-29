"use strict";

const MAX_FILE_BYTES = 10 * 1024 * 1024;
const MAX_ROWS = 100000;

function parseCsv(text) {
  if (typeof text !== "string") throw new TypeError("CSV text must be a string");
  const rows = [], row = [];
  let cell = "", quoted = false, afterQuote = false;
  const pushCell = () => { row.push(cell); cell = ""; afterQuote = false; };
  const pushRow = () => {
    pushCell();
    if (row.some((value) => value.trim() !== "")) rows.push(row.splice(0));
    if (rows.length > MAX_ROWS + 1) throw new Error("CSV exceeds the 100,000-row safety limit");
  };
  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i], next = text[i + 1];
    if (ch === '"') {
      if (!quoted && cell === "") quoted = true;
      else if (quoted && next === '"') { cell += '"'; i += 1; }
      else if (quoted) { quoted = false; afterQuote = true; }
      else throw new Error("Unexpected quote in CSV field");
    } else if (quoted) cell += ch;
    else if (afterQuote && ch === ",") pushCell();
    else if (afterQuote && (ch === "\n" || ch === "\r")) { if (ch === "\r" && next === "\n") i += 1; pushRow(); }
    else if (afterQuote && ch.trim() !== "") throw new Error("Unexpected characters after quoted field");
    else if (ch === ",") pushCell();
    else if (ch === "\n" || ch === "\r") { if (ch === "\r" && next === "\n") i += 1; pushRow(); }
    else cell += ch;
  }
  if (quoted) throw new Error("Unterminated quoted CSV field");
  if (cell !== "" || row.length) pushRow();
  if (rows.length < 2) throw new Error("CSV must contain a header and at least one data row");
  return rows;
}

function detectColumn(headers, terms) {
  const index = headers.findIndex((header) => terms.some((term) => header.toLowerCase().includes(term)));
  return index < 0 ? -1 : index;
}

function parseNumber(value) {
  const source = String(value ?? "").trim();
  if (!source) return "";
  const negative = /^\(.*\)$/.test(source);
  const cleaned = source.replace(/[($, ]/g, "").replace(/\)$/g, "");
  const number = Number(cleaned);
  if (!Number.isFinite(number)) return "";
  return (negative ? -number : number).toFixed(2);
}

function normalizeDate(value) {
  const source = String(value ?? "").trim();
  if (!source) return "";
  const date = new Date(source);
  return Number.isNaN(date.getTime()) ? source : date.toISOString().slice(0, 10);
}

function normalizeRows(rows, selections = {}) {
  if (!Array.isArray(rows) || rows.length < 2) throw new Error("rows require header plus data");
  const headers = rows[0].map((value) => String(value).trim());
  const date = selections.date ?? detectColumn(headers, ["date", "posted", "transaction"]);
  const description = selections.description ?? detectColumn(headers, ["description", "memo", "payee"]);
  const amount = selections.amount ?? detectColumn(headers, ["amount", "value", "total"]);
  const debit = selections.debit ?? detectColumn(headers, ["debit", "withdrawal", "outflow"]);
  const credit = selections.credit ?? detectColumn(headers, ["credit", "deposit", "inflow"]);
  if (date < 0 || description < 0 || (amount < 0 && debit < 0 && credit < 0)) {
    throw new Error("Could not identify date, description, and amount columns");
  }
  const findings = [], normalized = [], seen = new Set();
  rows.slice(1).forEach((source, offset) => {
    const rowNumber = offset + 2;
    if (source.length !== headers.length) findings.push({ row: rowNumber, kind: "row_width_mismatch" });
    const dateValue = normalizeDate(source[date]);
    const descriptionValue = String(source[description] ?? "").trim();
    let amountValue = amount >= 0 ? parseNumber(source[amount]) : "";
    if (amount < 0) {
      const creditValue = parseNumber(source[credit]);
      const debitValue = parseNumber(source[debit]);
      amountValue = creditValue || (debitValue ? (-Number(debitValue)).toFixed(2) : "");
    }
    const output = { date: dateValue, description: descriptionValue, amount: amountValue };
    const key = `${dateValue}|${descriptionValue}|${amountValue}`;
    if (key !== "||" && seen.has(key)) findings.push({ row: rowNumber, kind: "possible_duplicate", detail: key });
    seen.add(key);
    if (!dateValue) findings.push({ row: rowNumber, kind: "missing_or_invalid_date" });
    if (!descriptionValue) findings.push({ row: rowNumber, kind: "missing_description" });
    if (!amountValue) findings.push({ row: rowNumber, kind: "missing_or_invalid_amount" });
    normalized.push(output);
  });
  return { headers, rows: normalized, findings, local_only: true, uploaded: false, bank_connection: false };
}

function validateFileSize(bytes) {
  if (!Number.isInteger(bytes) || bytes < 0) throw new TypeError("file size must be a non-negative integer");
  if (bytes > MAX_FILE_BYTES) throw new Error("file exceeds the 10 MB safety limit");
}

const api = { MAX_FILE_BYTES, MAX_ROWS, parseCsv, normalizeRows, parseNumber, normalizeDate, validateFileSize };
if (typeof window !== "undefined") window.BankCsvNormalizer = api;
if (typeof module !== "undefined") module.exports = api;
