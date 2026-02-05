/**
 * Normaliza array de dimensionais para o formato do form (nome_cota, cota_mm, tolerancia_menos, tolerancia_mais).
 * Aceita formato legado com "dimensao" e converte para nome_cota.
 * @param {Array} arr
 * @returns {Array} Array sem keys, para Form.setFieldsValue
 */
export const normalizeDimensionais = (arr) => {
  if (!Array.isArray(arr)) return [];
  return arr.map((d) => ({
    nome_cota: d.nome_cota ?? d.dimensao ?? '',
    cota_mm: d.cota_mm ?? 0,
    tolerancia_menos: d.tolerancia_menos ?? 0,
    tolerancia_mais: d.tolerancia_mais ?? 0,
  }));
};
