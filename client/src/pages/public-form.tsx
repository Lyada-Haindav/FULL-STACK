import { useParams } from "wouter";
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
import { CheckCircle2, ChevronRight, ChevronLeft, Loader2 } from "lucide-react";
import { SimpleVoiceInput } from "@/components/simple-voice-input";
import { Textarea } from "@/components/ui/textarea";

export default function PublicForm() {
  const { id } = useParams();
  const formId = id || "0";
  const { data: form, isLoading } = useForm(formId);
  const submit = useSubmitForm();
  
  const [currentStep, setCurrentStep] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [website, setWebsite] = useState("");

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
            await submit.mutateAsync({ formId, data: submissionData, files: submissionFiles, website });
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
        <div className="max-w-3xl mx-auto px-4 py-3 sm:px-6 sm:py-4">
           <div className="flex min-w-0 items-center gap-3">
             {theme?.logoUrl ? (
               <div className="h-10 w-10 shrink-0 rounded-xl bg-muted/30 border border-border/60 flex items-center justify-center overflow-hidden">
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
               <div className="h-10 w-10 shrink-0 rounded-xl bg-muted/40 flex items-center justify-center text-xs text-muted-foreground">
                 FF
               </div>
             )}
             <h1 className="truncate font-bold text-base sm:text-xl">{form.title}</h1>
           </div>
        </div>
      </div>

      <main className="flex-1 max-w-3xl w-full mx-auto px-3 py-5 sm:px-6 md:py-12">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -20, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <Card
              className="shadow-lg border-t-4 border-t-primary bg-card/95 border-border/60"
              style={primaryColor ? { borderTopColor: primaryColor } : undefined}
            >
              <CardContent className="p-4 sm:p-6 md:p-8">
                <div className="mb-6 sm:mb-8">
                  <h2 className="text-xl font-bold font-display mb-2 sm:text-2xl">{step.title}</h2>
                  {step.description && <p className="text-sm text-muted-foreground sm:text-base">{step.description}</p>}
                </div>

                <div className="space-y-5 sm:space-y-6">
                  <div className="absolute left-[-9999px] top-auto h-px w-px overflow-hidden opacity-0">
                    <Label htmlFor="website">Leave this field empty</Label>
                    <Input
                      id="website"
                      value={website}
                      onChange={(event) => setWebsite(event.target.value)}
                      autoComplete="off"
                      tabIndex={-1}
                    />
                  </div>
                  {step.fields.map((field) => {
                    const validationRules = (field.validationRules ?? {}) as Record<string, any>;

                    return (
                    <div key={field.id} className="space-y-2">
                      <Label className="text-sm font-medium sm:text-base">
                        {field.label} {field.required && <span className="text-red-500">*</span>}
                      </Label>
                      
                      <div className="w-full">
                        {field.type === 'text' || field.type === 'email' || field.type === 'number' || field.type === 'phone' || field.type === 'tel' || field.type === 'url' || field.type === 'link' ? (
                          <div className="relative flex-1">
                            <Input 
                              {...register(`field_${field.id}`, {
                                required: field.required,
                                minLength: validationRules.minLength ? { value: validationRules.minLength, message: `Min ${validationRules.minLength} characters` } : undefined,
                                maxLength: validationRules.maxLength ? { value: validationRules.maxLength, message: `Max ${validationRules.maxLength} characters` } : undefined,
                                pattern: validationRules.pattern
                                  ? { value: new RegExp(validationRules.pattern), message: "Invalid format" }
                                  : field.type === "email"
                                    ? { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: "Enter a valid email" }
                                    : field.type === "phone" || field.type === "tel"
                                      ? { value: /^\+?[0-9][0-9\s\-().]{6,}[0-9]$/, message: "Enter a valid phone number" }
                                      : field.type === "url" || field.type === "link"
                                        ? { value: /^(https?:\/\/)?([^\s.]+\.)*[^\s.]+\.[^\s]{2,}(\/\S*)?$/, message: "Enter a valid URL" }
                                        : undefined,
                                min: field.type === 'number' && validationRules.min != null ? { value: validationRules.min, message: `Min ${validationRules.min}` } : undefined,
                                max: field.type === 'number' && validationRules.max != null ? { value: validationRules.max, message: `Max ${validationRules.max}` } : undefined,
                                onChange: () => {
                                  const fieldName = `field_${field.id}`;
                                  trigger(fieldName);
                                },
                              })}
                              type={
                                field.type === 'number'
                                  ? 'number'
                                  : field.type === 'email'
                                    ? 'email'
                                    : field.type === 'phone' || field.type === 'tel'
                                      ? 'tel'
                                      : field.type === 'url' || field.type === 'link'
                                        ? 'url'
                                        : 'text'
                              }
                              placeholder={field.placeholder || "Your answer..."}
                              className="h-11 bg-muted/40 border-border/60 pr-12 text-base"
                              onKeyDown={handleEnter}
                            />
                            {/* Voice Input Integration */}
                            <div className="absolute right-2 top-1/2 -translate-y-1/2 z-10">
                               <SimpleVoiceInput 
                                 onTranscript={(text: string) => {
                                   const fieldName = `field_${field.id}`;
                                   setValue(fieldName, text, { shouldValidate: true });
                                 }} 
                                 className="h-9 w-9" 
                               />
                            </div>
                          </div>
                        ) : field.type === 'textarea' ? (
                          <div className="relative flex-1">
                            <Textarea 
                              {...register(`field_${field.id}`, {
                                required: field.required,
                                minLength: validationRules.minLength ? { value: validationRules.minLength, message: `Min ${validationRules.minLength} characters` } : undefined,
                                maxLength: validationRules.maxLength ? { value: validationRules.maxLength, message: `Max ${validationRules.maxLength} characters` } : undefined,
                                pattern: validationRules.pattern ? { value: new RegExp(validationRules.pattern), message: "Invalid format" } : undefined,
                                onChange: () => {
                                  const fieldName = `field_${field.id}`;
                                  trigger(fieldName);
                                },
                              })}
                              className="bg-muted/40 border-border/60 min-h-[132px] pr-12 text-base"
                              placeholder={field.placeholder || "Your answer..."}
                              onKeyDown={handleEnter}
                            />
                            <div className="absolute right-2 bottom-2 z-10">
                               <SimpleVoiceInput onTranscript={(text: string) => {
                                 const fieldName = `field_${field.id}`;
                                 const current = getValues(fieldName) || "";
                                 setValue(fieldName, current ? `${current} ${text}` : text, { shouldValidate: true });
                               }} className="h-9 w-9" />
                            </div>
                          </div>
                        ) : field.type === 'select' ? (
                          <select
                            {...register(`field_${field.id}`, {
                              required: field.required,
                              onChange: () => {
                                const fieldName = `field_${field.id}`;
                                trigger(fieldName);
                              },
                            })}
                            className="h-11 w-full rounded-md border border-border/60 bg-muted/40 px-3 py-2 text-base ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                          >
                            <option value="">Select an option</option>
                            {(field.options || []).map((option: any) => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                        ) : field.type === 'radio' ? (
                          <RadioGroup 
                            onValueChange={(value) => setValue(`field_${field.id}`, value, { shouldValidate: true })}
                            className="flex flex-col space-y-2"
                          >
                            {(field.options || []).map((option: any) => (
                              <div key={option.value} className="flex min-h-10 items-center space-x-2 rounded-xl border border-border/50 bg-muted/25 px-3 py-2">
                                <RadioGroupItem value={option.value} id={`field_${field.id}_${option.value}`} />
                                <Label htmlFor={`field_${field.id}_${option.value}`} className="flex-1 text-sm sm:text-base">{option.label}</Label>
                              </div>
                            ))}
                            {/* Hidden input for react-hook-form registration */}
                            <input type="hidden" {...register(`field_${field.id}`, { required: field.required })} />
                          </RadioGroup>
                        ) : field.type === 'checkbox' ? (
                           <div className="flex min-h-10 items-center space-x-2 rounded-xl border border-border/50 bg-muted/25 px-3 py-2">
                             <input 
                               type="checkbox" 
                               id={`field_${field.id}`}
                               {...register(`field_${field.id}`, { required: field.required })}
                               className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                             />
                             <Label htmlFor={`field_${field.id}`} className="flex-1 text-sm sm:text-base">{field.placeholder || 'Check this box'}</Label>
                           </div>
                        ) : field.type === 'file' ? (
                          <Input
                            {...register(`field_${field.id}`, {
                              required: field.required,
                              validate: (value: FileList) => {
                                if (!value || value.length === 0) return true;
                                const maxFiles = validationRules.maxFiles ?? 3;
                                const maxSizeMb = validationRules.maxSizeMb ?? 10;
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
                            className="min-h-11 bg-muted/40 border-border/60 text-sm"
                            multiple={(validationRules.maxFiles ?? 3) > 1}
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
                            className="h-11 bg-muted/40 border-border/60 text-base"
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
                            className="h-11 bg-muted/40 border-border/60 text-base"
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
                  )})}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </AnimatePresence>

        <div className="mt-6 flex flex-col-reverse gap-3 sm:mt-8 sm:flex-row sm:items-center sm:justify-between">
          <Button 
            variant="ghost" 
            onClick={() => setCurrentStep(p => Math.max(0, p - 1))}
            disabled={currentStep === 0}
            className={currentStep === 0 ? "hidden sm:invisible sm:inline-flex" : "w-full sm:w-auto"}
          >
            <ChevronLeft className="mr-2 h-4 w-4" /> Previous
          </Button>

          <Button
            onClick={onNext}
            size="lg"
            className="w-full px-8 sm:w-auto"
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
