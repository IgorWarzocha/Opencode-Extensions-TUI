/**
 * Logic controller for the skills install modal.
 * Coordinates data loading, selection state, and keyboard actions before delegating UI rendering.
 */
import { useKeyboard } from "@opentui/react";
import { useEffect, useState } from "react";
import type { Extension } from "../types/extension";
import { ocTheme } from "../theme";
import { useTerminalSize } from "../hooks/useTerminalSize";
import { fetchAvailableSkills } from "../services/installation/skillsInstaller";
import { SkillInstallModalView } from "./skill-install-modal-view";

interface SkillInstallModalProps {
  extension: Extension | null;
  isVisible: boolean;
  onClose: () => void;
  onConfirm: (
    selection: SkillInstallSelection,
  ) => Promise<{ success: boolean; message?: string }>;
}

export interface SkillInstallSelection {
  scope: "local" | "global";
  selectedSkills: string[];
}

type FocusField = "list" | "scope" | "confirm";
type InstallStatus = "fetching" | "idle" | "installing" | "success" | "error";

export function SkillInstallModal({
  extension,
  isVisible,
  onClose,
  onConfirm,
}: SkillInstallModalProps) {
  const { width: termWidth, height: termHeight } = useTerminalSize();
  const [scope, setScope] = useState<SkillInstallSelection["scope"]>("local");
  const [focus, setFocus] = useState<FocusField>("list");
  const [status, setStatus] = useState<InstallStatus>("idle");
  const [message, setMessage] = useState("");
  const [skills, setSkills] = useState<string[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [cursor, setCursor] = useState(0);
  const [scroll, setScroll] = useState(0);

  const modalWidth = Math.floor(termWidth * 0.6);
  const modalHeight = Math.floor(termHeight * 0.6);
  const chromeLines = 1 + 3 + 2 + 2 + 2 + 2;
  const listHeight = Math.max(3, modalHeight - chromeLines);

  useEffect(() => {
    const treeUrl = extension?.install_command ?? extension?.repository_url;
    if (!isVisible || !treeUrl) return;

    setScope("local");
    setFocus("list");
    setStatus("fetching");
    setSkills([]);
    setSelected(new Set());
    setCursor(0);
    setScroll(0);

    fetchAvailableSkills(treeUrl)
      .then((list) => {
        setSkills(list);
        setSelected(new Set(list));
        setStatus(list.length ? "idle" : "error");
        if (!list.length) setMessage("No skills found.");
      })
      .catch((e) => {
        setStatus("error");
        setMessage(e instanceof Error ? e.message : "Failed to fetch");
      });
  }, [isVisible, extension]);

  const handleConfirm = async () => {
    if (!selected.size) {
      setMessage("Select at least one skill.");
      return;
    }
    setStatus("installing");
    try {
      const result = await onConfirm({ scope, selectedSkills: [...selected] });
      setStatus(result.success ? "success" : "error");
      setMessage(result.message ?? (result.success ? "Installed" : "Failed"));
    } catch (e) {
      setStatus("error");
      setMessage(e instanceof Error ? e.message : "Error");
    }
  };

  const toggle = (skill: string) => {
    const next = new Set(selected);
    next.has(skill) ? next.delete(skill) : next.add(skill);
    setSelected(next);
  };
  const clamp = (value: number, min: number, max: number) =>
    Math.max(min, Math.min(max, value));

  useKeyboard((key) => {
    if (!isVisible) return;
    if (status === "success" || (status === "error" && !skills.length)) {
      if (key.name === "return" || key.name === "enter") onClose();
      return;
    }
    if (key.name === "escape" || key.name === "q") {
      onClose();
      return;
    }
    if (status === "fetching" || status === "installing") return;

    if (key.name === "tab") {
      setFocus((f) =>
        f === "list" ? "scope" : f === "scope" ? "confirm" : "list",
      );
      return;
    }

    if (focus === "list" && skills.length) {
      if (key.name === "up" || key.name === "k") {
        setCursor((c) => {
          const n = Math.max(0, c - 1);
          if (n < scroll) setScroll(n);
          return n;
        });
      }
      if (key.name === "down" || key.name === "j") {
        setCursor((c) => {
          const n = Math.min(skills.length - 1, c + 1);
          if (n >= scroll + listHeight) setScroll(n - listHeight + 1);
          return n;
        });
      }
      if (key.name === "space") toggle(skills[cursor] ?? "");
      if (key.name === "a") setSelected(new Set(skills));
      if (key.name === "n") setSelected(new Set());
    }

    if (focus === "scope") {
      if (key.name === "left" || key.name === "h") setScope("local");
      if (key.name === "right" || key.name === "l") setScope("global");
    }

    if (key.name === "return" || key.name === "enter") {
      if (focus === "confirm" || focus === "scope") handleConfirm();
    }
  });

  if (!isVisible || !extension) return null;

  const borderColor =
    status === "error"
      ? ocTheme.danger
      : status === "success"
        ? ocTheme.success
        : ocTheme.accent;

  // Result screen
  return (
    <SkillInstallModalView
      extensionName={extension.name}
      skills={skills}
      selected={selected}
      selectedCount={selected.size}
      cursor={cursor}
      scroll={scroll}
      listHeight={listHeight}
      modalWidth={modalWidth}
      modalHeight={modalHeight}
      borderColor={borderColor}
      focus={focus}
      scope={scope}
      status={status}
      message={message}
      onClose={onClose}
      onToggleSkill={(skill, index) => {
        setFocus("list");
        setCursor(index);
        toggle(skill);
      }}
      onScroll={(direction, delta) => {
        const maxScroll = Math.max(0, skills.length - listHeight);
        if (direction === "up") {
          setScroll((prev) => clamp(prev - delta, 0, maxScroll));
          setCursor((prev) => clamp(prev - delta, 0, skills.length - 1));
        } else {
          setScroll((prev) => clamp(prev + delta, 0, maxScroll));
          setCursor((prev) => clamp(prev + delta, 0, skills.length - 1));
        }
      }}
      onSelectScope={(nextScope) => {
        setScope(nextScope);
        setFocus("scope");
      }}
      onConfirm={() => {
        setFocus("confirm");
        handleConfirm();
      }}
    />
  );
}
