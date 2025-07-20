"use client";

import { ProtectedRoute } from "@/components/auth/protected-route";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import QuotationManagement from "@/components/quotation-management";

export default function QuotationsPage() {
  return (
    <ProtectedRoute requiredPermission="quotations.read">
      <DashboardLayout>
        <QuotationManagement />
      </DashboardLayout>
    </ProtectedRoute>
  );
}