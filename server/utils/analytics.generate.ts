import { Document, Model } from "mongoose";

interface MonthsData {
    count: number;
    month: string;
}
export async function generateLast12MonthData<T extends Document>(
    model: Model<T>
): Promise<{ last12Month: MonthsData[] }> {

    const last12Month: MonthsData[] = []; // Array to hold the last 12 months data
    // Get the current date and set it to the next day to avoid timezone issues
    const currentDate = new Date();
    currentDate.setDate(currentDate.getDate() + 1); // Set to tomorrow

    for (let i = 11; i >= 0; i--) {
        const endDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate() - i * 28); // todays date minus i months
        // Calculate the start date for the month (28 days before the end date)
        const startDate = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate() - 28);

        const monthYear = endDate.toLocaleString('default', { day: "numeric", month: 'short', year: 'numeric' });
        const count = await model.countDocuments({
            createdAt: {
                $gte: startDate, //greater than or equal to startDate
                $lt: endDate, //less than endDate
            },

        });
        last12Month.push({
            count,
            month: monthYear,
        });
    }
    return { last12Month };
}
