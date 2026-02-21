import { useMemo, useState } from "react";
import { useTemplates } from "@/hooks/use-templates";
import { useCreateCompleteForm } from "@/hooks/use-forms";
import { LayoutShell } from "@/components/layout-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LayoutTemplate, ArrowRight, Users, Loader2, Sparkles } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { normalizeTemplateConfig } from "@/lib/legacy-config";

const categories = [
  { id: "all", name: "All Templates" },
  { id: "business", name: "Business" },
  { id: "hr", name: "HR" },
  { id: "events", name: "Events" },
  { id: "education", name: "Education" },
  { id: "healthcare", name: "Healthcare" },
  { id: "product", name: "Product" },
  { id: "support", name: "Support" },
  { id: "sales", name: "Sales" },
  { id: "operations", name: "Operations" },
  { id: "finance", name: "Finance" },
  { id: "it", name: "IT" },
  { id: "real estate", name: "Real Estate" },
  { id: "legal", name: "Legal" },
];

function getTemplateIcon(iconName?: string) {
  switch (iconName) {
    case "Mail": return "📧";
    case "Briefcase": return "💼";
    case "Calendar": return "📅";
    case "GraduationCap":
    case "BookOpen": return "🎓";
    case "Heart":
    case "HeartPulse":
    case "Stethoscope": return "❤️";
    case "ClipboardList":
    case "ClipboardCheck":
    case "ClipboardSignature": return "📋";
    case "MessageSquare": return "💬";
    case "Users": return "🧑‍🤝‍🧑";
    case "Star": return "⭐";
    case "LifeBuoy": return "🆘";
    case "Sparkles": return "✨";
    case "Building2": return "🏢";
    case "Banknote": return "💵";
    case "ShieldAlert": return "🛡️";
    case "Plane": return "✈️";
    case "Package": return "📦";
    case "MapPin": return "📍";
    case "UserCheck": return "✅";
    case "Bug": return "🐞";
    case "Handshake": return "🤝";
    case "KeyRound": return "🔑";
    case "Presentation": return "🖥️";
    case "Receipt": return "🧾";
    case "Home": return "🏠";
    case "Scale": return "⚖️";
    default: return "📋";
  }
}

function getSteps(config: any) {
  const normalized = normalizeTemplateConfig(config);
  return normalized?.steps || [];
}

function getTemplateStats(config: any) {
  const steps = getSteps(config);
  const fields = steps.reduce((acc: number, step: any) => acc + (step?.fields?.length || 0), 0);
  return { steps: steps.length, fields };
}

