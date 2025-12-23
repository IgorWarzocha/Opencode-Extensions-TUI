/**
 * Modal for installing skills from a bundle repository.
 * Shows available skills with selection, scope choice (local/global), and installation.
 */
import { t, bold, dim, green, red, cyan } from "@opentui/core";
import { useKeyboard } from "@opentui/react";
import { useEffect, useMemo, useState } from "react";
import type { Extension } from "../types/extension";
import { ocTheme } from "../theme";
import { useTerminalSize } from "../hooks/useTerminalSize";
import { fetchAvailableSkills } from "../services/installation/skillsInstaller";
import { homedir } from "os";

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

  const cwd = useMemo(() => process.cwd(), []);
  const modalWidth = Math.floor(termWidth * 0.6);
  const modalHeight = Math.floor(termHeight * 0.6);
  const listHeight = Math.max(3, modalHeight - 12);

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
  if (status === "success" || (status === "error" && !skills.length)) {
    return (
      <box
        style={{
          position: "absolute",
          left: "50%",
          top: "50%",
          marginLeft: -Math.floor(modalWidth / 2),
          marginTop: -Math.floor(modalHeight / 2),
          width: modalWidth,
          height: modalHeight,
          zIndex: 120,
        }}
        backgroundColor={ocTheme.background}
        borderStyle="double"
        borderColor={borderColor}
        flexDirection="column"
        padding={1}
      >
        <text
          content={t`${status === "success" ? green("✔ Success") : red("✘ Error")}`}
        />
        <box marginTop={1}>
          <text content={t`${message}`} />
        </box>
        <box marginTop={2}>
          <text content={t`${green("[Enter]")} Close`} />
        </box>
      </box>
    );
  }

  const visible = skills.slice(scroll, scroll + listHeight);

  return (
    <box
      style={{
        position: "absolute",
        left: "50%",
        top: "50%",
        marginLeft: -Math.floor(modalWidth / 2),
        marginTop: -Math.floor(modalHeight / 2),
        width: modalWidth,
        height: modalHeight,
        zIndex: 120,
      }}
      backgroundColor={ocTheme.background}
      borderStyle="double"
      borderColor={borderColor}
      flexDirection="column"
      padding={1}
    >
      <box flexShrink={0}>
        <text
          content={t`${bold(`📦 ${extension.name}`)} ${dim(`(${skills.length} skills)`)}`}
        />
      </box>

      {status === "fetching" ? (
        <box flexGrow={1} justifyContent="center">
          <text content={t`${dim("Loading...")}`} />
        </box>
      ) : (
        <box flexDirection="column" flexGrow={1} marginTop={1}>
          <text content={t`${dim("[a] all  [n] none  [Space] toggle")}`} />

          <box
            flexDirection="column"
            height={listHeight}
            borderStyle="single"
            borderColor={focus === "list" ? ocTheme.accent : ocTheme.border}
            marginTop={1}
          >
            {visible.map((skill, i) => {
              const idx = scroll + i;
              const isCur = idx === cursor && focus === "list";
              const isSel = selected.has(skill);
              return (
                <box key={skill}>
                  <text
                    content={t`${isCur ? cyan(">") : " "} ${isSel ? green("[✓]") : dim("[ ]")} ${isCur ? bold(skill) : skill}`}
                  />
                </box>
              );
            })}
          </box>

          <box
            marginTop={1}
            borderStyle="single"
            borderColor={focus === "scope" ? ocTheme.accent : ocTheme.border}
            paddingLeft={1}
          >
            <text
              content={t`${focus === "scope" ? cyan(">") : " "} ${scope === "local" ? bold(green("Local")) : dim("Local")} | ${scope === "global" ? bold(green("Global")) : dim("Global")}`}
            />
          </box>
          <text
            content={t`${dim("→")} ${scope === "local" ? `${cwd}/.opencode/skill/` : `${homedir()}/.config/opencode/skill/`}`}
          />
        </box>
      )}

      <box flexShrink={0} marginTop={1}>
        <text
          content={t`${dim(`${selected.size}/${skills.length} selected`)}  ${focus === "confirm" ? cyan("[Enter]") : dim("[Enter]")} Install  ${red("[Esc]")} Cancel`}
        />
      </box>
    </box>
  );
}
