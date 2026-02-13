export interface Agent {
    address: string;
    name: string;
    capabilities: string[];
    reputation?: number;
}

export interface AgentCapability {
    name: string;
    description?: string;
}
