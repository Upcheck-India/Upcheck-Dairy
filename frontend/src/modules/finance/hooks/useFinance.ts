import { useFinanceContext } from "../context/FinanceProvider";

export function useFinance() {
  return useFinanceContext();
}
