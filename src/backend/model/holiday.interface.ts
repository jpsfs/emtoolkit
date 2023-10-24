import { Country } from "./country.enum";

/**
 * Represents an holiday (non-working day) in the system.
 */
export interface Holiday {
    /**
     * Start date of the holiday
     */
    startDate: Date;
    /**
     * End date of the holiday
     */
    endDate: Date;
    /**
     * Name of the holiday (usually in the locale of @see Holiday.Country )
     */
    name: string;
    /**
     * Country there the holiday is celebrated / observed.
     */
    country: Country;
}