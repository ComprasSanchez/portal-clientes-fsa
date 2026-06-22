"use client";

import {Button, Form, InputOTP, Label} from "@heroui/react";
import React from "react";

type OtpCodeInputProps = {
  value: string;
  onChange: (value: string) => void;
  isInvalid?: boolean;
  describedBy?: string;
  autoFocus?: boolean;
  name?: string;
};

const otpSlotClassName = [
  "flex h-12 w-10 items-center justify-center rounded-2xl border-2 border-slate-300",
  "bg-white text-[1.2rem] font-black tracking-[0.08em] text-slate-900",
  "shadow-[0_12px_30px_rgba(15,23,42,0.14),0_0_0_1px_rgba(148,163,184,0.1)] transition-all duration-200",
  "data-[active=true]:border-[#007c98] data-[active=true]:shadow-[0_0_0_5px_rgba(0,124,152,0.2),0_16px_36px_rgba(0,124,152,0.16)]",
  "data-[filled=true]:border-slate-400 sm:h-14 sm:w-12 sm:text-[1.45rem] md:h-16 md:w-14 md:text-[1.7rem]",
].join(" ");

export function OtpCodeInput({
  value,
  onChange,
  isInvalid = false,
  describedBy,
  autoFocus = false,
  name = "code",
}: OtpCodeInputProps) {
  return (
    <div className="flex w-full justify-center">
      <InputOTP
        aria-describedby={describedBy}
        autoFocus={autoFocus}
        className="w-full justify-center"
        inputClassName="disabled:cursor-not-allowed"
        isInvalid={isInvalid}
        maxLength={6}
        name={name}
        value={value}
        onChange={onChange}
      >
        <InputOTP.Group className="gap-1.5 sm:gap-2 md:gap-3">
          <InputOTP.Slot className={otpSlotClassName} index={0} />
          <InputOTP.Slot className={otpSlotClassName} index={1} />
          <InputOTP.Slot className={otpSlotClassName} index={2} />
        </InputOTP.Group>
        <InputOTP.Separator className="mx-0.5 text-lg font-black text-[#007c98]/70 sm:mx-1 sm:text-xl md:mx-2" />
        <InputOTP.Group className="gap-1.5 sm:gap-2 md:gap-3">
          <InputOTP.Slot className={otpSlotClassName} index={3} />
          <InputOTP.Slot className={otpSlotClassName} index={4} />
          <InputOTP.Slot className={otpSlotClassName} index={5} />
        </InputOTP.Group>
      </InputOTP>
    </div>
  );
}

export function InputMFA({ onSubmit, isLoading, resetTrigger }: {
  onSubmit: (code: string, rememberDevice: boolean) => void | Promise<void>;
  isLoading?: boolean;
  resetTrigger?: number;
}) {
  const [value, setValue] = React.useState("");
  const [isInvalid, setIsInvalid] = React.useState(false);
  const [rememberDevice, setRememberDevice] = React.useState(true);
  const lastAutoSubmittedCodeRef = React.useRef<string | null>(null);

  const submitCode = React.useCallback(async () => {
    if (value.length !== 6 || isLoading) {
      return;
    }

    try {
      await onSubmit(value, rememberDevice);
      setIsInvalid(false);
    } catch {
      setIsInvalid(true);
    }
  }, [isLoading, onSubmit, rememberDevice, value]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    await submitCode();
  };

  const handleChange = (val: string) => {
    setValue(val);
    setIsInvalid(false);
  };

  React.useEffect(() => {
    if (value.length < 6) {
      lastAutoSubmittedCodeRef.current = null;
      return;
    }

    if (isLoading || lastAutoSubmittedCodeRef.current === value) {
      return;
    }

    lastAutoSubmittedCodeRef.current = value;
    void submitCode();
  }, [isLoading, submitCode, value]);

  React.useEffect(() => {
    setValue("");
    setIsInvalid(false);
    lastAutoSubmittedCodeRef.current = null;
  }, [resetTrigger]);

  return (
    <div className="flex w-full flex-col items-center gap-3">
      <Form className="flex w-full flex-col items-center gap-3 text-center" onSubmit={handleSubmit}>
        <Label className="justify-center text-center text-sm font-semibold uppercase tracking-[0.16em] text-slate-600">
          Ingresá el código de 6 dígitos
        </Label>
        <OtpCodeInput
          autoFocus
          describedBy={isInvalid ? "code-error" : undefined}
          isInvalid={isInvalid}
          value={value}
          onChange={handleChange}
        />
        <span className="field-error" data-visible={isInvalid} id="code-error">
          Código inválido. Intentá nuevamente.
        </span>
        <label className="mt-2 flex w-full items-center justify-center gap-3 text-sm text-slate-600">
          <input
            checked={rememberDevice}
            className="h-4 w-4 rounded border-slate-300 text-cyan-700"
            onChange={(event) => setRememberDevice(event.target.checked)}
            type="checkbox"
          />
          Recordar esta sesión en este dispositivo
        </label>
        <Button
          className="mt-2 h-12 w-full rounded-2xl bg-[#007c98] text-base font-bold text-white shadow-[0_10px_24px_rgba(0,124,152,0.18)] hover:bg-[#005f76] sm:h-14"
          isDisabled={value.length !== 6 || isLoading}
          type="submit"
        >
          {isLoading ? "Verificando..." : "Validar código"}
        </Button>
      </Form>
    </div>
  );
}
