"use client";

import { Suspense } from "react";
import { QuestionManager } from "@/components/admin/questions/QuestionManager";
import { LoadingState } from "@/components/admin/ui";

export default function QuestionsPage() {
  return (
    <Suspense fallback={<LoadingState />}>
      <QuestionManager />
    </Suspense>
  );
}
