/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, type ReactNode } from "react";

export type SessionProfile = { email: string; name: string; role: string; role_label: string; academy: { id: string; name: string } | null; active_unit: { id: string; name: string } | null; units: Array<{ id: string; name: string }>; capabilities: string[]; must_change_password: boolean; onboarding_completed: boolean };
export { hasAccess, routeAccess, type AccessRequirement } from "./access-policy";

const SessionContext = createContext<SessionProfile | null>(null);
export function SessionProvider({ profile, children }: { profile: SessionProfile; children: ReactNode }) { return <SessionContext.Provider value={profile}>{children}</SessionContext.Provider>; }
export function useSession() { const profile = useContext(SessionContext); if (!profile) throw new Error("Sessão não carregada."); return profile; }
