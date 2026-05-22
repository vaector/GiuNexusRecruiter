export const formatLocation = (location) => {
  if (!location) return "";
  if (typeof location === "string") return location;
  if (typeof location === "object") {
    return [location.city, location.country].filter(Boolean).join(", ");
  }
  return String(location);
};

export const formatSalary = (salary) => {
  if (!salary) return "";
  const amount = salary.min ?? salary.amount;
  if (amount == null) return "";
  return `${amount.toLocaleString?.() ?? amount} ${salary.currency || ""}`.trim();
};
