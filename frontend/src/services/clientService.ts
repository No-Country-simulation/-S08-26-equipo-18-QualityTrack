import { api } from "./api";

export interface Client {
  id: number;
  businessName: string;
  /** Once dígitos. Es texto: como número pierde los ceros a la izquierda. */
  taxId: string;
  email: string;
  phone: string;
  contactName?: string;
  address?: string;
  city?: string;
  province?: string;
  notes?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string | null;
}

export type CreateClientDto = Omit<
  Client,
  "id" | "isActive" | "createdAt" | "updatedAt"
>;
export type UpdateClientDto = Partial<CreateClientDto>;

export type ClientStatusFilter = "active" | "inactive" | "all";

export interface ListClientsParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: ClientStatusFilter;
}

export interface ClientPage {
  items: Client[];
  /** Total de coincidencias, no los de esta página: con esto se dibuja el paginador. */
  total: number;
  page: number;
  limit: number;
}

export const clientService = {
  list(params: ListClientsParams = {}): Promise<ClientPage> {
    return api.get<ClientPage>("/clients", { params });
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
  // Los clientes no se eliminan: se desactivan, para no perder su historial.
  setStatus(id: number | string, isActive: boolean): Promise<Client> {
    return api.patch<Client>(`/clients/${id}/status`, { isActive });
  },
};

export default clientService;
