/**
 * Generate unique loan number
 */
export const generateLoanNumber = (): string => {
  const timestamp = Date.now().toString().slice(-6);
  const random = Math.floor(Math.random() * 10000)
    .toString()
    .padStart(4, '0');
  return `LOAN-${timestamp}-${random}`;
};

/**
 * Generate unique repayment number
 */
export const generateRepaymentNumber = (): string => {
  const timestamp = Date.now().toString().slice(-6);
  const random = Math.floor(Math.random() * 10000)
    .toString()
    .padStart(4, '0');
  return `REP-${timestamp}-${random}`;
};

/**
 * Generate unique receipt number
 */
export const generateReceiptNumber = (): string => {
  const timestamp = Date.now().toString().slice(-6);
  const random = Math.floor(Math.random() * 10000)
    .toString()
    .padStart(4, '0');
  return `REC-${timestamp}-${random}`;
};

/**
 * Calculate simple interest
 */
export const calculateInterest = (
  principal: number,
  rate: number,
  months: number
): number => {
  return (principal * rate * months) / (100 * 12);
};

/**
 * Calculate loan schedule (amortization)
 */
export const calculateLoanSchedule = (
  principal: number,
  annualRate: number,
  months: number
): any[] => {
  const monthlyRate = annualRate / 100 / 12;
  const monthlyPayment =
    (principal * (monthlyRate * Math.pow(1 + monthlyRate, months))) /
    (Math.pow(1 + monthlyRate, months) - 1);

  const schedule: any[] = [];
  let balance = principal;
  let dueDate = new Date();

  for (let i = 1; i <= months; i++) {
    dueDate = new Date(dueDate.setMonth(dueDate.getMonth() + 1));
    const interestAmount = balance * monthlyRate;
    const principalAmount = monthlyPayment - interestAmount;
    balance -= principalAmount;

    schedule.push({
      schedule_number: i,
      due_date: new Date(dueDate),
      principal_amount: parseFloat(principalAmount.toFixed(2)),
      interest_amount: parseFloat(interestAmount.toFixed(2)),
      total_amount: parseFloat(monthlyPayment.toFixed(2)),
      balance_after_payment: parseFloat(Math.max(0, balance).toFixed(2)),
    });
  }

  return schedule;
};

/**
 * Format currency
 */
export const formatCurrency = (amount: number, currency: string = 'UGX'): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(amount);
};

/**
 * Format date
 */
export const formatDate = (date: Date, format: string = 'YYYY-MM-DD'): string => {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');

  return format.replace('YYYY', String(year)).replace('MM', month).replace('DD', day);
};

/**
 * Calculate days between dates
 */
export const daysBetween = (date1: Date, date2: Date): number => {
  const oneDay = 24 * 60 * 60 * 1000;
  return Math.round(Math.abs((date1.getTime() - date2.getTime()) / oneDay));
};

/**
 * Check if loan is overdue
 */
export const isLoanOverdue = (dueDate: Date): boolean => {
  return new Date(dueDate) < new Date();
};

/**
 * Get days overdue
 */
export const getDaysOverdue = (dueDate: Date): number => {
  if (!isLoanOverdue(dueDate)) return 0;
  return daysBetween(new Date(), dueDate);
};

/**
 * Validate email
 */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate phone number
 */
export const isValidPhoneNumber = (phone: string): boolean => {
  const phoneRegex = /^\+?[1-9]\d{1,14}$/;
  return phoneRegex.test(phone.replace(/\s/g, ''));
};

/**
 * Mask sensitive data
 */
export const maskSensitiveData = (data: any, fields: string[]): any => {
  const masked = { ...data };
  fields.forEach((field) => {
    if (masked[field]) {
      const value = String(masked[field]);
      masked[field] = value.substring(0, 2) + '*'.repeat(value.length - 4) + value.substring(value.length - 2);
    }
  });
  return masked;
};
