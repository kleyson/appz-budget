/**
 * Icon mapping from Ionicons to SF Symbols
 * Used with expo-symbols for native iOS icons
 */

export const iconMap: Record<string, string> = {
  // Navigation
  "chevron-back": "chevron.left",
  "chevron-forward": "chevron.right",
  "chevron-down": "chevron.down",
  "chevron-up": "chevron.up",
  "arrow-back": "arrow.left",
  "arrow-forward": "arrow.right",

  // Actions
  add: "plus",
  "add-circle": "plus.circle.fill",
  "add-circle-outline": "plus.circle",
  close: "xmark",
  trash: "trash.fill",
  "trash-outline": "trash",
  pencil: "pencil",
  "pencil-outline": "pencil",
  send: "paperplane.fill",
  copy: "doc.on.doc",
  "copy-outline": "doc.on.doc",
  checkmark: "checkmark",
  "checkmark-circle": "checkmark.circle.fill",
  "checkmark-circle-outline": "checkmark.circle",
  filter: "line.3.horizontal.decrease.circle.fill",
  "filter-outline": "line.3.horizontal.decrease.circle",

  // Finance
  wallet: "wallet.pass.fill",
  "wallet-outline": "wallet.pass",
  cash: "banknote.fill",
  "cash-outline": "banknote",
  "trending-up": "chart.line.uptrend.xyaxis",
  "trending-down": "chart.line.downtrend.xyaxis",
  "pie-chart": "chart.pie.fill",
  "pie-chart-outline": "chart.pie",
  cart: "cart.fill",
  "cart-outline": "cart",
  card: "creditcard.fill",
  "card-outline": "creditcard",
  "receipt-outline": "doc.text",
  "calculator-outline": "number",

  // Settings
  cog: "gearshape.fill",
  "cog-outline": "gearshape",
  "settings-outline": "gearshape",
  key: "key.fill",
  "key-outline": "key",
  "lock-closed": "lock.fill",
  "lock-closed-outline": "lock",
  "lock-open-outline": "lock.open",
  "server-outline": "server.rack",
  "shield-checkmark": "checkmark.shield.fill",

  // UI
  calendar: "calendar",
  "calendar-outline": "calendar",
  "pricetag-outline": "tag",
  pricetag: "tag.fill",
  "information-circle-outline": "info.circle",
  "globe-outline": "globe",
  "barcode-outline": "barcode",
  person: "person.fill",
  "person-outline": "person",
  people: "person.2.fill",
  "people-outline": "person.2",
  "phone-portrait-outline": "iphone",
  "stats-chart": "chart.bar.fill",
  "stats-chart-outline": "chart.bar",
  "mail-outline": "envelope",

  // Theme
  sunny: "sun.max.fill",
  moon: "moon.fill",
  "log-out-outline": "rectangle.portrait.and.arrow.right",
};

/**
 * Get SF Symbol name for an Ionicons icon name
 * Falls back to the original name if no mapping exists
 */
export function getSFSymbolName(ioniconsName: string): string {
  return iconMap[ioniconsName] ?? ioniconsName;
}
