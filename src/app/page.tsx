"use client";

import Image from "next/image";
import { Button } from "../components/atoms/Button";
import { InputWithLabel } from "../components/molecules/InputWithLabel";
import { OrderList } from "../components/organisms/OrderList";
import { MainLayout } from "../components/templates/MainLayout";
import { Loader } from "@/components/atoms/Loader";

export default function Home() {
  return (
    <MainLayout>
      <div style={{ padding: 32 }}>
        <Loader />
      </div>
    </MainLayout>
  );
}
