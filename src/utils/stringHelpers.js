/**
 * Removes double quotes from the beginning and end of a string.
 * Returns null if the input is null or undefined.
 * 
 * @param {string} str - The string to clean
 * @returns {string|null} The cleaned string or null
 */
export const cleanQuotedString = (str) => {
  if (!str) return null;
  return str.replace(/^"|"$/g, '');
}; 