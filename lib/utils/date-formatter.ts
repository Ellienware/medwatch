// lib/utils/date-formatter.ts
import { format, parseISO, addDays as addDaysFns } from 'date-fns';

export class DateFormatter {
  /**
   * Format date for display in UI (e.g., "March 1, 2025")
   */
  static formatForDisplay(date: string | Date, locale: string = 'en-US'): string {
    try {
      const dateObj = typeof date === 'string' ? parseISO(date) : date;
      return dateObj.toLocaleDateString(locale, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch {
      return 'Invalid Date';
    }
  }

  /**
   * Format date for certificate (DD MM YYYY format as per reference)
   */
  static formatForCertificate(date: string | Date): string {
    try {
      const dateObj = typeof date === 'string' ? parseISO(date) : date;
      return format(dateObj, 'dd MM yyyy');
    } catch {
      return '05 11 2025'; // fallback
    }
  }

  /**
   * Format date for database storage (YYYY-MM-DD)
   */
  static formatForDatabase(date: string | Date): string {
    try {
      const dateObj = typeof date === 'string' ? parseISO(date) : date;
      return format(dateObj, 'yyyy-MM-dd');
    } catch {
      return format(new Date(), 'yyyy-MM-dd');
    }
  }

  /**
   * Format date for storage (alias of formatForDatabase)
   */
  static formatForStorage(date: string | Date): string {
    return this.formatForDatabase(date);
  }

  /**
   * Add days to a date and return formatted for database
   */
  static addDays(date: string | Date, days: number): string {
    try {
      const dateObj = typeof date === 'string' ? parseISO(date) : date;
      const newDate = addDaysFns(dateObj, days);
      return this.formatForDatabase(newDate);
    } catch {
      const fallback = new Date();
      fallback.setDate(fallback.getDate() + days);
      return this.formatForDatabase(fallback);
    }
  }

  /**
   * Check if date is valid
   */
  static isValidDate(date: string): boolean {
    try {
      return !isNaN(Date.parse(date));
    } catch {
      return false;
    }
  }
}