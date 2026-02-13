import { useParams, useLocation } from "wouter";
import { useForm } from "@/hooks/use-forms";
import { useSubmitForm } from "@/hooks/use-submissions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { useForm as useReactForm } from "react-hook-form";
import { motion, AnimatePresence } from "framer-motion";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { CheckCircle2, ChevronRight, ChevronLeft, Loader2, Mic } from "lucide-react";
import { SimpleVoiceInput } from "@/components/simple-voice-input";
import { Textarea } from "@/components/ui/textarea";

export default function PublicForm() {
  const { id } = useParams();
  const formId = id || "0";
  const { data: form, isLoading } = useForm(formId);
  const submit = useSubmitForm();
  
  const [currentStep, setCurrentStep] = useState(0);
  const [submitted, setSubmitted] = useState(false);

  const { register, handleSubmit, setValue, formState: { errors }, trigger, getValues } = useReactForm({
    mode: "onChange",
    reValidateMode: "onChange",
  });

  if (isLoading) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin" /></div>;
  if (!form) return <div className="h-screen flex items-center justify-center text-muted-foreground">Form not found or unpublished.</div>;

  const totalSteps = form.steps.length;
  const isLastStep = currentStep === totalSteps - 1;
  const step = form.steps[currentStep];
  const theme: any = form.theme || {};
  const primaryColor = theme?.primaryColor;
  const backgroundStyle = theme?.backgroundStyle || "dark";
  const backgroundColor = theme?.backgroundColor || "#0b0f14";
  const gradientTo = theme?.gradientTo || "#1f2937";

  const onNext = async () => {
    const isValid = await trigger();
    if (isValid) {
      if (isLastStep) {
        // Handle final submission
        handleSubmit(async (formData) => {
          // Flatten form data into expected structure: { data: Record<string, any> }
          const submissionData: Record<string, any> = {};
          const submissionFiles: Record<string, File[]> = {};
          Object.keys(formData).forEach(key => {
            if (!key.startsWith('field_')) return;
            const value = formData[key];
            if (value instanceof FileList) {
              const files = Array.from(value).filter(file => file && file.size > 0);
              if (files.length > 0) {
                submissionFiles[key] = files;
              } else {
                submissionData[key] = null;
              }
              return;
            }
            submissionData[key] = value;
          });
          
          try {
            await submit.mutateAsync({ formId, data: submissionData, files: submissionFiles });
            setSubmitted(true);
          } catch (error) {
            console.error("Submission failed:", error);
          }
        })();
      } else {
        setCurrentStep(prev => prev + 1);
      }
    }
  };

  const handleEnter = (event: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (event.key !== "Enter") return;
    if ((event.target as HTMLElement).tagName.toLowerCase() === "textarea") return;
    event.preventDefault();
    onNext();
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center max-w-md">
          <div className="w-20 h-20 bg-emerald-500/15 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-10 h-10 text-emerald-400" />
          </div>
          <h1 className="text-3xl font-display font-bold mb-4">Thank you!</h1>
          <p className="text-muted-foreground">Your response has been recorded successfully.</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen bg-background flex flex-col"
      style={{
        background:
          backgroundStyle === "solid"
            ? backgroundColor
            : backgroundStyle === "gradient"
              ? `linear-gradient(135deg, ${backgroundColor}, ${gradientTo})`
              : undefined,
      }}
    >
      <div className="w-full bg-background/80 border-b border-border/60 backdrop-blur">
        <div className="h-1 bg-primary/20 w-full">
          <motion.div 
            className="h-full bg-primary"
            style={primaryColor ? { backgroundColor: primaryColor } : undefined}
            initial={{ width: 0 }}
            animate={{ width: `${((currentStep + 1) / totalSteps) * 100}%` }}
          />
        </div>
        <div className="max-w-3xl mx-auto px-6 py-4">
           <div className="flex items-center gap-3">
             {theme?.logoUrl ? (
               <div className="h-10 w-10 rounded-xl bg-muted/30 border border-border/60 flex items-center justify-center overflow-hidden">
                 <img
                   src={theme.logoUrl}
                   alt="Logo"
                   className="h-8 w-8 object-contain"
                   onError={(e) => {
                     (e.currentTarget as HTMLImageElement).style.display = "none";
                   }}
                 />
               </div>
             ) : (
               <div className="h-10 w-10 rounded-xl bg-muted/40 flex items-center justify-center text-xs text-muted-foreground">
                 FF
               </div>
             )}
             <h1 className="font-bold text-xl">{form.title}</h1>
           </div>
        </div>
      </div>

      <main className="flex-1 max-w-3xl w-full mx-auto p-6 md:py-12">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -20, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <Card
              className="shadow-lg border-t-4 border-t-primary bg-card/90 border-border/60"
              style={primaryColor ? { borderTopColor: primaryColor } : undefined}
            >
              <CardContent className="p-8">
                <div className="mb-8">
                  <h2 className="text-2xl font-bold font-display mb-2">{step.title}</h2>
                  {step.description && <p className="text-muted-foreground">{step.description}</p>}
                </div>

                <div className="space-y-6">
                  {step.fields.map((field) => (
                    <div key={field.id} className="space-y-2">
                      <Label className="text-base font-medium">
                        {field.label} {field.required && <span className="text-red-500">*</span>}
                      </Label>
                      
                      <div className="flex gap-2">
                        {field.type === 'text' || field.type === 'email' || field.type === 'number' ? (
                          <div className="relative flex-1">
                            <Input 
                              {...register(`field_${field.id}`, {
                                required: field.required,
                                minLength: field.validationRules?.minLength ? { value: field.validationRules.minLength, message: `Min ${field.validationRules.minLength} characters` } : undefined,
                                maxLength: field.validationRules?.maxLength ? { value: field.validationRules.maxLength, message: `Max ${field.validationRules.maxLength} characters` } : undefined,
                                pattern: field.validationRules?.pattern
                                  ? { value: new RegExp(field.validationRules.pattern), message: "Invalid format" }
                                  : field.type === "email"
                                    ? { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: "Enter a valid email" }
                                    : undefined,
                                min: field.type === 'number' && field.validationRules?.min != null ? { value: field.validationRules.min, message: `Min ${field.validationRules.min}` } : undefined,
                                max: field.type === 'number' && field.validationRules?.max != null ? { value: field.validationRules.max, message: `Max ${field.validationRules.max}` } : undefined,
                                onChange: () => {
                                  const fieldName = `field_${field.id}`;
                                  trigger(fieldName);
                                },
                              })}
                              type={field.type === 'number' ? 'number' : field.type === 'email' ? 'email' : 'text'}
                              placeholder={field.placeholder || "Your answer..."}
                              className="bg-muted/40 border-border/60 pr-12"
                              onKeyDown={handleEnter}
                            />
                            {/* Voice Input Integration */}
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 z-10">
                               <SimpleVoiceInput 
                                 onTranscript={(text: string) => {
                                   const fieldName = `field_${field.id}`;
                                   setValue(fieldName, text, { shouldValidate: true });
                                 }} 
                                 className="h-8 w-8" 
                               />
                            </div>
                          </div>
                        ) : field.type === 'textarea' ? (
                          <div className="relative flex-1">
                            <Textarea 
                              {...register(`field_${field.id}`, {
                                required: field.required,
                                minLength: field.validationRules?.minLength ? { value: field.validationRules.minLength, message: `Min ${field.validationRules.minLength} characters` } : undefined,
                                maxLength: field.validationRules?.maxLength ? { value: field.validationRules.maxLength, message: `Max ${field.validationRules.maxLength} characters` } : undefined,
                                pattern: field.validationRules?.pattern ? { value: new RegExp(field.validationRules.pattern), message: "Invalid format" } : undefined,
                                onChange: () => {
                                  const fieldName = `field_${field.id}`;
                                  trigger(fieldName);
                                },
                              })}
                              className="bg-muted/40 border-border/60 min-h-[120px] pr-12"
                              placeholder={field.placeholder || "Your answer..."}
                              onKeyDown={handleEnter}
                            />
                            <div className="absolute right-3 bottom-3 z-10">
                               <SimpleVoiceInput onTranscript={(text: string) => {
                                 const fieldName = `field_${field.id}`;
                                 const current = getValues(fieldName) || "";
                                 setValue(fieldName, current ? `${current} ${text}` : text, { shouldValidate: true });
                               }} className="h-8 w-8" />
                            </div>
                          </div>
                        ) : field.type === 'radio' ? (
                          <RadioGroup 
                            onValueChange={(value) => setValue(`field_${field.id}`, value, { shouldValidate: true })}
                            className="flex flex-col space-y-2"
                          >
                            {(field.options || []).map((option: any) => (
                              <div key={option.value} className="flex items-center space-x-2">
                                <RadioGroupItem value={option.value} id={`field_${field.id}_${option.value}`} />
                                <Label htmlFor={`field_${field.id}_${option.value}`}>{option.label}</Label>
                              </div>
                            ))}
                            {/* Hidden input for react-hook-form registration */}
                            <input type="hidden" {...register(`field_${field.id}`, { required: field.required })} />
                          </RadioGroup>
                        ) : field.type === 'checkbox' ? (
                           <div className="flex items-center space-x-2">
                             <input 
                               type="checkbox" 
                               id={`field_${field.id}`}
                               {...register(`field_${field.id}`, { required: field.required })}
                               className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                             />
                             <Label htmlFor={`field_${field.id}`}>{field.placeholder || 'Check this box'}</Label>
                           </div>
                        ) : field.type === 'file' ? (
                          <Input
                            {...register(`field_${field.id}`, {
                              required: field.required,
                              validate: (value: FileList) => {
                                if (!value || value.length === 0) return true;
                                const maxFiles = field.validationRules?.maxFiles ?? 3;
                                const maxSizeMb = field.validationRules?.maxSizeMb ?? 10;
                                if (value.length > maxFiles) return `Max ${maxFiles} files`;
                                const maxSize = maxSizeMb * 1024 * 1024;
                                for (const file of Array.from(value)) {
                                  if (file.size > maxSize) return `Max ${maxSizeMb}MB per file`;
                                }
                                return true;
                              },
                              onChange: () => {
                                const fieldName = `field_${field.id}`;
                                trigger(fieldName);
                              },
                            })}
                            type="file"
                            className="bg-muted/40 border-border/60"
                            multiple={(field.validationRules?.maxFiles ?? 3) > 1}
                            onKeyDown={handleEnter}
                          />
                        ) : field.type === 'date' ? (
                          <Input
                            {...register(`field_${field.id}`, {
                              required: field.required,
                              onChange: () => {
                                const fieldName = `field_${field.id}`;
                                trigger(fieldName);
                              },
                            })}
                            type="date"
                            className="bg-muted/40 border-border/60"
                            onKeyDown={handleEnter}
                          />
                        ) : (
                          <Input
                            {...register(`field_${field.id}`, {
                              required: field.required,
                              onChange: () => {
                                const fieldName = `field_${field.id}`;
                                trigger(fieldName);
                              },
                            })}
                            onKeyDown={handleEnter}
                          />
                        )}
                      </div>
                      
                      {errors[`field_${field.id}`] && (
                        <p className="text-sm text-red-500">
                          {(errors as any)[`field_${field.id}`]?.message || "This field is required"}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </AnimatePresence>

        <div className="mt-8 flex justify-between items-center">
          <Button 
            variant="ghost" 
            onClick={() => setCurrentStep(p => Math.max(0, p - 1))}
            disabled={currentStep === 0}
            className={currentStep === 0 ? "invisible" : ""}
          >
            <ChevronLeft className="mr-2 h-4 w-4" /> Previous
          </Button>

          <Button
            onClick={onNext}
            size="lg"
            className="px-8"
            style={primaryColor ? { backgroundColor: primaryColor, color: "#0b0f14" } : undefined}
            disabled={submit.isPending}
          >
            {submit.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isLastStep ? "Submit" : "Next"} {!isLastStep && <ChevronRight className="ml-2 h-4 w-4" />}
          </Button>
        </div>
      </main>
    </div>
  );
}
