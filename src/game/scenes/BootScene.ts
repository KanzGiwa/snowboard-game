import * as Phaser from "phaser";

export default class BootScene extends Phaser.Scene {
  constructor() {
    super("BootScene");
  }

  create() {
    // No assets required for this prototype (we draw everything with Graphics)
    this.scene.start("GameScene");
  }
}
