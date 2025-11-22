/**
 * Generate a random color in hex format
 * Generates a truly random hex color with good visibility
 */
export const generateRandomColor = (): string => {
  // Generate random RGB values
  // Using a range that ensures good visibility (avoiding very dark colors)
  // Minimum value of 50 ensures colors aren't too dark, max is 255
  const r = Math.floor(Math.random() * 205) + 50; // 50-255
  const g = Math.floor(Math.random() * 205) + 50; // 50-255
  const b = Math.floor(Math.random() * 205) + 50; // 50-255

  // Convert to hex format
  const toHex = (value: number): string => {
    const hex = value.toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
};

/**
 * Calculate the relative luminance of a color to determine if text should be light or dark
 * Returns true if the color is dark (use light text), false if light (use dark text)
 */
export const isDarkColor = (hexColor: string): boolean => {
  // Remove # if present
  const hex = hexColor.replace('#', '');

  // Convert to RGB
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);

  // Calculate relative luminance using the formula from WCAG
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

  // Return true if dark (luminance < 0.5), false if light
  return luminance < 0.5;
};
