/**
 * Editor for managing installed skills (folder-based, not config-based).
 * Skills are installed as directories in ~/.config/opencode/skill/ (global)
 * or ./.opencode/skill/ (local).
 */
import { t, dim, bold, cyan, red, green, yellow } from "@opentui/core";
import { useState, useEffect } from "react";
import { useKeyboard } from "@opentui/react";
import { ocTheme } from "../../theme";
import { homedir } from "os";
import { join } from "path";
import { readdir, rm, cp, mkdir } from "fs/promises";
import { existsSync } from "fs";

interface InstalledSkill {
  name: string;
  path: string;
  scope: "local" | "global";
}

type ConfirmAction =
  | { type: "delete"; skills: InstalledSkill[] }
  | { type: "move"; skills: InstalledSkill[] };

interface SkillEditorProps {
  height: number;
  onBusyChange?: (busy: boolean) => void;
}

async function scanSkillDirectories(): Promise<InstalledSkill[]> {
  const skills: InstalledSkill[] = [];

  const localDir = join(process.cwd(), ".opencode", "skill");
  const globalDir = join(homedir(), ".config", "opencode", "skill");

  for (const [dir, scope] of [
    [localDir, "local"],
    [globalDir, "global"],
  ] as const) {
    if (!existsSync(dir)) continue;

    try {
      const entries = await readdir(dir, { withFileTypes: true });
      for (const entry of entries) {
        if (entry.isDirectory()) {
          skills.push({
            name: entry.name,
            path: join(dir, entry.name),
            scope,
          });
        }
      }
    } catch {
      // Ignore read errors
    }
  }

  return skills.sort((a, b) => a.name.localeCompare(b.name));
}

