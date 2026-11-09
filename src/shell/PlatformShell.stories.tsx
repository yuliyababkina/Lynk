import type { Meta, StoryObj } from "@storybook/react-vite";
import React from "react";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider } from "@/components/ui/sidebar";
import { LynkDataProvider } from "@/lib/LynkDataContext";
import { APPS, appsForRole, getApp } from "./apps";
import { AppSwitcher } from "./AppSwitcher";
import { MfeSidebar } from "./MfeSidebar";
import { PlatformShell } from "./PlatformShell";
import { WireframeApp } from "./WireframeApp";

/*
 * Platform shell — concept for the 28 Oct shell discussion.
 *
 * Global switching between apps sits top right in the shell header; switching
 * inside an app is the app's own menu on the left. Lynk is the real prototype
 * running in shell mode; the other apps are wireframes.
 *
 * Use "Show shell boundaries" in the avatar menu to see who owns which region.
 */
const meta: Meta<typeof PlatformShell> = {
  title: "Platform/Shell",
  component: PlatformShell,
  parameters: { layout: "fullscreen" },
  decorators: [(Story) => React.createElement(LynkDataProvider, null, React.createElement(Story))],
};
export default meta;

type Story = StoryObj<typeof PlatformShell>;

/** Sabine opens Lynk; her switcher shows only what a procurement manager may open. */
export const ProcurementManagerInLynk: Story = {
  args: { initialRole: "procurement", initialApp: "lynk" },
};

/** Same frame, another role: Lynk is not in this switcher at all. */
export const PropertyManagerInWorkOrders: Story = {
  args: { initialRole: "property", initialApp: "work-orders" },
};

/** Every app — what the switcher looks like at full size. */
export const PlatformAdmin: Story = {
  args: { initialRole: "admin", initialApp: "users" },
};

/** Dashed outlines and tags: navy is the shell, green is the micro frontend. */
export const ShellBoundaries: Story = {
  args: { initialRole: "procurement", initialApp: "lynk", initialInspector: true },
};

/* Named components, not inline render functions: both hold state, and hooks are
   only legal inside components. */
function GlobalAppSwitcherDemo() {
  const [active, setActive] = React.useState("lynk");
  return React.createElement(
    TooltipProvider,
    null,
    React.createElement(
      "div",
      { className: "flex justify-end p-4" },
      React.createElement(AppSwitcher, { apps: appsForRole("admin"), activeId: active, onSelect: setActive })
    )
  );
}

function InnerMenuDemo() {
  const app = getApp("work-orders")!;
  const [active, setActive] = React.useState(app.nav[0].id);
  return React.createElement(
    TooltipProvider,
    null,
    React.createElement(
      SidebarProvider,
      { className: "h-[480px] min-h-0" },
      React.createElement(MfeSidebar, {
        appName: app.name,
        appIcon: app.icon,
        items: app.nav,
        activeId: active,
        onSelect: setActive,
      })
    )
  );
}

/** The global switcher on its own (top right in the header). */
export const GlobalAppSwitcher: StoryObj<typeof AppSwitcher> = {
  render: () => React.createElement(GlobalAppSwitcherDemo),
  parameters: { layout: "padded" },
};

/** The inner menu contract every app renders on the left. */
export const InnerMenu: StoryObj<typeof MfeSidebar> = {
  render: () => React.createElement(InnerMenuDemo),
  parameters: { layout: "padded" },
};

/** One wireframe app without the shell around it — what a team ships as its remote. */
export const WireframeRemote: StoryObj<typeof WireframeApp> = {
  render: () =>
    React.createElement(
      TooltipProvider,
      null,
      React.createElement("div", { className: "h-[720px]" }, React.createElement(WireframeApp, { app: APPS[0] }))
    ),
};
