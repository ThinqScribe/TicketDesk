import {
  ArrowRight,
  Check,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  User,
  Building2,
} from "lucide-react";

import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { signup } from "@/lib/api";
import { saveTokens } from "@/lib/auth";

export default function Signup() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [terms, setTerms] = useState(false);
  const [updates, setUpdates] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Form fields
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [password, setPassword] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!terms) {
      setError("You must agree to the Terms of Service to continue.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const tokens = await signup({
        email,
        password,
        first_name: firstName,
        last_name: lastName,
        company_name: company,
      });
      saveTokens(tokens.access_token, tokens.refresh_token);
      navigate("/dashboard");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Sign up failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#F6F8FD] flex items-center justify-center p-4 md:p-6">

      {/* ============================================================
          MAIN CARD
      ============================================================ */}

      <div
        className="
          flex
          w-full
          max-w-[1190px]
          overflow-hidden
          rounded-xl
          border
          border-slate-200
          bg-white
          shadow-[0_10px_40px_rgba(15,23,42,0.06)]
        "
      >

        {/* ==========================================================
            LEFT - SIGNUP FORM
        ========================================================== */}

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
                text-[27px]
                font-bold
                tracking-[-0.03em]
                text-[#111A3A]
              "
            >
              Create your account <span style={{ fontFamily: '"Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif' }}>🚀</span>
            </h1>

            <p className="mt-1 text-[12px] text-slate-500">
              Start your 14-day free trial. No credit card required.
            </p>


            {/* ======================================================
                FORM
            ====================================================== */}

            <form
              className="mt-5"
              onSubmit={handleSubmit}
            >

              {/* Error banner */}
              {error && (
                <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-[11px] text-red-600">
                  {error}
                </div>
              )}

              {/* Name row */}
              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="First name"
                  icon={<User className="h-4 w-4" />}
                  placeholder="John"
                  value={firstName}
                  onChange={setFirstName}
                />
                <Input
                  label="Last name"
                  icon={<User className="h-4 w-4" />}
                  placeholder="Doe"
                  value={lastName}
                  onChange={setLastName}
                />
              </div>

              {/* Company name */}
              <div className="mt-3">
                <Input
                  label="Company name"
                  icon={<Building2 className="h-4 w-4" />}
                  placeholder="Acme Inc."
                  value={company}
                  onChange={setCompany}
                />
              </div>

              {/* Work email */}
              <div className="mt-3">
                <Input
                  label="Work email"
                  icon={<Mail className="h-4 w-4" />}
                  placeholder="name@company.com"
                  type="email"
                  value={email}
                  onChange={setEmail}
                />
              </div>

              {/* Password */}
              <div className="mt-3">

                <label
                  className="
                    mb-1.5
                    block
                    text-[11px]
                    font-semibold
                    text-[#111A3A]
                  "
                >
                  Password
                </label>

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
                    placeholder="Min. 8 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={8}
                    className="
                      h-[42px]
                      w-full
                      rounded-md
                      border
                      border-slate-200
                      pl-10
                      pr-10
                      text-[12px]
                      outline-none
                      placeholder:text-slate-400
                      focus:border-[#3159E8]
                      focus:ring-2
                      focus:ring-[#3159E8]/10
                    "
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>

                </div>

              </div>


              {/* Terms */}
              <Checkbox
                checked={terms}
                onChange={() => setTerms((v) => !v)}
                className="mt-3"
              >
                I agree to the{" "}
                <a href="#terms" className="text-[#3159E8] hover:underline">Terms of Service</a>
                {" "}and{" "}
                <a href="#privacy" className="text-[#3159E8] hover:underline">Privacy Policy</a>
              </Checkbox>

              <Checkbox
                checked={updates}
                onChange={() => setUpdates((v) => !v)}
                className="mt-2"
              >
                I'd like to receive product updates and tips via email
              </Checkbox>


              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="
                  mt-3
                  flex
                  h-[42px]
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
                {loading ? "Creating account…" : "Create account"}
                {!loading && <ArrowRight className="h-4 w-4" />}
              </button>


              <Divider text="or sign up with" />

              <SocialButtons />


              <p className="mt-4 text-center text-[11px] text-slate-500">
                Already have an account?{" "}
                <Link to="/login" className="font-medium text-[#3159E8] hover:underline">
                  Sign in
                </Link>
              </p>

            </form>

          </div>

        </section>


        {/* ============================================================
            RIGHT - IMAGE

            The image controls its own height.

            This means:
            ✓ Full image visible
            ✓ No crop
            ✓ No distortion
            ✓ No contain letterboxing
            ✓ No stretching
        ============================================================ */}

        <div
          className="hidden lg:block lg:w-1/2 bg-cover bg-center"
          style={{
            backgroundImage: `url(/SignupImage.png)`,
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
    <a
      href="/"
      style={{
        display: "block",
        lineHeight: 0,
      }}
    >
      <img
        src="/Logo2.png"
        alt="TicketDesk"
        style={{
          width: "140px",
          height: "auto",
        }}
      />
    </a>
  );
}


/* ==========================================================================
   INPUT
========================================================================== */

function Input({
  label,
  icon,
  placeholder,
  type = "text",
  value,
  onChange,
}: {
  label: string;
  icon: React.ReactNode;
  placeholder: string;
  type?: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="block">

      <span className="mb-1.5 block text-[11px] font-semibold text-[#111A3A]">
        {label}
      </span>

      <div className="relative">

        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
          {icon}
        </span>

        <input
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required
          className="
            h-[42px]
            w-full
            rounded-md
            border
            border-slate-200
            pl-10
            pr-2
            text-[11px]
            outline-none
            placeholder:text-slate-400
            focus:border-[#3159E8]
            focus:ring-2
            focus:ring-[#3159E8]/10
          "
        />

      </div>

    </label>
  );
}


/* ==========================================================================
   CHECKBOX
========================================================================== */

function Checkbox({
  checked,
  onChange,
  children,
  className = "",
}: {
  checked: boolean;
  onChange: () => void;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label
      className={`
        flex
        cursor-pointer
        items-start
        gap-2
        text-[10px]
        leading-4
        text-slate-600
        ${className}
      `}
    >

      <button
        type="button"
        onClick={onChange}
        className={`
          mt-[1px]
          flex
          h-[14px]
          w-[14px]
          shrink-0
          items-center
          justify-center
          rounded-[3px]
          border
          ${
            checked
              ? "border-[#3159E8] bg-[#3159E8]"
              : "border-slate-300 bg-white"
          }
        `}
      >
        {checked && (
          <Check className="h-3 w-3 text-white" />
        )}
      </button>

      <span>{children}</span>

    </label>
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


/* ==========================================================================
   SOCIAL BUTTON
========================================================================== */

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
        transition
        hover:bg-slate-50
      "
    >
      {children}
    </button>
  );
}


/* ==========================================================================
   GOOGLE ICON
========================================================================== */

function GoogleIcon() {
  return (
    <span className="text-[13px] font-bold text-[#4285F4]">
      G
    </span>
  );
}


/* ==========================================================================
   MICROSOFT ICON
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
   SLACK ICON
========================================================================== */

function SlackIcon() {
  return (
    <span className="font-bold text-[#36C5F0]">
      #
    </span>
  );
}