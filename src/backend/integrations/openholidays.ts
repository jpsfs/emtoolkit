import axios, { Axios, AxiosResponse } from "axios";
import { Holiday } from "../model/holiday.interface";
import { HolidaysIntegration } from "./interfaces/holidays.interface";
import { Country } from "../model/country.enum";

type OpenHolidaysHoliday = {
    id: string,
    endDate: string,
    startDate: string,
    type: string,
    name: string
}

export class OpenHolidays implements HolidaysIntegration {

    private readonly axiosClient: Axios;

    constructor() {
        this.axiosClient = axios.create({
            baseURL: "https://openholidaysapi.org/",
            headers: {
                Accept: "application/json"
            }
        });
    }

    private convertDateToString(date: Date): string {
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
    }

    async GetHolidays(country: Country, startDate: Date, endDate: Date): Promise<Holiday[]> {

        const response: AxiosResponse = await this.axiosClient.get("PublicHolidays", {
            params: {
                "countryIsoCode": country.toString(),
                "validFrom": this.convertDateToString(startDate),
                "validTo": this.convertDateToString(endDate)
            }
        });

        const data: OpenHolidaysHoliday[] = response.data;

        const holidays: Holiday[] = [];
        for (const d of data) {
            const holiday: Holiday = {
                startDate: new Date(d.startDate),
                endDate: new Date(d.endDate),
                name: d.name,
                country: country
            };

            holidays.push(holiday);
        }

        return holidays;
    }

}