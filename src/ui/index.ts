/*
 * Lynk UI Library
 * ---------------
 * Single import point for shared UI. Usage:
 *   import { Button, Badge, criticalityDot } from "../ui";
 *
 * - components.tsx — reusable primitives (Button, Badge, Card, Pill, StatTile)
 * - theme.ts       — semantic class maps (criticality, tone, diff, chart)
 * - tokens.css     — colour tokens (imported once in index.css)
 */

export * from "./components";
export * from "./Alert";
export * from "./theme";
