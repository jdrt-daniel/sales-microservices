import { Observable } from 'rxjs';

export interface ClientResponse {
  id: string;
  fullName: string;
  exists: boolean;
}

export interface UsersGrpcService {
  validateClient(data: { id: string }): Observable<ClientResponse>;
}
