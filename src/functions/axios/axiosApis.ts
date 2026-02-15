import axios, { type AxiosRequestConfig, type Method, type AxiosResponse } from "axios";

export const apiUrl = import.meta.env.VITE_API_URL || "https://api-test.tensu.kz/api/v1"; 

export const headersFunction = (accessToken: string | null, contentType?: string) => {
  return {
    accept: "*/*",
    "Content-Type": contentType || "application/json",
    Authorization: `Bearer ${accessToken}`,
  };
};

export const axiosRequest = async <T = unknown>(
  endpoint: string,
  method: Method,
  accessToken: string | null,
  data?: unknown,
  contentType?: string
): Promise<AxiosResponse<T>> => {
  const config: AxiosRequestConfig = {
    url: `${apiUrl}${endpoint}`,
    method,
    headers: headersFunction(accessToken, contentType),
    data,
  };

  return axios<T>(config);
};
