import type { AxiosError } from 'axios'
import type { ApiResponse } from './types'

export function extractApiError(error: AxiosError | unknown) {
  const axiosError = error as AxiosError<ApiResponse<unknown>>

  if (axiosError.response?.data?.message) {
    return axiosError.response.data.message
  }

  if (axiosError.message === 'Network Error') {
    return 'Khong ket noi duoc backend. Vui long kiem tra server port 8088.'
  }

  return 'Da co loi xay ra. Vui long thu lai.'
}
