import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { useState } from "react";

import { AxiosError } from "axios";
import {
	type Body_login_login_access_token as AccessToken,
	LoginService,
	type UserPublic,
	type UserRegister,
	UsersService,
} from "../client";
import { toaster } from "@/components/ui/toaster";

interface ErrorResponse {
	body: {
		detail?: string;
	};
}

const isLoggedIn = () => {
	return localStorage.getItem("access_token") !== null;
};

const useAuth = () => {
	const [error, setError] = useState<string | null>(null);
	const navigate = useNavigate();
	const queryClient = useQueryClient();
	const { data: user, isLoading } = useQuery<UserPublic | null, Error>({
		queryKey: ["currentUser"],
		queryFn: UsersService.readUserMe,
		enabled: isLoggedIn(),
	});

	const signUpMutation = useMutation({
		mutationFn: (data: UserRegister) =>
			UsersService.registerUser({ requestBody: data }),

		onSuccess: () => {
			navigate({ to: "/login" });
			toaster.create({ 
				title: "Account created",
				description: "Your account has been created successfully.",
				type: "success" 
			});
		},
		onError: (err: Error | AxiosError | ErrorResponse) => {
			const errDetail = err instanceof AxiosError 
				? err.message 
				: 'body' in err && typeof err.body === 'object' && err.body 
					? String(err.body.detail) || "Something went wrong"
					: "Something went wrong";

			toaster.create({ 
				title: "Error creating account",
				description: errDetail,
				type: "error" 
			});
		},
		onSettled: () => {
			queryClient.invalidateQueries({ queryKey: ["users"] });
		},
	});

	const login = async (data: AccessToken) => {
		const response = await LoginService.loginAccessToken({
			formData: data,
		});
		localStorage.setItem("access_token", response.access_token);
	};

	const loginMutation = useMutation({
		mutationFn: login,
		onSuccess: () => {
			navigate({ to: "/collections" });
		},
		onError: (err: Error | AxiosError | ErrorResponse) => {
			const errDetail = err instanceof AxiosError 
				? err.message 
				: 'body' in err && typeof err.body === 'object' && err.body 
					? String(err.body.detail) || "Something went wrong"
					: "Something went wrong";

			const finalError = Array.isArray(errDetail) ? "Invalid credentials" : errDetail;

			toaster.create({ 
				title: "Login failed",
				description: finalError,
				type: "error" 
			});
			setError(finalError);
		},
	});

	const logout = () => {
		localStorage.removeItem("access_token");
		navigate({ to: "/" });
	};

	return {
		signUpMutation,
		loginMutation,
		logout,
		user,
		isLoading,
		error,
		resetError: () => setError(null),
	};
};

export { isLoggedIn };
export default useAuth;
