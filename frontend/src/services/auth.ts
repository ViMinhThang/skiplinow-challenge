import { api } from "@/lib/api"
import { API_ENDPOINTS } from "@/lib/constants"
import type {
  LoginResponse,
  RequestAccessCodeResult,
  SetupAccountResponse,
  UserUpdateInput,
  UserUpdateResponse,
  VerifyAccessCodeResponse,
} from "@/types"

export async function requestAccessCode(phone: string) {
  return api.post<RequestAccessCodeResult>(API_ENDPOINTS.requestAccessCode, {
    phone,
  })
}

export async function verifyAccessCode(phone: string, code: string) {
  return api.post<VerifyAccessCodeResponse>(API_ENDPOINTS.verifyAccessCode, {
    phone,
    code,
  })
}

export async function setupAccount(
  token: string,
  username: string,
  password: string,
) {
  return api.post<SetupAccountResponse>(API_ENDPOINTS.setupAccount, {
    token,
    username,
    password,
  })
}

export async function login(username: string, password: string) {
  return api.post<LoginResponse>(API_ENDPOINTS.login, { username, password })
}

export async function updateOwnProfile(input: UserUpdateInput) {
  return api.patch<UserUpdateResponse>(API_ENDPOINTS.me, input)
}
