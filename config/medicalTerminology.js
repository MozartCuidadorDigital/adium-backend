/**
 * Medical Terminology Configuration for TTS
 * This file contains mappings for medical terms to TTS-friendly pronunciations
 */

export const MEDICAL_TERMINOLOGY = {
  // Drug names - these should be processed first to avoid conflicts
  'tirzepatida': 'tirzepatida',
  'Mounjaro': 'Mounjaro',
  'semaglutida': 'semaglutida',
  'Ozempic': 'Ozempic',
  'Wegovy': 'Wegovy',
  'liraglutida': 'liraglutida',
  'Victoza': 'Victoza',
  'dulaglutida': 'dulaglutida',
  'Trulicity': 'Trulicity',
  'glargina': 'glargina',
  'degludec': 'degludec',
  'lispro': 'lispro',
  
  // Dosages and measurements
  '5/10/15 mg': '5, 10 y 15 miligramos',
  '10/15 mg': '10 y 15 miligramos',
  '5 mg': '5 miligramos',
  '10 mg': '10 miligramos',
  '15 mg': '15 miligramos',
  
  // Approximations and symbols
  '~1.9–2.1%': 'aproximadamente 1.9 a 2.1 por ciento',
  '~': 'aproximadamente ',
  'vs placebo': 'versus placebo',
  'vs. placebo': 'versus placebo',
  
  // Medical abbreviations and terms
  'HbA1c <7%': 'H-b-A-uno-C menor al 7 por ciento',
  'HbA1c': 'H-b-A-uno-C',
  'GI': 'G-I',
  'gastrointestinal': 'gastrointestinal',
  'BMI': 'B-M-I',
  'DM2': 'diabetes mellitus tipo 2',
  'DM1': 'diabetes mellitus tipo 1',
  
  // Percentages and ranges
  '1.9–2.1%': '1.9 a 2.1 por ciento',
  '7–9.5 kg': '7 a 9.5 kilogramos',
  '>80%': 'más del 80 por ciento',
  '<7%': 'menor al 7 por ciento',
  '≥7%': 'mayor o igual al 7 por ciento',
  '≤7%': 'menor o igual al 7 por ciento',
  
  // Clinical terms
  'leves-moderados': 'leves a moderados',
  'moderados-graves': 'moderados a graves',
  'hipoglucemia': 'hipoglucemia',
  'hiperglucemia': 'hiperglucemia',
  'clínicamente significativa': 'clínicamente significativa',
  'estadísticamente significativa': 'estadísticamente significativa',
  'grave/clínicamente significativa': 'grave o clínicamente significativa',
  'leves a moderados': 'leves a moderados',
  
  // Medical abbreviations - these should be processed after drug names
  'ETD': 'E-T-D',
  'GLP-1RA': 'G-L-P-1-R-A',
  'MACE': 'M-A-C-E',
  'HR': 'H-R',
  
  // Study names and protocols
  'SURPASS-1 (40 semanas)': 'SURPASS-1 a las 40 semanas',
  'SURPASS-1': 'SURPASS-1',
  'SURPASS-2': 'SURPASS-2',
  'SURPASS-3': 'SURPASS-3',
  'SURPASS-4': 'SURPASS-4',
  'SURPASS-5': 'SURPASS-5',
  
  // Medical conditions
  'diabetes tipo 2': 'diabetes tipo 2',
  'diabetes tipo 1': 'diabetes tipo 1',
  'obesidad': 'obesidad',
  'sobrepeso': 'sobrepeso',
  'resistencia a la insulina': 'resistencia a la insulina',
  
  // Side effects
  'efectos adversos': 'efectos adversos',
  'efectos secundarios': 'efectos secundarios',
  'náuseas': 'náuseas',
  'vómitos': 'vómitos',
  'diarrea': 'diarrea',
  'estreñimiento': 'estreñimiento',
  'dolor abdominal': 'dolor abdominal',
  
  // Time periods
  '40 semanas': '40 semanas',
  '52 semanas': '52 semanas',
  '26 semanas': '26 semanas',
  '12 semanas': '12 semanas',
  
  // Statistical terms - these should be last to avoid conflicts
  'p<0.001': 'p menor a 0.001',
  'p<0.01': 'p menor a 0.01',
  'p<0.05': 'p menor a 0.05',
  'IC 95%': 'intervalo de confianza del 95 por ciento',
  ' OR ': ' odds ratio ',
  ' RR ': ' riesgo relativo ',
  ' HR ': ' hazard ratio ',
  
  // Additional medical abbreviations - process after drug names
  // Note: These are handled separately to avoid conflicts with drug names
};

/**
 * Convert medical terminology to TTS-friendly text
 * @param {string} text - Text containing medical terms
 * @returns {string} - Text with medical terms converted for better pronunciation
 */
export function convertMedicalTerminology(text) {
  if (!text) return text;

  let converted = text;

  // Apply conversions in order of specificity (most specific first)
  // This ensures that longer, more specific terms are processed before shorter ones
  const sortedEntries = Object.entries(MEDICAL_TERMINOLOGY).sort((a, b) => b[0].length - a[0].length);
  
  sortedEntries.forEach(([original, replacement]) => {
    const regex = new RegExp(original.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
    converted = converted.replace(regex, replacement);
  });

  // Handle problematic abbreviations that conflict with drug names
  // These are processed last with word boundaries to avoid conflicts
  const problematicAbbreviations = {
    '\\bTID\\b': 'T-I-D',
    '\\bIC\\b': 'I-C'
  };

  Object.entries(problematicAbbreviations).forEach(([pattern, replacement]) => {
    const regex = new RegExp(pattern, 'gi');
    converted = converted.replace(regex, replacement);
  });

  // Fix specific drug name issues
  converted = converted.replace(/glarG-Ina/g, 'glargina');
  converted = converted.replace(/glarG Ina/g, 'glargina');

  return converted;
}

export default MEDICAL_TERMINOLOGY;
