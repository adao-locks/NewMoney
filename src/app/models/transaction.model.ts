export interface Transaction {
    id: string;
    date: string; // ISO date
    description: string;
    amount: number; // positive for ganho, negative for gasto
}
