export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  [key: string]: any;
}

export interface SuccessResponse<T = any> {
  success: true;
  data: T;
  message?: string;
  meta?: PaginationMeta;
}

export interface ErrorResponse {
  success: false;
  error: string;
  message?: string;
}

export const successResponse = <T>(
  data: T,
  message?: string,
  meta?: PaginationMeta
): SuccessResponse<T> => {
  const response: SuccessResponse<T> = {
    success: true,
    data,
  };
  if (message) response.message = message;
  if (meta) response.meta = meta;
  return response;
};

export const errorResponse = (error: string, message?: string): ErrorResponse => ({
  success: false,
  error,
  message,
});
