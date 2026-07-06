export interface TaskResponseDto {
  id: number;
  farmId: string;
  animalId: number | null;
  title: string;
  time: string;
  session: string;
  completed: boolean;
  date: string;
  type: "milk" | "feed" | "health" | "clean" | "other" | "breeding" | "vaccination";
  priority: "low" | "normal" | "high" | "critical";
  createdAt: string;
}

export interface CreateTaskRequestDto {
  farmId: string;
  animalId?: number;
  title: string;
  time: string;
  session: string;
  completed?: boolean;
  date: string;
  type: "milk" | "feed" | "health" | "clean" | "other" | "breeding" | "vaccination";
  priority?: "low" | "normal" | "high" | "critical";
}

export interface UpdateTaskRequestDto extends Partial<CreateTaskRequestDto> {}
