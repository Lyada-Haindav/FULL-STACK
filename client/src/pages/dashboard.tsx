import { useEffect, useState } from "react";
import { useForms, useForm, useCreateForm, useGenerateFormAI, useCreateCompleteForm, useDeleteForm, usePublishForm, useCloneForm } from "@/hooks/use-forms";
import { useSubmissions } from "@/hooks/use-submissions";
import { useTotalSubmissions, useFormSubmissionsCount } from "@/hooks/use-analytics";
import { useLocation } from "wouter";
import { 
  Plus, 
  MoreVertical, 
  FileText, 
  BarChart2, 
  Calendar, 
  Sparkles, 
  Loader2,
  Trash2,
  ArrowLeft,
  Download
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
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogTrigger 
} from "@/components/ui/dialog";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { format } from "date-fns";
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

export default function Dashboard() {
  const { data: forms, isLoading } = useForms();
  const { data: totalSubmissions } = useTotalSubmissions();
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

  if (selectedFormId) {
    const form = forms?.find(f => f.id === selectedFormId);
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
            <div>
              <h1 className="text-3xl font-bold font-display">{form.title} - Submissions</h1>
              <p className="text-muted-foreground mt-1">View and download all responses for this form.</p>
            </div>
          )}

          <SubmissionsView formId={selectedFormId} />
        </div>
      </LayoutShell>
    );
  }

  const activeForms = forms?.filter(f => f.isPublished).length || 0;
  const totalForms = forms?.length || 0;

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
        {/* Header Section */}
        <div className="rounded-3xl border border-border/70 bg-card px-6 py-6 shadow-[0_10px_28px_rgba(24,48,112,0.08)] md:px-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold font-display text-[#1a2a4b]">Dashboard</h1>
              <p className="text-muted-foreground mt-1">Manage your forms and track submissions from one workspace.</p>
            </div>
            <CreateFormDialog open={createOpen} onOpenChange={(open) => {
              setCreateOpen(open);
              if (!open && location === "/dashboard/new") {
                setLocation("/dashboard");
              }
            }} />
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatCard title="Total Forms" value={totalForms} icon={<FileText className="text-blue-500" />} />
          <StatCard title="Active Forms" value={activeForms} icon={<Sparkles className="text-amber-500" />} />
          <StatCard title="Total Responses" value={totalSubmissions || 0} icon={<BarChart2 className="text-emerald-500" />} />
        </div>

        {/* Forms List */}
        <div className="rounded-3xl border border-border/70 bg-card px-5 py-6 shadow-[0_10px_28px_rgba(24,48,112,0.08)] md:px-7">
          <div>
            <h2 className="text-xl font-bold font-display mb-4 text-[#1a2a4b]">Your Forms</h2>
            {forms && forms.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
                <CreateFormDialog open={createOpen} onOpenChange={(open) => {
                  setCreateOpen(open);
                  if (!open && location === "/dashboard/new") {
                    setLocation("/dashboard");
                  }
                }} />
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

  const downloadCSV = () => {
    if (!submissions || submissions.length === 0) return;

    const fieldLabelMap: Record<string, string> = {};
    form?.steps?.forEach((step: any) => {
      step.fields?.forEach((field: any) => {
        fieldLabelMap[`field_${field.id}`] = field.label || `field_${field.id}`;
      });
    });

    // Get all unique keys from all submissions
    const keys = Array.from(new Set(submissions.flatMap(s => Object.keys(s.data as object))));
    
    const headers = ["Submitted At", ...keys.map((key) => fieldLabelMap[key] || key)];
    const rows = submissions.map(s => {
      const data = s.data as Record<string, any>;
      return [
        format(new Date(s.submittedAt), 'yyyy-MM-dd HH:mm:ss'),
        ...keys.map(k => {
          const val = data[k];
          if (val && typeof val === 'object' && val.type === 'file' && Array.isArray(val.files)) {
            return val.files.map((file: any) => file?.name || file?.id).join("; ");
          }
          return typeof val === 'object' ? JSON.stringify(val) : val;
        })
      ];
    });

    const csvContent = [
      headers.join(","),
      ...rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `submissions_form_${formId}.csv`);
    link.style.visibility = 'hidden';
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

  const fieldLabelMap: Record<string, string> = {};
  form?.steps?.forEach((step: any) => {
    step.fields?.forEach((field: any) => {
      fieldLabelMap[`field_${field.id}`] = field.label || `field_${field.id}`;
    });
  });

  const dataKeys = Array.from(new Set(submissions.flatMap(s => Object.keys(s.data as object))));

  return (
    <div className="space-y-4">
      <div className="flex justify-end gap-2">
        <Button onClick={downloadCSV} className="gap-2" data-testid="button-download-csv">
          <Download className="w-4 h-4" />
          Download CSV
        </Button>
        <Button
          variant="outline"
          className="gap-2"
          onClick={() => window.open(`/api/forms/${formId}/submissions/export`, "_blank")}
          data-testid="button-download-zip"
        >
          <Download className="w-4 h-4" />
          Download All Files
        </Button>
      </div>

      <Card className="overflow-hidden border-border/70 shadow-[0_10px_24px_rgba(24,48,112,0.08)]">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              {dataKeys.map(key => (
                <TableHead key={key} className="capitalize">{fieldLabelMap[key] || key}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {submissions.map((submission) => (
              <TableRow key={submission.id}>
                <TableCell className="whitespace-nowrap text-muted-foreground">
                  {format(new Date(submission.submittedAt), 'MMM d, HH:mm')}
                </TableCell>
                {dataKeys.map(key => {
                  const val = (submission.data as any)[key];
                  if (val && typeof val === 'object' && val.type === 'file' && Array.isArray(val.files)) {
                    return (
                      <TableCell key={key} className="space-y-1">
                        {val.files.map((file: any) => {
                          return (
                            <div key={file.id} className="flex items-center gap-2">
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
                          );
                        })}
                      </TableCell>
                    );
                  }
                  return (
                    <TableCell key={key}>
                      {typeof val === 'boolean' ? (val ? 'Yes' : 'No') : String(val ?? '-')}
                    </TableCell>
                  );
                })}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}

function StatCard({ title, value, icon }: { title: string, value: number, icon: React.ReactNode }) {
  return (
    <Card className="border-border/70 bg-card hover:shadow-md transition-shadow">
      <CardContent className="p-6 flex items-center gap-4">
        <div className="p-3 rounded-xl bg-[#eef3ff]">
          {icon}
        </div>
        <div>
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="text-2xl font-bold font-display">{value}</p>
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
  form: any,
  onViewSubmissions: () => void,
  onDelete: () => void,
  onTogglePublish: () => void,
  onClone: () => void,
  isPublishing: boolean,
}) {
  const [_, setLocation] = useLocation();
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
            <div className={`px-2 py-1 rounded-md text-xs font-medium ${form.isPublished ? 'bg-emerald-100 text-emerald-700' : 'bg-[#edf2ff] text-[#5a6d93]'}`}>
              {form.isPublished ? 'Published' : 'Draft'}
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity" data-testid={`button-form-menu-${form.id}`}>
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
                <DropdownMenuItem onClick={() => window.open(`/forms/${form.id}`, '_blank')}>View Public</DropdownMenuItem>
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
          <CardDescription className="line-clamp-2 mt-2">
            {form.description || "No description provided."}
          </CardDescription>
        </CardHeader>
        <CardContent className="border-t border-border/50 pt-4 mt-auto">
          <div className="flex justify-between items-center text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {format(new Date(form.createdAt), 'MMM d, yyyy')}
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
          <div className="grid grid-cols-2 gap-2 mt-4">
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
              ) : (
                form.isPublished ? "Unpublish" : "Publish"
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
  const [activeTab, setActiveTab] = useState<'scratch' | 'ai' | 'template'>('ai');
  const [prompt, setPrompt] = useState("");
  const [title, setTitle] = useState("");
  const [model, setModel] = useState("gemini-2.5-flash");
  const [complexity, setComplexity] = useState<"compact" | "balanced" | "detailed">("detailed");
  const [tone, setTone] = useState<"professional" | "friendly" | "formal">("professional");
  const [_, setLocation] = useLocation();
  const { toast } = useToast();

  const createMutation = useCreateForm();
  const generateMutation = useGenerateFormAI();
  const createCompleteMutation = useCreateCompleteForm();

  const handleCreate = async () => {
    if (activeTab === 'scratch') {
      if (!title.trim()) {
        toast({ title: "Form title required", description: "Give your form a name before creating it." });
        return;
      }
      const res = await createMutation.mutateAsync({ title: title || "New Form", description: "", userId: "dev-user" });
      setOpen(false);
      setLocation(`/builder/${res.id}`);
    } else if (activeTab === 'ai') {
      if (!prompt.trim()) {
        toast({ title: "Prompt required", description: "Describe the form you want so AI can generate it." });
        return;
      }
      const generated = await generateMutation.mutateAsync({ prompt, model, complexity, tone });
      const form = await createCompleteMutation.mutateAsync({
        title: generated.title,
        description: generated.description,
        steps: generated.steps || []
      });
      setOpen(false);
      setLocation(`/builder/${form.id}`);
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
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-display">Create a new form</DialogTitle>
          <DialogDescription>
            Choose how you want to get started.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-3 gap-4 my-6">
          <div 
            className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${activeTab === 'ai' ? 'border-[#f0be57] bg-[#fff6e4]' : 'border-border hover:border-[#f0be57]'}`}
            onClick={() => setActiveTab('ai')}
            data-testid="tab-create-ai"
          >
            <div className="p-2 bg-[#fff0ce] rounded-lg w-fit text-[#c17c00] mb-3">
              <Sparkles className="w-6 h-6" />
            </div>
            <h3 className="font-bold">Generate with AI</h3>
            <p className="text-sm text-muted-foreground mt-1">Describe your form and let AI build the structure for you.</p>
          </div>
          
          <div 
            className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${activeTab === 'scratch' ? 'border-[#8ba5d5] bg-[#eef3ff]' : 'border-border hover:border-[#8ba5d5]'}`}
            onClick={() => setActiveTab('scratch')}
            data-testid="tab-create-scratch"
          >
            <div className="p-2 bg-[#e8f0ff] rounded-lg w-fit text-[#3569d0] mb-3">
              <Plus className="w-6 h-6" />
            </div>
            <h3 className="font-bold">Start from Scratch</h3>
            <p className="text-sm text-muted-foreground mt-1">Build your form manually field by field using the editor.</p>
          </div>
        </div>

        {activeTab === 'ai' ? (
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
        ) : activeTab === 'scratch' ? (
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
            {activeTab === 'ai' ? 'Generate Form' : 'Create Form'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
