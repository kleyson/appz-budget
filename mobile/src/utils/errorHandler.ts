/**
 * Extracts error message from unknown error object
 * Handles axios errors and other error types
 */
export const getErrorMessage = (error: unknown, defaultMessage: string = 'An error occurred'): string => {
  if (!error) {
    return defaultMessage;
  }

  // Handle axios error response
  if (typeof error === 'object' && 'response' in error) {
    const axiosError = error as { response?: { data?: { detail?: string } } };
    if (axiosError.response?.data?.detail) {
      return axiosError.response.data.detail;
    }
  }

  // Handle Error objects
  if (error instanceof Error) {
    return error.message;
  }

  // Handle objects with message property
  if (typeof error === 'object' && 'message' in error) {
    const message = (error as { message?: unknown }).message;
    if (typeof message === 'string') {
      return message;
    }
  }

  return defaultMessage;
};