export function SkillEditor({ height, onBusyChange }: SkillEditorProps) {
  const [skills, setSkills] = useState<InstalledSkill[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [cursor, setCursor] = useState(0);
  const [scroll, setScroll] = useState(0);
  const [confirmAction, setConfirmAction] = useState<ConfirmAction | null>(
    null,
  );
  const [message, setMessage] = useState<{
    text: string;
    type: "success" | "error";
  } | null>(null);

  const localDir = join(process.cwd(), ".opencode", "skill");
  const globalDir = join(homedir(), ".config", "opencode", "skill");

  const refresh = async () => {
    setLoading(true);
    const list = await scanSkillDirectories();
    setSkills(list);
    setSelected(new Set());
    setCursor(0);
    setScroll(0);
    setLoading(false);
  };

  useEffect(() => {
    refresh();
  }, []);

  // Auto-hide message
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  // Notify parent when in confirmation mode (busy state)
  useEffect(() => {
    onBusyChange?.(confirmAction !== null);
  }, [confirmAction, onBusyChange]);

  const getSelectedSkills = (): InstalledSkill[] => {
    if (selected.size === 0) {
      // If nothing selected, use current cursor item
      const current = skills[cursor];
      return current ? [current] : [];
    }
    return skills.filter((s) => selected.has(s.path));
  };

  const handleDelete = async (toDelete: InstalledSkill[]) => {
    const errors: string[] = [];
    let successCount = 0;

    for (const skill of toDelete) {
      try {
        await rm(skill.path, { recursive: true, force: true });
        successCount++;
      } catch (e) {
        errors.push(skill.name);
      }
    }

    if (errors.length > 0) {
      setMessage({
        text: `Failed to remove: ${errors.join(", ")}`,
        type: "error",
      });
    } else {
      setMessage({
        text: `Removed ${successCount} skill${successCount !== 1 ? "s" : ""}`,
        type: "success",
      });
    }
    setConfirmAction(null);
    await refresh();
  };

  const handleMove = async (toMove: InstalledSkill[]) => {
    const errors: string[] = [];
    let successCount = 0;

    for (const skill of toMove) {
      const targetDir = skill.scope === "global" ? localDir : globalDir;
      const destPath = join(targetDir, skill.name);

      try {
        if (!existsSync(targetDir)) {
          await mkdir(targetDir, { recursive: true });
        }

        if (existsSync(destPath)) {
          errors.push(`${skill.name} (exists)`);
          continue;
        }

        await cp(skill.path, destPath, { recursive: true });
        await rm(skill.path, { recursive: true, force: true });
        successCount++;
      } catch {
        errors.push(skill.name);
      }
    }

    if (errors.length > 0) {
      setMessage({
        text: `Failed: ${errors.join(", ")}`,
        type: "error",
      });
    } else {
      setMessage({
        text: `Moved ${successCount} skill${successCount !== 1 ? "s" : ""}`,
        type: "success",
      });
    }
    setConfirmAction(null);
    await refresh();
  };

  const toggleSelect = (skill: InstalledSkill) => {
    const next = new Set(selected);
    if (next.has(skill.path)) {
      next.delete(skill.path);
    } else {
      next.add(skill.path);
    }
    setSelected(next);
  };

  useKeyboard((key) => {
    if (loading) return;

    // Confirmation mode - only handle y/n/esc
    if (confirmAction) {
      if (key.name === "y") {
        if (confirmAction.type === "delete") {
          handleDelete(confirmAction.skills);
        } else {
          handleMove(confirmAction.skills);
        }
      } else if (key.name === "n" || key.name === "escape") {
        setConfirmAction(null);
      }
      return;
    }

    // Normal mode
    if (skills.length === 0) return;

    if (key.name === "up" || key.name === "k") {
      setCursor((c) => {
        const n = Math.max(0, c - 1);
        if (n < scroll) setScroll(n);
        return n;
      });
    } else if (key.name === "down" || key.name === "j") {
      setCursor((c) => {
        const n = Math.min(skills.length - 1, c + 1);
        if (n >= scroll + height) setScroll(n - height + 1);
        return n;
      });
    } else if (key.name === "space") {
      const skill = skills[cursor];
      if (skill) toggleSelect(skill);
    } else if (key.name === "a") {
      // Select all
      setSelected(new Set(skills.map((s) => s.path)));
    } else if (key.name === "n") {
      // Deselect all
      setSelected(new Set());
    } else if (key.name === "m") {
      const toMove = getSelectedSkills();
      if (toMove.length > 0) {
        setConfirmAction({ type: "move", skills: toMove });
        setMessage(null);
      }
    } else if (key.name === "r" || key.name === "d" || key.name === "delete") {
      const toDelete = getSelectedSkills();
      if (toDelete.length > 0) {
        setConfirmAction({ type: "delete", skills: toDelete });
        setMessage(null);
      }
    }
  });

  // Confirmation dialog
  if (confirmAction) {
    const isDelete = confirmAction.type === "delete";
    const skillList = confirmAction.skills;
    const count = skillList.length;

    // For move, show direction based on first skill (they could be mixed)
    const moveLabel = skillList[0]?.scope === "global" ? "local" : "global";

    return (
      <box
        flexDirection="column"
        flexGrow={1}
        padding={1}
        borderStyle="single"
        borderColor={isDelete ? ocTheme.danger : ocTheme.accent}
      >
        <text
          content={t`${bold(isDelete ? red(`Delete ${count} skill${count !== 1 ? "s" : ""}?`) : cyan(`Move ${count} skill${count !== 1 ? "s" : ""} to ${moveLabel}?`))}`}
        />
        <box marginTop={1} flexDirection="column" height={Math.min(count, 5)}>
          {skillList.slice(0, 5).map((skill) => {
            const scopeColor = skill.scope === "local" ? cyan : yellow;
            return (
              <text
                key={skill.path}
                content={t`  ${skill.name} ${scopeColor(`(${skill.scope})`)}`}
              />
            );
          })}
          {count > 5 && (
            <text content={t`  ${dim(`...and ${count - 5} more`)}`} />
          )}
        </box>
        <box marginTop={2}>
          <text
            content={t`${yellow("[y]")} Confirm  ${dim("[n/Esc]")} Cancel`}
          />
        </box>
      </box>
    );
  }

  const visible = skills.slice(scroll, scroll + height);

  return (
    <box
      flexDirection="column"
      flexGrow={1}
      padding={1}
      borderStyle="single"
      borderColor={ocTheme.border}
    >
      <box marginBottom={1} flexDirection="row" justifyContent="space-between">
        {message ? (
          <text
            content={t`${message.type === "success" ? green(message.text) : red(message.text)}`}
          />
        ) : (
          <text content={t`${bold("Installed Skills")}`} />
        )}
        <text
          content={t`${dim(`${selected.size > 0 ? `${selected.size}/` : ""}${skills.length} skill${skills.length !== 1 ? "s" : ""}`)}`}
        />
      </box>

      <box flexDirection="column" height={height} overflow="hidden">
        {loading && <text content={t`${dim("Scanning...")}`} />}

        {!loading && skills.length === 0 && (
          <text content={t`${dim("No skills installed.")}`} />
        )}

        {!loading &&
          visible.map((skill, idx) => {
            const absoluteIdx = scroll + idx;
            const isCursor = absoluteIdx === cursor;
            const isSelected = selected.has(skill.path);

            const cursorChar = isCursor ? cyan(">") : " ";
            const checkbox = isSelected ? green("[✓]") : dim("[ ]");
            const scopeLabel =
              skill.scope === "local" ? cyan(" (local)") : yellow(" (global)");

            return (
              <box key={skill.path} height={1} flexDirection="row">
                <text
                  content={t`${cursorChar} ${checkbox} ${isCursor ? bold(skill.name) : skill.name}${scopeLabel}`}
                />
              </box>
            );
          })}
      </box>

      <box marginTop={1}>
        <text
          content={t`${dim("[Space] Select • [a] All • [n] None • [m] Move • [r] Remove")}`}
        />
      </box>
    </box>
  );
}
