import { api } from "@/lib/api"
import { API_ENDPOINTS, USE_MOCK } from "@/lib/constants"
import {
  mockLogin,
  mockRequestAccessCode,
  mockSetupAccount,
  mockVerifyAccessCode,
} from "@/lib/mock/auth"
import type {
  LoginResponse,
  RequestAccessCodeResult,
  SetupAccountResponse,
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

export async function setupAccount(
  token: string,
  username: string,
  password: string,
) {
  if (USE_MOCK) return mockSetupAccount(token, username, password)
  return api.post<SetupAccountResponse>(API_ENDPOINTS.setupAccount, {
    token,
    username,
    password,
  })
}

export async function login(username: string, password: string) {
  if (USE_MOCK) return mockLogin(username, password)
  return api.post<LoginResponse>(API_ENDPOINTS.login, { username, password })
}
