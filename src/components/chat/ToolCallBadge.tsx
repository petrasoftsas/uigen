"use client";

import { FilePlus, FileEdit, Eye, Trash2, Loader2 } from "lucide-react";

interface ToolCallBadgeProps {
  toolName: string;
  args: Record<string, unknown>;
  state: "call" | "partial-call" | "result";
}

function getFileName(path: string): string {
  return path.split("/").pop() || path;
}

function getLabel(
  toolName: string,
  args: Record<string, unknown>
): { icon: React.ReactNode; text: string } {
  if (toolName === "str_replace_editor") {
    const command = args.command as string | undefined;
    const fileName = args.path ? getFileName(args.path as string) : null;

    switch (command) {
      case "create":
        return {
          icon: <FilePlus className="w-3 h-3" />,
          text: fileName ? `Creating ${fileName}` : "Creating file",
        };
      case "str_replace":
      case "insert":
        return {
          icon: <FileEdit className="w-3 h-3" />,
          text: fileName ? `Editing ${fileName}` : "Editing file",
        };
      case "view":
        return {
          icon: <Eye className="w-3 h-3" />,
          text: fileName ? `Reading ${fileName}` : "Reading file",
        };
    }
  }

  if (toolName === "file_manager") {
    const command = args.command as string | undefined;
    const fileName = args.path ? getFileName(args.path as string) : null;
    const newFileName = args.new_path
      ? getFileName(args.new_path as string)
      : null;

    switch (command) {
      case "rename":
        return {
          icon: <FileEdit className="w-3 h-3" />,
          text:
            fileName && newFileName
              ? `Renaming ${fileName} → ${newFileName}`
              : "Renaming file",
        };
      case "delete":
        return {
          icon: <Trash2 className="w-3 h-3" />,
          text: fileName ? `Deleting ${fileName}` : "Deleting file",
        };
    }
  }

  return { icon: null, text: toolName };
}

export function ToolCallBadge({ toolName, args, state }: ToolCallBadgeProps) {
  const { icon, text } = getLabel(toolName, args);
  const isComplete = state === "result";

  return (
    <div className="inline-flex items-center gap-2 mt-2 px-3 py-1.5 bg-neutral-50 rounded-lg text-xs border border-neutral-200">
      {isComplete ? (
        <div className="w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0" />
      ) : (
        <Loader2 className="w-3 h-3 animate-spin text-blue-600 flex-shrink-0" />
      )}
      {icon && (
        <span className="text-neutral-500 flex items-center">{icon}</span>
      )}
      <span className="text-neutral-700">{text}</span>
    </div>
  );
}
