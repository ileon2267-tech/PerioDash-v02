/**
 * Utilidades para manejo, formateo, validación y búsqueda de RUT / Cédula de Identidad chilena
 */

export function cleanRut(rut: string | undefined | null): string {
  if (!rut) return "";
  return String(rut)
    .replace(/[^0-9kK]/g, "")
    .toUpperCase();
}

export function formatRut(value: string | undefined | null): string {
  if (!value) return "";
  const cleaned = cleanRut(value);
  if (cleaned.length === 0) return "";
  if (cleaned.length === 1) return cleaned;

  const dv = cleaned.slice(-1);
  const body = cleaned.slice(0, -1);

  // Formatear el cuerpo con puntos de miles
  const formattedBody = body.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return `${formattedBody}-${dv}`;
}

export function validateRut(rut: string | undefined | null): boolean {
  const cleaned = cleanRut(rut);
  if (cleaned.length < 8 || cleaned.length > 9) return false;

  const body = cleaned.slice(0, -1);
  const dv = cleaned.slice(-1).toUpperCase();

  if (!/^\d+$/.test(body)) return false;

  let sum = 0;
  let multiplier = 2;

  for (let i = body.length - 1; i >= 0; i--) {
    sum += parseInt(body[i], 10) * multiplier;
    multiplier = multiplier === 7 ? 2 : multiplier + 1;
  }

  const remainder = 11 - (sum % 11);
  let expectedDv = "";
  if (remainder === 11) {
    expectedDv = "0";
  } else if (remainder === 10) {
    expectedDv = "K";
  } else {
    expectedDv = String(remainder);
  }

  return dv === expectedDv;
}

/**
 * Comprueba si una consulta coincide con el RUT del paciente
 * Admite búsqueda con o sin puntos y guión (ej: '12345678', '12.345.678-5', '12345678-5')
 */
export function matchPatientByRut(patientRut: string | undefined | null, query: string): boolean {
  if (!patientRut || !query) return false;
  const cleanedPatRut = cleanRut(patientRut);
  const cleanedQuery = cleanRut(query);

  if (cleanedQuery.length >= 2 && cleanedPatRut.includes(cleanedQuery)) {
    return true;
  }

  const rawPat = String(patientRut).toLowerCase();
  const rawQ = String(query).toLowerCase().trim();
  return rawPat.includes(rawQ);
}
