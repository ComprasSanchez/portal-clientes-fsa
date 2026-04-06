import React from "react";

type MainLayoutProps = {
  children: React.ReactNode;
};

export const MainLayout: React.FC<MainLayoutProps> = ({ children }) => (
  <div style={{ margin: "0 auto", maxWidth: 900 }}>
    <header style={{ padding: 16, borderBottom: "1px solid #eee" }}>
      <h1>Portal Clientes</h1>
    </header>
    <main>{children}</main>
  </div>
);
