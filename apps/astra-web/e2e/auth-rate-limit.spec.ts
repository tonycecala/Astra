import { expect, test } from "@playwright/test";

test("production email OTP rate limit rejects the fourth request @auth @release", async ({ request }) => {
  const statuses: number[] = [];

  for (let attempt = 1; attempt <= 4; attempt += 1) {
    const response = await request.post("/api/auth/email-otp/send-verification-otp", {
      data: {
        email: `rate-limit-${Date.now()}-${attempt}@example.com`,
        type: "sign-in"
      }
    });
    statuses.push(response.status());
  }

  expect(statuses).toEqual([200, 200, 200, 429]);
});
