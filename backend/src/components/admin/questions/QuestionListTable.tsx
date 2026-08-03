"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import { Id } from "@convex/_generated/dataModel";
import { toast } from "sonner";
import { Eye, Pencil, Copy, Trash2 } from "lucide-react";
import { Button, Badge, EmptyState, TableWrap } from "@/components/admin/ui";
import {
  ActionMenu,
  ConfirmDialog,
  Modal,
  QuestionTypeBadge,
  StatusBadge,
} from "@/components/admin/ui-extras";
import { QuestionForm, EditTarget } from "./QuestionForm";

export type Row = {
  _id: string;
  _creationTime: number;
  questionText: string;
  options: { id: string; text: string }[];
  correctOptionId: string;
  explanation?: string;
  subject?: string;
  topic?: string;
  difficulty: "easy" | "medium" | "hard";
  marks: number;
  negativeMarks: number;
  language?: string;
  status?: string;
  examId: string;
  examName: string;
  testId: string;
  testTitle: string;
  testType: string;
  year?: number;
};

type ExamOpt = { _id: string; name: string };
type SeriesOpt = { _id: string; examId: string; title: string };

export function QuestionListTable({
  rows,
  exams,
  seriesList,
  emptyMessage,
  emptyAction,
  hideExam,
  hideType,
}: {
  rows: Row[];
  exams: ExamOpt[];
  seriesList: SeriesOpt[];
  emptyMessage: string;
  emptyAction?: React.ReactNode;
  hideExam?: boolean;
  hideType?: boolean;
}) {
  const [editRow, setEditRow] = useState<Row | null>(null);
  const [viewRow, setViewRow] = useState<Row | null>(null);
  const [deleteRow, setDeleteRow] = useState<Row | null>(null);

  const duplicateQuestion = useMutation(api.exams.duplicateQuestion);
  const deleteQuestion = useMutation(api.exams.deleteQuestion);

  if (rows.length === 0) {
    return <EmptyState message={emptyMessage} action={emptyAction} />;
  }

  return (
    <>
      <TableWrap>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs uppercase tracking-wide text-slate-400 border-b border-slate-100">
              <th className="px-4 py-3 w-8">#</th>
              <th className="px-4 py-3">Question</th>
              {!hideExam && <th className="px-4 py-3">Exam</th>}
              <th className="px-4 py-3">Subject / Chapter</th>
              {!hideType && <th className="px-4 py-3">Type</th>}
              <th className="px-4 py-3">Difficulty</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 w-10"></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr
                key={r._id}
                className="border-b border-slate-50 hover:bg-slate-50/60 transition-colors"
              >
                <td className="px-4 py-3 text-slate-400">{i + 1}</td>
                <td className="px-4 py-3 max-w-xs">
                  <button
                    onClick={() => setViewRow(r)}
                    className="text-left text-slate-800 font-medium hover:text-indigo-600 line-clamp-2"
                  >
                    {r.questionText}
                  </button>
                </td>
                {!hideExam && (
                  <td className="px-4 py-3 text-slate-600 whitespace-nowrap">
                    {r.examName}
                    {r.year ? ` · ${r.year}` : ""}
                  </td>
                )}
                <td className="px-4 py-3 text-slate-600">
                  {r.subject || "—"}
                  {r.topic ? <span className="text-slate-400"> · {r.topic}</span> : null}
                </td>
                {!hideType && (
                  <td className="px-4 py-3">
                    <QuestionTypeBadge type={r.testType} />
                  </td>
                )}
                <td className="px-4 py-3">
                  <Badge
                    color={
                      r.difficulty === "easy"
                        ? "green"
                        : r.difficulty === "hard"
                        ? "red"
                        : "amber"
                    }
                  >
                    {r.difficulty}
                  </Badge>
                </td>
                <td className="px-4 py-3">
                  <StatusBadge status={r.status} />
                </td>
                <td className="px-4 py-3">
                  <ActionMenu
                    items={[
                      { label: "View", icon: Eye, onClick: () => setViewRow(r) },
                      { label: "Edit", icon: Pencil, onClick: () => setEditRow(r) },
                      {
                        label: "Duplicate",
                        icon: Copy,
                        onClick: async () => {
                          await duplicateQuestion({ id: r._id as Id<"questions"> });
                          toast.success("Duplicated as a draft copy");
                        },
                      },
                      {
                        label: "Delete",
                        icon: Trash2,
                        danger: true,
                        onClick: () => setDeleteRow(r),
                      },
                    ]}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </TableWrap>

      <p className="text-xs text-slate-400 mt-3">
        Showing {rows.length} question{rows.length > 1 ? "s" : ""}
      </p>

      {/* Edit */}
      {editRow && (
        <Modal
          open={!!editRow}
          onOpenChange={(o) => !o && setEditRow(null)}
          title="Edit Question"
          wide
        >
          <QuestionForm
            mode="edit"
            exams={exams}
            seriesList={seriesList}
            editTarget={editRow as EditTarget}
            onClose={() => setEditRow(null)}
            onSaved={() => {}}
          />
        </Modal>
      )}

      {/* View */}
      {viewRow && (
        <Modal
          open={!!viewRow}
          onOpenChange={(o) => !o && setViewRow(null)}
          title="Question Preview"
          wide
        >
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <QuestionTypeBadge type={viewRow.testType} />
              <StatusBadge status={viewRow.status} />
              <Badge color="blue">{viewRow.examName}</Badge>
              {viewRow.subject && <Badge>{viewRow.subject}</Badge>}
            </div>
            <p className="text-base font-semibold text-slate-900">{viewRow.questionText}</p>
            <div className="space-y-2">
              {viewRow.options.map((o) => (
                <div
                  key={o.id}
                  className={
                    "px-3 py-2 rounded-lg text-sm " +
                    (o.id === viewRow.correctOptionId
                      ? "bg-emerald-100 text-emerald-800 font-medium"
                      : "bg-slate-50 text-slate-700")
                  }
                >
                  {o.id.toUpperCase()}. {o.text}
                  {o.id === viewRow.correctOptionId && " ✓"}
                </div>
              ))}
            </div>
            {viewRow.explanation && (
              <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-3 text-sm text-slate-700">
                <span className="font-semibold text-indigo-700">Explanation: </span>
                {viewRow.explanation}
              </div>
            )}
            <div className="flex gap-3 pt-2">
              <Button
                onClick={() => {
                  setEditRow(viewRow);
                  setViewRow(null);
                }}
              >
                <Pencil size={15} /> Edit
              </Button>
              <Button variant="ghost" onClick={() => setViewRow(null)}>
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Delete */}
      <ConfirmDialog
        open={!!deleteRow}
        onOpenChange={(o) => !o && setDeleteRow(null)}
        title="Delete this question?"
        description="This permanently removes the question. This action cannot be undone."
        confirmLabel="Delete"
        danger
        onConfirm={async () => {
          if (!deleteRow) return;
          await deleteQuestion({ id: deleteRow._id as Id<"questions"> });
          toast.success("Question deleted");
          setDeleteRow(null);
        }}
      />
    </>
  );
}
