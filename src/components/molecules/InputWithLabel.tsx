import React from "react";

type InputWithLabelProps = {
  label: string;
  id: string;
} & React.InputHTMLAttributes<HTMLInputElement>;

export const InputWithLabel: React.FC<InputWithLabelProps> = ({ label, id, ...props }) => (
  <label htmlFor={id} style={{ display: "block" }}>
    {label}
    <input id={id} {...props} />
  </label>
);
