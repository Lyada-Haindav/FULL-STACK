import { useEffect, useMemo, useState } from "react";
import {
  useForms,
  useForm,
  useCreateForm,
  useGenerateFormAI,
  useCreateCompleteForm,
  useDeleteForm,
  usePublishForm,
  useCloneForm,
} from "@/hooks/use-forms";
import { useSubmissions } from "@/hooks/use-submissions";
import { useAnalyticsSummary, useDashboardSubmissionMetrics, useFormSubmissionsCount } from "@/hooks/use-analytics";
import { useLocation } from "wouter";
import {
  Plus,
  MoreVertical,
  FileText,
  BarChart2,
  Calendar,
  Sparkles,
  Loader2,
  ArrowLeft,
  Download,
  Search,
  Files,
  CheckCircle2,
  Clock3,
  Filter,
  TrendingDown,
} from "lucide-react";
import { LayoutShell } from "@/components/layout-shell";
import { Button } from "@/components/ui/button";
import { ShareFormDialog } from "@/components/share-form-dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  format,
  isAfter,
  subDays,
} from "date-fns";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  LabelList,
  Bar,
  BarChart as RechartsBarChart,
  CartesianGrid,
  Line,
  LineChart as RechartsLineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type FilterWindow = "all" | "7d" | "30d";

type FieldMeta = {
  id: string;
  key: string;
  label: string;
  type: string;
  required: boolean;
  stepTitle: string;
  stepIndex: number;
};

type SubmissionRowModel = {
  id: string;
  submittedAt: Date;
  values: Record<string, any>;
  hasFiles: boolean;
  isCompleted: boolean;
  searchText: string;
};

const EMPTY_ANALYTICS = {
  totalSubmissions: 0,
  totalForms: 0,
  publishedForms: 0,
  recentSubmissions: 0,
};

const IST_TIME_ZONE = "Asia/Kolkata";
const MONTH_LABELS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function getSubmissionDateParts(value: string | Date) {
  const date = value instanceof Date ? value : new Date(value);
  const formatter = new Intl.DateTimeFormat("en-IN", {
    timeZone: IST_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });

  const lookup = formatter.formatToParts(date).reduce<Record<string, string>>((acc, part) => {
    if (part.type !== "literal") {
      acc[part.type] = part.value;
    }
    return acc;
  }, {});

  return {
    year: lookup.year,
    month: lookup.month,
    day: lookup.day,
    hour24: lookup.hour,
    minute: lookup.minute,
    second: lookup.second,
  };
}

function formatSubmissionDateTime(value: string | Date, variant: "full" | "compact" | "csv" = "full") {
  const parts = getSubmissionDateParts(value);
  const monthLabel = MONTH_LABELS[Math.max(Number(parts.month) - 1, 0)] || parts.month;
  const hourNumber = Number(parts.hour24);
  const meridiem = hourNumber >= 12 ? "PM" : "AM";
  const hour12 = hourNumber % 12 === 0 ? 12 : hourNumber % 12;
  const paddedHour12 = String(hour12).padStart(2, "0");

  if (variant === "csv") {
    return `${parts.year}-${parts.month}-${parts.day} ${parts.hour24}:${parts.minute}:${parts.second} IST`;
  }

  if (variant === "compact") {
    return `${monthLabel} ${Number(parts.day)}, ${paddedHour12}:${parts.minute} ${meridiem} IST`;
  }

  return `${Number(parts.day)} ${monthLabel} ${parts.year}, ${paddedHour12}:${parts.minute} ${meridiem} IST`;
}

function getSubmissionDayKey(value: string | Date) {
  const parts = getSubmissionDateParts(value);
  return `${parts.year}-${parts.month}-${parts.day}`;
}

function formatSubmissionDayLabel(dayKey: string) {
  const [year, month, day] = dayKey.split("-").map(Number);
  const monthLabel = MONTH_LABELS[Math.max(month - 1, 0)] || String(month).padStart(2, "0");
  return `${monthLabel} ${day}`;
}

function buildSubmissionDayRange(startKey: string, endKey: string) {
  const [startYear, startMonth, startDay] = startKey.split("-").map(Number);
  const [endYear, endMonth, endDay] = endKey.split("-").map(Number);
  const cursor = new Date(Date.UTC(startYear, startMonth - 1, startDay, 12));
  const end = new Date(Date.UTC(endYear, endMonth - 1, endDay, 12));
  const keys: string[] = [];

  while (cursor <= end) {
    const key = [
      cursor.getUTCFullYear(),
      String(cursor.getUTCMonth() + 1).padStart(2, "0"),
      String(cursor.getUTCDate()).padStart(2, "0"),
    ].join("-");
    keys.push(key);
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }

  return keys;
}

function extractFiles(value: any): Array<{ id?: string; name?: string; size?: number }> {
  if (value && typeof value === "object" && value.type === "file" && Array.isArray(value.files)) {
    return value.files;
  }
  return [];
}

function hasMeaningfulValue(value: any): boolean {
  if (value == null) return false;
  if (typeof value === "string") return value.trim().length > 0;
  if (typeof value === "number") return !Number.isNaN(value);
  if (typeof value === "boolean") return value;
  if (Array.isArray(value)) return value.length > 0;

  const files = extractFiles(value);
  if (files.length > 0) return true;

  if (typeof value === "object") {
    return Object.keys(value).length > 0;
  }

  return true;
}

