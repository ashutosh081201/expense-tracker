// Exercises the real emailService transport selection with
// fetch / nodemailer mocked, so nothing is actually sent.
jest.mock("dotenv", () => ({ config: jest.fn() }));
jest.mock("nodemailer", () => ({ createTransport: jest.fn() }));

const nodemailer = require("nodemailer");

const loadEmailService = () => {
  let svc;
  jest.isolateModules(() => {
    svc = require("../services/emailService");
  });
  return svc;
};

afterEach(() => {
  delete process.env.BREVO_API_KEY;
  delete process.env.EMAIL_FROM;
  jest.restoreAllMocks();
  nodemailer.createTransport.mockReset();
});

describe("Brevo transport (BREVO_API_KEY set)", () => {
  beforeEach(() => {
    process.env.BREVO_API_KEY = "test-brevo-key";
    process.env.EMAIL_FROM = "sender@example.com";
  });

  test("sends the OTP email over HTTPS with the API key and HTML template", async () => {
    const fetchMock = jest
      .spyOn(global, "fetch")
      .mockResolvedValue({ ok: true, json: async () => ({ messageId: "1" }) });
    const { sendVerificationEmail } = loadEmailService();

    await sendVerificationEmail("user@example.com", "482913");

    expect(nodemailer.createTransport).not.toHaveBeenCalled();
    const [url, opts] = fetchMock.mock.calls[0];
    expect(url).toBe("https://api.brevo.com/v3/smtp/email");
    expect(opts.headers["api-key"]).toBe("test-brevo-key");
    const body = JSON.parse(opts.body);
    expect(body.sender).toEqual({
      name: "MoneyMap",
      email: "sender@example.com",
    });
    expect(body.to).toEqual([{ email: "user@example.com" }]);
    expect(body.subject).toBe("Verify your MoneyMap account");
    expect(body.htmlContent).toContain("482913");
  });

  test("a Brevo error surfaces as a thrown error", async () => {
    jest.spyOn(global, "fetch").mockResolvedValue({
      ok: false,
      status: 401,
      text: async () => '{"message":"Key not found"}',
    });
    const { sendBudgetAlertEmail } = loadEmailService();

    await expect(
      sendBudgetAlertEmail("u@example.com", "U", "Oct 2026", [
        { category: "Food", limit: 100, spent: 120, status: "exceeded" },
      ]),
    ).rejects.toThrow(/Brevo email failed \(401\).*Key not found/);
  });
});

describe("Gmail SMTP transport (no BREVO_API_KEY)", () => {
  test("falls back to nodemailer for local development", async () => {
    const sendMail = jest.fn().mockResolvedValue({});
    nodemailer.createTransport.mockReturnValue({ sendMail });
    const fetchMock = jest.spyOn(global, "fetch");
    const { sendForgotPasswordEmail } = loadEmailService();

    await sendForgotPasswordEmail("user@example.com", "111222");

    expect(nodemailer.createTransport).toHaveBeenCalledWith(
      expect.objectContaining({ service: "gmail" }),
    );
    expect(sendMail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "user@example.com",
        subject: "Reset your MoneyMap password",
      }),
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
