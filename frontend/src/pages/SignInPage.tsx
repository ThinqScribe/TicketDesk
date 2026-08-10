import {
  ArrowRight,
  Check,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
} from "lucide-react";

import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { login } from "@/lib/api";
import { saveTokens } from "@/lib/auth";

export default function Login() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const tokens = await login({ email, password });
      saveTokens(tokens.access_token, tokens.refresh_token);
      navigate("/dashboard");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#F6F8FD] flex items-center justify-center p-4 md:p-6">

      <div
        className="
          flex
          w-full
          max-w-[1190px]
          min-h-[560px]
          overflow-hidden
          rounded-xl
          border
          border-slate-200
          bg-white
          shadow-[0_10px_40px_rgba(15,23,42,0.06)]
        "
      >

        {/* ============================================================
            LEFT - LOGIN
        ============================================================ */}

        <section
          className="
            flex
            w-full
            flex-col
            px-7
            py-7
            sm:px-10
            lg:w-1/2
            lg:px-14
            xl:px-16
          "
        >

          <Logo />

          <div
            className="
              mx-auto
              flex
              w-full
              max-w-[390px]
              flex-1
              flex-col
              justify-center
            "
          >

            {/* Heading */}

            <h1
              className="
                text-[28px]
                font-bold
                tracking-[-0.03em]
                text-[#111A3A]
              "
            >
              Welcome back <span style={{ fontFamily: '"Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif' }}>👋</span>
            </h1>

            <p className="mt-1 text-[13px] text-slate-500">
              Sign in to your account to continue
            </p>


            {/* ========================================================
                FORM
            ======================================================== */}

            <form
              className="mt-6"
              onSubmit={handleSubmit}
            >

              {/* Error banner */}
              {error && (
                <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-[11px] text-red-600">
                  {error}
                </div>
              )}

              {/* Email */}

              <label className="block">

                <span
                  className="
                    mb-1.5
                    block
                    text-[11px]
                    font-semibold
                    text-[#111A3A]
                  "
                >
                  Email address
                </span>

                <div className="relative">

                  <Mail
                    className="
                      absolute
                      left-3
                      top-1/2
                      h-4
                      w-4
                      -translate-y-1/2
                      text-slate-400
                    "
                  />

                  <input
                    type="email"
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="
                      h-[43px]
                      w-full
                      rounded-md
                      border
                      border-slate-200
                      bg-white
                      pl-10
                      pr-3
                      text-[12px]
                      outline-none
                      placeholder:text-slate-400
                      focus:border-[#3159E8]
                      focus:ring-2
                      focus:ring-[#3159E8]/10
                    "
                  />

                </div>

              </label>


              {/* Password */}

              <div className="mt-4">

                <div className="mb-1.5 flex items-center justify-between">

                  <label
                    className="
                      text-[11px]
                      font-semibold
                      text-[#111A3A]
                    "
                  >
                    Password
                  </label>

                  <Link
                    to="/forgot-password"
                    className="
                      text-[11px]
                      font-medium
                      text-[#3159E8]
                      hover:underline
                    "
                  >
                    Forgot password?
                  </Link>

                </div>

                <div className="relative">

                  <LockKeyhole
                    className="
                      absolute
                      left-3
                      top-1/2
                      h-4
                      w-4
                      -translate-y-1/2
                      text-slate-400
                    "
                  />

                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="
                      h-[43px]
                      w-full
                      rounded-md
                      border
                      border-slate-200
                      bg-white
                      pl-10
                      pr-10
                      text-[12px]
                      outline-none
                      focus:border-[#3159E8]
                      focus:ring-2
                      focus:ring-[#3159E8]/10
                    "
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowPassword((value) => !value)
                    }
                    className="
                      absolute
                      right-3
                      top-1/2
                      -translate-y-1/2
                      text-slate-400
                    "
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>

                </div>

              </div>


              {/* Remember me */}

              <label
                className="
                  mt-2.5
                  flex
                  cursor-pointer
                  items-center
                  gap-2
                  text-[11px]
                  text-slate-600
                "
              >

                <button
                  type="button"
                  onClick={() =>
                    setRememberMe((value) => !value)
                  }
                  className={`
                    flex
                    h-[14px]
                    w-[14px]
                    items-center
                    justify-center
                    rounded-[3px]
                    border
                    ${
                      rememberMe
                        ? "border-[#3159E8] bg-[#3159E8]"
                        : "border-slate-300 bg-white"
                    }
                  `}
                >
                  {rememberMe && (
                    <Check className="h-3 w-3 text-white" />
                  )}
                </button>

                Remember me

              </label>


              {/* Sign in */}

              <button
                type="submit"
                disabled={loading}
                className="
                  mt-3
                  flex
                  h-[43px]
                  w-full
                  items-center
                  justify-center
                  gap-2
                  rounded-full
                  bg-[#3159E8]
                  text-[12px]
                  font-semibold
                  text-white
                  shadow-[0_6px_16px_rgba(49,89,232,0.22)]
                  transition
                  hover:bg-[#284DD1]
                  disabled:opacity-60
                  disabled:cursor-not-allowed
                "
              >
                {loading ? "Signing in…" : "Sign in"}
                {!loading && <ArrowRight className="h-4 w-4" />}
              </button>


              <Divider text="or continue with" />

              <SocialButtons />


              <p
                className="
                  mt-4
                  text-center
                  text-[11px]
                  text-slate-500
                "
              >
                Don't have an account?{" "}

                <Link
                  to="/signup"
                  className="
                    font-medium
                    text-[#3159E8]
                    hover:underline
                  "
                >
                  Sign up
                </Link>
              </p>

            </form>

          </div>

        </section>


        {/* ============================================================
            RIGHT - LOGIN IMAGE

            FULL IMAGE IS PRESERVED.
            NO CROP.
            NO STRETCH.
            NO DISTORTION.
        ============================================================ */}

        <div
          className="hidden lg:block lg:w-1/2 bg-cover bg-center"
          style={{
            backgroundImage: `url(/SiginImage.png)`,
          }}
        ></div>

      </div>

    </main>
  );
}


/* ==========================================================================
   LOGO
========================================================================== */

function Logo() {
  return (
    <a href="/" style={{ display: "block", lineHeight: 0 }}>
      <img src="/Logo2.png" alt="TicketDesk" style={{ width: "140px", height: "auto" }} />
    </a>
  );
}


/* ==========================================================================
   DIVIDER
========================================================================== */

function Divider({ text }: { text: string }) {
  return (
    <div className="my-3 flex items-center gap-3">

      <div className="h-px flex-1 bg-slate-200" />

      <span className="text-[10px] text-slate-400">
        {text}
      </span>

      <div className="h-px flex-1 bg-slate-200" />

    </div>
  );
}


/* ==========================================================================
   SOCIAL BUTTONS
========================================================================== */

function SocialButtons() {
  return (
    <div className="grid grid-cols-3 gap-2">

      <SocialButton>
        <GoogleIcon />
        Google
      </SocialButton>

      <SocialButton>
        <MicrosoftIcon />
        Microsoft
      </SocialButton>

      <SocialButton>
        <SlackIcon />
        Slack
      </SocialButton>

    </div>
  );
}


function SocialButton({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      className="
        flex
        h-[36px]
        items-center
        justify-center
        gap-2
        rounded-full
        border
        border-slate-200
        bg-white
        text-[11px]
        font-medium
        text-slate-700
        hover:bg-slate-50
      "
    >
      {children}
    </button>
  );
}


/* ==========================================================================
   GOOGLE
========================================================================== */

function GoogleIcon() {
  return (
    <span className="text-[13px] font-bold text-[#4285F4]">
      G
    </span>
  );
}


/* ==========================================================================
   MICROSOFT
========================================================================== */

function MicrosoftIcon() {
  return (
    <span className="grid grid-cols-2 gap-[1px]">

      <span className="h-[6px] w-[6px] bg-[#F25022]" />
      <span className="h-[6px] w-[6px] bg-[#7FBA00]" />
      <span className="h-[6px] w-[6px] bg-[#00A4EF]" />
      <span className="h-[6px] w-[6px] bg-[#FFB900]" />

    </span>
  );
}


/* ==========================================================================
   SLACK
========================================================================== */

function SlackIcon() {
  return (
    <span className="font-bold text-[#36C5F0]">
      #
    </span>
  );
}