function TemplateCard({
  template,
  onUseTemplate,
  onPreview,
  isPending,
}: {
  template: any;
  onUseTemplate: (template: any) => void;
  onPreview: (template: any) => void;
  isPending: boolean;
}) {
  const stats = getTemplateStats(template.config);
  const stepPreview = getSteps(template.config).slice(0, 2);

  return (
    <Card className="h-full rounded-3xl border border-[#c8d5ec] bg-white shadow-[0_10px_26px_rgba(29,52,110,0.08)] transition-all hover:-translate-y-0.5 hover:shadow-[0_14px_32px_rgba(29,52,110,0.12)]">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl border border-[#c8d5ec] bg-[#eef3ff] text-xl">
              {getTemplateIcon(template.icon)}
            </div>
            <div className="min-w-0">
              <CardTitle className="truncate text-[18px] font-display text-[#1a2a4b]">{template.name}</CardTitle>
              <Badge variant="secondary" className="mt-1 border border-[#c9d5ea] bg-[#edf3ff] text-[#3a568f]">
                {template.category}
              </Badge>
            </div>
          </div>
        </div>
        <CardDescription className="mt-2 line-clamp-2 text-[#667998]">{template.description}</CardDescription>
      </CardHeader>

      <CardContent className="flex h-full flex-col">
        <div className="mb-4 flex items-center gap-4 text-sm text-[#5a6f94]">
          <div className="flex items-center gap-1">
            <LayoutTemplate className="h-4 w-4" />
            <span>{stats.steps} steps</span>
          </div>
          <div className="flex items-center gap-1">
            <Users className="h-4 w-4" />
            <span>{stats.fields} fields</span>
          </div>
        </div>

        <div className="mb-5 rounded-2xl border border-[#d8e2f3] bg-[#f6f9ff] p-3">
          <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-[#667998]">Flow Preview</p>
          <div className="space-y-1.5">
            {stepPreview.map((step: any, index: number) => (
              <div key={index} className="flex items-center gap-2 text-xs text-[#4b628d]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#f6b42c]" />
                <span className="truncate">{step.title}</span>
              </div>
            ))}
            {stats.steps > 2 ? <p className="text-xs text-[#7b8fb3]">+{stats.steps - 2} more steps</p> : null}
          </div>
        </div>

        <div className="mt-auto flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={() => onPreview(template)}
            data-testid={`button-preview-template-${template.id}`}
          >
            Preview
          </Button>
          <Button
            size="sm"
            className="flex-1"
            onClick={() => onUseTemplate(template)}
            disabled={isPending}
            data-testid={`button-use-template-${template.id}`}
          >
            {isPending ? (
              <>
                <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                Creating
              </>
            ) : (
              "Use"
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default function TemplatesPage() {
  const { data: templates = [], isLoading, error } = useTemplates();
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [previewTemplate, setPreviewTemplate] = useState<any>(null);
  const createCompleteMutation = useCreateCompleteForm();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const currentCategory = selectedCategory || "all";

  const filteredTemplates = useMemo(
    () =>
      currentCategory === "all"
        ? templates
        : templates.filter((template) => template.category?.toLowerCase() === currentCategory.toLowerCase()),
    [currentCategory, templates],
  );

  const handleUseTemplate = async (template: any) => {
    try {
      const config = normalizeTemplateConfig(template.config) as any;
      const steps = Array.isArray(config?.steps)
        ? config.steps.map((step: any) => ({
            title: step.title || "Untitled Step",
            description: step.description || "",
            fields: Array.isArray(step.fields)
              ? step.fields.map((field: any) => ({
                  type: field.type || "text",
                  label: field.label || "Field",
                  placeholder: field.placeholder || "",
                  required: !!field.required,
                  options: Array.isArray(field.options) ? field.options : [],
                }))
              : [],
          }))
        : [];

      const form = await createCompleteMutation.mutateAsync({
        title: config?.title || template.name,
        description: config?.description || template.description,
        steps,
      });

      toast({ title: "Template applied", description: "Form created successfully from template." });
      setLocation(`/builder/${form.id}`);
    } catch {
      toast({ title: "Error", description: "Failed to create form from template.", variant: "destructive" });
    }
  };

  if (isLoading) {
    return (
      <LayoutShell>
        <div className="space-y-8">
          <div className="rounded-3xl border border-[#c9d5ea] bg-white p-6 shadow-[0_10px_24px_rgba(24,48,112,0.08)]">
            <div className="h-5 w-44 animate-pulse rounded bg-[#dde7f8]" />
            <div className="mt-3 h-4 w-80 animate-pulse rounded bg-[#e8effc]" />
          </div>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="h-[290px] rounded-3xl border border-[#c8d5ec] bg-white">
                <CardHeader>
                  <div className="h-5 w-3/4 animate-pulse rounded bg-[#dde7f8]" />
                </CardHeader>
                <CardContent>
                  <div className="h-4 w-full animate-pulse rounded bg-[#ecf2ff]" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </LayoutShell>
    );
  }

  if (error) {
    return (
      <LayoutShell>
        <Card className="rounded-3xl border border-[#efc0c0] bg-[#fff4f4] p-8">
          <h2 className="text-xl font-display text-[#8f1d1d]">Failed to load templates</h2>
          <p className="mt-2 text-sm text-[#a84545]">{error.message}</p>
        </Card>
      </LayoutShell>
    );
  }

  return (
    <LayoutShell>
      <div className="space-y-8">
        <Card className="rounded-3xl border border-[#c9d5ea] bg-white px-6 py-6 shadow-[0_10px_24px_rgba(24,48,112,0.08)] md:px-8">
          <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
            <div>
              <h1 className="text-3xl font-display font-bold text-[#1a2a4b]">Template Library</h1>
              <p className="mt-1 text-[#5d7196]">Start fast with structured templates and customize as needed.</p>
            </div>
            <Button asChild>
              <Link href="/dashboard/new">
                Create Custom Form <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </Card>

        <div className="rounded-3xl border border-[#c9d5ea] bg-white px-4 py-4 shadow-[0_8px_20px_rgba(24,48,112,0.06)]">
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <Button
                key={category.id}
                variant={currentCategory === category.id ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(category.id)}
                className="rounded-full"
                data-testid={`button-category-${category.id}`}
              >
                {category.name}
              </Button>
            ))}
          </div>
        </div>

        {currentCategory === "all" ? (
          <div className="space-y-10">
            {categories.slice(1).map((category) => {
              const categoryTemplates = templates.filter(
                (template) => template.category?.toLowerCase() === category.id.toLowerCase(),
              );
              if (categoryTemplates.length === 0) return null;

              return (
                <section key={category.id} className="space-y-4">
                  <div className="flex items-center gap-3">
                    <h2 className="text-2xl font-display text-[#203259]">{category.name}</h2>
                    <Badge className="border border-[#cfdaef] bg-[#eef3ff] text-[#47659a]">
                      {categoryTemplates.length} templates
                    </Badge>
                  </div>
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
                    {categoryTemplates.map((template) => (
                      <TemplateCard
                        key={template.id}
                        template={template}
                        onUseTemplate={handleUseTemplate}
                        onPreview={setPreviewTemplate}
                        isPending={createCompleteMutation.isPending}
                      />
                    ))}
                  </div>
                </section>
              );
            })}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
            {filteredTemplates.map((template) => (
              <TemplateCard
                key={template.id}
                template={template}
                onUseTemplate={handleUseTemplate}
                onPreview={setPreviewTemplate}
                isPending={createCompleteMutation.isPending}
              />
            ))}
          </div>
        )}

        {filteredTemplates.length === 0 ? (
          <Card className="rounded-3xl border border-dashed border-[#c8d5ec] bg-[#f7faff] py-16 text-center">
            <CardContent>
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-[#c8d5ec] bg-white">
                <Sparkles className="h-6 w-6 text-[#5873a2]" />
              </div>
              <h3 className="text-xl font-display text-[#203259]">No templates found</h3>
              <p className="mt-2 text-[#5f7297]">
                {currentCategory === "all"
                  ? "No templates available yet."
                  : `No templates in the ${currentCategory} category yet.`}
              </p>
              <Button asChild className="mt-5">
                <Link href="/dashboard/new">Create your own form</Link>
              </Button>
            </CardContent>
          </Card>
        ) : null}

        <Dialog open={!!previewTemplate} onOpenChange={() => setPreviewTemplate(null)}>
          <DialogContent className="max-h-[82vh] max-w-4xl overflow-y-auto rounded-3xl border border-[#c8d5ec] bg-white">
            <DialogHeader>
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[#c8d5ec] bg-[#eef3ff] text-2xl">
                  {getTemplateIcon(previewTemplate?.icon)}
                </div>
                <div>
                  <DialogTitle className="text-2xl font-display text-[#1a2a4b]">{previewTemplate?.name}</DialogTitle>
                  <Badge className="mt-1 border border-[#cfdaef] bg-[#eef3ff] text-[#47659a]">
                    {previewTemplate?.category}
                  </Badge>
                </div>
              </div>
            </DialogHeader>

            {previewTemplate ? (
              <div className="space-y-6">
                <p className="text-[#5d7196]">{previewTemplate.description}</p>

                <div className="space-y-4">
                  {getSteps(previewTemplate.config).map((step: any, stepIndex: number) => (
                    <Card key={stepIndex} className="rounded-2xl border border-[#d5dff0] bg-[#f8fbff] p-4">
                      <div className="mb-3 flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#f6b42c] text-sm font-bold text-[#1f2537]">
                          {stepIndex + 1}
                        </div>
                        <h4 className="font-display text-lg text-[#203259]">{step.title}</h4>
                      </div>
                      {step.description ? <p className="mb-3 text-sm text-[#607399]">{step.description}</p> : null}
                      {step.fields?.length ? (
                        <div className="space-y-2">
                          {step.fields.map((field: any, fieldIndex: number) => (
                            <div key={fieldIndex} className="flex items-center justify-between rounded-xl border border-[#d8e2f3] bg-white px-3 py-2 text-sm">
                              <span className="font-medium text-[#29406b]">{field.label}</span>
                              <span className="text-xs text-[#64799f]">
                                {field.type}{field.required ? " - required" : ""}
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : null}
                    </Card>
                  ))}
                </div>

                <div className="flex flex-wrap justify-end gap-2 pt-2">
                  <Button variant="outline" onClick={() => setPreviewTemplate(null)}>
                    Close
                  </Button>
                  <Button
                    onClick={() => {
                      handleUseTemplate(previewTemplate);
                      setPreviewTemplate(null);
                    }}
                    disabled={createCompleteMutation.isPending}
                  >
                    {createCompleteMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      "Use This Template"
                    )}
                  </Button>
                </div>
              </div>
            ) : null}
          </DialogContent>
        </Dialog>
      </div>
    </LayoutShell>
  );
}
