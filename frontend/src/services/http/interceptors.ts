import api from "../api";

api.interceptors.request.use((config) => {
    console.log(
        `[API] ${config.method?.toUpperCase()} ${config.url}`,
    );

    return config;
});

api.interceptors.response.use(
    (response) => response,
    (error) => {
        console.error("[API ERROR]", error);

        return Promise.reject(error);
    },
);