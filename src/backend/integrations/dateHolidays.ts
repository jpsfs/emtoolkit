import { injectable } from "inversify";
import { Country } from "../model/country.enum";
import { Holiday } from "../model/holiday.interface";
import { HolidaysIntegration } from "./interfaces/holidays.interface";
import Holidays from "date-holidays";

@injectable()
export class DateHolidays implements HolidaysIntegration {

    async GetHolidays(country: Country, startDate: Date, endDate: Date): Promise<Holiday[]> {
        const hd = new Holidays({
            country: country.toString()
        });

        const holidays = hd.getHolidays(startDate.getFullYear());
        return holidays.map(h => {

            const nHd: Holiday = {
                startDate: new Date(Date.UTC(h.start.getFullYear(), h.start.getMonth(), h.start.getDate())),
                endDate: h.end,
                name: h.name,
                country: country
            };
             
            return nHd;
        });
    }

}