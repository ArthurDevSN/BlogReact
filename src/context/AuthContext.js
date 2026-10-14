import { useContext, createContext } from "react";

export const AuthContext = createContext(null);

export function AuthProvider({ children, value }) {
    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuthValue() {
    const context = useContext(AuthContext);
    if (context === null) {
        throw new Error("useAuthValue deve ser usado dentro de AuthProvider.");
    }
    return context;
}
