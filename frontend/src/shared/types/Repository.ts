export interface Repository<T, CreateDTO = any, UpdateDTO = any> {
  fetch(): Promise<T[]>;
  create(dto: CreateDTO): Promise<T>;
  update(id: string, dto: UpdateDTO): Promise<T>;
  delete(id: string): Promise<void>;
}
