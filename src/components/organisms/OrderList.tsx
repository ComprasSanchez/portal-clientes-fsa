import React from "react";

// Organism: List of orders
export const OrderList: React.FC<{ orders: string[] }> = ({ orders }) => (
  <ul>
    {orders.map((order, idx) => (
      <li key={idx}>{order}</li>
    ))}
  </ul>
);
