const store = new Map<string, string>()
;(globalThis as Record<string, unknown>).window = {
  localStorage: {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => store.set(k, v),
    removeItem: (k: string) => store.delete(k),
  },
}

async function main() {
  const { mockRequestAccessCode, mockVerifyAccessCode } = await import(
    "@/lib/mock/auth"
  )

  let passed = 0
  function check(name: string, cond: boolean) {
    if (cond) {
      passed++
      console.log(`PASS ${name}`)
    } else {
      console.error(`FAIL ${name}`)
      process.exitCode = 1
    }
  }

  // 1. Unregistered phone is rejected
  try {
    await mockRequestAccessCode("999-9999")
    check("unregistered phone rejected", false)
  } catch (e) {
    check(
      "unregistered phone rejected",
      (e as { status: number }).status === 404,
    )
  }

  // 2. Registered owner phone returns code
  const req = await mockRequestAccessCode("555-0100")
  check("code requested for owner", req.message.includes("sent"))
  check(
    "mock returns devCode",
    typeof req.devCode === "string" && /^\d{6}$/.test(req.devCode ?? ""),
  )

  // 3. Wrong code rejected
  try {
    await mockVerifyAccessCode("555-0100", "000000")
    check("wrong code rejected", false)
  } catch (e) {
    check("wrong code rejected", (e as { status: number }).status === 400)
  }

  // 4. Correct code returns token + owner session
  const verify = await mockVerifyAccessCode("555-0100", req.devCode!)
  check(
    "verify returns token",
    typeof verify.token === "string" && verify.token.startsWith("mock-"),
  )
  check(
    "session user is owner",
    verify.user.role === "owner" && verify.user.id === "owner-1",
  )

  // 5. Code is single-use
  try {
    await mockVerifyAccessCode("555-0100", req.devCode!)
    check("code single-use", false)
  } catch {
    check("code single-use", true)
  }

  // 6. Unregistered phone cannot verify
  try {
    await mockVerifyAccessCode("555-0000", "123456")
    check("verify rejects unknown phone", false)
  } catch (e) {
    check(
      "verify rejects unknown phone",
      (e as { status: number }).status === 404,
    )
  }

  console.log(`\n${passed}/6 checks passed`)
  process.exit(process.exitCode ?? 0)
}

main()
