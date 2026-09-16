import {
    createUserWithEmailAndPassword,
    getAuth,
    signInWithEmailAndPassword,
    signOut,
    updateProfile
} from "firebase/auth";


import { auth } from "../firebase/config";

import { useState, useEffect } from "react";

export const useAuthentication = () => {

    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);
    const [cancelled, setCancelled] = useState(false);

    const auth = getAuth();

    // Criação de usuário

    function checkIfIsCancelled(){

        if(cancelled){
            return;
        }
    }

    // register
    const createUser = async (data) => {

        checkIfIsCancelled();
        setLoading(true);
        setError(null);

        try {

            const { user } = await createUserWithEmailAndPassword(
                auth,
                data.email,
                data.password
            );

            await updateProfile(user, {
                displayName: data.displayName
            });

            setLoading(false);

            return user;

        } catch (error) {

            console.log(error.message);
            setError(error.message);


            let systemErrorMessage;

            if (error.message.includes("Password")) {

                systemErrorMessage = "A senha precisa ter pelo menos 6 caracteres.";

            } else if (error.message.includes("email-already")) {

                systemErrorMessage = "E-mail já cadastrado.";

            } else {
                systemErrorMessage = "Ocorreu um erro, por favor tente mais tarde";
            }

            setError(systemErrorMessage);

        } finally {

            setLoading(false);

        }


    };

    //logout - sign out
    const logout = () => {

        checkIfIsCancelled();
        signOut(auth)
    }

    const login = async (data) => {

        checkIfIsCancelled();
        setLoading(true);
        setError(null);

        try {

           await signInWithEmailAndPassword(auth, data.email, data.password)

        } catch (error) {

            console.log(error.message);
            setError(error.message);
            setLoading(false);


            let systemErrorMessage;

            if (error.message.includes("user-not-found")) {

                systemErrorMessage = "Usuário não encontrado.";

            } else if (error.message.includes("Firebase: Error (auth/invalid-credential).")) {

                systemErrorMessage = "Senha incorreta.";
                
            } else {
                systemErrorMessage = "Ocorreu um erro, por favor tente mais tarde";
            }

            setError(systemErrorMessage);
            setLoading(false);

        } finally {

            setLoading(false);

        }


    };

    useEffect(() => {
        return() => setCancelled(true);
    }, []);

    return {
        auth,
        createUser,
        error,
        loading,
        logout,
        login
    };
};