export interface SessionUser {
    name: string;
    uid: string;
    role: string;
    accountType: string;
    image: string;
}

export interface LineChartData {
    index: number;
    date: string;
    linevalue: number;
    independentvalue: number;
}