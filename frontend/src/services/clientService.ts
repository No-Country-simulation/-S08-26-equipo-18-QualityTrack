import { api } from "./api";

export interface Client {
  id: number;
  businessName: string;
  taxId: number;
  contactName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  province: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export type CreateClientDto = Omit<Client, "id" | "createdAt" | "updatedAt">;
export type UpdateClientDto = Partial<CreateClientDto>;

export const clientService = {
  getAll(): Promise<Client[]> {
    return api.get<Client[]>("/clients");
  },
  getById(id: number | string): Promise<Client> {
    return api.get<Client>(`/clients/${id}`);
  },
  create(data: CreateClientDto): Promise<Client> {
    return api.post<Client>("/clients", data);
  },
  update(id: number | string, data: UpdateClientDto): Promise<Client> {
    return api.put<Client>(`/clients/${id}`, data);
  },
  delete(id: number | string): Promise<void> {
    return api.delete<void>(`/clients/${id}`);
  },
};

export default clientService;
