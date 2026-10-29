export type ApiResponse<T> = {
  status: number
  message: string
  data: T
}

export type PageResponse<T> = {
  content: T[]
  totalElements: number
  totalPages: number
  pageNumber: number
  pageSize: number
}
