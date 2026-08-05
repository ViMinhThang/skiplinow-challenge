import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export default function WorkspacePage() {
  return (
    <div className="flex h-full items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Welcome to your workspace</CardTitle>
          <CardDescription>
            Your tasks and profile tools are coming in the next phase.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Use the sidebar to navigate once your tools are ready.
        </CardContent>
      </Card>
    </div>
  )
}
