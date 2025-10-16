// Example of how to use the existing toast system in your components

import { useToast } from "@/hooks/use-toast"

export function ExampleComponent() {
  const { toast } = useToast()

  const showSuccessToast = () => {
    toast({
      title: "Success!",
      description: "Your action was completed successfully.",
      variant: "default", // or "destructive" for error toasts
    })
  }

  const showErrorToast = () => {
    toast({
      title: "Error!",
      description: "Something went wrong. Please try again.",
      variant: "destructive",
    })
  }

  return (
    <div>
      <button onClick={showSuccessToast}>Show Success Toast</button>
      <button onClick={showErrorToast}>Show Error Toast</button>
    </div>
  )
}