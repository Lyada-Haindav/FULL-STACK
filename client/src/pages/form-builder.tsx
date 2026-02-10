import { useParams, Link } from "wouter";
import { useForm, useUpdateForm, usePublishForm } from "@/hooks/use-forms";
import { useCreateStep } from "@/hooks/use-steps";
import { useCreateField, useUpdateField, useDeleteField } from "@/hooks/use-fields";
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
  Settings, 
  Save, 
  Eye, 
  Share2, 
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
  Mic
} from "lucide-react";
import { ShareFormDialog } from "@/components/share-form-dialog";
import { useState, useEffect } from "react";
import { DndContext, closestCenter, DragOverlay } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { motion, AnimatePresence } from "framer-motion";

export default function FormBuilder() {
  const { id } = useParams();
  const formId = parseInt(id || "0");
  const { data: form, isLoading } = useForm(formId);
  const [activeStepIndex, setActiveStepIndex] = useState(0);
  
  if (isLoading) return <div>Loading...</div>;
  if (!form) return <div>Form not found</div>;

  const currentStep = form.steps[activeStepIndex];

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
              {form.steps.map((step, idx) => (
                <div 
                  key={step.id}
                  className={`flex items-center gap-3 px-3 py-3 rounded-lg cursor-pointer transition-colors ${idx === activeStepIndex ? 'bg-primary/10 text-primary font-medium' : 'hover:bg-muted text-muted-foreground'}`}
                  onClick={() => setActiveStepIndex(idx)}
                >
                  <div className={`h-6 w-6 rounded flex items-center justify-center text-xs border ${idx === activeStepIndex ? 'border-primary bg-primary text-white' : 'border-border bg-background'}`}>
                    {idx + 1}
                  </div>
                  <span className="truncate flex-1 text-sm">{step.title}</span>
                </div>
              ))}
              <AddStepButton formId={formId} nextIndex={form.steps.length} />
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
                  value={currentStep?.title || ""} 
                  className="text-2xl font-bold border-none shadow-none px-0 h-auto focus-visible:ring-0" 
                  placeholder="Step Title"
                />
                <Textarea 
                  value={currentStep?.description || ""} 
                  className="resize-none border-none shadow-none px-0 focus-visible:ring-0 min-h-[60px] text-muted-foreground" 
                  placeholder="Add a description for this step..."
                />
              </div>
            </Card>

            {/* Fields Area */}
            <div className="space-y-4 min-h-[300px]">
              {currentStep && (
                <FieldsList 
                  fields={currentStep.fields} 
                  formId={formId} 
                  stepId={currentStep.id} 
                />
              )}
            </div>

            {/* Add Field Palette (Simplified) */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              <AddFieldButton type="text" icon={<Type className="w-4 h-4" />} label="Text Input" formId={formId} stepId={currentStep?.id} />
              <AddFieldButton type="textarea" icon={<FileText className="w-4 h-4" />} label="Textarea" formId={formId} stepId={currentStep?.id} />
              <AddFieldButton type="number" icon={<Hash className="w-4 h-4" />} label="Number" formId={formId} stepId={currentStep?.id} />
              <AddFieldButton type="select" icon={<List className="w-4 h-4" />} label="Select" formId={formId} stepId={currentStep?.id} />
              <AddFieldButton type="radio" icon={<CircleDot className="w-4 h-4" />} label="Radio" formId={formId} stepId={currentStep?.id} />
              <AddFieldButton type="checkbox" icon={<CheckSquare className="w-4 h-4" />} label="Checkbox" formId={formId} stepId={currentStep?.id} />
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

function AddStepButton({ formId, nextIndex }: { formId: number, nextIndex: number }) {
  const createStep = useCreateStep();
  
  return (
    <Button 
      variant="ghost" 
      className="w-full justify-start gap-2 text-muted-foreground hover:text-primary"
      onClick={() => createStep.mutate({ formId, title: "New Step", orderIndex: nextIndex })}
    >
      <Plus className="w-4 h-4" />
      Add Step
    </Button>
  );
}

function AddFieldButton({ type, icon, label, formId, stepId }: any) {
  const createField = useCreateField();

  if (!stepId) return null;

  return (
    <Button 
      variant="outline" 
      className="flex flex-col h-20 items-center justify-center gap-2 hover:border-primary hover:text-primary transition-colors bg-card"
      onClick={() => createField.mutate({ 
        formId, 
        stepId, 
        type, 
        label: `New ${label}`, 
        required: false, 
        orderIndex: 999 
      })}
    >
      {icon}
      <span className="text-xs">{label}</span>
    </Button>
  );
}

function FieldsList({ fields, formId, stepId }: { fields: any[], formId: number, stepId: number }) {
  // Sortable implementation would go here using dnd-kit
  // For brevity/stability in this generation, just rendering the list with edit controls
  return (
    <div className="space-y-4">
      {fields.sort((a,b) => a.orderIndex - b.orderIndex).map((field) => (
        <FieldEditor key={field.id} field={field} formId={formId} />
      ))}
      {fields.length === 0 && (
        <div className="border-2 border-dashed border-border rounded-xl p-12 text-center text-muted-foreground">
          <p>This step is empty. Add fields below.</p>
        </div>
      )}
    </div>
  );
}

function FieldEditor({ field, formId }: { field: any, formId: number }) {
  const update = useUpdateField();
  const remove = useDeleteField();
  const [label, setLabel] = useState(field.label);

  const handleBlur = () => {
    if (label !== field.label) {
      update.mutate({ id: field.id, formId, label });
    }
  };

  return (
    <motion.div layout initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <Card className="group relative border-transparent hover:border-border transition-colors">
        <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => remove.mutate({ id: field.id, formId })}>
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
            {field.type === 'textarea' && <Textarea placeholder="Long text answer" />}
            {field.type === 'number' && <Input type="number" placeholder="0" />}
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
          </div>

          <div className="mt-4 pt-4 border-t border-border/50 flex items-center gap-4 opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="flex items-center gap-2">
              <Switch 
                checked={field.required} 
                onCheckedChange={(checked) => update.mutate({ id: field.id, formId, required: checked })} 
              />
              <Label className="text-xs text-muted-foreground">Required</Label>
            </div>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}
