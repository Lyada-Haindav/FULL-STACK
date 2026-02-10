import { useState } from "react";
import { useTemplates } from "@/hooks/use-templates";
import { useCreateCompleteForm } from "@/hooks/use-forms";
import { LayoutShell } from "@/components/layout-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LayoutTemplate, ArrowRight, Star, Clock, Users, Loader2, X } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

// Template Card Component
function TemplateCard({ template, onUseTemplate, onPreview, isPending }: {
  template: any;
  onUseTemplate: (template: any) => void;
  onPreview: (template: any) => void;
  isPending: boolean;
}) {
  const getTemplateIcon = (iconName: string) => {
    switch (iconName) {
      case "Mail": return "📧";
      case "Briefcase": return "💼";
      case "Calendar": return "📅";
      case "GraduationCap": return "🎓";
      case "Heart": return "❤️";
      default: return "📋";
    }
  };

  const getTemplateStats = (config: any) => {
    const steps = config?.steps || [];
    const fields = steps.reduce((acc: number, step: any) => acc + (step?.fields?.length || 0), 0);
    return { steps: steps.length, fields };
  };

  const getSteps = (config: any) => {
    return config?.steps || [];
  };

  const stats = getTemplateStats(template.config);

  return (
    <Card className="hover:shadow-lg transition-shadow cursor-pointer group h-full flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="text-2xl flex-shrink-0">{getTemplateIcon(template.icon)}</div>
            <div className="min-w-0 flex-1">
              <CardTitle className="text-lg truncate">{template.name}</CardTitle>
              <Badge variant="secondary" className="text-xs mt-1 inline-block">
                {template.category}
              </Badge>
            </div>
          </div>
        </div>
        <CardDescription className="line-clamp-2 mt-2">{template.description}</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col">
        <div className="space-y-4 flex-1 flex flex-col">
          {/* Template Stats */}
          <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
            <div className="flex items-center gap-1">
              <LayoutTemplate className="h-4 w-4 flex-shrink-0" />
              <span>{stats.steps} steps</span>
            </div>
            <div className="flex items-center gap-1">
              <Users className="h-4 w-4 flex-shrink-0" />
              <span>{stats.fields} fields</span>
            </div>
          </div>

          {/* Preview Steps */}
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">Preview:</p>
            <div className="space-y-1">
              {getSteps(template.config).slice(0, 2).map((step: any, index: number) => (
                <div key={index} className="flex items-center gap-2 text-xs text-muted-foreground">
                  <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0"></div>
                  <span className="truncate">{step.title}</span>
                </div>
              ))}
              {getSteps(template.config).length > 2 && (
                <div className="text-xs text-muted-foreground">
                  +{getSteps(template.config).length - 2} more steps
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 mt-auto">
            <Button 
              variant="outline" 
              size="sm" 
              className="flex-1 group-hover:bg-primary group-hover:text-primary-foreground text-xs"
              onClick={() => onPreview(template)}
            >
              Preview
            </Button>
            <Button 
              size="sm" 
              className="flex-1 text-xs" 
              onClick={() => onUseTemplate(template)} 
              disabled={isPending}
            >
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                "Use Template"
              )}
            </Button>
          </div>
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

  // Force default to "all" category
  const currentCategory = selectedCategory || "all";

  const categories = [
    { id: "all", name: "All Templates" },
    { id: "business", name: "Business" },
    { id: "hr", name: "HR" },
    { id: "events", name: "Events" },
    { id: "education", name: "Education" },
    { id: "healthcare", name: "Healthcare" },
  ];

  const filteredTemplates = currentCategory === "all" 
    ? templates 
    : templates.filter(template => template.category?.toLowerCase() === currentCategory.toLowerCase());

  const getTemplateIcon = (iconName: string) => {
    switch (iconName) {
      case "Mail": return "📧";
      case "Briefcase": return "💼";
      case "Calendar": return "📅";
      case "GraduationCap": return "🎓";
      case "Heart": return "❤️";
      default: return "📋";
    }
  };

  const getTemplateStats = (config: any) => {
    const steps = config?.steps || [];
    const fields = steps.reduce((acc: number, step: any) => acc + (step?.fields?.length || 0), 0);
    return { steps: steps.length, fields };
  };

  const getSteps = (config: any) => {
    return config?.steps || [];
  };

  const handleUseTemplate = async (template: any) => {
    try {
      const config = template.config as any;
      const steps = Array.isArray(config?.steps) ? config.steps.map((step: any) => ({
        title: step.title || "Untitled Step",
        description: step.description || "",
        fields: Array.isArray(step.fields) ? step.fields.map((field: any) => ({
          type: field.type || "text",
          label: field.label || "Field",
          placeholder: field.placeholder || "",
          required: !!field.required,
          options: Array.isArray(field.options) ? field.options : [],
        })) : [],
      })) : [];
      
      const form = await createCompleteMutation.mutateAsync({
        title: config?.title || template.name,
        description: config?.description || template.description,
        steps,
      });
      
      toast({ title: "Template applied", description: "Form created successfully from template." });
      setLocation(`/builder/${form.id}`);
    } catch (error) {
      toast({ title: "Error", description: "Failed to create form from template.", variant: "destructive" });
    }
  };

  const handlePreview = (template: any) => {
    setPreviewTemplate(template);
  };

  if (isLoading) {
    return (
      <LayoutShell>
        <div className="flex-1 space-y-6 p-6">
          <div className="flex items-center gap-2">
            <LayoutTemplate className="h-6 w-6" />
            <h1 className="text-3xl font-bold">Templates</h1>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="h-4 bg-muted rounded w-3/4"></div>
                  <div className="h-3 bg-muted rounded w-1/2"></div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="h-3 bg-muted rounded"></div>
                    <div className="h-3 bg-muted rounded w-5/6"></div>
                  </div>
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
        <div className="flex-1 space-y-6 p-6">
          <div className="flex items-center gap-2">
            <LayoutTemplate className="h-6 w-6" />
            <h1 className="text-3xl font-bold">Templates</h1>
          </div>
          <div className="text-center py-12">
            <p className="text-red-500">Error loading templates: {error.message}</p>
            <p className="text-muted-foreground">Please check your connection and try again.</p>
          </div>
        </div>
      </LayoutShell>
    );
  }

  return (
    <LayoutShell>
      <div className="flex-1 space-y-6 p-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <LayoutTemplate className="h-6 w-6 flex-shrink-0" />
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold">Template Library</h1>
              <p className="text-muted-foreground text-sm sm:text-base">Choose from our curated collection of professional form templates</p>
            </div>
          </div>
          <Button asChild className="w-full sm:w-auto">
            <Link href="/dashboard/new">
              Create Custom Form <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>

        {/* Category Filter */}
        <div className="flex gap-2 flex-wrap">
          {categories.map((category) => (
            <Button
              key={category.id}
              variant={currentCategory === category.id ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory(category.id)}
            >
              {category.name}
            </Button>
          ))}
        </div>

        {/* Templates by Category */}
        {currentCategory === "all" ? (
          <div className="space-y-12">
            {categories.slice(1).map((category) => {
              const categoryTemplates = templates.filter(template => template.category?.toLowerCase() === category.id.toLowerCase());
              if (categoryTemplates.length === 0) return null;
              
              return (
                <div key={category.id}>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-6">
                    <h2 className="text-xl sm:text-2xl font-bold">{category.name}</h2>
                    <Badge variant="secondary">{categoryTemplates.length} templates</Badge>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                    {categoryTemplates.map((template) => (
                      <TemplateCard 
                        key={template.id} 
                        template={template} 
                        onUseTemplate={handleUseTemplate}
                        onPreview={handlePreview}
                        isPending={createCompleteMutation.isPending}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
            {filteredTemplates.map((template) => (
              <TemplateCard 
                key={template.id} 
                template={template} 
                onUseTemplate={handleUseTemplate}
                onPreview={handlePreview}
                isPending={createCompleteMutation.isPending}
              />
            ))}
          </div>
        )}

        {filteredTemplates.length === 0 && (
          <div className="text-center py-12">
            <LayoutTemplate className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No templates found</h3>
            <p className="text-muted-foreground mb-4">
              {currentCategory === "all" 
                ? "No templates available yet." 
                : `No templates in the ${currentCategory} category yet.`
              }
            </p>
            <Button asChild>
              <Link href="/dashboard/new">Create your own form</Link>
            </Button>
          </div>
        )}

        {/* Preview Dialog */}
        <Dialog open={!!previewTemplate} onOpenChange={() => setPreviewTemplate(null)}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <div className="flex items-center gap-3">
                <div className="text-2xl">
                  {previewTemplate && (() => {
                    switch (previewTemplate.icon) {
                      case "Mail": return "📧";
                      case "Briefcase": return "💼";
                      case "Calendar": return "📅";
                      case "GraduationCap": return "🎓";
                      case "Heart": return "❤️";
                      default: return "📋";
                    }
                  })()}
                </div>
                <div>
                  <DialogTitle>{previewTemplate?.name}</DialogTitle>
                  <Badge variant="secondary" className="text-xs mt-1">
                    {previewTemplate?.category}
                  </Badge>
                </div>
              </div>
            </DialogHeader>
            
            {previewTemplate && (
              <div className="space-y-6">
                <p className="text-muted-foreground">{previewTemplate.description}</p>
                
                <div className="space-y-4">
                  <h3 className="font-semibold">Form Structure:</h3>
                  {previewTemplate.config?.steps?.map((step: any, stepIndex: number) => (
                    <div key={stepIndex} className="border rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-semibold">
                          {stepIndex + 1}
                        </div>
                        <h4 className="font-semibold">{step.title}</h4>
                      </div>
                      {step.description && (
                        <p className="text-sm text-muted-foreground mb-3">{step.description}</p>
                      )}
                      {step.fields?.length > 0 && (
                        <div className="space-y-2">
                          {step.fields.map((field: any, fieldIndex: number) => (
                            <div key={fieldIndex} className="flex items-center gap-3 p-2 bg-muted/50 rounded">
                              <div className="w-2 h-2 bg-primary rounded-full"></div>
                              <div className="flex-1">
                                <div className="text-sm font-medium">{field.label}</div>
                                <div className="text-xs text-muted-foreground">
                                  Type: {field.type} {field.required && "(Required)"}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                
                <div className="flex gap-2 pt-4">
                  <Button variant="outline" onClick={() => setPreviewTemplate(null)}>
                    Close
                  </Button>
                  <Button onClick={() => {
                    if (previewTemplate) {
                      handleUseTemplate(previewTemplate);
                      setPreviewTemplate(null);
                    }
                  }} disabled={createCompleteMutation.isPending}>
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
            )}
          </DialogContent>
        </Dialog>
      </div>
    </LayoutShell>
  );
}
