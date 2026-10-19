export interface HealthResponse {
  success: boolean;
  status: string;
  service: string;
  environment: string;
  uptime: number;
  timestamp: string;
  database: 'connected' | 'disconnected' | 'connecting' | 'disconnecting' | 'unknown';
}

export interface NavItem {
  label: string;
  to: string;
}
