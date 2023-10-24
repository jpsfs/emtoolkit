/**
 * Represents a unit of Time Off, typically of an employee.
 */
export interface TimeOff {
    /**
     * Date of the time off.
     */
    date: Date;
    /**
     * Quantity. Usually 1 or 0.5.
     */
    quantity: number;
}