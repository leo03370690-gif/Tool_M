type Rule<T> = {
  field: keyof T;
  label: string;
  required?: boolean;
  minLength?: number;
  pattern?: { regex: RegExp; message: string };
};

export function validateForm<T>(
  data: Partial<T>,
  rules: Rule<T>[],
  addToast: (msg: string, type: 'warning') => void
): boolean {
  const errors: string[] = [];

  for (const rule of rules) {
    const value = data[rule.field];
    const str = value != null ? String(value).trim() : '';

    if (rule.required && str === '') {
      errors.push(`「${rule.label}」為必填欄位`);
      continue;
    }
    if (rule.minLength && str.length > 0 && str.length < rule.minLength) {
      errors.push(`「${rule.label}」最少需 ${rule.minLength} 個字元`);
    }
    if (rule.pattern && str.length > 0 && !rule.pattern.regex.test(str)) {
      errors.push(rule.pattern.message);
    }
  }

  if (errors.length > 0) {
    errors.forEach(e => addToast(e, 'warning'));
    return false;
  }
  return true;
}
