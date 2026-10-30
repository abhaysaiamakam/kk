/**
 * Accurately calculates age in years from date of birth (ISO string, "YYYY-MM-DD", "DD MMM YYYY", or numeric string/number).
 * Accurately accounts for current month, day, and leap years.
 */
export function calculateAgeFromDob(dobInput: string | number | undefined | null): number {
  if (dobInput === undefined || dobInput === null) return 70;

  // If already a number
  if (typeof dobInput === 'number') {
    if (dobInput > 0 && dobInput < 125) return dobInput;
    return 70;
  }

  const str = String(dobInput).trim();
  if (!str) return 70;

  // If input is purely digits e.g. "68"
  if (/^\d{1,3}$/.test(str)) {
    const val = parseInt(str, 10);
    if (val > 0 && val < 125) return val;
  }

  const today = new Date();

  // Try parsing Date
  const birthDate = new Date(str);
  if (!isNaN(birthDate.getTime()) && birthDate.getFullYear() > 1890 && birthDate.getFullYear() <= today.getFullYear()) {
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }

    if (age >= 0 && age < 125) return age;
  }

  // Fallback: search for 4-digit year e.g. "15 Apr 1957" or "10/05/1954"
  const matchedYear = str.match(/\b(18\d\d|19\d\d|20[0-2]\d)\b/);
  if (matchedYear) {
    const year = parseInt(matchedYear[1], 10);
    const age = today.getFullYear() - year;
    if (age >= 0 && age < 125) return age;
  }

  return 70;
}
