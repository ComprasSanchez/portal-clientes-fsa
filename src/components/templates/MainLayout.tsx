import React from "react";

type MainLayoutProps = {
  children: React.ReactNode;
};

export const MainLayout: React.FC<MainLayoutProps> = ({ children }) => (
  <div>
    <main>{children}</main>
  </div>
);
