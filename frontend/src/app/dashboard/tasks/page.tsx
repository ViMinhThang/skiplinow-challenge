"use client"

import { useState } from "react"
import { PlusIcon } from "lucide-react"

import { DeleteTaskDialog } from "@/components/tasks/delete-task-dialog"
import { TaskFormDialog } from "@/components/tasks/task-form-dialog"
import { TasksTable } from "@/components/tasks/tasks-table"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useTaskRealtime, useTasks } from "@/hooks/use-tasks"
import { STATUS_LABELS, TASK_STATUSES } from "@/lib/tasks"
import type { Task, TaskStatus } from "@/types"

type TaskFilter = "all" | TaskStatus

export default function TasksPage() {
  useTaskRealtime()
  const { data: tasks, isLoading, isError, error, refetch } = useTasks()
  const [filter, setFilter] = useState<TaskFilter>("all")
  const [formOpen, setFormOpen] = useState(false)
  const [formTask, setFormTask] = useState<Task | null>(null)
  const [deleteTask, setDeleteTask] = useState<Task | null>(null)

  const allTasks = tasks ?? []
  const filteredTasks =
    filter === "all" ? allTasks : allTasks.filter((t) => t.status === filter)

  function countFor(taskFilter: TaskFilter): number {
    if (taskFilter === "all") return allTasks.length
    return allTasks.filter((t) => t.status === taskFilter).length
  }

  function openCreate() {
    setFormTask(null)
    setFormOpen(true)
  }

  function openEdit(task: Task) {
    setFormTask(task)
    setFormOpen(true)
  }

  function openDelete(task: Task) {
    setDeleteTask(task)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-xl font-semibold">Tasks</h1>
          <p className="text-sm text-muted-foreground">
            Assign, track, and update work across your team.
          </p>
        </div>
        <Button onClick={openCreate}>
          <PlusIcon />
          New task
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="text-base">Task board</CardTitle>
              <CardDescription>
                {allTasks.length} task(s) in total.
              </CardDescription>
            </div>
            <Tabs value={filter} onValueChange={(value) => setFilter(value as TaskFilter)}>
              <TabsList>
                <TabsTrigger value="all">All ({countFor("all")})</TabsTrigger>
                {TASK_STATUSES.map((status) => (
                  <TabsTrigger key={status} value={status}>
                    {STATUS_LABELS[status]} ({countFor(status)})
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </div>
        </CardHeader>
        <CardContent>
          <TasksTable
            tasks={filteredTasks}
            isLoading={isLoading}
            isError={isError}
            error={error}
            emptyMessage={
              allTasks.length === 0
                ? "No tasks yet. Create your first task to get started."
                : `No tasks are ${filter === "all" ? "" : STATUS_LABELS[filter].toLowerCase()} right now.`
            }
            onRetry={() => refetch()}
            onAdd={openCreate}
            onEdit={openEdit}
            onDelete={openDelete}
          />
        </CardContent>
      </Card>

      <TaskFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        task={formTask}
      />
      <DeleteTaskDialog task={deleteTask} onOpenChange={(open) => { if (!open) setDeleteTask(null) }} />
    </div>
  )
}
