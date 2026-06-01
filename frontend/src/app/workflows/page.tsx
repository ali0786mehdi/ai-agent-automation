"use client";

import { useEffect, useState, FormEvent } from "react";
import Link from "next/link";
import { AppSidebar } from "@/components/app-sidebar";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AuthGuard } from "@/components/auth/auth-guard";
import { Button } from "@/components/ui/button";
import { useAssistantContext } from "@/context/assistant-context";
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
  EmptyContent,
} from "@/components/ui/empty";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Plus, MoreVertical, Bot, ChevronDown, GitFork } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiUrl } from "@/lib/api";

type Agent = {
  _id: string;
  name: string;
};

interface Workflow {
  _id: string;
  name: string;
  description?: string;
  status: "idle" | "running" | "failed" | "completed";
  agentId?: string;
}

type Template = {
  id: string;
  name: string;
  description: string;
  icon?: string;
  category?: string;
  stepsCount?: number;
};

function getStatusColor(status: string) {
  switch (status) {
    case "running":
      return "bg-success/20 text-success border-success/30";
    case "idle":
      return "bg-muted text-muted-foreground border-border";
    case "failed":
      return "bg-destructive/20 text-destructive border-destructive/30";
    default:
      return "bg-muted text-muted-foreground";
  }
}

export default function WorkflowsPage() {
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState<false | "blank" | "template">(false);
  const [editingWorkflow, setEditingWorkflow] = useState<Workflow | null>(null);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [agentMap, setAgentMap] = useState<Record<string, string>>({});
  const { addToast } = useToast();
  const { setContext, clearContext } = useAssistantContext();

  async function fetchAgents() {
    const res = await fetch(apiUrl("/agents"), {
      headers: {
        Authorization: "Bearer " + localStorage.getItem("token"),
      },
    });

    const data = await res.json();
    if (data.ok) {
      setAgents(data.agents);

      // 🔥 build fast lookup map
      const map: Record<string, string> = {};
      data.agents.forEach((a: Agent) => {
        map[a._id] = a.name;
      });

      setAgentMap(map);
    }
  }

  async function fetchWorkflows() {
    try {
      const res = await fetch(apiUrl("/workflows"), {
        headers: {
          Authorization: "Bearer " + (localStorage.getItem("token") ?? ""),
        },
      });

      const data = await res.json();
      setWorkflows(data.workflows || []);
    } catch (err) {
      console.error("Failed to fetch workflows:", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteWorkflow(id: string) {
    const confirmed = confirm("Delete this workflow? This cannot be undone.");
    if (!confirmed) return;

    try {
      const res = await fetch(apiUrl(`/workflows/${id}`), {
        method: "DELETE",
        headers: {
          Authorization: "Bearer " + (localStorage.getItem("token") ?? ""),
        },
      });

      if (!res.ok) {
        addToast({
          type: "error",
          title: "Failed to delete workflow",
          description:
            "There was an error deleting the workflow. Please try again.",
        });
        return;
      }

      addToast({
        type: "success",
        title: "Workflow deleted",
        description: "Your workflow was deleted successfully.",
      });

      fetchWorkflows();
    } catch (err) {
      console.error("Delete failed:", err);
    }
  }

  useEffect(() => {
    fetchWorkflows();
  }, []);

  useEffect(() => {
    fetchAgents();
  }, []);

  useEffect(() => {
    if (loading) return;

    setContext({
      page: "workflows",

      recentActivity: workflows.slice(0, 5).map((wf) => ({
        type: "workflow",
        name: wf.name,
        description: wf.description,
        agent: getAgentName(wf.agentId) || "No agent",
        status: wf.status,
      })),
    });

    return () => {
      clearContext();
    };
  }, [loading, workflows]);

  function getAgentName(agentId?: string | null) {
    if (!agentId) return "No agent";
    return agentMap[agentId] ?? "Unknown agent";
  }

  return (
    <AuthGuard>
      <div className="flex min-h-screen">
        <AppSidebar />

        <main
          className="flex-1 transition-[padding] duration-300"
          style={{ paddingLeft: "var(--sidebar-width, 256px)" }}
        >
          <div className="p-8">
            <div className="mb-8 flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold">Workflows</h1>
                <p className="mt-2 text-muted-foreground">
                  Manage your AI automation workflows
                </p>
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button>
                    <Plus className="mr-2 size-4" />
                    Create Workflow
                    <ChevronDown className="ml-2 size-4 opacity-70" />
                  </Button>
                </DropdownMenuTrigger>

                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setOpen("blank")}>
                    Blank Workflow
                  </DropdownMenuItem>

                  <DropdownMenuItem onClick={() => setOpen("template")}>
                    Choose Template
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {loading ? (
              <p className="opacity-70">Loading workflows...</p>
            ) : workflows.length === 0 ? (
              <div className="py-12 max-w-2xl mx-auto">
                <Empty>
                  <EmptyHeader>
                    <EmptyMedia variant="icon">
                      <GitFork />
                    </EmptyMedia>
                    <EmptyTitle>No workflows yet</EmptyTitle>
                    <EmptyDescription>
                      Create your first automated workflow or build from a template configuration to begin setting up agent jobs.
                    </EmptyDescription>
                  </EmptyHeader>
                  <EmptyContent>
                    <div className="flex gap-4">
                      <Button onClick={() => setOpen("blank")}>
                        Create Blank Workflow
                      </Button>
                      <Button variant="outline" onClick={() => setOpen("template")}>
                        Choose Template
                      </Button>
                    </div>
                  </EmptyContent>
                </Empty>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                {workflows.map((workflow) => (
                  <Card key={workflow._id} className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <Link
                          href={`/workflows/${workflow._id}`}
                          className="text-lg font-semibold hover:text-primary"
                        >
                          {workflow.name}
                        </Link>

                        {workflow.description && (
                          <p className="mt-2 text-sm text-muted-foreground">
                            {workflow.description}
                          </p>
                        )}
                      </div>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                          >
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>

                        <DropdownMenuContent align="end">
                          <Link href={`/workflows/${workflow._id}/builder`}>
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setEditingWorkflow(workflow);
                              }}
                            >
                              Edit Workflow Details
                            </DropdownMenuItem>
                          </Link>
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleDeleteWorkflow(workflow._id);
                            }}
                          >
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    <div className="mt-4 flex items-center justify-between">
                      <Badge className={getStatusColor(workflow.status)}>
                        {workflow.status}
                      </Badge>

                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Bot className="size-4" />
                        <span>{getAgentName(workflow.agentId)}</span>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </main>

        <CreateWorkflowModal
          mode={open}
          onOpenChange={() => setOpen(false)}
          refresh={fetchWorkflows}
        />
        <EditWorkflowModal
          workflow={editingWorkflow}
          close={() => setEditingWorkflow(null)}
          refresh={fetchWorkflows}
        />
      </div>
    </AuthGuard>
  );
}

/* ---------------- Modal ---------------- */

function CreateWorkflowModal({
  mode,
  onOpenChange,
  refresh,
}: {
  mode: false | "blank" | "template";
  onOpenChange: () => void;
  refresh: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const { addToast } = useToast();

  async function createWorkflow(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    const form = e.currentTarget;
    const name = (form.elements.namedItem("name") as HTMLInputElement).value;
    const description = (
      form.elements.namedItem("description") as HTMLTextAreaElement
    ).value;

    try {
      const res = await fetch(apiUrl("/workflows"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + (localStorage.getItem("token") ?? ""),
        },
        body: JSON.stringify({ name, description }),
      });

      if (!res.ok) throw new Error("Failed to create workflow");

      addToast({
        type: "success",
        title: "Workflow created",
        description: "Your workflow was created successfully.",
      });

      refresh();
      form.reset();
      onOpenChange();
    } catch (err) {
      console.error("Create workflow failed", err);
      addToast({
        type: "error",
        title: "Failed to create workflow",
        description:
          "There was an error creating the workflow. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={!!mode} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Create Workflow</DialogTitle>
          <DialogDescription>
            Create a blank workflow or start from a template.
          </DialogDescription>
        </DialogHeader>

        {mode === "blank" && (
          <form onSubmit={createWorkflow} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">Workflow name</Label>
              <Input
                id="name"
                name="name"
                placeholder="e.g. Daily Report Generator"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                name="description"
                placeholder="Describe what this workflow does…"
                className="min-h-[100px]"
              />
            </div>

            <DialogFooter>
              <Button variant="outline" type="button" onClick={onOpenChange}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>Create Workflow</Button>
            </DialogFooter>
          </form>
        )}
        {mode === "template" && (
          <TemplateSelector refresh={refresh} close={onOpenChange} />
        )}
      </DialogContent>
    </Dialog>
  );
}

function EditWorkflowModal({
  workflow,
  close,
  refresh,
}: {
  workflow: Workflow | null;
  close: () => void;
  refresh: () => void;
}) {
  const [name, setName] = useState(workflow?.name ?? "");
  const [description, setDescription] = useState(workflow?.description ?? "");
  const [loading, setLoading] = useState(false);
  const { addToast } = useToast();

  useEffect(() => {
    if (workflow) {
      setName(workflow.name);
      setDescription(workflow.description ?? "");
    }
  }, [workflow]);

  async function save() {
    if (!workflow) return;
    setLoading(true);

    try {
      const res = await fetch(apiUrl(`/workflows/${workflow._id}`), {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + (localStorage.getItem("token") ?? ""),
        },
        body: JSON.stringify({ name, description }),
      });

      if (!res.ok) throw new Error("Update failed");

      addToast({
        type: "success",
        title: "Workflow updated",
      });

      refresh();
      close();
    } catch {
      addToast({
        type: "error",
        title: "Failed to update workflow",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={!!workflow} onOpenChange={close}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Edit Workflow</DialogTitle>
          <DialogDescription>
            Update the workflow name and description.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label>Workflow Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>

          <div>
            <Label>Description</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={close}>
            Cancel
          </Button>
          <Button onClick={save} disabled={loading}>
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function TemplateSelector({
  refresh,
  close,
}: {
  refresh: () => void;
  close: () => void;
}) {
  const [templates, setTemplates] = useState<any[]>([]);
  const { addToast } = useToast();

  async function fetchTemplates() {
    const res = await fetch(apiUrl("/templates"), {
      headers: {
        Authorization: "Bearer " + localStorage.getItem("token"),
      },
    });

    const data = await res.json();
    if (data.ok) setTemplates(data.templates);
  }

  useEffect(() => {
    fetchTemplates();
  }, []);

  async function applyTemplate(id: string) {
    const res = await fetch(apiUrl(`/templates/import/${id}`), {
      method: "POST",
      headers: {
        Authorization: "Bearer " + localStorage.getItem("token"),
      },
    });

    if (!res.ok) {
      addToast({
        type: "error",
        title: "Failed to create workflow",
      });
      return;
    }

    addToast({
      type: "success",
      title: "Workflow created from template",
    });

    refresh();
    close();
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[420px] overflow-y-auto pr-2">
      {templates.map((t) => (
        <Card
          key={t.id}
          className="p-5 hover:border-primary/40 hover:shadow-md transition cursor-pointer flex flex-col justify-between"
        >
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-lg font-semibold">
              <span className="text-xl">{t.icon ?? "⚙️"}</span>
              {t.name}
            </div>

            <p className="text-sm text-muted-foreground line-clamp-2">
              {t.description}
            </p>

            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              {t.category && <Badge variant="secondary">{t.category}</Badge>}
              {t.stepsCount && <span>{t.stepsCount} steps</span>}
            </div>
          </div>

          <Button
            size="sm"
            className="mt-4 w-full"
            onClick={() => applyTemplate(t.id)}
          >
            Use Template
          </Button>
        </Card>
      ))}
    </div>
  );
}