import { api } from "@/lib/api"
import { API_ENDPOINTS } from "@/lib/constants"
import {
  loginResponseSchema,
  requestAccessCodeResultSchema,
  setupAccountResponseSchema,
  userUpdateResponseSchema,
  verifyAccessCodeResponseSchema,
} from "@/lib/schemas"
import type { UserUpdateInput } from "@/types"

export async function requestAccessCode(phone: string) {
  return api.post(API_ENDPOINTS.requestAccessCode, { phone }, {
    schema: requestAccessCodeResultSchema,
  })
}

export async function verifyAccessCode(phone: string, code: string) {
  return api.post(API_ENDPOINTS.verifyAccessCode, { phone, code }, {
    schema: verifyAccessCodeResponseSchema,
  })
}

export async function setupAccount(
  token: string,
  username: string,
  password: string,
) {
  return api.post(API_ENDPOINTS.setupAccount, { token, username, password }, {
    schema: setupAccountResponseSchema,
  })
}

export async function login(username: string, password: string) {
  return api.post(API_ENDPOINTS.login, { username, password }, {
    schema: loginResponseSchema,
  })
}

export async function updateOwnProfile(input: UserUpdateInput) {
  return api.patch(API_ENDPOINTS.me, input, { schema: userUpdateResponseSchema })
}
