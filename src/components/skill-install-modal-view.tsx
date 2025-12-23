/**
 * Visual layout for the skills install modal.
 * Receives state and handlers from the logic component to keep rendering simple and stable.
 */

import { MouseButton, t, bold, dim, green, red, cyan } from "@opentui/core";
import { ocTheme } from "../theme";
import { ModalBackdrop } from "./ui/modal-backdrop";
import { ModalActionButton } from "./ui/modal-action-button";

interface SkillInstallModalViewProps {
  extensionName: string;
  skills: string[];
  selected: Set<string>;
  selectedCount: number;
  cursor: number;
  scroll: number;
  listHeight: number;
  modalWidth: number;
  modalHeight: number;
  borderColor: string;
  focus: "list" | "scope" | "confirm";
  scope: "local" | "global";
  status: "fetching" | "idle" | "installing" | "success" | "error";
  message: string;
  onClose: () => void;
  onToggleSkill: (skill: string, index: number) => void;
  onScroll: (direction: "up" | "down", delta: number) => void;
  onSelectScope: (scope: "local" | "global") => void;
  onConfirm: () => void;
}

export function SkillInstallModalView({
  extensionName,
  skills,
  selected,
  selectedCount,
  cursor,
  scroll,
  listHeight,
  modalWidth,
  modalHeight,
  borderColor,
  focus,
  scope,
  status,
  message,
  onClose,
  onToggleSkill,
  onScroll,
  onSelectScope,
  onConfirm,
}: SkillInstallModalViewProps) {
  const visible = skills.slice(scroll, scroll + listHeight);

  if (status === "success" || (status === "error" && skills.length === 0)) {
    return (
      <>
        <ModalBackdrop onClose={onClose} zIndex={110} />
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
          onMouseDown={(event) => event.stopPropagation()}
        >
          <box flexShrink={0}>
            <text content={t`${bold(`Install ${extensionName}`)}`} />
          </box>

          <box flexDirection="column" justifyContent="center" flexGrow={1}>
            <text
              content={t`${status === "success" ? green("✔ Success") : red("✘ Error")}`}
            />
            <box marginTop={1}>
              <text content={t`${message}`} />
            </box>
          </box>

          <box flexShrink={0} marginTop={1}>
            <ModalActionButton
              content={t`${green("Close")}`}
              onPress={onClose}
            />
          </box>
        </box>
      </>
    );
  }

  return (
    <>
      <ModalBackdrop onClose={onClose} zIndex={110} />
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
        onMouseDown={(event) => event.stopPropagation()}
      >
        <box flexShrink={0}>
          <text
            content={t`${bold(`Install ${extensionName}`)} ${dim(`(${skills.length} skills)`)}`}
          />
        </box>

        {status === "fetching" || status === "installing" ? (
          <box flexGrow={1} justifyContent="center">
            <text
              content={t`${dim(status === "fetching" ? "Loading..." : "Installing...")}`}
            />
          </box>
        ) : (
          <box flexDirection="column" flexGrow={1}>
            <box flexDirection="column" marginTop={1}>
              <text content={t`${dim("Scope:")}`} />
              <box flexDirection="row" columnGap={1}>
                <ModalActionButton
                  content={
                    scope === "local" ? bold(cyan("local")) : dim("local")
                  }
                  borderColor={
                    scope === "local" ? ocTheme.accent : ocTheme.border
                  }
                  backgroundColor={
                    scope === "local" ? ocTheme.element : ocTheme.panel
                  }
                  onPress={() => onSelectScope("local")}
                />
                <ModalActionButton
                  content={
                    scope === "global" ? bold(cyan("global")) : dim("global")
                  }
                  borderColor={
                    scope === "global" ? ocTheme.accent : ocTheme.border
                  }
                  backgroundColor={
                    scope === "global" ? ocTheme.element : ocTheme.panel
                  }
                  onPress={() => onSelectScope("global")}
                />
              </box>
            </box>

            <box marginTop={1}>
              <text content={t`${dim("[a] all  [n] none  [Space] toggle")}`} />
            </box>

            <box
              flexDirection="column"
              flexGrow={1}
              marginTop={1}
              borderStyle="single"
              borderColor={focus === "list" ? ocTheme.accent : ocTheme.border}
              onMouseScroll={(event) => {
                const scrollEvent = event.scroll;
                if (!scrollEvent) return;
                if (scrollEvent.direction === "up") {
                  onScroll("up", Math.max(1, scrollEvent.delta));
                } else if (scrollEvent.direction === "down") {
                  onScroll("down", Math.max(1, scrollEvent.delta));
                }
              }}
            >
              {visible.map((skill, i) => {
                const idx = scroll + i;
                const isCur = idx === cursor && focus === "list";
                const isSel = selected.has(skill);
                return (
                  <box
                    key={skill}
                    onMouseDown={(event) => {
                      if (event.button !== MouseButton.LEFT) return;
                      onToggleSkill(skill, idx);
                    }}
                  >
                    <text
                      content={t`${isCur ? cyan(">") : " "} ${isSel ? green("[✓]") : dim("[ ]")} ${isCur ? bold(skill) : skill}`}
                    />
                  </box>
                );
              })}
            </box>

            <box marginTop={1}>
              <text
                content={t`${dim(`${selectedCount}/${skills.length} selected`)}`}
              />
            </box>
          </box>
        )}

        <box flexShrink={0} marginTop={1}>
          <box flexDirection="row" columnGap={1}>
            <ModalActionButton
              content={t`${green("Install")}`}
              borderColor={
                focus === "confirm" ? ocTheme.accent : ocTheme.border
              }
              onPress={onConfirm}
            />
            <ModalActionButton
              content={t`${red("Cancel")}`}
              onPress={onClose}
            />
          </box>
        </box>
      </box>
    </>
  );
}
