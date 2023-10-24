import { Country } from "../../model/country.enum";
import { Holiday } from "../../model/holiday.interface";

export interface HolidaysIntegration {
    GetHolidays(country: Country, startDate: Date, endDate: Date): Promise<Holiday[]>;
}