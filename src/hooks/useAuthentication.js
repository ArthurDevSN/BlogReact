import {
    createUserWithEmailAndPassword,
    updateProfile
} from "firebase/auth";

import { auth } from "../firebase/config";

import { useState, useEffect } from "react";

export const useAuthentication = () => {

    const [user, setUser] = useState(null);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);

    // Criação de usuário

    const createUser = async (data) => {

        setLoading(true);

        try {

            const { user } = await createUserWithEmailAndPassword(
                auth,
                data.email,
                data.password
            );

            await updateProfile(user, {
                displayName: data.displayName
            });

            return user;

        } catch (error) {

            console.log(error.message);
            setError(error.message);

        } finally {

            setLoading(false);

        }
    };

    return {
        auth,
        createUser,
        error,
        loading
    };
};