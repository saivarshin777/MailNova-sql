/**
 * Parses a single CSV line, handling quotes, double quotes, and embedded commas correctly.
 * @param {string} line
 * @returns {string[]} parsed columns
 */
export const parseCsvLine = (line) => {
  const result = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      // Toggle quote state
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      // Split on non-quoted comma
      result.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  result.push(current.trim());

  // Clean surrounding quotes and restore escaped double quotes ("")
  return result.map((val) =>
    val.replace(/^"|"$/g, "").replaceAll('""', '"')
  );
};
