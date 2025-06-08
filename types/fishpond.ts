// types/fishPond.ts
import { Application, Sprite, Ticker } from "pixi.js";

export interface AssetData {
  alias: string;
  src: string;
}

// Function type definitions for imported modules
export type AddBackgroundFunction = (app: Application) => void;

export type AddFishesFunction = (app: Application, fishes: Sprite[]) => void;

export type AnimateFishesFunction = (
  app: Application,
  fishes: Sprite[],
  time: Ticker
) => void;

export type AddWaterOverlayFunction = (app: Application) => void;

export type AnimateWaterOverlayFunction = (
  app: Application,
  time: Ticker
) => void;

export type AddDisplacementEffectFunction = (app: Application) => void;
