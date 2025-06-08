import { Application, Graphics, Ticker } from "pixi.js";
import moonSvg from "./moon.svg";

export function addStars(app: Application): void {
  const starCount: number = 20;
  const graphics: Graphics = new Graphics();

  for (let index = 0; index < starCount; index++) {
    const x: number = (index * 0.78695 * app.screen.width) % app.screen.width;
    const y: number = (index * 0.9382 * app.screen.height) % app.screen.height;
    const radius: number = 2 + Math.random() * 3;
    const rotation: number = Math.random() * Math.PI * 2;

    graphics.star(x, y, 5, radius, 0, rotation).fill({
      color: 0xffdf00,
      alpha: radius / 5,
    });
  }

  app.stage.addChild(graphics);
}

export function addMoon(app: Application): void {
  const graphics: Graphics = new Graphics().svg(moonSvg);

  graphics.x = app.screen.width / 2 + 100;
  graphics.y = app.screen.height / 8;

  app.stage.addChild(graphics);
}

export function addMountains(app: Application): void {
  const group1: Graphics = createMountainGroup(app);
  const group2: Graphics = createMountainGroup(app);

  group2.x = app.screen.width;

  app.stage.addChild(group1, group2);
  app.ticker.add((time: Ticker) => {
    const dx: number = time.deltaTime * 0.5;
    group1.x -= dx;
    group2.x -= dx;

    if (group1.x <= -app.screen.width) {
      group1.x += app.screen.width * 2;
    }
    if (group2.x <= -app.screen.width) {
      group2.x += app.screen.width * 2;
    }
  });
}

function createMountainGroup(app: Application): Graphics {
  const graphics: Graphics = new Graphics();

  const width: number = app.screen.width / 2;

  const startY: number = app.screen.height;

  const startXLeft: number = 0;
  const startXMiddle: number = app.screen.width / 4;
  const startXRight: number = app.screen.width / 2;

  const heightLeft: number = app.screen.height / 2;
  const heightMiddle: number = (app.screen.height * 4) / 5;
  const heightRight: number = (app.screen.height * 2) / 3;

  const colorLeft: number = 0xc1c0c2;
  const colorMiddle: number = 0x7e818f;
  const colorRight: number = 0x8c919f;

  graphics
    .moveTo(startXMiddle, startY)
    .bezierCurveTo(
      startXMiddle + width / 2,
      startY - heightMiddle,
      startXMiddle + width / 2,
      startY - heightMiddle,
      startXMiddle + width,
      startY
    )
    .fill({ color: colorMiddle })

    // Draw the left mountain
    .moveTo(startXLeft, startY)
    .bezierCurveTo(
      startXLeft + width / 2,
      startY - heightLeft,
      startXLeft + width / 2,
      startY - heightLeft,
      startXLeft + width,
      startY
    )
    .fill({ color: colorLeft })

    // Draw the right mountain
    .moveTo(startXRight, startY)
    .bezierCurveTo(
      startXRight + width / 2,
      startY - heightRight,
      startXRight + width / 2,
      startY - heightRight,
      startXRight + width,
      startY
    )
    .fill({ color: colorRight });

  return graphics;
}

export function addTrees(app: Application): void {
  // Width of each tree.
  const treeWidth: number = 200;

  // Position of the base of the trees on the y-axis.
  const y: number = app.screen.height - 20;

  // Spacing between each tree.
  const spacing: number = 15;

  // Calculate the number of trees needed to fill the screen horizontally.
  const count: number = app.screen.width / (treeWidth + spacing) + 1;

  // Create an array to store all the trees.
  const trees: Graphics[] = [];

  for (let index = 0; index < count; index++) {
    // Randomize the height of each tree within a constrained range.
    const treeHeight: number = 225 + Math.random() * 50;

    // Create a tree instance.
    const tree: Graphics = createTree(treeWidth, treeHeight);

    // Initially position the tree.
    tree.x = index * (treeWidth + spacing);
    tree.y = y;

    // Add the tree to the stage and the reference array.
    app.stage.addChild(tree);
    trees.push(tree);
  }

  // Animate the trees.
  app.ticker.add((time: Ticker) => {
    // Calculate the amount of distance to move the trees per tick.
    const dx: number = time.deltaTime * 3;

    trees.forEach((tree: Graphics) => {
      // Move the trees leftwards.
      tree.x -= dx;

      // Reposition the trees when they move off screen.
      if (tree.x <= -(treeWidth / 2 + spacing)) {
        tree.x += count * (treeWidth + spacing) + spacing * 3;
      }
    });
  });
}

function createTree(width: number, height: number): Graphics {
  // Define the dimensions of the tree trunk.
  const trunkWidth: number = 30;
  const trunkHeight: number = height / 4;

  // Define the dimensions and parameters for the tree crown layers.
  const crownHeight: number = height - trunkHeight;
  const crownLevels: number = 4;
  const crownLevelHeight: number = crownHeight / crownLevels;
  const crownWidthIncrement: number = width / crownLevels;

  // Define the colors of the parts.
  const crownColor: number = 0x264d3d;
  const trunkColor: number = 0x563929;

  const graphics: Graphics = new Graphics()
    // Draw the trunk.
    .rect(-trunkWidth / 2, -trunkHeight, trunkWidth, trunkHeight)
    .fill({ color: trunkColor });

  for (let index = 0; index < crownLevels; index++) {
    const y: number = -trunkHeight - crownLevelHeight * index;
    const levelWidth: number = width - crownWidthIncrement * index;
    const offset: number = index < crownLevels - 1 ? crownLevelHeight / 2 : 0;

    // Draw a crown layer.
    graphics
      .moveTo(-levelWidth / 2, y)
      .lineTo(0, y - crownLevelHeight - offset)
      .lineTo(levelWidth / 2, y)
      .fill({ color: crownColor });
  }

  return graphics;
}
