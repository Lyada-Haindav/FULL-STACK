import { useParams, Link } from "wouter";
import { useForm, useUpdateForm, usePublishForm } from "@/hooks/use-forms";
import { useCreateStep, useUpdateStep } from "@/hooks/use-steps";
import { useCreateField, useUpdateField, useDeleteField, useReorderFields } from "@/hooks/use-fields";
import { LayoutShell } from "@/components/layout-shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { 
  ArrowLeft, 
  Eye, 
  Type, 
  Hash, 
  List, 
  CheckSquare, 
  Calendar as CalendarIcon, 
  Plus,
  Trash2,
  GripVertical,
  CircleDot,
  FileText,
  Mic,
  Upload,
  Mail,
  Clock3,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import { ShareFormDialog } from "@/components/share-form-dialog";
import { useState, useEffect, useMemo } from "react";
import { DndContext, closestCenter } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, useSortable, arrayMove } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { motion, AnimatePresence } from "framer-motion";

type SaveState = "idle" | "saving" | "saved" | "error";

type SaveHandlers = {
  onSaveStart: () => void;
  onSaveSuccess: () => void;
  onSaveError: () => void;
};

export default function FormBuilder() {
  const { id } = useParams();
  const formId = id || "0";
  const { data: form, isLoading } = useForm(formId);
  const [activeStepIndex, setActiveStepIndex] = useState(0);
  const [theme, setTheme] = useState<any>({});
  const [stepTitleDraft, setStepTitleDraft] = useState("");
  const [stepDescriptionDraft, setStepDescriptionDraft] = useState("");
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const updateForm = useUpdateForm();
  const updateStep = useUpdateStep();

  const markSaving = () => setSaveState("saving");
  const markSaved = () => {
    setSaveState("saved");
    setLastSavedAt(new Date());
  };
  const markError = () => setSaveState("error");
  
  useEffect(() => {
    if (form) {
      setTheme(form?.theme || {});
    }
  }, [form?.theme, form]);
  const steps = form?.steps ?? [];
  const currentStep = steps[activeStepIndex];

  useEffect(() => {
    if (!currentStep) {
      setStepTitleDraft("");
      setStepDescriptionDraft("");
      return;
    }
    setStepTitleDraft(currentStep.title || "");
    setStepDescriptionDraft(currentStep.description || "");
  }, [currentStep?.id, currentStep?.title, currentStep?.description]);

  useEffect(() => {
    if (!form) return;
    if (steps.length === 0) {
      if (activeStepIndex !== 0) setActiveStepIndex(0);
      return;
    }
    if (activeStepIndex >= steps.length) {
      setActiveStepIndex(steps.length - 1);
    }
  }, [form, steps.length, activeStepIndex]);

  const saveStatus = useMemo(() => {
    if (saveState === "saving") {
      return {
        label: "Saving...",
        icon: <Clock3 className="h-3.5 w-3.5" />,
        className: "border-amber-200 bg-amber-50 text-amber-700",
      };
    }
    if (saveState === "saved") {
      return {
        label: lastSavedAt ? `Saved ${lastSavedAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}` : "Saved",
        icon: <CheckCircle2 className="h-3.5 w-3.5" />,
        className: "border-emerald-200 bg-emerald-50 text-emerald-700",
      };
    }
    if (saveState === "error") {
      return {
        label: "Save failed",
        icon: <AlertCircle className="h-3.5 w-3.5" />,
        className: "border-red-200 bg-red-50 text-red-700",
      };
    }
    return {
      label: "Draft ready",
      icon: <CheckCircle2 className="h-3.5 w-3.5" />,
      className: "border-border bg-muted text-muted-foreground",
    };
  }, [lastSavedAt, saveState]);

  if (isLoading) return <div>Loading...</div>;
  if (!form) return <div>Form not found</div>;

  const persistCurrentStep = () => {
    if (!currentStep) return;

    const normalizedTitle = stepTitleDraft.trim() || "Untitled Step";
    const normalizedDescription = stepDescriptionDraft.trim();
    const existingTitle = currentStep.title || "";
    const existingDescription = currentStep.description || "";

    if (normalizedTitle === existingTitle && normalizedDescription === existingDescription) {
      return;
    }

    markSaving();
    updateStep.mutate(
      {
        id: currentStep.id,
        formId,
        title: normalizedTitle,
        description: normalizedDescription,
      },
      {
        onSuccess: () => markSaved(),
        onError: () => markError(),
      },
    );
  };

  const saveTheme = (next: any) => {
    setTheme(next);
    markSaving();
    updateForm.mutate(
      { id: formId, theme: next },
      {
        onSuccess: () => markSaved(),
        onError: () => markError(),
      },
    );
  };

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Builder Header */}
      <header className="h-16 border-b border-border bg-card px-4 sm:px-6 flex items-center justify-between z-20">
        <div className="flex items-center gap-2 sm:gap-4 min-w-0 flex-1">
          <Link href="/dashboard">
            <Button variant="ghost" size="icon" className="flex-shrink-0">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div className="h-6 w-[1px] bg-border mx-2 hidden sm:block" />
          <h1 className="font-bold text-sm sm:text-lg truncate max-w-[150px] sm:max-w-[200px] md:max-w-md">{form.title}</h1>
          <span className="bg-muted text-muted-foreground px-2 py-0.5 rounded text-xs font-medium uppercase flex-shrink-0">
            {form.isPublished ? 'Published' : 'Draft'}
          </span>
          <span className={`hidden sm:inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium ${saveStatus.className}`}>
            {saveStatus.icon}
            {saveStatus.label}
          </span>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          <Button variant="outline" size="sm" className="hidden sm:flex" onClick={() => window.open(`/forms/${formId}`, '_blank')}>
            <Eye className="h-4 w-4 mr-2" />
            Preview
          </Button>
          <Button variant="outline" size="sm" className="sm:hidden" onClick={() => window.open(`/forms/${formId}`, '_blank')}>
            <Eye className="h-4 w-4" />
          </Button>
          <ShareFormDialog formId={formId} formTitle={form.title} />
          <PublishButton form={form} />
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar: Steps & Outline */}
        <aside className="w-64 sm:w-72 border-r border-border bg-card flex flex-col hidden lg:block">
          <div className="p-4 border-b border-border">
            <h2 className="font-semibold text-sm uppercase text-muted-foreground">Steps</h2>
          </div>
          <ScrollArea className="flex-1">
            <div className="p-2 space-y-1">
              {steps.map((step, idx) => (
                <div 
                  key={step.id}
                  className={`flex items-center gap-3 px-3 py-3 rounded-lg cursor-pointer transition-colors ${idx === activeStepIndex ? 'bg-primary/10 text-primary font-medium' : 'hover:bg-muted text-muted-foreground'}`}
                  onClick={() => {
                    if (idx !== activeStepIndex) {
                      persistCurrentStep();
                    }
                    setActiveStepIndex(idx);
                  }}
                >
                  <div className={`h-6 w-6 rounded flex items-center justify-center text-xs border ${idx === activeStepIndex ? 'border-primary bg-primary text-white' : 'border-border bg-background'}`}>
                    {idx + 1}
                  </div>
                  <span className="truncate flex-1 text-sm">{step.title}</span>
                </div>
              ))}
              <AddStepButton
                formId={formId}
                nextIndex={steps.length}
                onSaveStart={markSaving}
                onSaveSuccess={markSaved}
                onSaveError={markError}
              />
            </div>
          </ScrollArea>
        </aside>

        {/* Center: Canvas */}
        <main className="flex-1 bg-muted/30 p-8 overflow-y-auto">
          <div className="max-w-3xl mx-auto space-y-8">
            {/* Step Properties Card */}
            <Card className="shadow-none border-border/50">
              <div className="p-6 space-y-4">
                <Input 
                  value={stepTitleDraft}
                  onChange={(e) => setStepTitleDraft(e.target.value)}
                  onBlur={persistCurrentStep}
                  disabled={!currentStep}
                  className="text-2xl font-bold border-none shadow-none px-0 h-auto focus-visible:ring-0" 
                  placeholder="Step Title"
                />
                <Textarea 
                  value={stepDescriptionDraft}
                  onChange={(e) => setStepDescriptionDraft(e.target.value)}
                  onBlur={persistCurrentStep}
                  disabled={!currentStep}
                  className="resize-none border-none shadow-none px-0 focus-visible:ring-0 min-h-[60px] text-muted-foreground" 
                  placeholder="Add a description for this step..."
                />
              </div>
            </Card>

            {/* Theme Card */}
            <Card className="shadow-none border-border/50">
              <div className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Theme</h3>
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs text-muted-foreground">Primary Color</Label>
                    <Input
                      type="color"
                      value={theme?.primaryColor || "#f6b73c"}
                      onChange={(e) => saveTheme({ ...theme, primaryColor: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Background Style</Label>
                    <select
                      className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                      value={theme?.backgroundStyle || "dark"}
                      onChange={(e) => saveTheme({ ...theme, backgroundStyle: e.target.value })}
                    >
                      <option value="dark">Dark</option>
                      <option value="solid">Solid</option>
                      <option value="gradient">Gradient</option>
                    </select>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Background Color</Label>
                    <Input
                      type="color"
                      value={theme?.backgroundColor || "#0b0f14"}
                      onChange={(e) => saveTheme({ ...theme, backgroundColor: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Gradient End</Label>
                    <Input
                      type="color"
                      value={theme?.gradientTo || "#1f2937"}
                      onChange={(e) => saveTheme({ ...theme, gradientTo: e.target.value })}
                    />
                  </div>
                  <div className="sm:col-span-2 space-y-2">
                    <Label className="text-xs text-muted-foreground">Logo URL</Label>
                    <Input
                      value={theme?.logoUrl || ""}
                      onChange={(e) => saveTheme({ ...theme, logoUrl: e.target.value })}
                      placeholder="https://..."
                    />
                    <div className="flex flex-wrap gap-2">
                      {[
                        {
                          name: "Aurora",
                          url:
                            "data:image/svg+xml;utf8," +
                            encodeURIComponent('<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"96\" height=\"96\" viewBox=\"0 0 96 96\"><defs><linearGradient id=\"g\" x1=\"0\" y1=\"0\" x2=\"1\" y2=\"1\"><stop offset=\"0\" stop-color=\"#f59e0b\"/><stop offset=\"1\" stop-color=\"#22d3ee\"/></linearGradient></defs><rect width=\"96\" height=\"96\" rx=\"24\" fill=\"url(#g)\"/><path d=\"M30 62c10-22 26-24 36-28-6 10-8 18-12 26-6 12-14 20-24 22\" fill=\"#0b0f14\" opacity=\"0.9\"/></svg>'),
                        },
                        {
                          name: "Helix",
                          url:
                            "data:image/svg+xml;utf8," +
                            encodeURIComponent('<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"96\" height=\"96\" viewBox=\"0 0 96 96\"><rect width=\"96\" height=\"96\" rx=\"24\" fill=\"#0f172a\"/><circle cx=\"48\" cy=\"30\" r=\"10\" fill=\"#38bdf8\"/><circle cx=\"48\" cy=\"66\" r=\"10\" fill=\"#f59e0b\"/><path d=\"M32 40c8 8 24 8 32 0\" stroke=\"#94a3b8\" stroke-width=\"6\" stroke-linecap=\"round\"/></svg>'),
                        },
                        {
                          name: "Nimbus",
                          url:
                            "data:image/svg+xml;utf8," +
                            encodeURIComponent('<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"96\" height=\"96\" viewBox=\"0 0 96 96\"><rect width=\"96\" height=\"96\" rx=\"24\" fill=\"#111827\"/><path d=\"M28 58c0-8 6-14 14-14 2-10 10-18 22-18 11 0 20 9 20 20 0 9-7 16-16 16H42c-8 0-14-6-14-14\" fill=\"#e5e7eb\"/></svg>'),
                        },
                        {
                          name: "Quanta",
                          url:
                            "data:image/svg+xml;utf8," +
                            encodeURIComponent('<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"96\" height=\"96\" viewBox=\"0 0 96 96\"><rect width=\"96\" height=\"96\" rx=\"24\" fill=\"#0b0f14\"/><rect x=\"24\" y=\"24\" width=\"48\" height=\"48\" rx=\"12\" fill=\"#f59e0b\"/><path d=\"M36 36h24v24H36z\" fill=\"#0b0f14\" opacity=\"0.7\"/></svg>'),
                        },
                        {
                          name: "Pulse",
                          url:
                            "data:image/svg+xml;utf8," +
                            encodeURIComponent('<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"96\" height=\"96\" viewBox=\"0 0 96 96\"><rect width=\"96\" height=\"96\" rx=\"24\" fill=\"#111827\"/><path d=\"M18 52h14l6-12 10 24 8-18 4 6h18\" stroke=\"#22d3ee\" stroke-width=\"6\" fill=\"none\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/></svg>'),
                        },
                      ].map((logo) => (
                        <button
                          key={logo.name}
                          className="flex items-center gap-2 rounded-full border border-border px-3 py-1 text-xs text-muted-foreground hover:text-foreground hover:border-foreground/40 transition-colors"
                          onClick={() => saveTheme({ ...theme, logoUrl: logo.url })}
                          type="button"
                        >
                          <img src={logo.url} alt={logo.name} className="h-5 w-5 rounded-md object-contain bg-muted/30" />
                          {logo.name}
                        </button>
                      ))}
                      <button
                        className="flex items-center gap-2 rounded-full border border-border px-3 py-1 text-xs text-muted-foreground hover:text-foreground hover:border-foreground/40 transition-colors"
                        onClick={() => saveTheme({ ...theme, logoUrl: "" })}
                        type="button"
                      >
                        Clear Logo
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            {/* Fields Area */}
            <div className="space-y-4 min-h-[300px]">
              {currentStep && (
                <FieldsList 
                  fields={currentStep.fields} 
                  formId={formId} 
                  stepId={currentStep.id} 
                  onSaveStart={markSaving}
                  onSaveSuccess={markSaved}
                  onSaveError={markError}
                />
              )}
            </div>

            {/* Add Field Palette (Simplified) */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              <AddFieldButton type="text" icon={<Type className="w-4 h-4" />} label="Text Input" formId={formId} stepId={currentStep?.id} onSaveStart={markSaving} onSaveSuccess={markSaved} onSaveError={markError} />
              <AddFieldButton type="email" icon={<Mail className="w-4 h-4" />} label="Email" formId={formId} stepId={currentStep?.id} onSaveStart={markSaving} onSaveSuccess={markSaved} onSaveError={markError} />
              <AddFieldButton type="textarea" icon={<FileText className="w-4 h-4" />} label="Textarea" formId={formId} stepId={currentStep?.id} onSaveStart={markSaving} onSaveSuccess={markSaved} onSaveError={markError} />
              <AddFieldButton type="number" icon={<Hash className="w-4 h-4" />} label="Number" formId={formId} stepId={currentStep?.id} onSaveStart={markSaving} onSaveSuccess={markSaved} onSaveError={markError} />
              <AddFieldButton type="select" icon={<List className="w-4 h-4" />} label="Select" formId={formId} stepId={currentStep?.id} onSaveStart={markSaving} onSaveSuccess={markSaved} onSaveError={markError} />
              <AddFieldButton type="radio" icon={<CircleDot className="w-4 h-4" />} label="Radio" formId={formId} stepId={currentStep?.id} onSaveStart={markSaving} onSaveSuccess={markSaved} onSaveError={markError} />
              <AddFieldButton type="checkbox" icon={<CheckSquare className="w-4 h-4" />} label="Checkbox" formId={formId} stepId={currentStep?.id} onSaveStart={markSaving} onSaveSuccess={markSaved} onSaveError={markError} />
              <AddFieldButton type="date" icon={<CalendarIcon className="w-4 h-4" />} label="Date" formId={formId} stepId={currentStep?.id} onSaveStart={markSaving} onSaveSuccess={markSaved} onSaveError={markError} />
              <AddFieldButton type="file" icon={<Upload className="w-4 h-4" />} label="File Upload" formId={formId} stepId={currentStep?.id} onSaveStart={markSaving} onSaveSuccess={markSaved} onSaveError={markError} />
            </div>
          </div>
        </main>

        {/* Right Sidebar: Field Properties */}
        {/* Simplified: Properties could be inline or modal for MVP, omitting sidebar for cleaner code in this iteration */}
      </div>
    </div>
  );
}

function PublishButton({ form }: { form: any }) {
  const publish = usePublishForm();
  
  return (
    <Button 
      onClick={() => publish.mutate(form.id)} 
      disabled={publish.isPending}
      className={form.isPublished ? "bg-muted text-foreground hover:bg-muted/80" : "bg-primary text-primary-foreground"}
    >
      {publish.isPending ? "Publishing..." : form.isPublished ? "Unpublish" : "Publish Form"}
    </Button>
  );
}

function AddStepButton({ formId, nextIndex, onSaveStart, onSaveSuccess, onSaveError }: { formId: string, nextIndex: number } & SaveHandlers) {
  const createStep = useCreateStep();
  
  return (
    <Button 
      variant="ghost" 
      className="w-full justify-start gap-2 text-muted-foreground hover:text-primary"
      onClick={() => {
        onSaveStart();
        createStep.mutate(
          { formId, title: "New Step", orderIndex: nextIndex },
          {
            onSuccess: () => onSaveSuccess(),
            onError: () => onSaveError(),
          },
        );
      }}
    >
      <Plus className="w-4 h-4" />
      Add Step
    </Button>
  );
}

function AddFieldButton({ type, icon, label, formId, stepId, onSaveStart, onSaveSuccess, onSaveError }: any) {
  const createField = useCreateField();

  if (!stepId) return null;

  return (
    <Button 
      variant="outline" 
      className="flex flex-col h-20 items-center justify-center gap-2 hover:border-primary hover:text-primary transition-colors bg-card"
      onClick={() => {
        onSaveStart();
        createField.mutate({ 
          formId, 
          stepId, 
          type, 
          label: `New ${label}`, 
          required: false, 
          orderIndex: 999 
        }, {
          onSuccess: () => onSaveSuccess(),
          onError: () => onSaveError(),
        });
      }}
    >
      {icon}
      <span className="text-xs">{label}</span>
    </Button>
  );
}

function FieldsList({ fields, formId, stepId, onSaveStart, onSaveSuccess, onSaveError }: { fields: any[], formId: string, stepId: string } & SaveHandlers) {
  const reorder = useReorderFields();
  const sorted = useMemo(() => [...fields].sort((a, b) => a.orderIndex - b.orderIndex), [fields]);
  const [ordered, setOrdered] = useState(sorted);

  useEffect(() => {
    setOrdered(sorted);
  }, [sorted]);

  const handleDragEnd = (event: any) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = ordered.findIndex((item) => item.id === active.id);
    const newIndex = ordered.findIndex((item) => item.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;
    const next = arrayMove(ordered, oldIndex, newIndex).map((item, index) => ({
      ...item,
      orderIndex: index,
    }));
    setOrdered(next);
    onSaveStart();
    reorder.mutate({
      formId,
      stepId,
      fields: next.map((item) => ({ id: item.id, orderIndex: item.orderIndex })),
    }, {
      onSuccess: () => onSaveSuccess(),
      onError: () => onSaveError(),
    });
  };

  return (
    <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={ordered.map((f) => f.id)} strategy={verticalListSortingStrategy}>
        <div className="space-y-4">
          {ordered.map((field) => (
            <SortableFieldEditor
              key={field.id}
              field={field}
              formId={formId}
              onSaveStart={onSaveStart}
              onSaveSuccess={onSaveSuccess}
              onSaveError={onSaveError}
            />
          ))}
          {ordered.length === 0 && (
            <div className="border-2 border-dashed border-border rounded-xl p-12 text-center text-muted-foreground">
              <p>This step is empty. Add fields below.</p>
            </div>
          )}
        </div>
      </SortableContext>
    </DndContext>
  );
}

function SortableFieldEditor({ field, formId, onSaveStart, onSaveSuccess, onSaveError }: { field: any; formId: string } & SaveHandlers) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: field.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
  };

  return (
    <div ref={setNodeRef} style={style}>
      <FieldEditor
        field={field}
        formId={formId}
        onSaveStart={onSaveStart}
        onSaveSuccess={onSaveSuccess}
        onSaveError={onSaveError}
        dragAttributes={attributes}
        dragListeners={listeners}
        dragHandleRef={setActivatorNodeRef}
      />
    </div>
  );
}

function FieldEditor({
  field,
  formId,
  onSaveStart,
  onSaveSuccess,
  onSaveError,
  dragAttributes,
  dragListeners,
  dragHandleRef,
}: {
  field: any;
  formId: string;
  onSaveStart: () => void;
  onSaveSuccess: () => void;
  onSaveError: () => void;
  dragAttributes?: any;
  dragListeners?: any;
  dragHandleRef?: (node: HTMLElement | null) => void;
}) {
  const update = useUpdateField();
  const remove = useDeleteField();
  const [label, setLabel] = useState(field.label);
  const [rules, setRules] = useState<any>(field.validationRules || {});

  const handleBlur = () => {
    if (label !== field.label) {
      onSaveStart();
      update.mutate({ id: field.id, formId, label }, {
        onSuccess: () => onSaveSuccess(),
        onError: () => onSaveError(),
      });
    }
  };

  const saveRules = (next: any) => {
    setRules(next);
    onSaveStart();
    update.mutate({ id: field.id, formId, validationRules: next }, {
      onSuccess: () => onSaveSuccess(),
      onError: () => onSaveError(),
    });
  };

  return (
    <motion.div layout initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <Card className="group relative border-transparent hover:border-border transition-colors">
        <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground cursor-grab active:cursor-grabbing"
            ref={dragHandleRef}
            {...dragAttributes}
            {...dragListeners}
            aria-label="Drag field"
          >
            <GripVertical className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => {
            onSaveStart();
            remove.mutate({ id: field.id, formId }, {
              onSuccess: () => onSaveSuccess(),
              onError: () => onSaveError(),
            });
          }}>
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
        <div className="p-6">
          <div className="mb-4">
            <Input 
              value={label} 
              onChange={(e) => setLabel(e.target.value)}
              onBlur={handleBlur}
              className="font-medium text-lg border-none p-0 h-auto focus-visible:ring-0 max-w-md bg-transparent"
            />
          </div>
          
            {/* Preview of the field */}
          <div className="pointer-events-none opacity-60">
            {field.type === 'text' && <Input placeholder="Short text answer" />}
            {field.type === 'email' && <Input type="email" placeholder="name@company.com" />}
            {field.type === 'textarea' && <Textarea placeholder="Long text answer" />}
            {field.type === 'number' && <Input type="number" placeholder="0" />}
            {field.type === 'date' && <Input type="date" />}
            {field.type === 'radio' && (
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <div className="h-4 w-4 border border-primary rounded-full" />
                  <label>Option 1</label>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="h-4 w-4 border border-primary rounded-full" />
                  <label>Option 2</label>
                </div>
              </div>
            )}
            {field.type === 'checkbox' && (
              <div className="flex items-center space-x-2">
                <div className="h-4 w-4 border border-primary rounded" />
                <label>Option label</label>
              </div>
            )}
            {field.type === 'file' && (
              <Input type="file" disabled />
            )}
          </div>

          <div className="mt-4 pt-4 border-t border-border/50 flex items-center gap-4 opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="flex items-center gap-2">
              <Switch 
                checked={field.required} 
                onCheckedChange={(checked) => {
                  onSaveStart();
                  update.mutate({ id: field.id, formId, required: checked }, {
                    onSuccess: () => onSaveSuccess(),
                    onError: () => onSaveError(),
                  });
                }} 
              />
              <Label className="text-xs text-muted-foreground">Required</Label>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-border/50">
            <p className="text-xs uppercase tracking-wide text-muted-foreground mb-3">Validation</p>
            {field.type === 'text' || field.type === 'textarea' || field.type === 'email' ? (
              <div className="grid sm:grid-cols-3 gap-3">
                <div>
                  <Label className="text-xs text-muted-foreground">Min length</Label>
                  <Input
                    type="number"
                    value={rules?.minLength ?? ""}
                    onChange={(e) => saveRules({ ...rules, minLength: e.target.value ? Number(e.target.value) : undefined })}
                  />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Max length</Label>
                  <Input
                    type="number"
                    value={rules?.maxLength ?? ""}
                    onChange={(e) => saveRules({ ...rules, maxLength: e.target.value ? Number(e.target.value) : undefined })}
                  />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Pattern</Label>
                  <select
                    className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                    value={rules?.patternLabel ?? (field.type === 'email' ? 'Email' : 'None')}
                    onChange={(e) => {
                      const label = e.target.value;
                      const presets: Record<string, string | undefined> = {
                        None: undefined,
                        Email: "^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$",
                        Phone: "^\\+?[0-9\\s\\-()]{7,}$",
                        URL: "^(https?:\\/\\/)?([\\w-]+\\.)+[\\w-]+(\\/[\\w-./?%&=]*)?$",
                        ZIP: "^[0-9]{5}(-[0-9]{4})?$",
                      };
                      saveRules({ ...rules, patternLabel: label === 'None' ? undefined : label, pattern: presets[label] });
                    }}
                  >
                    <option>None</option>
                    <option>Email</option>
                    <option>Phone</option>
                    <option>URL</option>
                    <option>ZIP</option>
                  </select>
                </div>
              </div>
            ) : field.type === 'number' ? (
              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs text-muted-foreground">Min</Label>
                  <Input
                    type="number"
                    value={rules?.min ?? ""}
                    onChange={(e) => saveRules({ ...rules, min: e.target.value ? Number(e.target.value) : undefined })}
                  />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Max</Label>
                  <Input
                    type="number"
                    value={rules?.max ?? ""}
                    onChange={(e) => saveRules({ ...rules, max: e.target.value ? Number(e.target.value) : undefined })}
                  />
                </div>
              </div>
            ) : field.type === 'file' ? (
              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs text-muted-foreground">Max files</Label>
                  <Input
                    type="number"
                    value={rules?.maxFiles ?? 3}
                    onChange={(e) => saveRules({ ...rules, multiple: true, maxFiles: e.target.value ? Number(e.target.value) : 3 })}
                  />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Max size (MB)</Label>
                  <Input
                    type="number"
                    value={rules?.maxSizeMb ?? 10}
                    onChange={(e) => saveRules({ ...rules, maxSizeMb: e.target.value ? Number(e.target.value) : 10 })}
                  />
                </div>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">No validation options for this field type.</p>
            )}
          </div>
        </div>
      </Card>
    </motion.div>
  );
}
