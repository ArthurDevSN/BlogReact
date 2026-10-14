import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    updateProfile,
} from "firebase/auth";
import { useCallback, useContext, useEffect, useRef, useState } from "react";
import { auth } from "../firebase/config";
import { AuthContext } from "../context/AuthContext";

const errorMessages = {
    "auth/email-already-in-use": "E-mail já cadastrado.",
    "auth/invalid-email": "Informe um e-mail válido.",
    "auth/weak-password": "A senha precisa ter pelo menos 6 caracteres.",
    "auth/missing-password": "Informe sua senha.",
    "auth/invalid-credential": "E-mail ou senha incorretos.",
    "auth/invalid-login-credentials": "E-mail ou senha incorretos.",
    "auth/user-not-found": "E-mail ou senha incorretos.",
    "auth/wrong-password": "E-mail ou senha incorretos.",
    "auth/user-disabled": "Esta conta foi desativada.",
    "auth/too-many-requests": "Muitas tentativas. Aguarde um pouco antes de tentar novamente.",
    "auth/network-request-failed": "Não foi possível conectar. Verifique sua conexão e tente novamente.",
    "auth/operation-not-allowed": "O acesso por e-mail e senha está indisponível no momento.",
    "profile/update-failed": "Sua conta foi criada, mas não foi possível salvar seu nome. Tente novamente.",
};

export const useAuthentication = () => {
    const [error, setError] = useState(null);
    const [actionLoading, setLoading] = useState(false);
    const [profileUser, setProfileUser] = useState(null);
    const context = useContext(AuthContext);
    const setRegistration = context?.setRegistration;
    const pendingProfile = context?.registration?.user || profileUser;
    const registrationBusy = Boolean(context?.registration?.busy);
    const mounted = useRef(false);
    const pending = useRef(false);
    const operation = useRef(0);

    useEffect(() => {
        mounted.current = true;
        return () => {
            mounted.current = false;
            pending.current = false;
            operation.current += 1;
        };
    }, []);

    const performAction = useCallback(async (action) => {
        if (!mounted.current || pending.current || registrationBusy) return null;

        const operationId = ++operation.current;
        pending.current = true;
        setLoading(true);
        setError(null);

        try {
            return await action();
        } catch (actionError) {
            if (mounted.current && operation.current === operationId) {
                setError(errorMessages[actionError?.code] || "Ocorreu um erro. Tente novamente mais tarde.");
            }
            return null;
        } finally {
            if (mounted.current && operation.current === operationId) {
                pending.current = false;
                setLoading(false);
            }
        }
    }, [registrationBusy]);

    const createUser = useCallback((data) => performAction(async () => {
        let user = pendingProfile;
        setRegistration?.({ pending: true, user, busy: true });
        try {
            if (!user) {
                ({ user } = await createUserWithEmailAndPassword(auth, data.email.trim(), data.password));
                setRegistration?.({ pending: true, user, busy: true });
                if (mounted.current) setProfileUser(user);
            }
            try {
                await updateProfile(user, { displayName: data.displayName.trim() });
            } catch {
                throw Object.assign(new Error('Profile update failed'), { code: 'profile/update-failed' });
            }
            if (mounted.current) setProfileUser(null);
            setRegistration?.({ pending: false, user: null, busy: false });
            return user;
        } catch (registrationError) {
            setRegistration?.({ pending: Boolean(user), user, busy: false });
            throw registrationError;
        }
    }), [performAction, pendingProfile, setRegistration]);

    const login = useCallback((data) => performAction(async () => {
        const { user } = await signInWithEmailAndPassword(auth, data.email.trim(), data.password);
        if (mounted.current) setProfileUser(null);
        setRegistration?.({ pending: false, user: null, busy: false });
        return user;
    }), [performAction, setRegistration]);

    const logout = useCallback(() => performAction(async () => {
        await signOut(auth);
        if (mounted.current) setProfileUser(null);
        setRegistration?.({ pending: false, user: null, busy: false });
        return true;
    }), [performAction, setRegistration]);

    return { auth, createUser, error, loading: actionLoading || registrationBusy, logout, login, pendingProfile };
};
