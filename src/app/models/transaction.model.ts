export type TransactionType = 'income' | 'expense' | 'investment_in' | 'investment_out' | 'investment_return';

export interface Transaction {
    id: string;
    date: string;
    description: string;
    amount: number;
    type?: TransactionType;
    category?: string;
    account?: string;
    notes?: string;
}

export interface InvestmentMovement extends Transaction {
    type: 'investment_in' | 'investment_out' | 'investment_return';
    investmentName: string;
    institution?: string;
    assetClass?: string;
    quantity?: number;
    unitPrice?: number;
    brokerFee?: number;
}

export type AssetStatus = 'ativo' | 'vendido' | 'quitado';

export interface PersonalAsset {
    id: string;
    name: string;
    category: string;
    acquisitionDate: string;
    acquisitionValue: number;
    currentValue: number;
    liquidity: 'alta' | 'media' | 'baixa';
    status: AssetStatus;
    notes?: string;
}
