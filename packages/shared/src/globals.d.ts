interface HelloMessage {
  message: string
}

type ApiErrorCode =
  | 'NOT_FOUND'
  | 'VALIDATION_ERROR'
  | 'INTERNAL_ERROR'
  | 'UNAUTHORIZED'
  | 'UNKNOWN'

interface ApiError {
  message: string
  code: ApiErrorCode
  statusCode: number
}

type ApiResponse<T> =
  | { data: T; error: null }
  | { data: null; error: ApiError }
