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

  // --- Employee CRUD ---
  const employees = await import("@/lib/mock/employees")
  const seed = await employees.mockListEmployees()
  check("list returns seeded employees", seed.length === 3)
  check("seed has job titles", seed.every((e) => e.role.length > 0))
  check("seed schedules default correctly", seed[1].schedule.entries.length === 7)

  const created = await employees.mockCreateEmployee({
    name: "Test Person",
    phone: "555-0199",
    email: "test.person@taskflow.local",
    role: "Manager",
  })
  check("create returns new employee", created.role === "Manager" && !created.accountSetup)

  try {
    await employees.mockCreateEmployee({
      name: "Dup",
      phone: "555-0198",
      email: "test.person@taskflow.local",
      role: "Staff",
    })
    check("duplicate email rejected", false)
  } catch (e) {
    check("duplicate email rejected", (e as { status: number }).status === 409)
  }

  const updated = await employees.mockUpdateEmployee(created.id, {
    name: "Test Person Jr",
    phone: "555-0197",
    role: "Supervisor",
  })
  check("update changes fields", updated.name === "Test Person Jr" && updated.role === "Supervisor")

  const schedule = await employees.mockUpdateSchedule(created.id, [
    { day: "monday", start: "08:00", end: "16:00", enabled: true },
    { day: "friday", start: "10:00", end: "14:00", enabled: true },
  ])
  check("schedule update persists", schedule.entries.filter((e) => e.enabled).length === 2)

  const withSchedule = (await employees.mockListEmployees()).find(
    (e) => e.id === created.id,
  )
  check(
    "schedule visible in list",
    withSchedule?.schedule.entries.find((e) => e.day === "monday")?.start === "08:00",
  )

  await employees.mockDeleteEmployee(created.id)
  const afterDelete = await employees.mockListEmployees()
  check("delete removes employee", !afterDelete.some((e) => e.id === created.id))

  try {
    await employees.mockDeleteEmployee(created.id)
    check("delete missing employee errors", false)
  } catch (e) {
    check("delete missing employee errors", (e as { status: number }).status === 404)
  }

  console.log(`\n${passed} checks passed`)
  process.exit(process.exitCode ?? 0)
}

main()
