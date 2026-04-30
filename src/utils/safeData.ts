export function safeString(value: unknown, fallback = "Não informado"): string {
  if (typeof value === "string" && value.trim()) return value;
  if (typeof value === "number") return String(value);
  return fallback;
}

export function safeArray<T = unknown>(value: unknown): T[] {
  return Array.isArray(value) ? value : [];
}

export function safeJoin(value: unknown, separator = ", "): string {
  if (Array.isArray(value)) {
    const result = value.filter(v => v !== null && v !== undefined && String(v).trim() !== "").join(separator);
    return result || "Não informado";
  }

  if (typeof value === "string" && value.trim()) {
    return value;
  }

  return "Não informado";
}

export function safeDate(value: unknown): string {
  if (!value) return "Data não informada";

  try {
    if (value instanceof Date) {
      return value.toLocaleDateString("pt-BR");
    }

    // Firebase Timestamp check
    if (typeof value === "object" && value !== null && "toDate" in value && typeof (value as any).toDate === 'function') {
      return (value as any).toDate().toLocaleDateString("pt-BR");
    }

    const date = new Date(value as any);
    if (isNaN(date.getTime())) return "Data inválida";
    
    return date.toLocaleDateString("pt-BR");
  } catch {
    return "Data inválida";
  }
}
