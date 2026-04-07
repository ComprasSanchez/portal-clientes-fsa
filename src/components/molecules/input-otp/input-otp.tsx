"use client";

import {Button, Form, InputOTP, Label} from "@heroui/react";
import React from "react";

export function InputMFA({ onSubmit, isLoading }: {
  onSubmit: (code: string, rememberDevice: boolean) => void | Promise<void>;
  isLoading?: boolean;
}) {
  const [value, setValue] = React.useState("");
  const [isInvalid, setIsInvalid] = React.useState(false);
  const [rememberDevice, setRememberDevice] = React.useState(true);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (value.length !== 6) return;
    try {
      await onSubmit(value, rememberDevice);
      setIsInvalid(false);
    } catch {
      setIsInvalid(true);
    }
  };

  const handleChange = (val: string) => {
    setValue(val);
    setIsInvalid(false);
  };

  return (
    <div className="flex w-70 flex-col gap-2">
      <Form className="flex flex-col gap-2" onSubmit={handleSubmit}>
        <Label>Ingresá el código de 6 dígitos</Label>
        <InputOTP
          aria-describedby={isInvalid ? "code-error" : undefined}
          isInvalid={isInvalid}
          maxLength={6}
          name="code"
          value={value}
          onChange={handleChange}
          autoFocus
        >
          <InputOTP.Group>
            <InputOTP.Slot index={0} />
            <InputOTP.Slot index={1} />
            <InputOTP.Slot index={2} />
          </InputOTP.Group>
          <InputOTP.Separator />
          <InputOTP.Group>
            <InputOTP.Slot index={3} />
            <InputOTP.Slot index={4} />
            <InputOTP.Slot index={5} />
          </InputOTP.Group>
        </InputOTP>
        <span className="field-error" data-visible={isInvalid} id="code-error">
          Código inválido. Intentá nuevamente.
        </span>
        <label className="mt-2 flex items-center gap-3 text-sm text-slate-600">
          <input
            checked={rememberDevice}
            className="h-4 w-4 rounded border-slate-300 text-cyan-700"
            onChange={(event) => setRememberDevice(event.target.checked)}
            type="checkbox"
          />
          Recordar esta sesión en este dispositivo
        </label>
        <Button isDisabled={value.length !== 6 || isLoading} type="submit">
          {isLoading ? "Verificando..." : "Validar código"}
        </Button>
      </Form>
    </div>
  );
}