function valueToText(value: any): string {
  if (value == null) return "";
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);

  const files = extractFiles(value);
  if (files.length > 0) {
    return files.map((file) => file.name || file.id || "file").join(" ");
  }

  if (Array.isArray(value)) {
    return value.map((item) => valueToText(item)).join(", ");
  }

  if (typeof value === "object") {
    return JSON.stringify(value);
  }

  return String(value);
}

function formatCellValue(value: any): string {
  if (value == null || value === "") return "-";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  const files = extractFiles(value);
  if (files.length > 0) {
    return files.map((file) => file.name || file.id || "file").join("; ");
  }
  return valueToText(value);
}

function getDateCutoff(filterWindow: FilterWindow): Date | null {
  if (filterWindow === "7d") return subDays(new Date(), 7);
  if (filterWindow === "30d") return subDays(new Date(), 30);
  return null;
}

export default function Dashboard() {
  const { data: forms, isLoading, error: formsError, refetch: refetchForms } = useForms();
  const { data: summary, error: summaryError, refetch: refetchSummary } = useAnalyticsSummary();
  const {
    data: dashboardSubmissionMetrics,
    error: metricsError,
    refetch: refetchDashboardMetrics,
  } = useDashboardSubmissionMetrics(forms);
  const analytics = summary ?? EMPTY_ANALYTICS;
  const deleteFormMutation = useDeleteForm();
  const publishMutation = usePublishForm();
  const cloneFormMutation = useCloneForm();
  const [location, setLocation] = useLocation();
  const [selectedFormId, setSelectedFormId] = useState<string | null>(null);
  const [publishingId, setPublishingId] = useState<string | null>(null);
  const shouldOpenCreate = location === "/dashboard/new";
  const [createOpen, setCreateOpen] = useState(shouldOpenCreate);

  useEffect(() => {
    setCreateOpen(shouldOpenCreate);
  }, [shouldOpenCreate]);

  if (isLoading) {
    return (
      <LayoutShell>
        <div className="flex items-center justify-center h-[60vh]">
          <Loader2 className="w-10 h-10 animate-spin text-primary" />
        </div>
      </LayoutShell>
    );
  }

  if (formsError || summaryError || metricsError) {
    const errorMessage =
      (formsError instanceof Error && formsError.message) ||
      (summaryError instanceof Error && summaryError.message) ||
      (metricsError instanceof Error && metricsError.message) ||
      "Something went wrong while loading your dashboard.";

    return (
      <LayoutShell>
        <div className="rounded-3xl border border-red-200 bg-red-50 px-6 py-8 shadow-sm">
          <h1 className="text-2xl font-bold font-display text-red-900">Dashboard hit an error</h1>
          <p className="mt-2 text-sm text-red-700">{errorMessage}</p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Button
              onClick={() => {
                refetchForms();
                refetchSummary();
                refetchDashboardMetrics();
              }}
            >
              Retry loading
            </Button>
            <Button variant="outline" onClick={() => window.location.reload()}>
              Refresh page
            </Button>
          </div>
        </div>
      </LayoutShell>
    );
  }

  if (selectedFormId) {
    const form = forms?.find((item) => item.id === selectedFormId);
    return (
      <LayoutShell>
        <div className="space-y-6">
          <Button
            variant="ghost"
            onClick={() => setSelectedFormId(null)}
            className="gap-2"
            data-testid="button-back-to-dashboard"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Button>

          {form && (
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div>
                <h1 className="text-3xl font-bold font-display">{form.title} - Submissions</h1>
                <p className="text-muted-foreground mt-1">
                  Search responses, review drop-off, and export every file in one place.
                </p>
              </div>
              <CreateFormDialog
                open={createOpen}
                onOpenChange={(open) => {
                  setCreateOpen(open);
                  if (!open && location === "/dashboard/new") {
                    setLocation("/dashboard");
                  }
                }}
              />
            </div>
          )}

          <SubmissionsView formId={selectedFormId} />
        </div>
      </LayoutShell>
    );
  }

  const totalForms = forms?.length || 0;
  const activeForms = forms?.filter((form) => form.isPublished).length || 0;
  const totalSubmissions = totalForms === 0
    ? 0
    : dashboardSubmissionMetrics?.totalSubmissions ?? analytics.totalSubmissions ?? 0;
  const recentSubmissions = totalForms === 0
    ? 0
    : dashboardSubmissionMetrics?.recentSubmissions ?? analytics.recentSubmissions ?? 0;

  const handleTogglePublish = async (formId: string) => {
    setPublishingId(formId);
    try {
      await publishMutation.mutateAsync(formId);
    } finally {
      setPublishingId(null);
    }
  };

  const handleClone = async (formId: string) => {
    const cloned = await cloneFormMutation.mutateAsync(formId);
    if (cloned?.id) {
      setLocation(`/builder/${cloned.id}`);
    }
  };

  return (
    <LayoutShell>
      <div className="space-y-8">
        <div className="rounded-3xl border border-border/70 bg-card px-4 py-5 shadow-[0_10px_28px_rgba(24,48,112,0.08)] sm:px-6 md:px-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="min-w-0">
              <h1 className="text-2xl font-bold font-display text-[#1a2a4b] sm:text-3xl">Dashboard</h1>
              <p className="mt-1 text-sm text-muted-foreground sm:text-base">
                Manage your forms, track response quality, and keep every draft moving.
              </p>
            </div>
            <CreateFormDialog
              open={createOpen}
              onOpenChange={(open) => {
                setCreateOpen(open);
                if (!open && location === "/dashboard/new") {
                  setLocation("/dashboard");
                }
              }}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
          <StatCard title="Total Forms" value={totalForms} icon={<FileText className="text-blue-500" />} />
          <StatCard title="Active Forms" value={activeForms} icon={<Sparkles className="text-amber-500" />} />
          <StatCard title="Total Responses" value={totalSubmissions} icon={<BarChart2 className="text-emerald-500" />} />
          <StatCard title="Recent Responses" value={recentSubmissions} icon={<Clock3 className="text-violet-500" />} />
        </div>

        <div className="rounded-3xl border border-border/70 bg-card px-4 py-5 shadow-[0_10px_28px_rgba(24,48,112,0.08)] sm:px-5 md:px-7">
          <div>
            <h2 className="text-xl font-bold font-display mb-4 text-[#1a2a4b]">Your Forms</h2>
            {forms && forms.length > 0 ? (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 lg:gap-6">
                {forms.map((form) => (
                  <FormCard
                    key={form.id}
                    form={form}
                    onViewSubmissions={() => setSelectedFormId(form.id)}
                    onDelete={() => deleteFormMutation.mutate(form.id)}
                    onTogglePublish={() => handleTogglePublish(form.id)}
                    onClone={() => handleClone(form.id)}
                    isPublishing={publishingId === form.id}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-20 bg-muted/30 rounded-2xl border border-dashed border-border">
                <div className="mx-auto bg-muted p-4 rounded-full w-fit mb-4">
                  <FileText className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-medium">No forms yet</h3>
                <p className="text-muted-foreground mb-6">Create your first form to get started</p>
                <CreateFormDialog
                  open={createOpen}
                  onOpenChange={(open) => {
                    setCreateOpen(open);
                    if (!open && location === "/dashboard/new") {
                      setLocation("/dashboard");
                    }
                  }}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </LayoutShell>
  );
}

function SubmissionsView({ formId }: { formId: string }) {
  const { data: form } = useForm(formId);
  const { data: submissions, isLoading } = useSubmissions(formId);
  const [search, setSearch] = useState("");
  const [dateWindow, setDateWindow] = useState<FilterWindow>("all");
  const [onlyWithFiles, setOnlyWithFiles] = useState(false);
  const [onlyCompleted, setOnlyCompleted] = useState(false);

  const fieldMeta = useMemo<FieldMeta[]>(() => {
    if (!form?.steps) return [];
    return form.steps.flatMap((step: any, stepIndex: number) =>
      (step.fields || []).map((field: any) => ({
        id: field.id,
        key: `field_${field.id}`,
        label: field.label || `field_${field.id}`,
        type: field.type,
        required: !!field.required,
        stepTitle: step.title || `Step ${stepIndex + 1}`,
        stepIndex,
      })),
    );
  }, [form]);

  const fieldLabelMap = useMemo(() => {
    return Object.fromEntries(fieldMeta.map((field) => [field.key, field.label]));
  }, [fieldMeta]);

  const allDataKeys = useMemo(() => {
    const discoveredKeys = Array.from(new Set((submissions || []).flatMap((submission) => Object.keys((submission.data as object) || {}))));
    const formOrderedKeys = fieldMeta.map((field) => field.key).filter((key) => discoveredKeys.includes(key));
    const extraKeys = discoveredKeys.filter((key) => !formOrderedKeys.includes(key)).sort();
    return [...formOrderedKeys, ...extraKeys];
  }, [fieldMeta, submissions]);

  const normalizedSubmissions = useMemo<SubmissionRowModel[]>(() => {
    if (!submissions) return [];

    const requiredFields = fieldMeta.filter((field) => field.required);
    return submissions.map((submission) => {
      const values = ((submission.data as Record<string, any>) || {}) as Record<string, any>;
      const hasFiles = Object.values(values).some((value) => extractFiles(value).length > 0);
      const isCompleted = requiredFields.length === 0
        ? fieldMeta.length === 0 || fieldMeta.every((field) => hasMeaningfulValue(values[field.key]))
        : requiredFields.every((field) => hasMeaningfulValue(values[field.key]));
      const searchText = [
        formatSubmissionDateTime(submission.submittedAt),
        ...fieldMeta.map((field) => `${field.label} ${valueToText(values[field.key])}`),
      ].join(" ").toLowerCase();

      return {
        id: submission.id,
        submittedAt: submission.submittedAt,
        values,
        hasFiles,
        isCompleted,
        searchText,
      };
    });
  }, [fieldMeta, submissions]);

  const filteredSubmissions = useMemo(() => {
    const cutoff = getDateCutoff(dateWindow);
    const query = search.trim().toLowerCase();

    return normalizedSubmissions.filter((submission) => {
      if (query && !submission.searchText.includes(query)) {
        return false;
      }
      if (cutoff && !isAfter(new Date(submission.submittedAt), cutoff)) {
        return false;
      }
      if (onlyWithFiles && !submission.hasFiles) {
        return false;
      }
      if (onlyCompleted && !submission.isCompleted) {
        return false;
      }
      return true;
    });
  }, [dateWindow, normalizedSubmissions, onlyCompleted, onlyWithFiles, search]);

  const overview = useMemo(() => {
    const total = normalizedSubmissions.length;
    const withFiles = normalizedSubmissions.filter((submission) => submission.hasFiles).length;
    const completed = normalizedSubmissions.filter((submission) => submission.isCompleted).length;
    const recent = normalizedSubmissions.filter((submission) => isAfter(new Date(submission.submittedAt), subDays(new Date(), 7))).length;

    return {
      total,
      withFiles,
      completed,
      recent,
      completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
    };
  }, [normalizedSubmissions]);

  const volumeData = useMemo(() => {
    if (normalizedSubmissions.length === 0) return [];

    const formCreatedAt = form?.createdAt ? new Date(form.createdAt) : null;
    const rangeStartKey = getSubmissionDayKey(
      formCreatedAt && !Number.isNaN(formCreatedAt.getTime()) ? formCreatedAt : subDays(new Date(), 13),
    );
    const rangeEndKey = getSubmissionDayKey(new Date());
    const counts = new Map<string, number>();
    normalizedSubmissions.forEach((submission) => {
      const key = getSubmissionDayKey(submission.submittedAt);
      counts.set(key, (counts.get(key) || 0) + 1);
    });

    return buildSubmissionDayRange(rangeStartKey, rangeEndKey).map((key) => {
      return {
        day: formatSubmissionDayLabel(key),
        submissions: counts.get(key) || 0,
      };
    });
  }, [form?.createdAt, normalizedSubmissions]);

  const stepCompletionData = useMemo(() => {
    const total = normalizedSubmissions.length;
    if (!form?.steps || total === 0) return [];

    return form.steps.map((step: any, index: number) => {
      const stepFields = (step.fields || []) as any[];
      const requiredFields = stepFields.filter((field) => field.required);
      const completionFields = requiredFields.length > 0 ? requiredFields : stepFields;
      const startedCount = normalizedSubmissions.filter((submission) =>
        stepFields.some((field) => hasMeaningfulValue(submission.values[`field_${field.id}`])),
      ).length;
      const completedCount = normalizedSubmissions.filter((submission) => {
        if (completionFields.length === 0) return true;
        return completionFields.every((field) => hasMeaningfulValue(submission.values[`field_${field.id}`]));
      }).length;

      return {
        step: step.title || `Step ${index + 1}`,
        startedCount,
        completedCount,
        completionRate: Math.round((completedCount / total) * 100),
        startedRate: Math.round((startedCount / total) * 100),
        completionLabel: `${completedCount}/${total}`,
      };
    });
  }, [form, normalizedSubmissions]);

  const dropOffData = useMemo(() => {
    let previousStarted = normalizedSubmissions.length;
    return stepCompletionData.map((step) => {
      const lostCount = Math.max(previousStarted - step.startedCount, 0);
      const dropRate = previousStarted > 0 ? Math.round((lostCount / previousStarted) * 100) : 0;
      previousStarted = step.startedCount;
      return {
        step: step.step,
        lostCount,
        dropRate,
        retained: step.startedCount,
      };
    });
  }, [normalizedSubmissions.length, stepCompletionData]);

  const skippedQuestions = useMemo(() => {
    const total = normalizedSubmissions.length;
    if (total === 0) return [];

    return fieldMeta
      .map((field) => {
        const answeredCount = normalizedSubmissions.filter((submission) => hasMeaningfulValue(submission.values[field.key])).length;
        const skippedCount = total - answeredCount;
        return {
          field: field.label,
          step: field.stepTitle,
          skippedCount,
          skipRate: Math.round((skippedCount / total) * 100),
        };
      })
      .filter((field) => field.skippedCount > 0)
      .sort((a, b) => b.skipRate - a.skipRate)
      .slice(0, 6);
  }, [fieldMeta, normalizedSubmissions]);

  const hasActiveFilters = search.trim().length > 0 || dateWindow !== "all" || onlyWithFiles || onlyCompleted;

  const downloadCSV = () => {
    if (filteredSubmissions.length === 0) return;

    const headers = ["Submitted At", ...allDataKeys.map((key) => fieldLabelMap[key] || key)];
    const rows = filteredSubmissions.map((submission) => [
      formatSubmissionDateTime(submission.submittedAt, "csv"),
      ...allDataKeys.map((key) => formatCellValue(submission.values[key])),
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `submissions_form_${formId}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!submissions || submissions.length === 0) {
    return (
      <Card className="bg-muted/30 border-dashed">
        <CardContent className="py-20 text-center">
          <BarChart2 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium">No submissions yet</h3>
          <p className="text-muted-foreground">When people fill out your form, their responses will appear here.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <OverviewCard title="Submissions" value={overview.total} hint={`${filteredSubmissions.length} in current view`} icon={<BarChart2 className="w-4 h-4 text-blue-500" />} />
        <OverviewCard title="Completion Rate" value={`${overview.completionRate}%`} hint={`${overview.completed} complete responses`} icon={<CheckCircle2 className="w-4 h-4 text-emerald-500" />} />
        <OverviewCard title="With Files" value={overview.withFiles} hint="Responses that include uploads" icon={<Files className="w-4 h-4 text-amber-500" />} />
        <OverviewCard title="Last 7 Days" value={overview.recent} hint="Recent response volume" icon={<Clock3 className="w-4 h-4 text-violet-500" />} />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <AnalyticsPanel title="Response Volume" description="Daily submission trend since this form was created.">
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <RechartsLineChart data={volumeData} margin={{ top: 8, right: 16, left: 8, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.25)" />
                <XAxis
                  dataKey="day"
                  tickLine={false}
                  axisLine={false}
                  minTickGap={28}
                  tick={{ fill: "#64748b", fontSize: 12 }}
                />
                <YAxis
                  allowDecimals={false}
                  tickLine={false}
                  axisLine={false}
                  width={40}
                  tick={{ fill: "#64748b", fontSize: 12 }}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: "16px",
                    border: "1px solid rgba(203, 213, 225, 0.8)",
                    boxShadow: "0 16px 32px rgba(15, 23, 42, 0.12)",
                  }}
                  formatter={(value: number) => [`${value} responses`, "Volume"]}
                />
                <Line
                  type="monotone"
                  dataKey="submissions"
                  stroke="#2563eb"
                  strokeWidth={3}
                  dot={{ r: 3, fill: "#2563eb", strokeWidth: 0 }}
                  activeDot={{ r: 6, fill: "#1d4ed8" }}
                />
              </RechartsLineChart>
            </ResponsiveContainer>
          </div>
        </AnalyticsPanel>

        <AnalyticsPanel title="Completion By Step" description="How many responses fully complete each step.">
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <RechartsBarChart data={stepCompletionData} margin={{ top: 8, right: 16, left: 12, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.25)" />
                <XAxis
                  dataKey="step"
                  tickLine={false}
                  axisLine={false}
                  interval={0}
                  angle={-10}
                  textAnchor="end"
                  height={60}
                  tick={{ fill: "#64748b", fontSize: 12 }}
                />
                <YAxis
                  domain={[0, 100]}
                  ticks={[0, 25, 50, 75, 100]}
                  tickFormatter={(value) => `${value}%`}
                  tickLine={false}
                  axisLine={false}
                  width={46}
                  tick={{ fill: "#64748b", fontSize: 12 }}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: "16px",
                    border: "1px solid rgba(203, 213, 225, 0.8)",
                    boxShadow: "0 16px 32px rgba(15, 23, 42, 0.12)",
                  }}
                  formatter={(value: number, _name, entry: any) => [
                    `${value}% (${entry?.payload?.completedCount ?? 0}/${normalizedSubmissions.length})`,
                    "Completion",
                  ]}
                />
                <Bar dataKey="completionRate" fill="#0f766e" radius={[10, 10, 0, 0]} maxBarSize={88}>
                  <LabelList
                    dataKey="completionLabel"
                    position="top"
                    fill="#1e293b"
                    fontSize={12}
                    fontWeight={600}
                  />
                </Bar>
              </RechartsBarChart>
            </ResponsiveContainer>
          </div>
        </AnalyticsPanel>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <AnalyticsPanel title="Most Skipped Questions" description="Questions respondents leave blank most often.">
          {skippedQuestions.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border/80 bg-muted/20 px-6 py-10 text-sm text-muted-foreground">
              Skipped-question analytics will appear as responses come in.
            </div>
          ) : (
            <div className="space-y-4">
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsBarChart data={skippedQuestions} layout="vertical" margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.25)" horizontal={false} />
                    <XAxis type="number" tickFormatter={(value) => `${value}%`} tickLine={false} axisLine={false} />
                    <YAxis type="category" dataKey="field" width={150} tickLine={false} axisLine={false} />
                    <Tooltip formatter={(value: number) => [`${value}%`, "Skipped"]} />
                    <Bar dataKey="skipRate" fill="#f59e0b" radius={[0, 8, 8, 0]} />
                  </RechartsBarChart>
                </ResponsiveContainer>
              </div>
              <div className="grid gap-2">
                {skippedQuestions.slice(0, 3).map((field) => (
                  <div key={field.field} className="rounded-xl border border-border/70 bg-background px-4 py-3">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="font-medium text-sm">{field.field}</p>
                        <p className="text-xs text-muted-foreground">{field.step}</p>
                      </div>
                      <Badge variant="secondary">{field.skipRate}% skipped</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </AnalyticsPanel>

        <AnalyticsPanel title="Estimated Drop-off" description="Where respondents start falling away between steps.">
          <div className="space-y-3">
            {dropOffData.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border/80 bg-muted/20 px-6 py-10 text-sm text-muted-foreground">
                Step drop-off will appear once this form has enough responses.
              </div>
            ) : (
              dropOffData.map((step) => (
                <div key={step.step} className="rounded-2xl border border-border/70 bg-background px-4 py-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium">{step.step}</p>
                      <p className="text-sm text-muted-foreground">{step.retained} respondents reached this step.</p>
                    </div>
                    <Badge variant={step.dropRate > 0 ? "destructive" : "secondary"} className="gap-1">
                      <TrendingDown className="h-3 w-3" />
                      {step.dropRate}% drop-off
                    </Badge>
                  </div>
                </div>
              ))
            )}
          </div>
        </AnalyticsPanel>
      </div>

      <Card className="overflow-hidden border-border/70 shadow-[0_10px_24px_rgba(24,48,112,0.08)]">
        <CardHeader className="border-b border-border/60 bg-card/80">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <CardTitle className="font-display text-[#1d2d4d]">Submission Explorer</CardTitle>
              <CardDescription>Search by email, date, field value, or narrow down the current response view.</CardDescription>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button onClick={downloadCSV} className="gap-2" data-testid="button-download-csv" disabled={filteredSubmissions.length === 0}>
                <Download className="w-4 h-4" />
                Download CSV
              </Button>
              <Button
                variant="outline"
                className="gap-2"
                onClick={() => window.open(`/api/forms/${formId}/submissions/export.xlsx`, "_blank")}
                data-testid="button-download-excel"
                disabled={normalizedSubmissions.length === 0}
              >
                <Download className="w-4 h-4" />
                Download Excel
              </Button>
              <Button
                variant="outline"
                className="gap-2"
                onClick={() => window.open(`/api/forms/${formId}/submissions/export`, "_blank")}
                data-testid="button-download-zip"
                disabled={normalizedSubmissions.length === 0}
              >
                <Download className="w-4 h-4" />
                Files + Excel ZIP
              </Button>
            </div>
          </div>

          <div className="grid gap-3 pt-4 lg:grid-cols-[1fr_auto] lg:items-center">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search email, date, or any field value"
                className="pl-9"
              />
            </div>

            <div className="flex flex-wrap gap-2">
              <Select value={dateWindow} onValueChange={(value) => setDateWindow(value as FilterWindow)}>
                <SelectTrigger className="w-[150px]">
                  <Filter className="mr-2 h-4 w-4 text-muted-foreground" />
                  <SelectValue placeholder="Filter by date" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All time</SelectItem>
                  <SelectItem value="7d">Last 7 days</SelectItem>
                  <SelectItem value="30d">Last 30 days</SelectItem>
                </SelectContent>
              </Select>
              <Button variant={onlyWithFiles ? "default" : "outline"} onClick={() => setOnlyWithFiles((value) => !value)}>
                With files
              </Button>
              <Button variant={onlyCompleted ? "default" : "outline"} onClick={() => setOnlyCompleted((value) => !value)}>
                Completed
              </Button>
              {hasActiveFilters && (
                <Button
                  variant="ghost"
                  onClick={() => {
                    setSearch("");
                    setDateWindow("all");
                    setOnlyWithFiles(false);
                    setOnlyCompleted(false);
                  }}
                >
                  Clear filters
                </Button>
              )}
            </div>
          </div>

          {hasActiveFilters && (
            <div className="flex flex-wrap gap-2 pt-3">
              {dateWindow !== "all" && <Badge variant="secondary">{dateWindow === "7d" ? "Last 7 days" : "Last 30 days"}</Badge>}
              {onlyWithFiles && <Badge variant="secondary">Only with files</Badge>}
              {onlyCompleted && <Badge variant="secondary">Only complete</Badge>}
              {search.trim() && <Badge variant="secondary">Search: {search.trim()}</Badge>}
            </div>
          )}
        </CardHeader>

        <CardContent className="p-0">
          {filteredSubmissions.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <Search className="mx-auto mb-4 h-10 w-10 text-muted-foreground" />
              <h3 className="text-lg font-medium">No matching submissions</h3>
              <p className="mt-1 text-muted-foreground">Try clearing one or two filters to widen the results.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    {allDataKeys.map((key) => (
                      <TableHead key={key} className="capitalize">{fieldLabelMap[key] || key}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSubmissions.map((submission) => (
                    <TableRow key={submission.id}>
                      <TableCell className="whitespace-nowrap text-muted-foreground">
                        {formatSubmissionDateTime(submission.submittedAt, "compact")}
                      </TableCell>
                      {allDataKeys.map((key) => {
                        const value = submission.values[key];
                        const files = extractFiles(value);
                        if (files.length > 0) {
                          return (
                            <TableCell key={key} className="space-y-1 min-w-[220px]">
                              {files.map((file) => (
                                <div key={file.id || file.name} className="flex items-center gap-2">
                                  <a
                                    href={`/api/files/${file.id}`}
                                    className="text-primary underline-offset-4 hover:underline"
                                    download
                                  >
                                    {file.name || "Download file"}
                                  </a>
                                  <a
                                    href={`/api/files/${file.id}?inline=1`}
                                    className="inline-flex items-center rounded-full border border-border px-2 py-0.5 text-[11px] font-medium text-muted-foreground hover:text-foreground hover:border-foreground/40 transition-colors"
                                    target="_blank"
                                    rel="noreferrer"
                                  >
                                    View
                                  </a>
                                  <span className="text-xs text-muted-foreground">
                                    {file.size ? `${Math.round(file.size / 1024)} KB` : ""}
                                  </span>
                                </div>
                              ))}
                            </TableCell>
                          );
                        }

                        return <TableCell key={key}>{formatCellValue(value)}</TableCell>;
                      })}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function OverviewCard({
  title,
  value,
  hint,
  icon,
}: {
  title: string;
  value: number | string;
  hint: string;
  icon: React.ReactNode;
}) {
  return (
    <Card className="border-border/70 bg-card hover:shadow-md transition-shadow">
      <CardContent className="p-5 flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="mt-2 text-2xl font-bold font-display">{value}</p>
          <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
        </div>
        <div className="rounded-2xl bg-[#eef3ff] p-3">{icon}</div>
      </CardContent>
    </Card>
  );
}

function AnalyticsPanel({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <Card className="border-border/70 shadow-[0_10px_24px_rgba(24,48,112,0.08)]">
      <CardHeader>
        <CardTitle className="font-display text-[#1d2d4d]">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

function StatCard({ title, value, icon }: { title: string; value: number; icon: React.ReactNode }) {
  return (
    <Card className="border-border/70 bg-card hover:shadow-md transition-shadow">
      <CardContent className="flex min-h-[112px] flex-col items-start gap-3 p-4 sm:min-h-0 sm:flex-row sm:items-center sm:gap-4 sm:p-6">
        <div className="rounded-xl bg-[#eef3ff] p-2.5 sm:p-3">{icon}</div>
        <div>
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="font-display text-2xl font-bold">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function FormCard({
  form,
  onViewSubmissions,
  onDelete,
  onTogglePublish,
  onClone,
  isPublishing,
}: {
  form: any;
  onViewSubmissions: () => void;
  onDelete: () => void;
  onTogglePublish: () => void;
  onClone: () => void;
  isPublishing: boolean;
}) {
  const [, setLocation] = useLocation();
  const { data: submissionCount } = useFormSubmissionsCount(form.id);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
    >
      <Card
        className={`h-full flex flex-col border-border/70 bg-card hover:border-primary/50 transition-colors group ${
          form.isPublished ? "ring-2 ring-emerald-400/70 shadow-[0_0_24px_rgba(16,185,129,0.25)]" : ""
        }`}
      >
        <CardHeader className="flex-1">
          <div className="flex justify-between items-start">
            <div className={`px-2 py-1 rounded-md text-xs font-medium ${form.isPublished ? "bg-emerald-100 text-emerald-700" : "bg-[#edf2ff] text-[#5a6d93]"}`}>
              {form.isPublished ? "Published" : "Draft"}
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0 opacity-100 transition-opacity md:opacity-0 md:group-hover:opacity-100" data-testid={`button-form-menu-${form.id}`}>
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setLocation(`/builder/${form.id}`)}>Edit</DropdownMenuItem>
                <DropdownMenuItem onClick={onClone}>Duplicate</DropdownMenuItem>
                <DropdownMenuItem onClick={onViewSubmissions}>Submissions</DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <ShareFormDialog
                    formId={form.id}
                    formTitle={form.title}
                    trigger={
                      <div className="relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 w-full">
                        Share
                      </div>
                    }
                  />
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => window.open(`/forms/${form.id}`, "_blank")}>View Public</DropdownMenuItem>
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onClick={() => {
                    if (window.confirm(`Delete \"${form.title}\"? This cannot be undone.`)) {
                      onDelete();
                    }
                  }}
                >
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <CardTitle className="mt-4 font-display truncate text-[#1d2d4d]">{form.title}</CardTitle>
          <CardDescription className="line-clamp-2 mt-2">{form.description || "No description provided."}</CardDescription>
        </CardHeader>
        <CardContent className="border-t border-border/50 pt-4 mt-auto">
          <div className="flex justify-between items-center text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {format(new Date(form.createdAt), "MMM d, yyyy")}
            </div>
            <button
              className="flex items-center gap-1 hover:text-primary transition-colors"
              onClick={onViewSubmissions}
              data-testid={`button-view-submissions-${form.id}`}
            >
              <BarChart2 className="w-3 h-3" />
              {submissionCount || 0} Responses
            </button>
          </div>
          <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
            <Button
              className="bg-muted hover:bg-muted/80 text-foreground shadow-none"
              onClick={() => setLocation(`/builder/${form.id}`)}
              data-testid={`button-edit-form-${form.id}`}
            >
              Edit Form
            </Button>
            <Button
              className={form.isPublished ? "bg-emerald-500 hover:bg-emerald-600 text-white" : "bg-primary text-primary-foreground"}
              onClick={onTogglePublish}
              data-testid={`button-toggle-publish-${form.id}`}
              disabled={isPublishing}
            >
              {isPublishing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {form.isPublished ? "Unpublishing..." : "Publishing..."}
                </>
              ) : form.isPublished ? (
                "Unpublish"
              ) : (
                "Publish"
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function CreateFormDialog({ open, onOpenChange }: { open?: boolean; onOpenChange?: (open: boolean) => void }) {
  const [localOpen, setLocalOpen] = useState(false);
  const effectiveOpen = open ?? localOpen;
  const setOpen = onOpenChange ?? setLocalOpen;
  const [activeTab, setActiveTab] = useState<"scratch" | "ai" | "template">("ai");
  const [prompt, setPrompt] = useState("");
  const [title, setTitle] = useState("");
  const [model, setModel] = useState("gemini-2.5-flash");
  const [complexity, setComplexity] = useState<"compact" | "balanced" | "detailed">("detailed");
  const [tone, setTone] = useState<"professional" | "friendly" | "formal">("professional");
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const createMutation = useCreateForm();
  const generateMutation = useGenerateFormAI();
  const createCompleteMutation = useCreateCompleteForm();

  const handleCreate = async () => {
    try {
      if (activeTab === "scratch") {
        if (!title.trim()) {
          toast({ title: "Form title required", description: "Give your form a name before creating it." });
          return;
        }
        const res = await createMutation.mutateAsync({ title: title || "New Form", description: "", userId: "dev-user" });
        setOpen(false);
        setLocation(`/builder/${res.id}`);
      } else if (activeTab === "ai") {
        if (!prompt.trim()) {
          toast({ title: "Prompt required", description: "Describe the form you want so AI can generate it." });
          return;
        }
        const generated = await generateMutation.mutateAsync({ prompt, model, complexity, tone });
        const safeSteps = Array.isArray(generated.steps) && generated.steps.length > 0
          ? generated.steps
          : [{
              title: "Step 1",
              description: "Auto-generated step",
              fields: [{ type: "text", label: "Your answer", placeholder: "", required: true, options: [] }],
            }];
        const form = await createCompleteMutation.mutateAsync({
          title: generated.title || "Generated Form",
          description: generated.description || "",
          steps: safeSteps,
        });
        setOpen(false);
        setLocation(`/builder/${form.id}`);
      }
    } catch (error) {
      toast({
        title: "Create failed",
        description: error instanceof Error ? error.message : "Could not create the form. Please retry.",
        variant: "destructive",
      });
    }
  };

  const isPending = createMutation.isPending || generateMutation.isPending || createCompleteMutation.isPending;

  return (
    <Dialog open={effectiveOpen} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="lg" className="shadow-lg shadow-primary/20" data-testid="button-create-new-form">
          <Plus className="mr-2 h-5 w-5" />
          Create New Form
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[92vh] w-[calc(100vw-1.5rem)] overflow-y-auto rounded-2xl p-4 sm:max-w-[600px] sm:p-6">
        <DialogHeader>
          <DialogTitle className="text-2xl font-display">Create a new form</DialogTitle>
          <DialogDescription>Choose how you want to get started.</DialogDescription>
        </DialogHeader>

        <div className="my-5 grid grid-cols-1 gap-3 sm:my-6 sm:grid-cols-2 sm:gap-4">
          <div
            className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${activeTab === "ai" ? "border-[#f0be57] bg-[#fff6e4]" : "border-border hover:border-[#f0be57]"}`}
            onClick={() => setActiveTab("ai")}
            data-testid="tab-create-ai"
          >
            <div className="p-2 bg-[#fff0ce] rounded-lg w-fit text-[#c17c00] mb-3">
              <Sparkles className="w-6 h-6" />
            </div>
            <h3 className="font-bold">Generate with AI</h3>
            <p className="text-sm text-muted-foreground mt-1">Describe your form and let AI build the structure for you.</p>
          </div>

          <div
            className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${activeTab === "scratch" ? "border-[#8ba5d5] bg-[#eef3ff]" : "border-border hover:border-[#8ba5d5]"}`}
            onClick={() => setActiveTab("scratch")}
            data-testid="tab-create-scratch"
          >
            <div className="p-2 bg-[#e8f0ff] rounded-lg w-fit text-[#3569d0] mb-3">
              <Plus className="w-6 h-6" />
            </div>
            <h3 className="font-bold">Start from Scratch</h3>
            <p className="text-sm text-muted-foreground mt-1">Build your form manually field by field using the editor.</p>
          </div>
        </div>

        {activeTab === "ai" ? (
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1.5 block">What kind of form do you need?</label>
              <Textarea
                placeholder="e.g. A job application form for a senior react developer with sections for personal info, experience, and GitHub profile."
                className="h-32 resize-none"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                data-testid="input-ai-prompt"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground">Model</label>
                <Select value={model} onValueChange={setModel}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select model" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="gemini-2.5-flash">Gemini 2.5 Flash (Fast)</SelectItem>
                    <SelectItem value="gemini-2.5-pro">Gemini 2.5 Pro (Advanced)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Complexity</label>
                <Select value={complexity} onValueChange={(value) => setComplexity(value as typeof complexity)}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select complexity" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="compact">Compact</SelectItem>
                    <SelectItem value="balanced">Balanced</SelectItem>
                    <SelectItem value="detailed">Detailed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Tone</label>
                <Select value={tone} onValueChange={(value) => setTone(value as typeof tone)}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select tone" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="professional">Professional</SelectItem>
                    <SelectItem value="friendly">Friendly</SelectItem>
                    <SelectItem value="formal">Formal</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        ) : activeTab === "scratch" ? (
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1.5 block">Form Title</label>
              <Input
                placeholder="e.g. Contact Form"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                data-testid="input-form-title"
              />
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1.5 block">Form Title</label>
              <Input
                placeholder="Enter form title..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                data-testid="input-form-title"
              />
            </div>
          </div>
        )}

        <div className="flex justify-end pt-4">
          <Button onClick={handleCreate} disabled={isPending} className="w-full sm:w-auto" data-testid="button-confirm-create">
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {activeTab === "ai" ? "Generate Form" : "Create Form"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
