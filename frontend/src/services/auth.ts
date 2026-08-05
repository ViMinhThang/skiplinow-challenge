import { api } from "@/lib/api"
import { API_ENDPOINTS, USE_MOCK } from "@/lib/constants"
import { mockRequestAccessCode, mockVerifyAccessCode } from "@/lib/mock/auth"
import type {
  RequestAccessCodeResult,
  VerifyAccessCodeResponse,
} from "@/types"

export async function requestAccessCode(phone: string) {
  if (USE_MOCK) return mockRequestAccessCode(phone)
  return api.post<RequestAccessCodeResult>(API_ENDPOINTS.requestAccessCode, {
    phone,
  })
}

export async function verifyAccessCode(phone: string, code: string) {
  if (USE_MOCK) return mockVerifyAccessCode(phone, code)
  return api.post<VerifyAccessCodeResponse>(API_ENDPOINTS.verifyAccessCode, {
    phone,
    code,
  })
}
