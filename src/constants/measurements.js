export const MEASUREMENT_OPTIONS = [
  {
    key: "LENGTH",
    label: "Length",
    emoji: "📏"
  },
  {
    key: "WEIGHT",
    label: "Weight",
    emoji: "⚖️"
  },
  {
    key: "VOLUME",
    label: "Volume",
    emoji: "🧪"
  },
  {
    key: "TEMPERATURE",
    label: "Temperature",
    emoji: "🌡️"
  }
];

export const MODE_OPTIONS = [
  { key: "COMPARE", label: "Comparison" },
  { key: "CONVERT", label: "Conversion" },
  { key: "CALCULATOR", label: "Calculator" }
];

export const CALCULATOR_OPERATIONS = [
  { key: "ADD", label: "Add" },
  { key: "SUBTRACT", label: "Subtract" },
  { key: "MULTIPLY", label: "Multiply" },
  { key: "DIVIDE", label: "Divide" }
];

export const HISTORY_OPERATIONS = [
  "COMPARE",
  "CONVERT",
  "ADD",
  "SUBTRACT",
  "MULTIPLY",
  "DIVIDE"
];

export const UNITS_BY_TYPE = {
  LENGTH: [
    "MILLIMETER",
    "CENTIMETER",
    "METER",
    "KILOMETER",
    "INCH",
    "FOOT",
    "YARD"
  ],
  WEIGHT: ["MILLIGRAM", "GRAM", "KILOGRAM", "TON", "OUNCE", "POUND"],
  VOLUME: ["MILLILITER", "LITER", "CUBIC_METER", "GALLON"],
  TEMPERATURE: ["CELSIUS", "FAHRENHEIT", "KELVIN"]
};

export function toTitleCase(value) {
  return value
    .toLowerCase()
    .split("_")
    .map((item) => item.charAt(0).toUpperCase() + item.slice(1))
    .join(" ");
}
