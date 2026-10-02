import { createContext, useContext, useState, type Dispatch, type ReactNode, type SetStateAction } from 'react';
import type { TrainingDraft } from './session';
const Context = createContext<{ draft: TrainingDraft | null; setDraft: Dispatch<SetStateAction<TrainingDraft | null>> } | null>(null);
export function TrainingProvider({ children }: { children: ReactNode }) {
  const [draft, setDraft] = useState<TrainingDraft | null>(null);
  return <Context.Provider value={{ draft, setDraft }}>{children}</Context.Provider>;
}
export function useTraining() {
  const value = useContext(Context);
  if (!value) throw new Error('Contexto do treino indisponível.');
  return value;
}
